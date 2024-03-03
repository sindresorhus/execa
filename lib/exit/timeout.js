import {setTimeout} from 'node:timers/promises';
import {DiscardedError} from '../return/error.js';

export const validateTimeout = ({timeout}) => {
	if (timeout !== undefined && (!Number.isFinite(timeout) || timeout < 0)) {
		throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
	}
};

// `timeout` option handling
export const throwOnTimeout = (subprocess, timeout, context, controller) => timeout === 0 || timeout === undefined
	? []
	: [killAfterTimeout(subprocess, timeout, context, controller)];

const killAfterTimeout = async (subprocess, timeout, context, {signal}) => {
	await setTimeout(timeout, undefined, {signal});
	context.timedOut = true;
	subprocess.kill();
	throw new DiscardedError();
};
