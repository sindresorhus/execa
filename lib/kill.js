import os from 'node:os';
import {setTimeout} from 'node:timers/promises';
import {onExit} from 'signal-exit';

const DEFAULT_FORCE_KILL_TIMEOUT = 1000 * 5;

// Monkey-patches `childProcess.kill()` to add `forceKillAfterDelay` behavior
export const spawnedKill = (kill, {forceKillAfterDelay}, controller, signal) => {
	const killResult = kill(signal);
	setKillTimeout({kill, signal, forceKillAfterDelay, killResult, controller});
	return killResult;
};

const setKillTimeout = async ({kill, signal, forceKillAfterDelay, killResult, controller}) => {
	if (!shouldForceKill(signal, forceKillAfterDelay, killResult)) {
		return;
	}

	try {
		await setTimeout(forceKillAfterDelay, undefined, {signal: controller.signal});
		kill('SIGKILL');
	} catch {}
};

const shouldForceKill = (signal, forceKillAfterDelay, killResult) => isSigterm(signal) && forceKillAfterDelay !== false && killResult;

const isSigterm = signal => signal === undefined
	|| signal === os.constants.signals.SIGTERM
	|| (typeof signal === 'string' && signal.toUpperCase() === 'SIGTERM');

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

const killAfterTimeout = async ({spawned, timeout, killSignal, context, controller}) => {
	await setTimeout(timeout, undefined, {signal: controller.signal});
	spawned.kill(killSignal);
	Object.assign(context, {timedOut: true, signal: killSignal});
	throw new Error('Timed out');
};

// `timeout` option handling
export const throwOnTimeout = ({spawned, timeout, killSignal, context, controller}) => {
	if (timeout === 0 || timeout === undefined) {
		return [];
	}

	return [killAfterTimeout({spawned, timeout, killSignal, context, controller})];
};

export const validateTimeout = ({timeout}) => {
	if (timeout !== undefined && (!Number.isFinite(timeout) || timeout < 0)) {
		throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
	}
};

// `cleanup` option handling
export const cleanupOnExit = (spawned, cleanup, detached) => {
	if (!cleanup || detached) {
		return;
	}

	return onExit(() => {
		spawned.kill();
	});
};
