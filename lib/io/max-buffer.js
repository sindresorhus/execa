import {MaxBufferError} from 'get-stream';
import {getStreamName} from '../utils/standard-stream.js';
import {getFdSpecificValue} from '../arguments/specific.js';

// When the `maxBuffer` option is hit, a MaxBufferError is thrown.
// The stream is aborted, then specific information is kept for the error message.
export const handleMaxBuffer = ({error, stream, readableObjectMode, lines, encoding, fdNumber}) => {
	if (!(error instanceof MaxBufferError)) {
		throw error;
	}

	if (fdNumber === 'all') {
		return error;
	}

	const unit = getMaxBufferUnit(readableObjectMode, lines, encoding);
	error.maxBufferInfo = {fdNumber, unit};
	stream.destroy();
	throw error;
};

const getMaxBufferUnit = (readableObjectMode, lines, encoding) => {
	if (readableObjectMode) {
		return 'objects';
	}

	if (lines) {
		return 'lines';
	}

	if (encoding === 'buffer') {
		return 'bytes';
	}

	return 'characters';
};

// Check the `maxBuffer` option with `result.ipcOutput`, before buffering one more message.
// Like the stream-based `maxBuffer`, the threshold is hit when the buffered amount would exceed it, which also applies to non-integer values.
export const checkIpcMaxBuffer = (ipcOutput, maxBuffer) => {
	if (ipcOutput.length + 1 <= maxBuffer) {
		return;
	}

	const error = new MaxBufferError();
	error.maxBufferInfo = {fdNumber: 'ipc'};
	throw error;
};

// Error message when `maxBuffer` is hit
export const getMaxBufferMessage = (error, maxBuffer) => {
	const {streamName, threshold, unit} = getMaxBufferInfo(error, maxBuffer);
	return `Command's ${streamName} was larger than ${threshold} ${unit}`;
};

const getMaxBufferInfo = (error, maxBuffer) => {
	if (error?.maxBufferInfo === undefined) {
		return {streamName: 'output', threshold: maxBuffer[1], unit: 'bytes'};
	}

	const {maxBufferInfo: {fdNumber, unit, threshold = getFdSpecificValue(maxBuffer, fdNumber)}} = error;
	delete error.maxBufferInfo;

	if (fdNumber === 'ipc') {
		return {streamName: 'IPC output', threshold, unit: 'messages'};
	}

	return {streamName: getStreamName(fdNumber), threshold, unit};
};

// The native `maxBuffer` option passed to `spawnSync()` does not allow differentiating values per file descriptor, so we use `stdout`'s.
// Since each other file descriptor's own limit is capped by `stdout`'s, this is also the highest one.
// Node.js applies it to the total output of all piped file descriptors, not to each of them. When it is hit, the subprocess is killed and a `ENOBUFS` error is thrown.
export const getMaxBufferSync = ([, stdoutMaxBuffer]) => stdoutMaxBuffer;

// File descriptors with a limit lower than `spawnSync()`'s native `maxBuffer` are enforced from the output, after the subprocess exits.
// Since no native error was thrown, we create the `ENOBUFS` error ourselves.
// Like with asynchronous methods, file descriptors which are not buffered are not limited by their own value. However, when they are piped, e.g. to a file, they still count towards the native limit, which is `stdout`'s value.
export const handleMaxBufferSync = ({resultError, output, maxBuffer, buffer}) => {
	const fdNumber = findMaxBufferSync(output, maxBuffer, buffer);
	if (fdNumber === undefined) {
		// The native limit can be hit by the total output without any single file descriptor being over its own limit
		return {resultError, isMaxBuffer: resultError?.code === 'ENOBUFS'};
	}

	const threshold = getMaxBufferValueSync(maxBuffer, fdNumber);
	const error = resultError ?? Object.assign(new MaxBufferError(), {code: 'ENOBUFS'});
	error.maxBufferInfo = {fdNumber, unit: 'bytes', threshold};
	return {resultError: error, isMaxBuffer: true};
};

const findMaxBufferSync = (output, maxBuffer, buffer) => {
	if (output === null) {
		return;
	}

	const fdNumber = output.findIndex((result, index) => result !== null
		&& buffer[index]
		&& result.length > getMaxBufferValueSync(maxBuffer, index));
	return fdNumber === -1 ? undefined : fdNumber;
};

// `spawnSync()` uses `maxBuffer.stdout` as its native `maxBuffer`, so other file descriptors' limits can only be lower than that
const getMaxBufferValueSync = (maxBuffer, fdNumber) => Math.min(maxBuffer[1], maxBuffer[fdNumber]);

// When `maxBuffer` is hit, ensure each buffered file descriptor's result is truncated at its own limit
export const truncateMaxBufferSync = (result, fdNumber, {maxBuffer, buffer}) => {
	const maxBufferValue = getMaxBufferValueSync(maxBuffer, fdNumber);
	return buffer[fdNumber] && result.length > maxBufferValue ? result.slice(0, maxBufferValue) : result;
};
