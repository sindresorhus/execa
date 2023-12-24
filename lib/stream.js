import {once} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import {finished} from 'node:stream/promises';
import process from 'node:process';
import getStream, {getStreamAsBuffer, getStreamAsArrayBuffer} from 'get-stream';
import mergeStreams from '@sindresorhus/merge-streams';

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

// Some `stdout`/`stderr` options create a stream, e.g. when passing a file path.
// The `.pipe()` method automatically ends that stream when `childProcess.stdout|stderr` ends.
// This makes sure we want for the completion of those streams, in order to catch any error.
// Since we want to end those streams, they cannot be infinite, except for `process.stdout|stderr`.
// However, for the `stdin`/`input`/`inputFile` options, we only wait for errors, not completion.
// This is because source streams completion should end destination streams, but not the other way around.
// This allows for source streams to pipe to multiple destinations.
// We make an exception for `filePath`, since we create that source stream and we know it is piped to a single destination.
const waitForStreamEnd = ({value, type, direction}, processDone) => {
	if (type === 'native' || type === 'stringOrBuffer') {
		return;
	}

	return type === 'filePath' || (direction === 'output' && value !== process.stdout && value !== process.stderr)
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
		return Promise.all([
			{error, signal: error.signal, timedOut: error.timedOut},
			getBufferedData(spawned.stdout, stdoutPromise),
			getBufferedData(spawned.stderr, stderrPromise),
			getBufferedData(spawned.all, allPromise),
		]);
	} finally {
		cleanupStdioStreams(stdioStreams);
		spawned.kill();
	}
};
