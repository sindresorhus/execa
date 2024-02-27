import {once} from 'node:events';
import {isStream} from 'is-stream';
import {waitForSuccessfulExit} from '../exit/code.js';
import {errorSignal} from '../exit/kill.js';
import {throwOnTimeout} from '../exit/timeout.js';
import {isStandardStream} from '../utils.js';
import {waitForAllStream} from './all.js';
import {waitForChildStream, getBufferedData} from './child.js';
import {waitForExit} from './exit.js';
import {waitForStream} from './wait.js';

// Retrieve result of child process: exit code, signal, error, streams (stdout/stderr/all)
export const getSpawnedResult = async ({
	spawned,
	options: {encoding, buffer, maxBuffer, timeoutDuration: timeout},
	context,
	stdioStreamsGroups,
	originalStreams,
	controller,
}) => {
	const exitPromise = waitForExit(spawned);
	const streamInfo = {originalStreams, stdioStreamsGroups, exitPromise, propagating: new Set([])};

	const stdioPromises = waitForChildStreams({spawned, encoding, buffer, maxBuffer, streamInfo});
	const allPromise = waitForAllStream({spawned, encoding, buffer, maxBuffer, streamInfo});
	const originalPromises = waitForOriginalStreams(originalStreams, spawned, streamInfo);
	const customStreamsEndPromises = waitForCustomStreamsEnd(stdioStreamsGroups, streamInfo);

	try {
		return await Promise.race([
			Promise.all([
				{},
				waitForSuccessfulExit(exitPromise),
				Promise.all(stdioPromises),
				allPromise,
				...originalPromises,
				...customStreamsEndPromises,
			]),
			throwOnProcessError(spawned, controller),
			throwOnInternalError(spawned, controller),
			...throwOnTimeout(spawned, timeout, context, controller),
		]);
	} catch (error) {
		return Promise.all([
			{error},
			exitPromise,
			Promise.all(stdioPromises.map(stdioPromise => getBufferedData(stdioPromise, encoding))),
			getBufferedData(allPromise, encoding),
			Promise.allSettled(originalPromises),
			Promise.allSettled(customStreamsEndPromises),
		]);
	}
};

// Read the contents of `childProcess.std*` and|or wait for its completion
const waitForChildStreams = ({spawned, encoding, buffer, maxBuffer, streamInfo}) =>
	spawned.stdio.map((stream, fdNumber) => waitForChildStream({stream, spawned, fdNumber, encoding, buffer, maxBuffer, streamInfo}));

// Transforms replace `childProcess.std*`, which means they are not exposed to users.
// However, we still want to wait for their completion.
const waitForOriginalStreams = (originalStreams, spawned, streamInfo) =>
	originalStreams.map((stream, fdNumber) => stream === spawned.stdio[fdNumber]
		? undefined
		: waitForStream(stream, fdNumber, streamInfo));

// Some `stdin`/`stdout`/`stderr` options create a stream, e.g. when passing a file path.
// The `.pipe()` method automatically ends that stream when `childProcess` ends.
// This makes sure we wait for the completion of those streams, in order to catch any error.
const waitForCustomStreamsEnd = (stdioStreamsGroups, streamInfo) => stdioStreamsGroups.flat()
	.filter(({value}) => isStream(value, {checkOpen: false}) && !isStandardStream(value))
	.map(({type, value, fdNumber}) => waitForStream(value, fdNumber, streamInfo, {
		isSameDirection: type === 'generator',
		stopOnExit: type === 'native',
	}));

const throwOnProcessError = async (spawned, {signal}) => {
	const [error] = await once(spawned, 'error', {signal});
	throw error;
};

const throwOnInternalError = async (spawned, {signal}) => {
	const [error] = await once(spawned, errorSignal, {signal});
	throw error;
};
