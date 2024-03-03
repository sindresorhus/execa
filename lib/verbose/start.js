import {debuglog} from 'node:util';
import {verboseLog} from './log.js';

// When `verbose` is `short|full`, print each command
export const logCommand = (escapedCommand, {verbose = verboseDefault, piped = false}) => {
	if (!verbose) {
		return;
	}

	const icon = piped ? 'pipedCommand' : 'command';
	verboseLog(escapedCommand, icon);
};

const verboseDefault = debuglog('execa').enabled;
