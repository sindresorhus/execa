import {onAbortedSignal, validateAbortSignal} from '../utils/abort-signal.js';

// Validate the `cancelSignal` option
export const validateCancelSignal = ({cancelSignal}) => {
	validateAbortSignal(cancelSignal, 'cancelSignal');
};

// The `signal` option was renamed to `cancelSignal`. Validated for every method, otherwise synchronous methods would silently ignore it, since `child_process.spawnSync()` does not support that option either.
export const validateRenamedSignalOption = ({signal}) => {
	if (signal !== undefined) {
		throw new TypeError('The "signal" option has been renamed to "cancelSignal" instead.');
	}
};

// Terminate the subprocess when aborting the `cancelSignal` option and `gracefulSignal` is `false`
export const throwOnCancel = ({kill, cancelSignal, gracefulCancel, context, controller}) => cancelSignal === undefined || gracefulCancel
	? []
	: [terminateOnCancel(kill, cancelSignal, context, controller)];

const terminateOnCancel = async (kill, cancelSignal, context, {signal}) => {
	await onAbortedSignal(cancelSignal, signal);
	context.terminationReason ??= 'cancel';
	kill();
	throw cancelSignal.reason;
};
