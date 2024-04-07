import {addAbortListener} from 'node:events';
import {onExit} from 'signal-exit';

// `cleanup` option handling
export const cleanupOnExit = (subprocess, {cleanup, detached}, {signal}) => {
	if (!cleanup || detached) {
		return;
	}

	const removeExitHandler = onExit(() => {
		subprocess.kill();
	});
	addAbortListener(signal, () => {
		removeExitHandler();
	});
};
