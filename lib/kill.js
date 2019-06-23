'use strict';
const os = require('os');
const onExit = require('signal-exit');

const DEFAULT_FORCE_KILL_TIMEOUT = 1000 * 5;

// Monkey-patches `childProcess.kill()` to add `forceKillAfterTimeout` behavior
const spawnedKill = (kill, signal = 'SIGTERM', options = {}) => {
	const killResult = kill(signal);
	setKillTimeout(kill, signal, options, killResult);
	return killResult;
};

const setKillTimeout = (kill, signal, options, killResult) => {
	if (!shouldForceKill(signal, options, killResult)) {
		return;
	}

	const timeout = getForceKillAfterTimeout(options);
	setTimeout(() => {
		kill('SIGKILL');
	}, timeout).unref();
};

const shouldForceKill = (signal, {forceKillAfterTimeout}, killResult) => {
	return isSigterm(signal) && forceKillAfterTimeout !== false && killResult;
};

const isSigterm = signal => {
	return signal === os.constants.signals.SIGTERM ||
		(typeof signal === 'string' && signal.toUpperCase() === 'SIGTERM');
};

const getForceKillAfterTimeout = ({forceKillAfterTimeout = true}) => {
	if (forceKillAfterTimeout === true) {
		return DEFAULT_FORCE_KILL_TIMEOUT;
	}

	if (!Number.isInteger(forceKillAfterTimeout) || forceKillAfterTimeout < 0) {
		throw new TypeError(`Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${forceKillAfterTimeout}\` (${typeof forceKillAfterTimeout})`);
	}

	return forceKillAfterTimeout;
};

// `childProcess.cancel()`
const spawnedCancel = (spawned, context) => {
	const killResult = spawned.kill();

	if (killResult) {
		context.isCanceled = true;
	}
};

// `timeout` option handling
const setupTimeout = (spawned, {timeout, killSignal}, context) => {
	if (timeout > 0) {
		return setTimeout(() => {
			context.timedOut = true;
			spawned.kill(killSignal);
		}, timeout);
	}
};

// `cleanup` option handling
const setExitHandler = (spawned, {cleanup, detached}) => {
	if (!cleanup || detached) {
		return;
	}

	return onExit(() => {
		spawned.kill();
	});
};

const cleanup = (timeoutId, removeExitHandler) => {
	if (timeoutId !== undefined) {
		clearTimeout(timeoutId);
	}

	if (removeExitHandler !== undefined) {
		removeExitHandler();
	}
};

module.exports = {
	spawnedKill,
	spawnedCancel,
	setupTimeout,
	setExitHandler,
	cleanup
};
