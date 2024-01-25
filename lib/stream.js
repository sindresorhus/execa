import {once} from 'node:events';
import {finished} from 'node:stream/promises';
import getStream, {getStreamAsArrayBuffer, getStreamAsArray} from 'get-stream';
import mergeStreams from '@sindresorhus/merge-streams';
import {throwOnTimeout, cleanupOnExit} from './kill.js';
import {STANDARD_STREAMS} from './stdio/native.js';
import {generatorToDuplexStream} from './stdio/generator.js';

// `all` interleaves `stdout` and `stderr`
export const makeAllStream = ({stdout, stderr}, {all}) => all && (stdout || stderr)
	? mergeStreams([stdout, stderr].filter(Boolean))
	: undefined;

// `childProcess.stdout|stderr` do not end until they have been consumed by `childProcess.all`.
// `childProcess.all` does not end until `childProcess.stdout|stderr` have ended.
// That's a good thing, since it ensures those streams are fully read and destroyed, even on errors.
// However, this creates a deadlock if `childProcess.all` is not being read.
// Doing so prevents the process from exiting, even when it failed.
// It also prevents those streams from being properly destroyed.
// This can only happen when:
//  - `all` is `true`
//  - `buffer` is `false`
//  - `childProcess.all` is not read by the user
// Therefore, we forcefully resume `childProcess.all` flow on errors.
const resumeAll = all => {
	if (all?.readableFlowing === null) {
		all.resume();
	}
};

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

const getStdioPromise = ({stream, stdioStreams, encoding, buffer, maxBuffer}) => stdioStreams[0].direction === 'output'
	? getStreamPromise({stream, encoding, buffer, maxBuffer})
	: undefined;

const getAllPromise = ({spawned, encoding, buffer, maxBuffer}) => getStreamPromise({stream: getAllStream(spawned, encoding), encoding, buffer, maxBuffer: maxBuffer * 2});

// When `childProcess.stdout` is in objectMode but not `childProcess.stderr` (or the opposite), we need to use both:
//  - `getStreamAsArray()` for the chunks in objectMode, to return as an array without changing each chunk
//  - `getStreamAsArrayBuffer()` or `getStream()` for the chunks not in objectMode, to convert them from Buffers to string or Uint8Array
// We do this by emulating the Buffer -> string|Uint8Array conversion performed by `get-stream` with our own, which is identical.
const getAllStream = ({all, stdout, stderr}, encoding) => all && stdout && stderr && stdout.readableObjectMode !== stderr.readableObjectMode
	? all.pipe(generatorToDuplexStream({value: allStreamGenerator, encoding}).value)
	: all;

const allStreamGenerator = {
	async * transform(chunks) {
		yield * chunks;
	},
	binary: true,
	writableObjectMode: true,
	readableObjectMode: true,
};

const getStreamPromise = async ({stream, encoding, buffer, maxBuffer}) => {
	if (!stream) {
		return;
	}

	if (!buffer) {
		return finished(stream);
	}

	if (stream.readableObjectMode) {
		return getStreamAsArray(stream, {maxBuffer});
	}

	const contents = encoding === 'buffer'
		? await getStreamAsArrayBuffer(stream, {maxBuffer})
		: await getStream(stream, {maxBuffer});
	return applyEncoding(contents, encoding);
};

const applyEncoding = (contents, encoding) => encoding === 'buffer' ? new Uint8Array(contents) : contents;

// Retrieve streams created by the `std*` options
const getCustomStreams = stdioStreamsGroups => stdioStreamsGroups.flat().filter(({type}) => type !== 'native');

// Some `stdout`/`stderr` options create a stream, e.g. when passing a file path.
// The `.pipe()` method automatically ends that stream when `childProcess.stdout|stderr` ends.
// This makes sure we want for the completion of those streams, in order to catch any error.
// Since we want to end those streams, they cannot be infinite, except for `process.stdout|stderr`.
// However, for the `stdin`/`input`/`inputFile` options, we only wait for errors, not completion.
// This is because source streams completion should end destination streams, but not the other way around.
// This allows for source streams to pipe to multiple destinations.
// We make an exception for `fileUrl` and `filePath`, since we create that source stream and we know it is piped to a single destination.
const waitForCustomStreamsEnd = customStreams => customStreams
	.filter(({value, type, direction}) => shouldWaitForCustomStream(value, type, direction))
	.map(({value}) => finished(value));

const throwOnCustomStreamsError = customStreams => customStreams
	.filter(({value, type, direction}) => !shouldWaitForCustomStream(value, type, direction))
	.map(({value}) => throwOnStreamError(value));

const shouldWaitForCustomStream = (value, type, direction) => (type === 'fileUrl' || type === 'filePath')
	|| (direction === 'output' && !STANDARD_STREAMS.includes(value));

const throwIfStreamError = stream => stream === null ? [] : [throwOnStreamError(stream)];

const throwOnStreamError = async stream => {
	const [error] = await once(stream, 'error');
	throw error;
};

// The streams created by the `std*` options are automatically ended by `.pipe()`.
// However `.pipe()` only does so when the source stream ended, not when it errored.
// Therefore, when `childProcess.stdin|stdout|stderr` errors, those streams must be manually destroyed.
const cleanupStdioStreams = (customStreams, error) => {
	for (const {value} of customStreams) {
		if (!STANDARD_STREAMS.includes(value)) {
			value.destroy(error);
		}
	}
};

// Like `once()` except it never rejects, especially not on `error` event.
const pEvent = (eventEmitter, eventName) => new Promise(resolve => {
	eventEmitter.once(eventName, (...payload) => {
		resolve([eventName, ...payload]);
	});
});

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
	options: {encoding, buffer, maxBuffer, timeoutDuration: timeout, cleanup, detached},
	context,
	stdioStreamsGroups,
	controller,
}) => {
	const processSpawnPromise = pEvent(spawned, 'spawn');
	const processErrorPromise = pEvent(spawned, 'error');
	const processExitPromise = pEvent(spawned, 'exit');

	const removeExitHandler = cleanupOnExit(spawned, cleanup, detached);
	const customStreams = getCustomStreams(stdioStreamsGroups);

	const stdioPromises = spawned.stdio.map((stream, index) => getStdioPromise({stream, stdioStreams: stdioStreamsGroups[index], encoding, buffer, maxBuffer}));
	const allPromise = getAllPromise({spawned, encoding, buffer, maxBuffer});
	const customStreamsEndPromises = waitForCustomStreamsEnd(customStreams);

	try {
		return await Promise.race([
			Promise.all([
				undefined,
				processExitPromise,
				Promise.all(stdioPromises),
				allPromise,
				...customStreamsEndPromises,
			]),
			throwOnProcessError(processErrorPromise),
			...throwOnCustomStreamsError(customStreams),
			...throwIfStreamError(spawned.stdin),
			...throwOnTimeout(timeout, context, controller),
		]);
	} catch (error) {
		spawned.kill();
		resumeAll(spawned.all);
		const results = await Promise.all([
			error,
			waitForFailedProcess(processSpawnPromise, processErrorPromise, processExitPromise),
			Promise.all(stdioPromises.map(stdioPromise => getBufferedData(stdioPromise, encoding))),
			getBufferedData(allPromise, encoding),
		]);
		cleanupStdioStreams(customStreams, error);
		await Promise.allSettled(customStreamsEndPromises);
		return results;
	} finally {
		controller.abort();
		removeExitHandler?.();
	}
};
