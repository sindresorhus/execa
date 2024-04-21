import {MaxBufferError} from 'get-stream';
import {getStreamName} from '../utils/standard-stream.js';

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

// Error message when `maxBuffer` is hit
export const getMaxBufferMessage = (error, maxBuffer) => {
	const {streamName, threshold, unit} = getMaxBufferInfo(error, maxBuffer);
	return `Command's ${streamName} was larger than ${threshold} ${unit}`;
};

const getMaxBufferInfo = (error, maxBuffer) => {
	if (error?.maxBufferInfo === undefined) {
		return {streamName: 'output', threshold: maxBuffer[1], unit: 'bytes'};
	}

	const {maxBufferInfo: {fdNumber, unit}} = error;
	delete error.maxBufferInfo;
	return {streamName: getStreamName(fdNumber), threshold: maxBuffer[fdNumber], unit};
};

// The only way to apply `maxBuffer` with `spawnSync()` is to use the native `maxBuffer` option Node.js provides.
// However, this has multiple limitations, and cannot behave the exact same way as the async behavior.
// When the `maxBuffer` is hit, a `ENOBUFS` error is thrown.
export const isMaxBufferSync = (resultError, output, maxBuffer) => resultError?.code === 'ENOBUFS'
	&& output !== null
	&& output.some(result => result !== null && result.length > getMaxBufferSync(maxBuffer));

// When `maxBuffer` is hit, ensure the result is truncated
export const truncateMaxBufferSync = (result, isMaxBuffer, maxBuffer) => {
	if (!isMaxBuffer) {
		return result;
	}

	const maxBufferValue = getMaxBufferSync(maxBuffer);
	return result.length > maxBufferValue ? result.slice(0, maxBufferValue) : result;
};

// `spawnSync()` does not allow differentiating `maxBuffer` per file descriptor, so we always use `stdout`
export const getMaxBufferSync = ([, stdoutMaxBuffer]) => stdoutMaxBuffer;
