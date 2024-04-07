import stripFinalNewlineFunction from 'strip-final-newline';
import {logFinalResult} from '../verbose/complete.js';

export const stripNewline = (value, {stripFinalNewline}, isAll, fdNumber) => getStripFinalNewline(stripFinalNewline, isAll, fdNumber) && value !== undefined && !Array.isArray(value)
	? stripFinalNewlineFunction(value)
	: value;

export const getStripFinalNewline = (stripFinalNewline, isAll, fdNumber) => isAll
	? stripFinalNewline[1] || stripFinalNewline[2]
	: stripFinalNewline[fdNumber];

export const handleResult = (result, verboseInfo, {reject}) => {
	logFinalResult(result, reject, verboseInfo);

	if (result.failed && reject) {
		throw result;
	}

	return result;
};
