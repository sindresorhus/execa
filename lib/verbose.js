import {writeFileSync} from 'node:fs';
import {debuglog} from 'node:util';
import process from 'node:process';

export const verboseDefault = debuglog('execa').enabled;

const padField = (field, padding) => String(field).padStart(padding, '0');

const getTimestamp = () => {
	const date = new Date();
	return `${padField(date.getHours(), 2)}:${padField(date.getMinutes(), 2)}:${padField(date.getSeconds(), 2)}.${padField(date.getMilliseconds(), 3)}`;
};

export const logCommand = (escapedCommand, {verbose}) => {
	if (!verbose) {
		return;
	}

	// Write synchronously to ensure it is written before spawning the child process.
	// This guarantees this line is written to `stderr` before the child process prints anything.
	writeFileSync(process.stderr.fd, `[${getTimestamp()}] ${escapedCommand}\n`);
};
