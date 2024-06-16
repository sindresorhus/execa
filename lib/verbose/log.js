import {writeFileSync} from 'node:fs';
import {inspect} from 'node:util';
import {escapeLines} from '../arguments/escape.js';
import {defaultVerboseFunction} from './default.js';
import {applyVerboseOnLines} from './custom.js';

// Write synchronously to ensure lines are properly ordered and not interleaved with `stdout`
export const verboseLog = ({type, verboseMessage, fdNumber, verboseInfo, result}) => {
	const verboseObject = getVerboseObject({type, result, verboseInfo});
	const printedLines = getPrintedLines(verboseMessage, verboseObject);
	const finalLines = applyVerboseOnLines(printedLines, verboseInfo, fdNumber);
	writeFileSync(STDERR_FD, finalLines);
};

const getVerboseObject = ({
	type,
	result,
	verboseInfo: {escapedCommand, commandId, rawOptions: {piped = false, ...options}},
}) => ({
	type,
	escapedCommand,
	commandId: `${commandId}`,
	timestamp: new Date(),
	piped,
	result,
	options,
});

const getPrintedLines = (verboseMessage, verboseObject) => verboseMessage
	.split('\n')
	.map(message => getPrintedLine({...verboseObject, message}));

const getPrintedLine = verboseObject => {
	const verboseLine = defaultVerboseFunction(verboseObject);
	return {verboseLine, verboseObject};
};

// Unless a `verbose` function is used, print all logs on `stderr`
const STDERR_FD = 2;

// Serialize any type to a line string, for logging
export const serializeVerboseMessage = message => {
	const messageString = typeof message === 'string' ? message : inspect(message);
	const escapedMessage = escapeLines(messageString);
	return escapedMessage.replaceAll('\t', ' '.repeat(TAB_SIZE));
};

// Same as `util.inspect()`
const TAB_SIZE = 2;
