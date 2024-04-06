import {setImmediate} from 'node:timers/promises';
import getStream, {getStreamAsArrayBuffer, getStreamAsArray, MaxBufferError} from 'get-stream';
import {iterateForResult} from '../convert/loop.js';
import {isArrayBuffer} from '../stdio/uint-array.js';
import {waitForStream, isInputFileDescriptor} from './wait.js';

export const waitForSubprocessStream = async ({stream, fdNumber, encoding, buffer, maxBuffer, lines, allMixed, stripFinalNewline, streamInfo}) => {
	if (!stream) {
		return;
	}

	const onStreamEnd = waitForStream(stream, fdNumber, streamInfo);
	const [output] = await Promise.all([
		waitForDefinedStream({stream, onStreamEnd, fdNumber, encoding, buffer, maxBuffer, lines, allMixed, stripFinalNewline, streamInfo}),
		onStreamEnd,
	]);
	return output;
};

const waitForDefinedStream = async ({stream, onStreamEnd, fdNumber, encoding, buffer, maxBuffer, lines, allMixed, stripFinalNewline, streamInfo}) => {
	if (isInputFileDescriptor(streamInfo, fdNumber)) {
		return;
	}

	if (!buffer) {
		await resumeStream(stream);
		return;
	}

	const iterable = iterateForResult({stream, onStreamEnd, lines, encoding, stripFinalNewline, allMixed});
	return getStreamContents({stream, iterable, encoding, maxBuffer, lines});
};

// When using `buffer: false`, users need to read `subprocess.stdout|stderr|all` right away
// See https://github.com/sindresorhus/execa/issues/730 and https://github.com/sindresorhus/execa/pull/729#discussion_r1465496310
const resumeStream = async stream => {
	await setImmediate();
	if (stream.readableFlowing === null) {
		stream.resume();
	}
};

const getStreamContents = async ({stream, iterable, encoding, maxBuffer, lines}) => {
	try {
		if (stream.readableObjectMode || lines) {
			return await getStreamAsArray(iterable, {maxBuffer});
		}

		if (encoding === 'buffer') {
			return new Uint8Array(await getStreamAsArrayBuffer(iterable, {maxBuffer}));
		}

		return await getStream(iterable, {maxBuffer});
	} catch (error) {
		if (error instanceof MaxBufferError) {
			stream.destroy();
		}

		throw error;
	}
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

