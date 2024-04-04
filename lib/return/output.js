import stripFinalNewline from 'strip-final-newline';
import {logFinalResult} from '../verbose/complete.js';

export const stripNewline = (value, options) => options.stripFinalNewline && value !== undefined && !Array.isArray(value)
	? stripFinalNewline(value)
	: value;

export const handleResult = (result, verboseInfo, {reject}) => {
	logFinalResult(result, reject, verboseInfo);

	if (result.failed && reject) {
		throw result;
	}

	return result;
};
