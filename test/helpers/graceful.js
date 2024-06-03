import {setTimeout} from 'node:timers/promises';

// Combines `util.aborted()` and `events.addAbortListener()`: promise-based and cleaned up with a stop signal
export const onAbortedSignal = async signal => {
	try {
		await setTimeout(1e8, undefined, {signal});
	} catch {}
};
