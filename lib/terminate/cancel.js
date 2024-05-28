import {once} from 'node:events';

// Validate the `cancelSignal` option
export const validateCancelSignal = ({cancelSignal}) => {
	if (cancelSignal !== undefined && Object.prototype.toString.call(cancelSignal) !== '[object AbortSignal]') {
		throw new Error(`The \`cancelSignal\` option must be an AbortSignal: ${String(cancelSignal)}`);
	}
};

// Terminate the subprocess when aborting the `cancelSignal` option
export const throwOnCancel = (subprocess, cancelSignal, context, controller) => cancelSignal === undefined
	? []
	: [terminateOnCancel(subprocess, cancelSignal, context, controller)];

const terminateOnCancel = async (subprocess, cancelSignal, context, {signal}) => {
	await onAbortedSignal(cancelSignal, signal);
	context.isCanceled = true;
	subprocess.kill();
	throw cancelSignal.reason;
};

const onAbortedSignal = async (cancelSignal, signal) => {
	if (!cancelSignal.aborted) {
		await once(cancelSignal, 'abort', {signal});
	}
};
