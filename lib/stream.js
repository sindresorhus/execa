import {addAbortListener} from 'node:events';
import {finished} from 'node:stream/promises';
import {setImmediate} from 'node:timers/promises';
import getStream, {getStreamAsArrayBuffer, getStreamAsArray} from 'get-stream';
import mergeStreams from '@sindresorhus/merge-streams';
import {throwOnTimeout} from './kill.js';
import {isStandardStream} from './stdio/utils.js';
import {generatorToDuplexStream} from './stdio/generator.js';

// `all` interleaves `stdout` and `stderr`
export const makeAllStream = ({stdout, stderr}, {all}) => all && (stdout || stderr)
	? mergeStreams([stdout, stderr].filter(Boolean))
	: undefined;

// On failure, `result.stdout|stderr|all` should contain the currently buffered stream
// They are automatically closed and flushed by Node.js when the child process exits
// We guarantee this by calling `childProcess.kill()`
// When `buffer` is `false`, `streamPromise` is `undefined` and there is no buffered data to retrieve
const getBufferedData = async (streamPromise, encoding) => {
	try {
		return await streamPromise;
	} catch (error) {
		return error.bufferedData === undefined || Array.isArray(error.bufferedData)
			? error.bufferedData
			: applyEncoding(error.bufferedData, encoding);
	}
};

// Read the contents of `childProcess.std*` and|or wait for its completion
const waitForChildStreams = ({spawned, stdioStreamsGroups, encoding, buffer, maxBuffer, waitForStream}) => spawned.stdio.map((stream, index) => waitForChildStream({
	stream,
	direction: stdioStreamsGroups[index][0].direction,
	encoding,
	buffer,
	maxBuffer,
	waitForStream,
}));

// Read the contents of `childProcess.all` and|or wait for its completion
const waitForAllStream = ({spawned, encoding, buffer, maxBuffer, waitForStream}) => waitForChildStream({
	stream: getAllStream(spawned, encoding),
	direction: 'output',
	encoding,
	buffer,
	maxBuffer: maxBuffer * 2,
	waitForStream,
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

const waitForChildStream = async ({stream, direction, encoding, buffer, maxBuffer, waitForStream}) => {
	if (!stream) {
		return;
	}

	if (direction === 'input') {
		await waitForStream(stream);
		return;
	}

	if (!buffer) {
		await Promise.all([
			waitForStream(stream),
			resumeStream(stream),
		]);
		return;
	}

	if (stream.readableObjectMode) {
		return getStreamAsArray(stream, {maxBuffer});
	}

	const contents = encoding === 'buffer'
		? await getStreamAsArrayBuffer(stream, {maxBuffer})
		: await getStream(stream, {maxBuffer});
	return applyEncoding(contents, encoding);
};

// When using `buffer: false`, users need to read `childProcess.stdout|stderr|all` right away
// See https://github.com/sindresorhus/execa/issues/730 and https://github.com/sindresorhus/execa/pull/729#discussion_r1465496310
const resumeStream = async stream => {
	await setImmediate();
	if (stream.readableFlowing === null) {
		stream.resume();
	}
};

const applyEncoding = (contents, encoding) => encoding === 'buffer' ? new Uint8Array(contents) : contents;

// Transforms replace `childProcess.std*`, which means they are not exposed to users.
// However, we still want to wait for their completion.
const waitForOriginalStreams = (originalStreams, spawned, waitForStream) => originalStreams
	.filter((stream, index) => stream !== spawned.stdio[index])
	.map(stream => waitForStream(stream));

// Some `stdin`/`stdout`/`stderr` options create a stream, e.g. when passing a file path.
// The `.pipe()` method automatically ends that stream when `childProcess` ends.
// This makes sure we wait for the completion of those streams, in order to catch any error.
const waitForCustomStreamsEnd = (stdioStreamsGroups, waitForStream) => stdioStreamsGroups.flat()
	.filter(({type, value}) => type !== 'native' && !isStandardStream(value))
	.map(({value}) => waitForStream(value));

// Like `once()` except it never rejects, especially not on `error` event.
const pEvent = (eventEmitter, eventName, {signal}) => new Promise(resolve => {
	const listener = (...payload) => {
		resolve([eventName, ...payload]);
	};

	eventEmitter.once(eventName, listener);
	addAbortListener(signal, () => {
		eventEmitter.removeListener(eventName, listener);
	});
});

// Wraps `finished(stream)` to handle the following case:
//  - When the child process exits, Node.js automatically calls `childProcess.stdin.destroy()`, which we need to ignore.
//  - However, we still need to throw if `childProcess.stdin.destroy()` is called before child process exit.
const onFinishedStream = async ([originalStdin], processExitPromise, stream) => {
	const finishedPromise = finished(stream, {cleanup: true});
	if (stream !== originalStdin) {
		await finishedPromise;
		return;
	}

	try {
		await finishedPromise;
	} catch {
		await Promise.race([processExitPromise, finishedPromise]);
	}
};

const throwOnProcessError = async processErrorPromise => {
	const [, error] = await processErrorPromise;
	throw error;
};

// First the `spawn` event is emitted, then `exit`.
// If the `error` event is emitted:
//  - before `spawn`: `exit` is never emitted.
//  - after `spawn`: `exit` is always emitted.
// We only want to listen to `exit` if it will be emitted, i.e. if `spawn` has been emitted.
// Therefore, the arguments order of `Promise.race()` is significant.
const waitForFailedProcess = async (processSpawnPromise, processErrorPromise, processExitPromise) => {
	const [eventName] = await Promise.race([processSpawnPromise, processErrorPromise]);
	return eventName === 'spawn' ? processExitPromise : [];
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
	const processSpawnPromise = pEvent(spawned, 'spawn', controller);
	const processErrorPromise = pEvent(spawned, 'error', controller);
	const processExitPromise = pEvent(spawned, 'exit', controller);
	const waitForStream = onFinishedStream.bind(undefined, originalStreams, processExitPromise);

	const stdioPromises = waitForChildStreams({spawned, stdioStreamsGroups, encoding, buffer, maxBuffer, waitForStream});
	const allPromise = waitForAllStream({spawned, encoding, buffer, maxBuffer, waitForStream});
	const originalPromises = waitForOriginalStreams(originalStreams, spawned, waitForStream);
	const customStreamsEndPromises = waitForCustomStreamsEnd(stdioStreamsGroups, waitForStream);

	try {
		return await Promise.race([
			Promise.all([
				undefined,
				processExitPromise,
				Promise.all(stdioPromises),
				allPromise,
				...originalPromises,
				...customStreamsEndPromises,
			]),
			throwOnProcessError(processErrorPromise),
			...throwOnTimeout(timeout, context, controller),
		]);
	} catch (error) {
		spawned.kill();
		return Promise.all([
			error,
			waitForFailedProcess(processSpawnPromise, processErrorPromise, processExitPromise),
			Promise.all(stdioPromises.map(stdioPromise => getBufferedData(stdioPromise, encoding))),
			getBufferedData(allPromise, encoding),
			Promise.allSettled(originalPromises),
			Promise.allSettled(customStreamsEndPromises),
		]);
	}
};
