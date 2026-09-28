import {logResult} from '../verbose/complete.js';

// Applies the `reject` option.
// Also print the final log line with `verbose`.
export const handleResult = (result, verboseInfo, {reject}) => {
	logResult(result, verboseInfo);

	if (reject && result.failed) {
		throw result;
	}

	return result;
};
