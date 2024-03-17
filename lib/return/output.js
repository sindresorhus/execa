import {Buffer} from 'node:buffer';
import stripFinalNewline from 'strip-final-newline';
import {bufferToUint8Array} from '../encoding.js';
import {logFinalResult} from '../verbose/complete.js';

export const handleOutput = (options, value) => {
	if (value === undefined || value === null) {
		return;
	}

	if (Array.isArray(value)) {
		return value;
	}

	if (Buffer.isBuffer(value)) {
		value = bufferToUint8Array(value);
	}

	return options.stripFinalNewline ? stripFinalNewline(value) : value;
};

export const handleResult = (result, verboseInfo, {reject}) => {
	logFinalResult(result, reject, verboseInfo);

	if (result.failed && reject) {
		throw result;
	}

	return result;
};
