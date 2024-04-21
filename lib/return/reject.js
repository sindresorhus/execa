import {logFinalResult} from '../verbose/complete.js';

// Applies the `reject` option.
// Also print the final log line with `verbose`.
export const handleResult = (result, verboseInfo, {reject}) => {
	logFinalResult(result, reject, verboseInfo);

	if (result.failed && reject) {
		throw result;
	}

	return result;
};
