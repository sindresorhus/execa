import {setTimeout} from 'node:timers/promises';
import {DiscardedError} from '../return/error.js';

export const validateTimeout = ({timeout}) => {
	if (timeout !== undefined && (!Number.isFinite(timeout) || timeout < 0)) {
		throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
	}
};

// `timeout` option handling
export const throwOnTimeout = (spawned, timeout, context, controller) => timeout === 0 || timeout === undefined
	? []
	: [killAfterTimeout(spawned, timeout, context, controller)];

const killAfterTimeout = async (spawned, timeout, context, {signal}) => {
	await setTimeout(timeout, undefined, {signal});
	context.timedOut = true;
	spawned.kill();
	throw new DiscardedError();
};
