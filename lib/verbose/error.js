import {verboseLog} from './log.js';

// When `verbose` is `short|full`, print each command's error when it fails
export const logError = (logMessage, verboseInfo, failed) => {
	if (failed) {
		verboseLog({
			type: 'error',
			logMessage,
			verboseInfo,
			failed,
		});
	}
};
