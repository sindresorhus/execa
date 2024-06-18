import prettyMs from 'pretty-ms';
import {escapeLines} from '../arguments/escape.js';
import {getDurationMs} from '../return/duration.js';
import {isVerbose} from './info.js';
import {verboseLog} from './log.js';
import {logError} from './error.js';

// When `verbose` is `short|full`, print each command's completion, duration and error
export const logFinalResult = ({shortMessage, durationMs, failed}, verboseInfo) => {
	logResult(shortMessage, durationMs, verboseInfo, failed);
};

// Same but for early validation errors
export const logEarlyResult = (error, startTime, {rawOptions, ...verboseInfo}) => {
	const shortMessage = escapeLines(String(error));
	const durationMs = getDurationMs(startTime);
	const earlyVerboseInfo = {...verboseInfo, rawOptions: {...rawOptions, reject: true}};
	logResult(shortMessage, durationMs, earlyVerboseInfo, true);
};

const logResult = (shortMessage, durationMs, verboseInfo, failed) => {
	if (!isVerbose(verboseInfo)) {
		return;
	}

	logError(shortMessage, verboseInfo, failed);
	logDuration(durationMs, verboseInfo, failed);
};

const logDuration = (durationMs, verboseInfo, failed) => {
	const logMessage = `(done in ${prettyMs(durationMs)})`;
	verboseLog({
		type: 'duration',
		logMessage,
		verboseInfo,
		failed,
	});
};
