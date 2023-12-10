import {once} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import getStream, {getStreamAsBuffer} from 'get-stream';
import mergeStreams from '@sindresorhus/merge-streams';

// `all` interleaves `stdout` and `stderr`
export const makeAllStream = (spawned, {all}) => {
	if (!all || (!spawned.stdout && !spawned.stderr)) {
		return;
	}

	return mergeStreams([spawned.stdout, spawned.stderr].filter(Boolean));
};

// On failure, `result.stdout|stderr|all` should contain the currently buffered stream
const getBufferedData = async (stream, streamPromise) => {
	// When `buffer` is `false`, `streamPromise` is `undefined` and there is no buffered data to retrieve
	if (!stream || streamPromise === undefined) {
		return;
	}

	// Wait for the `all` stream to receive the last chunk before destroying the stream
	await setTimeout(0);

	stream.destroy();

	try {
		return await streamPromise;
	} catch (error) {
		return error.bufferedData;
	}
};

const getStreamPromise = (stream, {encoding, buffer, maxBuffer}) => {
	if (!stream || !buffer) {
		return;
	}

	// eslint-disable-next-line unicorn/text-encoding-identifier-case
	if (encoding === 'utf8' || encoding === 'utf-8') {
		return getStream(stream, {maxBuffer});
	}

	if (encoding === null || encoding === 'buffer') {
		return getStreamAsBuffer(stream, {maxBuffer});
	}

	return applyEncoding(stream, maxBuffer, encoding);
};

const applyEncoding = async (stream, maxBuffer, encoding) => {
	const buffer = await getStreamAsBuffer(stream, {maxBuffer});
	return buffer.toString(encoding);
};

// Handle any errors thrown by the iterable passed to the `stdin` option, if any.
// We do not consume nor wait on that stream though, since it could potentially be infinite (like `process.stdin` in an interactive TTY).
const throwOnStreamsError = streams => streams.filter(Boolean).map(stream => throwOnStreamError(stream));

const throwOnStreamError = async stream => {
	const [error] = await once(stream, 'error');
	throw error;
};

// Retrieve result of child process: exit code, signal, error, streams (stdout/stderr/all)
export const getSpawnedResult = async (spawned, {encoding, buffer, maxBuffer}, {stdinStream}, processDone) => {
	const stdoutPromise = getStreamPromise(spawned.stdout, {encoding, buffer, maxBuffer});
	const stderrPromise = getStreamPromise(spawned.stderr, {encoding, buffer, maxBuffer});
	const allPromise = getStreamPromise(spawned.all, {encoding, buffer, maxBuffer: maxBuffer * 2});
	const processDoneOrStreamsError = Promise.race([processDone, ...throwOnStreamsError([stdinStream])]);

	try {
		return await Promise.all([processDoneOrStreamsError, stdoutPromise, stderrPromise, allPromise]);
	} catch (error) {
		spawned.kill();
		return Promise.all([
			{error, signal: error.signal, timedOut: error.timedOut},
			getBufferedData(spawned.stdout, stdoutPromise),
			getBufferedData(spawned.stderr, stderrPromise),
			getBufferedData(spawned.all, allPromise),
		]);
	}
};
