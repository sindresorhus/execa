import {onAbortedSignal} from '../utils/abort-signal.js';

// Validate the `cancelSignal` option
export const validateCancelSignal = ({cancelSignal}) => {
	if (cancelSignal !== undefined && Object.prototype.toString.call(cancelSignal) !== '[object AbortSignal]') {
		throw new Error(`The \`cancelSignal\` option must be an AbortSignal: ${String(cancelSignal)}`);
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
