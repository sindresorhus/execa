import {Buffer} from 'node:buffer';
import {once} from 'node:events';
import {finished} from 'node:stream/promises';
import process from 'node:process';
import getStream, {getStreamAsArrayBuffer} from 'get-stream';
import mergeStreams from '@sindresorhus/merge-streams';
import {throwOnTimeout, cleanupOnExit} from './kill.js';

// `all` interleaves `stdout` and `stderr`
export const makeAllStream = (spawned, {all}) => {
	if (!all) {
		return;
	}

	if (!spawned.stdout) {
		return spawned.stderr;
	}

	if (!spawned.stderr) {
		return spawned.stdout;
	}

	return mergeStreams([spawned.stdout, spawned.stderr]);
};

// On failure, `result.stdout|stderr|all` should contain the currently buffered stream
// They are automatically closed and flushed by Node.js when the child process exits
// We guarantee this by calling `childProcess.kill()`
// When `buffer` is `false`, `streamPromise` is `undefined` and there is no buffered data to retrieve
const getBufferedData = async (streamPromise, encoding) => {
	try {
		return await streamPromise;
	} catch (error) {
		return error.bufferedData === undefined ? undefined : applyEncoding(error.bufferedData, encoding);
	}
};

const getStreamPromise = async (stream, {encoding, buffer, maxBuffer}) => {
	if (!stream || !buffer) {
		return;
	}

	const contents = isUtf8Encoding(encoding)
		? await getStream(stream, {maxBuffer})
		: await getStreamAsArrayBuffer(stream, {maxBuffer});
	return applyEncoding(contents, encoding);
};

const applyEncoding = (contents, encoding) => {
	if (isUtf8Encoding(encoding)) {
		return contents;
	}

	if (encoding === 'buffer') {
		return new Uint8Array(contents);
	}

	return Buffer.from(contents).toString(encoding);
};

// eslint-disable-next-line unicorn/text-encoding-identifier-case
const isUtf8Encoding = encoding => encoding === 'utf8' || encoding === 'utf-8';

// Retrieve streams created by the `std*` options
const getCustomStreams = stdioStreams => stdioStreams.filter(({type}) => type !== 'native' && type !== 'stringOrBuffer');

// Some `stdout`/`stderr` options create a stream, e.g. when passing a file path.
// The `.pipe()` method automatically ends that stream when `childProcess.stdout|stderr` ends.
// This makes sure we want for the completion of those streams, in order to catch any error.
// Since we want to end those streams, they cannot be infinite, except for `process.stdout|stderr`.
// However, for the `stdin`/`input`/`inputFile` options, we only wait for errors, not completion.
// This is because source streams completion should end destination streams, but not the other way around.
// This allows for source streams to pipe to multiple destinations.
// We make an exception for `filePath`, since we create that source stream and we know it is piped to a single destination.
const waitForCustomStreamsEnd = customStreams => customStreams
	.filter(({value, type, direction}) => shouldWaitForCustomStream(value, type, direction))
	.map(({value}) => finished(value));

const throwOnCustomStreamsError = customStreams => customStreams
	.filter(({value, type, direction}) => !shouldWaitForCustomStream(value, type, direction))
	.map(({value}) => throwOnStreamError(value));

const shouldWaitForCustomStream = (value, type, direction) => type === 'filePath'
	|| (direction === 'output' && value !== process.stdout && value !== process.stderr);

const throwIfStreamError = stream => stream === null ? [] : [throwOnStreamError(stream)];

const throwOnStreamError = async stream => {
	const [error] = await once(stream, 'error');
	throw error;
};

// The streams created by the `std*` options are automatically ended by `.pipe()`.
// However `.pipe()` only does so when the source stream ended, not when it errored.
// Therefore, when `childProcess.stdin|stdout|stderr` errors, those streams must be manually destroyed.
const cleanupStdioStreams = (customStreams, error) => {
	for (const customStream of customStreams) {
		if (customStream.autoDestroy) {
			customStream.value.destroy(error);
		}
	}
};

// Retrieve result of child process: exit code, signal, error, streams (stdout/stderr/all)
export const getSpawnedResult = async (
	spawned,
	{encoding, buffer, maxBuffer, timeout, killSignal, cleanup, detached},
	context,
	stdioStreams,
) => {
	const finalizers = [];
	cleanupOnExit(spawned, cleanup, detached, finalizers);
	const customStreams = getCustomStreams(stdioStreams);

	const stdoutPromise = getStreamPromise(spawned.stdout, {encoding, buffer, maxBuffer});
	const stderrPromise = getStreamPromise(spawned.stderr, {encoding, buffer, maxBuffer});
	const allPromise = getStreamPromise(spawned.all, {encoding, buffer, maxBuffer: maxBuffer * 2});

	try {
		return await Promise.race([
			Promise.all([
				once(spawned, 'exit'),
				stdoutPromise,
				stderrPromise,
				allPromise,
				...waitForCustomStreamsEnd(customStreams),
			]),
			...throwOnCustomStreamsError(customStreams),
			...throwIfStreamError(spawned.stdin),
			...throwOnTimeout({spawned, timeout, killSignal, context, finalizers}),
		]);
	} catch (error) {
		spawned.kill();
		const results = await Promise.all([
			[undefined, context.signal, error],
			getBufferedData(stdoutPromise, encoding),
			getBufferedData(stderrPromise, encoding),
			getBufferedData(allPromise, encoding),
		]);
		cleanupStdioStreams(customStreams, error);
		return results;
	} finally {
		for (const finalizer of finalizers) {
			finalizer();
		}
	}
};
