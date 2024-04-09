import {bold} from 'yoctocolors';
import {isVerbose} from './info.js';
import {verboseLog} from './log.js';

// When `verbose` is `short|full`, print each command
export const logCommand = (escapedCommand, {verbose, verboseId}, {piped = false}) => {
	if (!isVerbose(verbose)) {
		return;
	}

	const icon = piped ? 'pipedCommand' : 'command';
	verboseLog(escapedCommand, verboseId, icon, bold);
};
