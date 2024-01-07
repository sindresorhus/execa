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

const killAfterTimeout = async ({spawned, timeout, killSignal, context, controller}) => {
	await pSetTimeout(timeout, undefined, {ref: false, signal: controller.signal});
	spawned.kill(killSignal);
	Object.assign(context, {timedOut: true, signal: killSignal});
	throw new Error('Timed out');
};

// `timeout` option handling
export const throwOnTimeout = ({spawned, timeout, killSignal, context, finalizers}) => {
	if (timeout === 0 || timeout === undefined) {
		return [];
	}

	const controller = new AbortController();
	finalizers.push(controller.abort.bind(controller));
	return [killAfterTimeout({spawned, timeout, killSignal, context, controller})];
};

export const validateTimeout = ({timeout}) => {
	if (timeout !== undefined && (!Number.isFinite(timeout) || timeout < 0)) {
		throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
	}
};

// `cleanup` option handling
export const cleanupOnExit = (spawned, cleanup, detached, finalizers) => {
	if (!cleanup || detached) {
		return;
	}

	const removeExitHandler = onExit(() => {
		spawned.kill();
	});
	finalizers.push(removeExitHandler);
};
