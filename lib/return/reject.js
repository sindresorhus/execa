import {logFinalResult} from '../verbose/complete.js';

export const handleResult = (result, verboseInfo, {reject}) => {
	logFinalResult(result, reject, verboseInfo);

	if (result.failed && reject) {
		throw result;
	}

	return result;
};
