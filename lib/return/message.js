import stripFinalNewline from 'strip-final-newline';
import {isUint8Array, uint8ArrayToString} from '../stdio/uint-array.js';
import {fixCwdError} from '../arguments/cwd.js';
import {escapeLines} from '../arguments/escape.js';
import {getMaxBufferMessage} from '../stream/max-buffer.js';
import {DiscardedError, isExecaError} from './cause.js';

export const createMessages = ({
	stdio,
	all,
	originalError,
	signal,
	signalDescription,
	exitCode,
	escapedCommand,
	timedOut,
	isCanceled,
	isMaxBuffer,
	maxBuffer,
	timeout,
	cwd,
}) => {
	const errorCode = originalError?.code;
	const prefix = getErrorPrefix({originalError, timedOut, timeout, isMaxBuffer, maxBuffer, errorCode, signal, signalDescription, exitCode, isCanceled});
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

const getErrorPrefix = ({originalError, timedOut, timeout, isMaxBuffer, maxBuffer, errorCode, signal, signalDescription, exitCode, isCanceled}) => {
	if (timedOut) {
		return `Command timed out after ${timeout} milliseconds`;
	}

	if (isCanceled) {
		return 'Command was canceled';
	}

	if (isMaxBuffer) {
		return getMaxBufferMessage(originalError, maxBuffer);
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
