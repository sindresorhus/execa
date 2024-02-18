import {Buffer} from 'node:buffer';
import stripFinalNewline from 'strip-final-newline';
import {bufferToUint8Array} from '../utils.js';

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
