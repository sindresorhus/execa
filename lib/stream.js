import {once} from 'node:events';
import {finished} from 'node:stream/promises';
import {setImmediate} from 'node:timers/promises';
import getStream, {getStreamAsArrayBuffer, getStreamAsArray} from 'get-stream';
import mergeStreams from '@sindresorhus/merge-streams';
import {waitForSuccessfulExit, throwOnTimeout} from './kill.js';
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

// Wraps `finished(stream)` to handle the following case:
//  - When the child process exits, Node.js automatically calls `childProcess.stdin.destroy()`, which we need to ignore.
//  - However, we still need to throw if `childProcess.stdin.destroy()` is called before child process exit.
const onFinishedStream = async ([originalStdin], exitPromise, stream) => {
	await Promise.race([
		...(stream === originalStdin ? [exitPromise] : []),
		finished(stream, {cleanup: true}),
	]);
};

const throwOnProcessError = async (spawned, {signal}) => {
	const [error] = await once(spawned, 'error', {signal});
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
	const waitForStream = onFinishedStream.bind(undefined, originalStreams, exitPromise);

	const stdioPromises = waitForChildStreams({spawned, stdioStreamsGroups, encoding, buffer, maxBuffer, waitForStream});
	const allPromise = waitForAllStream({spawned, encoding, buffer, maxBuffer, waitForStream});
	const originalPromises = waitForOriginalStreams(originalStreams, spawned, waitForStream);
	const customStreamsEndPromises = waitForCustomStreamsEnd(stdioStreamsGroups, waitForStream);

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
			...throwOnTimeout(timeout, context, controller),
		]);
	} catch (error) {
		spawned.kill();
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
