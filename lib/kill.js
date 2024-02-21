import {addAbortListener} from 'node:events';
import os from 'node:os';
import {setTimeout} from 'node:timers/promises';
import {onExit} from 'signal-exit';
import {isErrorInstance} from './clone.js';
import {DiscardedError} from './error.js';

const DEFAULT_FORCE_KILL_TIMEOUT = 1000 * 5;

// Monkey-patches `childProcess.kill()` to add `forceKillAfterDelay` behavior and `.kill(error)`
export const spawnedKill = ({kill, spawned, options: {forceKillAfterDelay, killSignal}, controller}, signalOrError, errorArgument) => {
	const {signal, error} = parseKillArguments(signalOrError, errorArgument, killSignal);
	emitKillError(spawned, error);
	const killResult = kill(signal);
	setKillTimeout({kill, signal, forceKillAfterDelay, killSignal, killResult, controller});
	return killResult;
};

const parseKillArguments = (signalOrError, errorArgument, killSignal) => {
	const [signal = killSignal, error] = isErrorInstance(signalOrError)
		? [undefined, signalOrError]
		: [signalOrError, errorArgument];

	if (typeof signal !== 'string' && typeof signal !== 'number') {
		throw new TypeError(`The first argument must be an error instance or a signal name string/number: ${signal}`);
	}

	if (error !== undefined && !isErrorInstance(error)) {
		throw new TypeError(`The second argument is optional. If specified, it must be an error instance: ${error}`);
	}

	return {signal, error};
};

const emitKillError = (spawned, error) => {
	if (error !== undefined) {
		spawned.emit(errorSignal, error);
	}
};

// Like `error` signal but internal to Execa.
// E.g. does not make process crash when no `error` listener is set.
export const errorSignal = Symbol('error');

const setKillTimeout = async ({kill, signal, forceKillAfterDelay, killSignal, killResult, controller}) => {
	if (!shouldForceKill(signal, forceKillAfterDelay, killSignal, killResult)) {
		return;
	}

	try {
		await setTimeout(forceKillAfterDelay, undefined, {signal: controller.signal});
		kill('SIGKILL');
	} catch {}
};

const shouldForceKill = (signal, forceKillAfterDelay, killSignal, killResult) =>
	normalizeSignal(signal) === normalizeSignal(killSignal)
	&& forceKillAfterDelay !== false
	&& killResult;

const normalizeSignal = signal => typeof signal === 'string'
	? os.constants.signals[signal.toUpperCase()]
	: signal;

export const normalizeForceKillAfterDelay = forceKillAfterDelay => {
	if (forceKillAfterDelay === false) {
		return forceKillAfterDelay;
	}

	if (forceKillAfterDelay === true) {
		return DEFAULT_FORCE_KILL_TIMEOUT;
	}

	if (!Number.isFinite(forceKillAfterDelay) || forceKillAfterDelay < 0) {
		throw new TypeError(`Expected the \`forceKillAfterDelay\` option to be a non-negative integer, got \`${forceKillAfterDelay}\` (${typeof forceKillAfterDelay})`);
	}

	return forceKillAfterDelay;
};

export const waitForSuccessfulExit = async exitPromise => {
	const [exitCode, signal] = await exitPromise;

	if (!isProcessErrorExit(exitCode, signal) && isFailedExit(exitCode, signal)) {
		throw new DiscardedError();
	}

	return [exitCode, signal];
};

const isProcessErrorExit = (exitCode, signal) => exitCode === undefined && signal === undefined;
export const isFailedExit = (exitCode, signal) => exitCode !== 0 || signal !== null;

const killAfterTimeout = async (spawned, timeout, context, {signal}) => {
	await setTimeout(timeout, undefined, {signal});
	context.timedOut = true;
	spawned.kill();
	throw new DiscardedError();
};

// `timeout` option handling
export const throwOnTimeout = (spawned, timeout, context, controller) => timeout === 0 || timeout === undefined
	? []
	: [killAfterTimeout(spawned, timeout, context, controller)];

export const validateTimeout = ({timeout}) => {
	if (timeout !== undefined && (!Number.isFinite(timeout) || timeout < 0)) {
		throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
	}
};

// `cleanup` option handling
export const cleanupOnExit = (spawned, {cleanup, detached}, {signal}) => {
	if (!cleanup || detached) {
		return;
	}

	const removeExitHandler = onExit(() => {
		spawned.kill();
	});
	addAbortListener(signal, () => {
		removeExitHandler();
	});
};
