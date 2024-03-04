import {writeFileSync} from 'node:fs';
import process from 'node:process';

// Write synchronously to ensure lines are properly ordered and not interleaved with `stdout`
export const verboseLog = (string, verboseId, icon) => {
	const prefixedLines = addPrefix(string, verboseId, icon);
	writeFileSync(process.stderr.fd, `${prefixedLines}\n`);
};

const addPrefix = (string, verboseId, icon) => string.includes('\n')
	? string
		.split('\n')
		.map(line => addPrefixToLine(line, verboseId, icon))
		.join('\n')
	: addPrefixToLine(string, verboseId, icon);

const addPrefixToLine = (line, verboseId, icon) => [
	`[${getTimestamp()}]`,
	`[${verboseId}]`,
	ICONS[icon],
	line,
].join(' ');

// Prepending the timestamp allows debugging the slow paths of a process
const getTimestamp = () => {
	const date = new Date();
	return `${padField(date.getHours(), 2)}:${padField(date.getMinutes(), 2)}:${padField(date.getSeconds(), 2)}.${padField(date.getMilliseconds(), 3)}`;
};

const padField = (field, padding) => String(field).padStart(padding, '0');

const ICONS = {
	command: '$',
	pipedCommand: '|',
	output: ' ',
	error: '×',
	warning: '‼',
	success: '√',
};
