import {once} from 'node:events';

// Combines `util.aborted()` and `events.addAbortListener()`: promise-based and cleaned up with a stop signal
export const onAbortedSignal = async (mainSignal, stopSignal) => {
	if (!mainSignal.aborted) {
		await once(mainSignal, 'abort', {signal: stopSignal});
	}
};

// Validate the `cancelSignal` and `unpipeSignal` options, so a wrong type fails right away instead of failing later with an unrelated error
export const validateAbortSignal = (signal, optionName) => {
	if (signal !== undefined && Object.prototype.toString.call(signal) !== '[object AbortSignal]') {
		throw new TypeError(`The \`${optionName}\` option must be an AbortSignal: ${String(signal)}.`);
	}
};
