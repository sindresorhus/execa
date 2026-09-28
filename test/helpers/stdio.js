import assert from 'node:assert/strict';
import process, {platform} from 'node:process';
import {noopReadable} from './stream.js';

export const identity = value => value;

export const getStdio = (fdNumberOrName, stdioOption, length = 3) => {
	if (typeof fdNumberOrName === 'string') {
		return {[fdNumberOrName]: stdioOption};
	}

	const stdio = Array.from({length}).fill('pipe');
	stdio[fdNumberOrName] = stdioOption;
	return {stdio};
};

export const fullStdio = getStdio(3, 'pipe');
export const fullReadableStdio = () => getStdio(3, ['pipe', noopReadable()]);

export const STANDARD_STREAMS = [process.stdin, process.stdout, process.stderr];

export const prematureClose = {code: 'ERR_STREAM_PREMATURE_CLOSE'};

const isWindows = platform === 'win32';

export const assertEpipe = (stderr, fdNumber = 1) => {
	if (fdNumber === 1 && !isWindows) {
		assert.ok(stderr.includes('EPIPE'));
	}
};

export const parseStdioOption = stdioOption => {
	const optionValue = JSON.parse(stdioOption);
	if (typeof optionValue === 'string' && optionValue in process) {
		return process[optionValue];
	}

	return Array.isArray(optionValue) && typeof optionValue[0] === 'string' && optionValue[0] in process ? [process[optionValue[0]], ...optionValue.slice(1)] : optionValue;
};
