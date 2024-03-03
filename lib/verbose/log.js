import {writeFileSync} from 'node:fs';
import process from 'node:process';

// Write synchronously to ensure lines are properly ordered and not interleaved with `stdout`
export const verboseLog = (string, icon) => {
	writeFileSync(process.stderr.fd, `[${getTimestamp()}] ${ICONS[icon]} ${string}\n`);
};

// Prepending the timestamp allows debugging the slow paths of a process
const getTimestamp = () => {
	const date = new Date();
	return `${padField(date.getHours(), 2)}:${padField(date.getMinutes(), 2)}:${padField(date.getSeconds(), 2)}.${padField(date.getMilliseconds(), 3)}`;
};

const padField = (field, padding) => String(field).padStart(padding, '0');

const ICONS = {
	command: '$',
	pipedCommand: '|',
};
