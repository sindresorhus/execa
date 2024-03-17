import {signalsByName} from 'human-signals';
import stripFinalNewline from 'strip-final-newline';
import {isUint8Array, uint8ArrayToString} from '../utils.js';
import {fixCwdError} from '../arguments/cwd.js';
import {escapeLines} from '../arguments/escape.js';
import {getDurationMs} from './duration.js';
import {getFinalError, DiscardedError, isExecaError} from './cause.js';

export const makeSuccessResult = ({
	command,
	escapedCommand,
	stdio,
	all,
	options: {cwd},
	startTime,
}) => ({
	command,
	escapedCommand,
	cwd,
	durationMs: getDurationMs(startTime),
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
	startTime,
	isSync,
}) => makeError({
	error,
	command,
	escapedCommand,
	startTime,
	timedOut: false,
	isCanceled: false,
	stdio: Array.from({length: stdioStreamsGroups.length}),
	options,
	isSync,
});

export const makeError = ({
	error: originalError,
	command,
	escapedCommand,
	startTime,
	timedOut,
	isCanceled,
	exitCode: rawExitCode,
	signal: rawSignal,
	stdio,
	all,
	options: {timeoutDuration, timeout = timeoutDuration, cwd},
	isSync,
}) => {
	const {exitCode, signal, signalDescription} = normalizeExitPayload(rawExitCode, rawSignal);
	const {originalMessage, shortMessage, message} = createMessages({
		stdio,
		all,
		originalError,
		signal,
		signalDescription,
		exitCode,
		escapedCommand,
		timedOut,
		isCanceled,
		timeout,
		cwd,
	});
	const error = getFinalError(originalError, message, isSync);

	error.shortMessage = shortMessage;
	error.originalMessage = originalMessage;
	error.command = command;
	error.escapedCommand = escapedCommand;
	error.cwd = cwd;
	error.durationMs = getDurationMs(startTime);

	error.failed = true;
	error.timedOut = timedOut;
	error.isCanceled = isCanceled;
	error.isTerminated = signal !== undefined;
	error.exitCode = exitCode;
	error.signal = signal;
	error.signalDescription = signalDescription;
	error.code = error.cause?.code;

	error.stdout = stdio[1];
	error.stderr = stdio[2];

	if (all !== undefined) {
		error.all = all;
	}

	error.stdio = stdio;
	error.pipedFrom = [];

	return error;
};

// `signal` and `exitCode` emitted on `subprocess.on('exit')` event can be `null`.
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
	originalError,
	signal,
	signalDescription,
	exitCode,
	escapedCommand,
	timedOut,
	isCanceled,
	timeout,
	cwd,
}) => {
	const errorCode = originalError?.code;
	const prefix = getErrorPrefix({timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled});
	const originalMessage = getOriginalMessage(originalError, cwd);
	const newline = originalMessage === '' ? '' : '\n';
	const shortMessage = `${prefix}: ${escapedCommand}${newline}${originalMessage}`;
	const messageStdio = all === undefined ? [stdio[2], stdio[1]] : [all];
	const message = [shortMessage, ...messageStdio, ...stdio.slice(3)]
		.map(messagePart => escapeLines(stripFinalNewline(serializeMessagePart(messagePart))))
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

const getOriginalMessage = (originalError, cwd) => {
	if (originalError instanceof DiscardedError) {
		return '';
	}

	const originalMessage = isExecaError(originalError)
		? originalError.originalMessage
		: String(originalError?.message ?? originalError);
	return escapeLines(fixCwdError(originalMessage, cwd));
};

const serializeMessagePart = messagePart => Array.isArray(messagePart)
	? messagePart.map(messageItem => stripFinalNewline(serializeMessageItem(messageItem))).filter(Boolean).join('\n')
	: serializeMessageItem(messagePart);

const serializeMessageItem = messageItem => {
	if (typeof messageItem === 'string') {
		return messageItem;
	}

	if (isUint8Array(messageItem)) {
		return uint8ArrayToString(messageItem);
	}

	return '';
};
