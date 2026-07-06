import {setTimeout} from 'node:timers/promises';
import {DiscardedError} from '../return/final-error.js';

// Validate `timeout` option
export const validateTimeout = ({timeout}) => {
	if (timeout !== undefined && (!Number.isFinite(timeout) || timeout < 0)) {
		throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
	}
};

// Fails when the `timeout` option is exceeded
export const throwOnTimeout = (kill, timeout, context, controller) => timeout === 0 || timeout === undefined
	? []
	: [killAfterTimeout(kill, timeout, context, controller)];

const killAfterTimeout = async (kill, timeout, context, {signal}) => {
	await setTimeout(timeout, undefined, {signal});
	context.terminationReason ??= 'timeout';
	kill();
	throw new DiscardedError();
};
