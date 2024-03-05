import {verboseLog} from './log.js';

// When `verbose` is `short|full`, print each command's error when it fails
export const logError = ({message, failed, verboseId, icon}) => {
	if (!failed) {
		return;
	}

	verboseLog(message, verboseId, icon);
};
