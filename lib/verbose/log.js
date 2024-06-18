import {writeFileSync} from 'node:fs';
import {inspect} from 'node:util';
import {escapeLines} from '../arguments/escape.js';
import {defaultLogger} from './default.js';

// Write synchronously to ensure lines are properly ordered and not interleaved with `stdout`
export const verboseLog = ({type, logMessage, verboseInfo, failed, piped}) => {
	const logObject = getLogObject({
		type,
		failed,
		piped,
		verboseInfo,
	});
	const printedLines = getPrintedLines(logMessage, logObject);
	writeFileSync(STDERR_FD, `${printedLines}\n`);
};

const getLogObject = ({
	type,
	failed = false,
	piped = false,
	verboseInfo: {commandId, rawOptions},
}) => ({
	type,
	timestamp: new Date(),
	failed,
	piped,
	commandId,
	options: rawOptions,
});

const getPrintedLines = (logMessage, logObject) => logMessage
	.split('\n')
	.map(message => defaultLogger({...logObject, message}))
	.join('\n');

// Unless a `verbose` function is used, print all logs on `stderr`
const STDERR_FD = 2;

// Serialize any type to a line string, for logging
export const serializeLogMessage = message => {
	const messageString = typeof message === 'string' ? message : inspect(message);
	const escapedMessage = escapeLines(messageString);
	return escapedMessage.replaceAll('\t', ' '.repeat(TAB_SIZE));
};

// Same as `util.inspect()`
const TAB_SIZE = 2;
