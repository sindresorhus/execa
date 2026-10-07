import {setTimeout} from 'node:timers/promises';
import {DiscardedError} from '../return/final-error.js';
import {getTypeName} from '../utils/type-name.js';

// Validate `timeout` option
export const validateTimeout = ({timeout}) => {
	if (timeout !== undefined) {
		validateDelay(timeout, 'timeout');
	}
};

// Used by the `timeout` and `forceKillAfterDelay` options.
// Fractional numbers are excluded since `spawnSync()` requires an integer `timeout`.
export const validateDelay = (delay, optionName) => {
	if (!Number.isInteger(delay) || delay < 0 || delay > MAX_DELAY) {
		throw new TypeError(`Expected the \`${optionName}\` option to be a non-negative integer up to ${MAX_DELAY}, got \`${delay}\` (${getTypeName(delay)})`);
	}
};

// Timers fire right away when their delay is larger than this
const MAX_DELAY = (2 ** 31) - 1;

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
