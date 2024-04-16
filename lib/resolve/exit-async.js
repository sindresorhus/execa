import {once} from 'node:events';
import {DiscardedError} from '../return/final-error.js';

// If `error` is emitted before `spawn`, `exit` will never be emitted.
// However, `error` might be emitted after `spawn`, e.g. with the `cancelSignal` option.
// In that case, `exit` will still be emitted.
// Since the `exit` event contains the signal name, we want to make sure we are listening for it.
// This function also takes into account the following unlikely cases:
//  - `exit` being emitted in the same microtask as `spawn`
//  - `error` being emitted multiple times
export const waitForExit = async subprocess => {
	const [spawnPayload, exitPayload] = await Promise.allSettled([
		once(subprocess, 'spawn'),
		once(subprocess, 'exit'),
	]);

	if (spawnPayload.status === 'rejected') {
		return [];
	}

	return exitPayload.status === 'rejected'
		? waitForSubprocessExit(subprocess)
		: exitPayload.value;
};

const waitForSubprocessExit = async subprocess => {
	try {
		return await once(subprocess, 'exit');
	} catch {
		return waitForSubprocessExit(subprocess);
	}
};

export const waitForSuccessfulExit = async exitPromise => {
	const [exitCode, signal] = await exitPromise;

	if (!isSubprocessErrorExit(exitCode, signal) && isFailedExit(exitCode, signal)) {
		throw new DiscardedError();
	}

	return [exitCode, signal];
};

const isSubprocessErrorExit = (exitCode, signal) => exitCode === undefined && signal === undefined;
export const isFailedExit = (exitCode, signal) => exitCode !== 0 || signal !== null;
