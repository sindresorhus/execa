import {writeFileSync} from 'node:fs';
import figures from 'figures';
import {gray} from 'yoctocolors';

// Write synchronously to ensure lines are properly ordered and not interleaved with `stdout`
export const verboseLog = (string, verboseId, icon, color) => {
	const prefixedLines = addPrefix(string, verboseId, icon, color);
	writeFileSync(STDERR_FD, `${prefixedLines}\n`);
};

const STDERR_FD = 2;

const addPrefix = (string, verboseId, icon, color) => string.includes('\n')
	? string
		.split('\n')
		.map(line => addPrefixToLine(line, verboseId, icon, color))
		.join('\n')
	: addPrefixToLine(string, verboseId, icon, color);

const addPrefixToLine = (line, verboseId, icon, color = identity) => [
	gray(`[${getTimestamp()}]`),
	gray(`[${verboseId}]`),
	color(ICONS[icon]),
	color(line),
].join(' ');

const identity = string => string;

// Prepending the timestamp allows debugging the slow paths of a subprocess
const getTimestamp = () => {
	const date = new Date();
	return `${padField(date.getHours(), 2)}:${padField(date.getMinutes(), 2)}:${padField(date.getSeconds(), 2)}.${padField(date.getMilliseconds(), 3)}`;
};

const padField = (field, padding) => String(field).padStart(padding, '0');

const ICONS = {
	command: '$',
	pipedCommand: '|',
	output: ' ',
	error: figures.cross,
	warning: figures.warning,
	success: figures.tick,
};
