import {createReadStream, createWriteStream} from 'node:fs';
import process from 'node:process';

export const getReadStream = fdNumber => fdNumber === 0
	? process.stdin
	: createReadStream(undefined, {fd: fdNumber});

export const getWriteStream = fdNumber => {
	if (fdNumber === 1) {
		return process.stdout;
	}

	if (fdNumber === 2) {
		return process.stderr;
	}

	return createWriteStream(undefined, {fd: fdNumber});
};
