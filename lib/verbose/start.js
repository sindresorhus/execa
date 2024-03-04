import {verboseLog} from './log.js';

// When `verbose` is `short|full`, print each command
export const logCommand = (escapedCommand, {verbose, verboseId}, {piped = false}) => {
	if (verbose === 'none') {
		return;
	}

	const icon = piped ? 'pipedCommand' : 'command';
	verboseLog(escapedCommand, verboseId, icon);
};
