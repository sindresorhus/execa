import {once} from 'node:events';
import {createReadStream, readFileSync} from 'node:fs';
import {setTimeout} from 'node:timers/promises';
import {isStream} from 'is-stream';
import getStream, {getStreamAsBuffer} from 'get-stream';
import mergeStreams from '@sindresorhus/merge-streams';

export const validateInputOptions = ({input, inputFile}, {stdinIterableStream}) => {
	if (input !== undefined && inputFile !== undefined) {
		throw new TypeError('The `input` and `inputFile` options cannot be both set.');
	}

	if (stdinIterableStream !== undefined) {
		if (input !== undefined) {
			throw new TypeError('The `stdin` option cannot be an iterable when the `input` option is set.');
		}

		if (inputFile !== undefined) {
			throw new TypeError('The `stdin` option cannot be an iterable when the `inputFile` option is set.');
		}
	}
};

// `input` and `inputFile` option in sync mode
export const handleInputSync = ({input, inputFile}, {stdinIterableStream}) => {
	if (stdinIterableStream !== undefined) {
		throw new TypeError('The `stdin` option cannot be an iterable in sync mode');
	}

	const inputOption = typeof inputFile === 'string' ? readFileSync(inputFile) : input;

	if (isStream(inputOption)) {
		throw new TypeError('The `input` option cannot be a stream in sync mode');
	}

	return inputOption;
};

// `input` and `inputFile` option in async mode
export const handleInput = (spawned, {input, inputFile}, {stdinIterableStream}) => {
	if (stdinIterableStream !== undefined) {
		stdinIterableStream.pipe(spawned.stdin);
		return;
	}

	const inputOption = typeof inputFile === 'string' ? createReadStream(inputFile) : input;

	if (inputOption === undefined) {
		return;
	}

	if (isStream(inputOption)) {
		inputOption.pipe(spawned.stdin);
	} else {
		spawned.stdin.end(inputOption);
	}
};

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
const throwOnStreamsError = streams => streams.filter(Boolean).map(stream => once(stream, ''));

// Retrieve result of child process: exit code, signal, error, streams (stdout/stderr/all)
export const getSpawnedResult = async (spawned, {encoding, buffer, maxBuffer}, {stdinIterableStream}, processDone) => {
	const stdoutPromise = getStreamPromise(spawned.stdout, {encoding, buffer, maxBuffer});
	const stderrPromise = getStreamPromise(spawned.stderr, {encoding, buffer, maxBuffer});
	const allPromise = getStreamPromise(spawned.all, {encoding, buffer, maxBuffer: maxBuffer * 2});
	const processDoneOrStreamsError = Promise.race([processDone, ...throwOnStreamsError([stdinIterableStream])]);

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
