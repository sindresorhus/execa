import {once} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import {finished} from 'node:stream/promises';
import getStream, {getStreamAsBuffer, getStreamAsArrayBuffer} from 'get-stream';
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

	if (encoding === 'buffer') {
		return getStreamAsArrayBuffer(stream, {maxBuffer}).then(arrayBuffer => new Uint8Array(arrayBuffer));
	}

	return applyEncoding(stream, maxBuffer, encoding);
};

const applyEncoding = async (stream, maxBuffer, encoding) => {
	const buffer = await getStreamAsBuffer(stream, {maxBuffer});
	return buffer.toString(encoding);
};

// We need to handle any `error` coming from the `stdin|stdout|stderr` options.
// However, those might be infinite streams, e.g. a TTY passed as input or output.
// We wait for completion or not depending on whether `finite` is `true`.
// In either case, we handle `error` events while the process is running.
const waitForStreamEnd = ({value, type}, processDone) => {
	if (type === 'native' || type === 'stringOrBuffer') {
		return;
	}

	return type === 'filePath'
		? finished(value)
		: Promise.race([processDone, throwOnStreamError(value)]);
};

const throwOnStreamError = async stream => {
	const [error] = await once(stream, 'error');
	throw error;
};

const cleanupStdioStreams = stdioStreams => {
	for (const stdioStream of stdioStreams) {
		if (stdioStream.autoDestroy) {
			stdioStream.value.destroy();
		}
	}
};

// Retrieve result of child process: exit code, signal, error, streams (stdout/stderr/all)
export const getSpawnedResult = async (
	spawned,
	{encoding, buffer, maxBuffer},
	stdioStreams,
	processDone,
) => {
	const stdoutPromise = getStreamPromise(spawned.stdout, {encoding, buffer, maxBuffer});
	const stderrPromise = getStreamPromise(spawned.stderr, {encoding, buffer, maxBuffer});
	const allPromise = getStreamPromise(spawned.all, {encoding, buffer, maxBuffer: maxBuffer * 2});

	try {
		return await Promise.all([
			processDone,
			stdoutPromise,
			stderrPromise,
			allPromise,
			...stdioStreams.map(stdioStream => waitForStreamEnd(stdioStream, processDone)),
		]);
	} catch (error) {
		cleanupStdioStreams(stdioStreams);
		spawned.kill();
		return Promise.all([
			{error, signal: error.signal, timedOut: error.timedOut},
			getBufferedData(spawned.stdout, stdoutPromise),
			getBufferedData(spawned.stderr, stderrPromise),
			getBufferedData(spawned.all, allPromise),
		]);
	}
};
