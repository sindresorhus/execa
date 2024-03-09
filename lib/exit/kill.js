import os from 'node:os';
import {setTimeout} from 'node:timers/promises';
import {isErrorInstance} from '../return/clone.js';

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

const DEFAULT_FORCE_KILL_TIMEOUT = 1000 * 5;

// Monkey-patches `subprocess.kill()` to add `forceKillAfterDelay` behavior and `.kill(error)`
export const subprocessKill = ({kill, subprocess, options: {forceKillAfterDelay, killSignal}, controller}, signalOrError, errorArgument) => {
	const {signal, error} = parseKillArguments(signalOrError, errorArgument, killSignal);
	emitKillError(subprocess, error);
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

const emitKillError = (subprocess, error) => {
	if (error !== undefined) {
		subprocess.emit(errorSignal, error);
	}
};

// Like `error` signal but internal to Execa.
// E.g. does not make subprocess crash when no `error` listener is set.
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
