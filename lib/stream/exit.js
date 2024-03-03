import {once} from 'node:events';

// If `error` is emitted before `spawn`, `exit` will never be emitted.
// However, `error` might be emitted after `spawn`, e.g. with the `cancelSignal` option.
// In that case, `exit` will still be emitted.
// Since the `exit` event contains the signal name, we want to make sure we are listening for it.
// This function also takes into account the following unlikely cases:
//  - `exit` being emitted in the same microtask as `spawn`
//  - `error` being emitted multiple times
export const waitForExit = async spawned => {
	const [spawnPayload, exitPayload] = await Promise.allSettled([
		once(spawned, 'spawn'),
		once(spawned, 'exit'),
	]);

	if (spawnPayload.status === 'rejected') {
		return [];
	}

	return exitPayload.status === 'rejected'
		? waitForProcessExit(spawned)
		: exitPayload.value;
};

const waitForProcessExit = async spawned => {
	try {
		return await once(spawned, 'exit');
	} catch {
		return waitForProcessExit(spawned);
	}
};
