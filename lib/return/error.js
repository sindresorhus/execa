import {signalsByName} from 'human-signals';
import stripFinalNewline from 'strip-final-newline';
import {isBinary, binaryToString} from '../utils.js';
import {fixCwdError} from '../arguments/cwd.js';
import {getFinalError, isPreviousError} from './clone.js';

export const makeSuccessResult = ({
	command,
	escapedCommand,
	stdio,
	all,
	options: {cwd},
}) => ({
	command,
	escapedCommand,
	cwd,
	failed: false,
	timedOut: false,
	isCanceled: false,
	isTerminated: false,
	exitCode: 0,
	stdout: stdio[1],
	stderr: stdio[2],
	all,
	stdio,
	pipedFrom: [],
});

export const makeEarlyError = ({
	error,
	command,
	escapedCommand,
	stdioStreamsGroups,
	options,
}) => makeError({
	error,
	command,
	escapedCommand,
	timedOut: false,
	isCanceled: false,
	stdio: Array.from({length: stdioStreamsGroups.length}),
	options,
});

export const makeError = ({
	error: rawError,
	command,
	escapedCommand,
	timedOut,
	isCanceled,
	exitCode: rawExitCode,
	signal: rawSignal,
	stdio,
	all,
	options: {timeoutDuration, timeout = timeoutDuration, cwd},
}) => {
	const initialError = rawError instanceof DiscardedError ? undefined : rawError;
	const {exitCode, signal, signalDescription} = normalizeExitPayload(rawExitCode, rawSignal);
	const {originalMessage, shortMessage, message} = createMessages({
		stdio,
		all,
		error: initialError,
		signal,
		signalDescription,
		exitCode,
		command,
		timedOut,
		isCanceled,
		timeout,
		cwd,
	});
	const error = getFinalError(initialError, message);

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

	error.pipedFrom = [];

	return error;
};

// Indicates that the error is used only to interrupt control flow, but not in the return value
export class DiscardedError extends Error {}

// `signal` and `exitCode` emitted on `spawned.on('exit')` event can be `null`.
// We normalize them to `undefined`
const normalizeExitPayload = (rawExitCode, rawSignal) => {
	const exitCode = rawExitCode === null ? undefined : rawExitCode;
	const signal = rawSignal === null ? undefined : rawSignal;
	const signalDescription = signal === undefined ? undefined : signalsByName[rawSignal].description;
	return {exitCode, signal, signalDescription};
};

const createMessages = ({
	stdio,
	all,
	error,
	signal,
	signalDescription,
	exitCode,
	command,
	timedOut,
	isCanceled,
	timeout,
	cwd,
}) => {
	const errorCode = error?.code;
	const prefix = getErrorPrefix({timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled});
	const originalMessage = getOriginalMessage(error, cwd);
	const newline = originalMessage === '' ? '' : '\n';
	const shortMessage = `${prefix}: ${command}${newline}${originalMessage}`;
	const messageStdio = all === undefined ? [stdio[2], stdio[1]] : [all];
	const message = [shortMessage, ...messageStdio, ...stdio.slice(3)]
		.map(messagePart => stripFinalNewline(serializeMessagePart(messagePart)))
		.filter(Boolean)
		.join('\n\n');
	return {originalMessage, shortMessage, message};
};

const getErrorPrefix = ({timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled}) => {
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

const getOriginalMessage = (error, cwd) => {
	if (error === undefined) {
		return '';
	}

	const originalMessage = isPreviousError(error) ? error.originalMessage : String(error?.message ?? error);
	return fixCwdError(originalMessage, cwd);
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
