import {once} from 'node:events';
import {setImmediate} from 'node:timers/promises';
import getStream, {getStreamAsArrayBuffer, getStreamAsArray, MaxBufferError} from 'get-stream';
import {isStream} from 'is-stream';
import mergeStreams from '@sindresorhus/merge-streams';
import {waitForSuccessfulExit, throwOnTimeout, errorSignal} from './kill.js';
import {isStandardStream} from './stdio/utils.js';
import {generatorToDuplexStream} from './stdio/generator.js';
import {waitForStream, handleStreamError, isInputFileDescriptor} from './wait.js';

// `all` interleaves `stdout` and `stderr`
export const makeAllStream = ({stdout, stderr}, {all}) => all && (stdout || stderr)
	? mergeStreams([stdout, stderr].filter(Boolean))
	: undefined;

// On failure, `result.stdout|stderr|all` should contain the currently buffered stream
// They are automatically closed and flushed by Node.js when the child process exits
// When `buffer` is `false`, `streamPromise` is `undefined` and there is no buffered data to retrieve
const getBufferedData = async (streamPromise, encoding) => {
	try {
		return await streamPromise;
	} catch (error) {
		return handleBufferedData(error, encoding);
	}
};

const handleBufferedData = (error, encoding) => error.bufferedData === undefined || Array.isArray(error.bufferedData)
	? error.bufferedData
	: applyEncoding(error.bufferedData, encoding);

// Read the contents of `childProcess.std*` and|or wait for its completion
const waitForChildStreams = ({spawned, encoding, buffer, maxBuffer, streamInfo}) => spawned.stdio.map((stream, index) => waitForChildStream({
	stream,
	spawned,
	index,
	encoding,
	buffer,
	maxBuffer,
	streamInfo,
}));

// Read the contents of `childProcess.all` and|or wait for its completion
const waitForAllStream = ({spawned, encoding, buffer, maxBuffer, streamInfo}) => waitForChildStream({
	stream: getAllStream(spawned, encoding),
	spawned,
	index: 1,
	encoding,
	buffer,
	maxBuffer: maxBuffer * 2,
	streamInfo,
});

// When `childProcess.stdout` is in objectMode but not `childProcess.stderr` (or the opposite), we need to use both:
//  - `getStreamAsArray()` for the chunks in objectMode, to return as an array without changing each chunk
//  - `getStreamAsArrayBuffer()` or `getStream()` for the chunks not in objectMode, to convert them from Buffers to string or Uint8Array
// We do this by emulating the Buffer -> string|Uint8Array conversion performed by `get-stream` with our own, which is identical.
const getAllStream = ({all, stdout, stderr}, encoding) => all && stdout && stderr && stdout.readableObjectMode !== stderr.readableObjectMode
	? all.pipe(generatorToDuplexStream({value: allStreamGenerator, encoding}).value)
	: all;

const allStreamGenerator = {
	* transform(chunk) {
		yield chunk;
	},
	binary: true,
	writableObjectMode: true,
	readableObjectMode: true,
};

const waitForChildStream = async ({stream, spawned, index, encoding, buffer, maxBuffer, streamInfo}) => {
	if (!stream) {
		return;
	}

	if (isInputFileDescriptor(index, streamInfo.stdioStreamsGroups)) {
		await waitForStream(stream, index, streamInfo);
		return;
	}

	if (!buffer) {
		await Promise.all([
			waitForStream(stream, index, streamInfo),
			resumeStream(stream),
		]);
		return;
	}

	try {
		return await getAnyStream(stream, encoding, maxBuffer);
	} catch (error) {
		if (error instanceof MaxBufferError) {
			spawned.kill();
		}

		handleStreamError(error, index, streamInfo);
		return handleBufferedData(error, encoding);
	}
};

// When using `buffer: false`, users need to read `childProcess.stdout|stderr|all` right away
// See https://github.com/sindresorhus/execa/issues/730 and https://github.com/sindresorhus/execa/pull/729#discussion_r1465496310
const resumeStream = async stream => {
	await setImmediate();
	if (stream.readableFlowing === null) {
		stream.resume();
	}
};

const getAnyStream = async (stream, encoding, maxBuffer) => {
	if (stream.readableObjectMode) {
		return getStreamAsArray(stream, {maxBuffer});
	}

	const contents = encoding === 'buffer'
		? await getStreamAsArrayBuffer(stream, {maxBuffer})
		: await getStream(stream, {maxBuffer});
	return applyEncoding(contents, encoding);
};

const applyEncoding = (contents, encoding) => encoding === 'buffer' ? new Uint8Array(contents) : contents;

// Transforms replace `childProcess.std*`, which means they are not exposed to users.
// However, we still want to wait for their completion.
const waitForOriginalStreams = (originalStreams, spawned, streamInfo) =>
	originalStreams.map((stream, index) => stream === spawned.stdio[index]
		? undefined
		: waitForStream(stream, index, streamInfo));

// Some `stdin`/`stdout`/`stderr` options create a stream, e.g. when passing a file path.
// The `.pipe()` method automatically ends that stream when `childProcess` ends.
// This makes sure we wait for the completion of those streams, in order to catch any error.
const waitForCustomStreamsEnd = (stdioStreamsGroups, streamInfo) => stdioStreamsGroups.flatMap((stdioStreams, index) => stdioStreams
	.filter(({value}) => isStream(value) && !isStandardStream(value))
	.map(({type, value}) => waitForStream(value, index, streamInfo, {
		isSameDirection: type === 'generator',
		stopOnExit: type === 'native',
	})));

const throwOnProcessError = async (spawned, {signal}) => {
	const [error] = await once(spawned, 'error', {signal});
	throw error;
};

const throwOnInternalError = async (spawned, {signal}) => {
	const [error] = await once(spawned, errorSignal, {signal});
	throw error;
};

// If `error` is emitted before `spawn`, `exit` will never be emitted.
// However, `error` might be emitted after `spawn`, e.g. with the `signal` option.
// In that case, `exit` will still be emitted.
// Since the `exit` event contains the signal name, we want to make sure we are listening for it.
// This function also takes into account the following unlikely cases:
//  - `exit` being emitted in the same microtask as `spawn`
//  - `error` being emitted multiple times
const waitForExit = async spawned => {
	const [spawnPayload, exitPayload] = await Promise.allSettled([
		once(spawned, 'spawn'),
		once(spawned, 'exit'),
	]);

	if (spawnPayload.status === 'rejected') {
		return [];
	}

	return exitPayload.status === 'rejected'
		? waitForProcessExit(spawned)
		: exitPayload.value;
};

const waitForProcessExit = async spawned => {
	try {
		return await once(spawned, 'exit');
	} catch {
		return waitForProcessExit(spawned);
	}
};

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
