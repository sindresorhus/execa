import {getSignalDescription} from '../terminate/signal.js';
import {getAllSync, getAllSyncFds} from '../resolve/all-sync.js';
import {getDurationMs} from './duration.js';
import {getFinalError} from './final-error.js';
import {createMessages, getErrorCode} from './message.js';

// Object returned on subprocess success
export const makeSuccessResult = ({
	command,
	escapedCommand,
	stdio,
	all,
	ipcOutput,
	options: {cwd},
	startTime,
}) => omitUndefinedProperties({
	command,
	escapedCommand,
	cwd,
	durationMs: getDurationMs(startTime),
	failed: false,
	timedOut: false,
	isCanceled: false,
	isGracefullyCanceled: false,
	isTerminated: false,
	isMaxBuffer: false,
	isForcefullyTerminated: false,
	exitCode: 0,
	stdout: stdio[1],
	stderr: stdio[2],
	all,
	stdio,
	ipcOutput,
	pipedFrom: [],
});

// Object returned on subprocess failure before spawning
export const makeEarlyError = ({
	error,
	command,
	escapedCommand,
	fileDescriptors,
	options,
	startTime,
	isSync,
	stdio = Array.from({length: fileDescriptors.length}),
	all,
}) => makeError({
	error,
	command,
	escapedCommand,
	startTime,
	timedOut: false,
	isCanceled: false,
	isGracefullyCanceled: false,
	isMaxBuffer: false,
	isForcefullyTerminated: false,
	stdio,
	all,
	ipcOutput: [],
	options,
	isSync,
});

// When the subprocess fails to spawn, its output is empty, with the same shape as when it spawns but prints nothing
export const getEarlyErrorOutput = (fileDescriptors, options) => {
	const stdio = fileDescriptors.map((fileDescriptor, fdNumber) => getEmptyOutput(fileDescriptor, fdNumber, options));
	return {stdio, all: getAllSync(stdio, getAllSyncFds(stdio), options)};
};

const getEmptyOutput = ({direction, objectMode}, fdNumber, {stdio, buffer, lines, encoding}) => {
	if (direction === 'input' || !PIPED_STDIO.has(stdio[fdNumber]) || !buffer[fdNumber]) {
		return;
	}

	if (objectMode || lines[fdNumber]) {
		return [];
	}

	return encoding === 'buffer' ? new Uint8Array() : '';
};

const PIPED_STDIO = new Set(['pipe', 'overlapped']);

// Object returned on subprocess failure
export const makeError = ({
	error: originalError,
	command,
	escapedCommand,
	startTime,
	timedOut,
	isCanceled,
	isGracefullyCanceled,
	isMaxBuffer,
	isForcefullyTerminated,
	exitCode: rawExitCode,
	signal: rawSignal,
	stdio,
	all,
	ipcOutput,
	options: {
		timeoutDuration,
		timeout = timeoutDuration,
		forceKillAfterDelay,
		killSignal,
		cwd,
		maxBuffer,
	},
	isSync,
}) => {
	const {exitCode, signal, signalDescription} = normalizeExitPayload(rawExitCode, rawSignal);
	const {originalMessage, shortMessage, message} = createMessages({
		stdio,
		all,
		ipcOutput,
		originalError,
		signal,
		signalDescription,
		exitCode,
		escapedCommand,
		timedOut,
		isCanceled,
		isGracefullyCanceled,
		isMaxBuffer,
		isForcefullyTerminated,
		forceKillAfterDelay,
		killSignal,
		maxBuffer,
		timeout,
		cwd,
	});
	const error = getFinalError(originalError, message, isSync);
	Object.assign(error, getErrorProperties({
		error,
		command,
		escapedCommand,
		startTime,
		timedOut,
		isCanceled,
		isGracefullyCanceled,
		isMaxBuffer,
		isForcefullyTerminated,
		exitCode,
		signal,
		signalDescription,
		stdio,
		all,
		ipcOutput,
		cwd,
		originalMessage,
		shortMessage,
	}));
	return error;
};

const getErrorProperties = ({
	error,
	command,
	escapedCommand,
	startTime,
	timedOut,
	isCanceled,
	isGracefullyCanceled,
	isMaxBuffer,
	isForcefullyTerminated,
	exitCode,
	signal,
	signalDescription,
	stdio,
	all,
	ipcOutput,
	cwd,
	originalMessage,
	shortMessage,
}) => omitUndefinedProperties({
	shortMessage,
	originalMessage,
	command,
	escapedCommand,
	cwd,
	durationMs: getDurationMs(startTime),
	failed: true,
	timedOut,
	isCanceled,
	isGracefullyCanceled,
	isTerminated: signal !== undefined,
	isMaxBuffer,
	isForcefullyTerminated,
	exitCode,
	signal,
	signalDescription,
	code: getErrorCode(error.cause),
	stdout: stdio[1],
	stderr: stdio[2],
	all,
	stdio,
	ipcOutput,
	pipedFrom: [],
});

const omitUndefinedProperties = result => Object.fromEntries(Object.entries(result).filter(([, value]) => value !== undefined));

// `signal` and `exitCode` emitted on `subprocess.on('exit')` event can be `null`.
// We normalize them to `undefined`
const normalizeExitPayload = (rawExitCode, rawSignal) => {
	const exitCode = rawExitCode === null ? undefined : rawExitCode;
	const signal = rawSignal === null ? undefined : rawSignal;
	const signalDescription = signal === undefined ? undefined : getSignalDescription(rawSignal);
	return {exitCode, signal, signalDescription};
};
