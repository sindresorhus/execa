import {redBright, yellowBright} from 'yoctocolors';
import {verboseLog} from './log.js';

// When `verbose` is `short|full`, print each command's error when it fails
export const logError = ({message, failed, reject, verboseId, icon}) => {
	if (!failed) {
		return;
	}

	const color = reject ? redBright : yellowBright;
	verboseLog(message, verboseId, icon, color);
};
