import {once} from 'node:events';
import {isStream as isNodeStream} from 'is-stream';
import {waitForSuccessfulExit} from '../exit/code.js';
import {errorSignal} from '../exit/kill.js';
import {throwOnTimeout} from '../exit/timeout.js';
import {isStandardStream} from '../utils.js';
import {TRANSFORM_TYPES} from '../stdio/generator.js';
import {waitForAllStream} from './all.js';
import {waitForSubprocessStream, getBufferedData} from './subprocess.js';
import {waitForExit} from './exit.js';
import {waitForStream} from './wait.js';

// Retrieve result of subprocess: exit code, signal, error, streams (stdout/stderr/all)
export const getSubprocessResult = async ({
	subprocess,
	options: {encoding, buffer, maxBuffer, lines, timeoutDuration: timeout},
	context,
	fileDescriptors,
	originalStreams,
	controller,
}) => {
	const exitPromise = waitForExit(subprocess);
	const streamInfo = {originalStreams, fileDescriptors, subprocess, exitPromise, propagating: false};

	const stdioPromises = waitForSubprocessStreams({subprocess, encoding, buffer, maxBuffer, lines, streamInfo});
	const allPromise = waitForAllStream({subprocess, encoding, buffer, maxBuffer, streamInfo});
	const originalPromises = waitForOriginalStreams(originalStreams, subprocess, streamInfo);
	const customStreamsEndPromises = waitForCustomStreamsEnd(fileDescriptors, streamInfo);

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
			throwOnSubprocessError(subprocess, controller),
			throwOnInternalError(subprocess, controller),
			...throwOnTimeout(subprocess, timeout, context, controller),
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

// Read the contents of `subprocess.std*` and|or wait for its completion
const waitForSubprocessStreams = ({subprocess, encoding, buffer, maxBuffer, lines, streamInfo}) =>
	subprocess.stdio.map((stream, fdNumber) => waitForSubprocessStream({stream, subprocess, fdNumber, encoding, buffer, maxBuffer, lines, streamInfo}));

// Transforms replace `subprocess.std*`, which means they are not exposed to users.
// However, we still want to wait for their completion.
const waitForOriginalStreams = (originalStreams, subprocess, streamInfo) =>
	originalStreams.map((stream, fdNumber) => stream === subprocess.stdio[fdNumber]
		? undefined
		: waitForStream(stream, fdNumber, streamInfo));

// Some `stdin`/`stdout`/`stderr` options create a stream, e.g. when passing a file path.
// The `.pipe()` method automatically ends that stream when `subprocess` ends.
// This makes sure we wait for the completion of those streams, in order to catch any error.
const waitForCustomStreamsEnd = (fileDescriptors, streamInfo) => fileDescriptors.flatMap(({stdioItems, fdNumber}) => stdioItems
	.filter(({value, stream = value}) => isNodeStream(stream, {checkOpen: false}) && !isStandardStream(stream))
	.map(({type, value, stream = value}) => waitForStream(stream, fdNumber, streamInfo, {
		isSameDirection: TRANSFORM_TYPES.has(type),
		stopOnExit: type === 'native',
	})));

const throwOnSubprocessError = async (subprocess, {signal}) => {
	const [error] = await once(subprocess, 'error', {signal});
	throw error;
};

const throwOnInternalError = async (subprocess, {signal}) => {
	const [error] = await once(subprocess, errorSignal, {signal});
	throw error;
};
