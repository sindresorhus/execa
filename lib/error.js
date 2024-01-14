import process from 'node:process';
import {signalsByName} from 'human-signals';
import stripFinalNewline from 'strip-final-newline';
import {isBinary, binaryToString} from './stdio/utils.js';

const getErrorPrefix = ({timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled}) => {
	if (timedOut) {
		return `timed out after ${timeout} milliseconds`;
	}

	if (isCanceled) {
		return 'was canceled';
	}

	if (errorCode !== undefined) {
		return `failed with ${errorCode}`;
	}

	if (signal !== undefined) {
		return `was killed with ${signal} (${signalDescription})`;
	}

	if (exitCode !== undefined) {
		return `failed with exit code ${exitCode}`;
	}

	return 'failed';
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
	error,
	signal,
	exitCode,
	command,
	escapedCommand,
	timedOut,
	isCanceled,
	options: {timeout, cwd = process.cwd()},
}) => {
	// `signal` and `exitCode` emitted on `spawned.on('exit')` event can be `null`.
	// We normalize them to `undefined`
	exitCode = exitCode === null ? undefined : exitCode;
	signal = signal === null ? undefined : signal;
	const signalDescription = signal === undefined ? undefined : signalsByName[signal].description;

	const errorCode = error && error.code;

	const prefix = getErrorPrefix({timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled});
	const execaMessage = `Command ${prefix}: ${command}`;
	const isError = Object.prototype.toString.call(error) === '[object Error]';
	const shortMessage = isError ? `${execaMessage}\n${error.message}` : execaMessage;
	const messageStdio = all === undefined ? [stdio[2], stdio[1]] : [all];
	const message = [shortMessage, ...messageStdio, ...stdio.slice(3)]
		.map(messagePart => stripFinalNewline(serializeMessagePart(messagePart)))
		.filter(Boolean)
		.join('\n\n');

	if (isError) {
		error.originalMessage = error.message;
		error.message = message;
	} else {
		error = new Error(message);
	}

	error.shortMessage = shortMessage;
	error.command = command;
	error.escapedCommand = escapedCommand;
	error.exitCode = exitCode;
	error.signal = signal;
	error.signalDescription = signalDescription;
	error.stdio = stdio;
	error.stdout = stdio[1];
	error.stderr = stdio[2];
	error.cwd = cwd;

	if (all !== undefined) {
		error.all = all;
	}

	if ('bufferedData' in error) {
		delete error.bufferedData;
	}

	error.failed = true;
	error.timedOut = Boolean(timedOut);
	error.isCanceled = isCanceled;
	error.isTerminated = signal !== undefined;

	return error;
};
