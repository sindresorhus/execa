import {isVerbose} from './info.js';
import {verboseLog} from './log.js';

// When `verbose` is `short|full`, print each command
export const logCommand = (escapedCommand, verboseInfo, piped) => {
	if (!isVerbose(verboseInfo)) {
		return;
	}

	verboseLog({
		type: 'command',
		logMessage: escapedCommand,
		verboseInfo,
		piped,
	});
};
