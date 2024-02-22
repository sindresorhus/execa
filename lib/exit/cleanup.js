import {addAbortListener} from 'node:events';
import {onExit} from 'signal-exit';

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
