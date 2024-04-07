import {MaxBufferError} from 'get-stream';

export const handleMaxBuffer = ({error, stream, readableObjectMode, lines, encoding, streamName}) => {
	if (!(error instanceof MaxBufferError)) {
		return;
	}

	const unit = getMaxBufferUnit(readableObjectMode, lines, encoding);
	error.maxBufferInfo = {unit, streamName};
	stream.destroy();
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

export const getMaxBufferMessage = (error, maxBuffer) => {
	const {unit, streamName} = getMaxBufferInfo(error);
	return `Command's ${streamName} was larger than ${maxBuffer} ${unit}`;
};

const getMaxBufferInfo = error => {
	if (error?.maxBufferInfo === undefined) {
		return {unit: 'bytes', streamName: 'output'};
	}

	const {maxBufferInfo} = error;
	delete error.maxBufferInfo;
	return maxBufferInfo;
};
