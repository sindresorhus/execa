import os from 'node:os';
import {setTimeout as pSetTimeout} from 'node:timers/promises';
import {onExit} from 'signal-exit';

const DEFAULT_FORCE_KILL_TIMEOUT = 1000 * 5;

// Monkey-patches `childProcess.kill()` to add `forceKillAfterTimeout` behavior
export const spawnedKill = (kill, signal = 'SIGTERM', {forceKillAfterTimeout = true} = {}) => {
	const killResult = kill(signal);
	const timeout = getForceKillAfterTimeout(signal, forceKillAfterTimeout, killResult);
	setKillTimeout(kill, timeout);
	return killResult;
};

const setKillTimeout = async (kill, timeout) => {
	if (timeout === undefined) {
		return;
	}

	await pSetTimeout(timeout, undefined, {ref: false});
	kill('SIGKILL');
};

const shouldForceKill = (signal, forceKillAfterTimeout, killResult) => isSigterm(signal) && forceKillAfterTimeout !== false && killResult;

const isSigterm = signal => signal === os.constants.signals.SIGTERM
	|| (typeof signal === 'string' && signal.toUpperCase() === 'SIGTERM');

const getForceKillAfterTimeout = (signal, forceKillAfterTimeout, killResult) => {
	if (!shouldForceKill(signal, forceKillAfterTimeout, killResult)) {
		return;
	}

	if (forceKillAfterTimeout === true) {
		return DEFAULT_FORCE_KILL_TIMEOUT;
	}

	if (!Number.isFinite(forceKillAfterTimeout) || forceKillAfterTimeout < 0) {
		throw new TypeError(`Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${forceKillAfterTimeout}\` (${typeof forceKillAfterTimeout})`);
	}

	return forceKillAfterTimeout;
};

// `childProcess.cancel()`
export const spawnedCancel = (spawned, context) => {
	const killResult = spawned.kill();

	if (killResult) {
		context.isCanceled = true;
	}
};

const killAfterTimeout = async (spawned, timeout, killSignal, controller) => {
	await pSetTimeout(timeout, undefined, {ref: false, signal: controller.signal});
	spawned.kill(killSignal);
	throw Object.assign(new Error('Timed out'), {timedOut: true, signal: killSignal});
};

// `timeout` option handling
export const setupTimeout = async (spawned, {timeout, killSignal = 'SIGTERM'}, spawnedPromise) => {
	if (timeout === 0 || timeout === undefined) {
		return spawnedPromise;
	}

	const controller = new AbortController();
	try {
		return await Promise.race([
			spawnedPromise,
			killAfterTimeout(spawned, timeout, killSignal, controller),
		]);
	} finally {
		controller.abort();
	}
};

export const validateTimeout = ({timeout}) => {
	if (timeout !== undefined && (!Number.isFinite(timeout) || timeout < 0)) {
		throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
	}
};

// `cleanup` option handling
export const setExitHandler = async (spawned, {cleanup, detached}, timedPromise) => {
	if (!cleanup || detached) {
		return timedPromise;
	}

	const removeExitHandler = onExit(() => {
		spawned.kill();
	});

	try {
		return await timedPromise;
	} finally {
		removeExitHandler();
	}
};
