import {setImmediate} from 'node:timers/promises';
import getStream, {getStreamAsArrayBuffer, getStreamAsArray, MaxBufferError} from 'get-stream';
import {iterateForResult} from '../convert/loop.js';
import {isArrayBuffer} from '../stdio/uint-array.js';
import {waitForStream, handleStreamError, isInputFileDescriptor} from './wait.js';

export const waitForSubprocessStream = async ({stream, subprocess, fdNumber, encoding, buffer, maxBuffer, lines, allMixed, stripFinalNewline, streamInfo}) => {
	if (!stream) {
		return;
	}

	if (isInputFileDescriptor(streamInfo, fdNumber)) {
		await waitForStream(stream, fdNumber, streamInfo);
		return;
	}

	if (!buffer) {
		await Promise.all([
			waitForStream(stream, fdNumber, streamInfo),
			resumeStream(stream),
		]);
		return;
	}

	try {
		return await getAnyStream({stream, fdNumber, encoding, maxBuffer, lines, allMixed, stripFinalNewline, streamInfo});
	} catch (error) {
		if (error instanceof MaxBufferError) {
			subprocess.kill();
		}

		handleStreamError(error, fdNumber, streamInfo);
		return handleBufferedData(error);
	}
};

// When using `buffer: false`, users need to read `subprocess.stdout|stderr|all` right away
// See https://github.com/sindresorhus/execa/issues/730 and https://github.com/sindresorhus/execa/pull/729#discussion_r1465496310
const resumeStream = async stream => {
	await setImmediate();
	if (stream.readableFlowing === null) {
		stream.resume();
	}
};

const getAnyStream = async ({stream, fdNumber, encoding, maxBuffer, lines, allMixed, stripFinalNewline, streamInfo}) => {
	if (allMixed) {
		const iterable = getIterable({stream, fdNumber, encoding, lines, stripFinalNewline, streamInfo});
		return getStreamAsArray(iterable, {maxBuffer});
	}

	if (stream.readableObjectMode) {
		return getStreamAsArray(stream, {maxBuffer});
	}

	if (encoding === 'buffer') {
		return new Uint8Array(await getStreamAsArrayBuffer(stream, {maxBuffer}));
	}

	if (lines) {
		const iterable = getIterable({stream, fdNumber, encoding, lines, stripFinalNewline, streamInfo});
		return getStreamAsArray(iterable, {maxBuffer});
	}

	if (encoding !== 'utf8') {
		const iterable = getIterable({stream, fdNumber, encoding, lines, stripFinalNewline, streamInfo});
		return getStream(iterable, {maxBuffer});
	}

	return getStream(stream, {maxBuffer});
};

const getIterable = ({stream, fdNumber, encoding, lines, stripFinalNewline, streamInfo}) => {
	const onStreamEnd = waitForStream(stream, fdNumber, streamInfo);
	return iterateForResult({stream, onStreamEnd, lines, encoding, stripFinalNewline});
};

// On failure, `result.stdout|stderr|all` should contain the currently buffered stream
// They are automatically closed and flushed by Node.js when the subprocess exits
// When `buffer` is `false`, `streamPromise` is `undefined` and there is no buffered data to retrieve
export const getBufferedData = async streamPromise => {
	try {
		return await streamPromise;
	} catch (error) {
		return handleBufferedData(error);
	}
};

const handleBufferedData = ({bufferedData}) => isArrayBuffer(bufferedData)
	? new Uint8Array(bufferedData)
	: bufferedData;

