import os from 'node:os';
import {setTimeout} from 'node:timers/promises';
import {onExit} from 'signal-exit';

const DEFAULT_FORCE_KILL_TIMEOUT = 1000 * 5;

// Monkey-patches `childProcess.kill()` to add `forceKillAfterTimeout` behavior
export const spawnedKill = (kill, {forceKillAfterTimeout}, controller, signal) => {
	const killResult = kill(signal);
	setKillTimeout({kill, signal, forceKillAfterTimeout, killResult, controller});
	return killResult;
};

const setKillTimeout = async ({kill, signal, forceKillAfterTimeout, killResult, controller}) => {
	if (!shouldForceKill(signal, forceKillAfterTimeout, killResult)) {
		return;
	}

	try {
		await setTimeout(forceKillAfterTimeout, undefined, {signal: controller.signal});
		kill('SIGKILL');
	} catch {}
};

const shouldForceKill = (signal, forceKillAfterTimeout, killResult) => isSigterm(signal) && forceKillAfterTimeout !== false && killResult;

const isSigterm = signal => signal === undefined
	|| signal === os.constants.signals.SIGTERM
	|| (typeof signal === 'string' && signal.toUpperCase() === 'SIGTERM');

export const normalizeForceKillAfterTimeout = forceKillAfterTimeout => {
	if (forceKillAfterTimeout === false) {
		return forceKillAfterTimeout;
	}

	if (forceKillAfterTimeout === true) {
		return DEFAULT_FORCE_KILL_TIMEOUT;
	}

	if (!Number.isFinite(forceKillAfterTimeout) || forceKillAfterTimeout < 0) {
		throw new TypeError(`Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${forceKillAfterTimeout}\` (${typeof forceKillAfterTimeout})`);
	}

	return forceKillAfterTimeout;
};

const killAfterTimeout = async ({spawned, timeout, killSignal, context, controller}) => {
	await setTimeout(timeout, undefined, {signal: controller.signal});
	spawned.kill(killSignal);
	context.timedOut = true;
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
