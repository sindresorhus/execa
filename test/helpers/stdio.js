import process from 'node:process';

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

export const STANDARD_STREAMS = [process.stdin, process.stdout, process.stderr];

export const prematureClose = {code: 'ERR_STREAM_PREMATURE_CLOSE'};
