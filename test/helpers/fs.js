import {createReadStream, createWriteStream} from 'node:fs';
import process from 'node:process';

export const getReadStream = fdNumber => fdNumber === 0
	? process.stdin
	: createReadStream(undefined, {fd: fdNumber});

export const getWriteStream = fdNumber => {
	if (fdNumber === 1) {
		return process.stdout;
	}

	return fdNumber === 2 ? process.stderr : createWriteStream(undefined, {fd: fdNumber});
};
