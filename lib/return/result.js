import {signalsByName} from 'human-signals';
import {getDurationMs} from './duration.js';
import {getFinalError} from './final-error.js';
import {createMessages} from './message.js';

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
	isMaxBuffer: false,
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
	error.isMaxBuffer = isMaxBuffer;
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
