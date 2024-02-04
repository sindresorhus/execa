import {addAbortListener} from 'node:events';
import os from 'node:os';
import {setTimeout} from 'node:timers/promises';
import {onExit} from 'signal-exit';

const DEFAULT_FORCE_KILL_TIMEOUT = 1000 * 5;

// Monkey-patches `childProcess.kill()` to add `forceKillAfterDelay` behavior
export const spawnedKill = (kill, {forceKillAfterDelay, killSignal}, controller, signal = killSignal) => {
	const killResult = kill(signal);
	setKillTimeout({kill, signal, forceKillAfterDelay, killSignal, killResult, controller});
	return killResult;
};

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

const killAfterTimeout = async (timeout, context, {signal}) => {
	await setTimeout(timeout, undefined, {signal});
	context.timedOut = true;
	throw new Error('Timed out');
};

// `timeout` option handling
export const throwOnTimeout = (timeout, context, controller) => timeout === 0 || timeout === undefined
	? []
	: [killAfterTimeout(timeout, context, controller)];

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
