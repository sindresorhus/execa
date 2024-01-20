import process from 'node:process';

export const identity = value => value;

export const getStdio = (indexOrName, stdioOption, length) => {
	if (typeof indexOrName === 'string') {
		return {[indexOrName]: stdioOption};
	}

	const stdio = Array.from({length}).fill('pipe');
	stdio[indexOrName] = stdioOption;
	return {stdio};
};

export const fullStdio = getStdio(3, 'pipe');

export const STANDARD_STREAMS = [process.stdin, process.stdout, process.stderr];
