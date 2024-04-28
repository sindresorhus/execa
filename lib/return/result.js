import {signalsByName} from 'human-signals';
import {getDurationMs} from './duration.js';
import {getFinalError} from './final-error.js';
import {createMessages} from './message.js';

// Object returned on subprocess success
export const makeSuccessResult = ({
	command,
	escapedCommand,
	stdio,
	all,
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
	isTerminated: false,
	isMaxBuffer: false,
	exitCode: 0,
	stdout: stdio[1],
	stderr: stdio[2],
	all,
	stdio,
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
}) => makeError({
	error,
	command,
	escapedCommand,
	startTime,
	timedOut: false,
	isCanceled: false,
	isMaxBuffer: false,
	stdio: Array.from({length: fileDescriptors.length}),
	options,
	isSync,
});

// Object returned on subprocess failure
export const makeError = ({
	error: originalError,
	command,
	escapedCommand,
	startTime,
	timedOut,
	isCanceled,
	isMaxBuffer,
	exitCode: rawExitCode,
	signal: rawSignal,
	stdio,
	all,
	options: {timeoutDuration, timeout = timeoutDuration, cwd, maxBuffer},
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
		isMaxBuffer,
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
		isMaxBuffer,
		exitCode,
		signal,
		signalDescription,
		stdio,
		all,
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
	isMaxBuffer,
	exitCode,
	signal,
	signalDescription,
	stdio,
	all,
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
	isTerminated: signal !== undefined,
	isMaxBuffer,
	exitCode,
	signal,
	signalDescription,
	code: error.cause?.code,
	stdout: stdio[1],
	stderr: stdio[2],
	all,
	stdio,
	pipedFrom: [],
});

const omitUndefinedProperties = result => Object.fromEntries(Object.entries(result).filter(([, value]) => value !== undefined));

// `signal` and `exitCode` emitted on `subprocess.on('exit')` event can be `null`.
// We normalize them to `undefined`
const normalizeExitPayload = (rawExitCode, rawSignal) => {
	const exitCode = rawExitCode === null ? undefined : rawExitCode;
	const signal = rawSignal === null ? undefined : rawSignal;
	const signalDescription = signal === undefined ? undefined : signalsByName[rawSignal].description;
	return {exitCode, signal, signalDescription};
};
