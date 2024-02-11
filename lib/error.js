import {signalsByName} from 'human-signals';
import stripFinalNewline from 'strip-final-newline';
import {isBinary, binaryToString} from './stdio/utils.js';
import {fixCwdError} from './cwd.js';

export const getErrorPrefix = ({timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled}) => {
	if (timedOut) {
		return `Command timed out after ${timeout} milliseconds`;
	}

	if (isCanceled) {
		return 'Command was canceled';
	}

	if (errorCode !== undefined) {
		return `Command failed with ${errorCode}`;
	}

	if (signal !== undefined) {
		return `Command was killed with ${signal} (${signalDescription})`;
	}

	if (exitCode !== undefined) {
		return `Command failed with exit code ${exitCode}`;
	}

	return 'Command failed';
};

const getErrorSuffix = (error, cwd) => {
	if (error === undefined) {
		return {originalMessage: '', suffix: ''};
	}

	const originalErrorMessage = previousErrors.has(error) ? error.originalMessage : String(error?.message ?? error);
	const originalMessage = fixCwdError(originalErrorMessage, cwd);
	const suffix = `\n${originalMessage}`;
	return {originalMessage, suffix};
};

// `signal` and `exitCode` emitted on `spawned.on('exit')` event can be `null`.
// We normalize them to `undefined`
export const normalizeExitPayload = (rawExitCode, rawSignal) => {
	const exitCode = rawExitCode === null ? undefined : rawExitCode;
	const signal = rawSignal === null ? undefined : rawSignal;
	const signalDescription = signal === undefined ? undefined : signalsByName[rawSignal].description;
	return {exitCode, signal, signalDescription};
};

const serializeMessagePart = messagePart => Array.isArray(messagePart)
	? messagePart.map(messageItem => serializeMessageItem(messageItem)).join('')
	: serializeMessageItem(messagePart);

const serializeMessageItem = messageItem => {
	if (typeof messageItem === 'string') {
		return messageItem;
	}

	if (isBinary(messageItem)) {
		return binaryToString(messageItem);
	}

	return '';
};

export const makeError = ({
	stdio,
	all,
	error: rawError,
	signal: rawSignal,
	exitCode: rawExitCode,
	command,
	escapedCommand,
	timedOut,
	isCanceled,
	options: {timeoutDuration, timeout = timeoutDuration, cwd},
}) => {
	let error = rawError?.discarded ? undefined : rawError;
	const {exitCode, signal, signalDescription} = normalizeExitPayload(rawExitCode, rawSignal);
	const errorCode = error?.code;
	const prefix = getErrorPrefix({timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled});
	const {originalMessage, suffix} = getErrorSuffix(error, cwd);
	const shortMessage = `${prefix}: ${command}${suffix}`;
	const messageStdio = all === undefined ? [stdio[2], stdio[1]] : [all];
	const message = [shortMessage, ...messageStdio, ...stdio.slice(3)]
		.map(messagePart => stripFinalNewline(serializeMessagePart(messagePart)))
		.filter(Boolean)
		.join('\n\n');

	if (!isErrorInstance(error)) {
		error = new Error(message);
	} else if (previousErrors.has(error)) {
		const newError = new Error(message);
		copyErrorProperties(newError, error);
		error = newError;
	} else {
		error.message = message;
	}

	previousErrors.add(error);

	error.shortMessage = shortMessage;
	error.originalMessage = originalMessage;
	error.command = command;
	error.escapedCommand = escapedCommand;
	error.cwd = cwd;

	error.failed = true;
	error.timedOut = timedOut;
	error.isCanceled = isCanceled;
	error.isTerminated = signal !== undefined;
	error.exitCode = exitCode;
	error.signal = signal;
	error.signalDescription = signalDescription;

	error.stdout = stdio[1];
	error.stderr = stdio[2];

	if (all !== undefined) {
		error.all = all;
	}

	error.stdio = stdio;

	if ('bufferedData' in error) {
		delete error.bufferedData;
	}

	return error;
};

export const isErrorInstance = value => Object.prototype.toString.call(value) === '[object Error]';

const copyErrorProperties = (newError, previousError) => {
	for (const propertyName of COPIED_ERROR_PROPERTIES) {
		const descriptor = Object.getOwnPropertyDescriptor(previousError, propertyName);
		if (descriptor !== undefined) {
			Object.defineProperty(newError, propertyName, descriptor);
		}
	}
};

// Known Node.js-specific error properties
const COPIED_ERROR_PROPERTIES = [
	'code',
	'errno',
	'syscall',
	'path',
	'dest',
	'address',
	'port',
	'info',
];

const previousErrors = new WeakSet();
