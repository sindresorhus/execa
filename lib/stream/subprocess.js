import {setImmediate} from 'node:timers/promises';
import getStream, {getStreamAsArrayBuffer, getStreamAsArray, MaxBufferError} from 'get-stream';
import {waitForStream, handleStreamError, isInputFileDescriptor, getFileDescriptor} from './wait.js';

export const waitForSubprocessStream = async ({stream, subprocess, fdNumber, encoding, buffer, maxBuffer, lines, streamInfo}) => {
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
		return await getAnyStream({stream, fdNumber, encoding, maxBuffer, lines, streamInfo});
	} catch (error) {
		if (error instanceof MaxBufferError) {
			subprocess.kill();
		}

		handleStreamError(error, fdNumber, streamInfo);
		return handleBufferedData(error, encoding);
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

const getAnyStream = async ({stream, fdNumber, encoding, maxBuffer, lines, streamInfo}) => {
	if (stream.readableObjectMode) {
		return getStreamAsArray(stream, {maxBuffer});
	}

	if (lines) {
		return getOutputLines(stream, fdNumber, streamInfo);
	}

	const contents = encoding === 'buffer'
		? await getStreamAsArrayBuffer(stream, {maxBuffer})
		: await getStream(stream, {maxBuffer});
	return applyEncoding(contents, encoding);
};

const getOutputLines = async (stream, fdNumber, streamInfo) => {
	await waitForStream(stream, fdNumber, streamInfo);
	return getFileDescriptor(streamInfo, fdNumber).outputLines;
};

// On failure, `result.stdout|stderr|all` should contain the currently buffered stream
// They are automatically closed and flushed by Node.js when the subprocess exits
// When `buffer` is `false`, `streamPromise` is `undefined` and there is no buffered data to retrieve
export const getBufferedData = async (streamPromise, encoding) => {
	try {
		return await streamPromise;
	} catch (error) {
		return handleBufferedData(error, encoding);
	}
};

const handleBufferedData = ({bufferedData}, encoding) => bufferedData === undefined || Array.isArray(bufferedData)
	? bufferedData
	: applyEncoding(bufferedData, encoding);

const applyEncoding = (contents, encoding) => encoding === 'buffer' ? new Uint8Array(contents) : contents;
