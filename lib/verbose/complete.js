import prettyMs from 'pretty-ms';
import {gray} from 'yoctocolors';
import {escapeLines} from '../arguments/escape.js';
import {getDurationMs} from '../return/duration.js';
import {isVerbose} from './info.js';
import {verboseLog} from './log.js';
import {logError} from './error.js';

// When `verbose` is `short|full`, print each command's completion, duration and error
export const logFinalResult = ({shortMessage, failed, durationMs}, reject, verboseInfo) => {
	logResult({
		message: shortMessage,
		failed,
		reject,
		durationMs,
		verboseInfo,
	});
};

// Same but for early validation errors
export const logEarlyResult = (error, startTime, verboseInfo) => {
	logResult({
		message: escapeLines(String(error)),
		failed: true,
		reject: true,
		durationMs: getDurationMs(startTime),
		verboseInfo,
	});
};

const logResult = ({message, failed, reject, durationMs, verboseInfo: {verbose, verboseId}}) => {
	if (!isVerbose(verbose)) {
		return;
	}

	const icon = getIcon(failed, reject);
	logError({
		message,
		failed,
		reject,
		verboseId,
		icon,
	});
	logDuration(durationMs, verboseId, icon);
};

const logDuration = (durationMs, verboseId, icon) => {
	const durationMessage = `(done in ${prettyMs(durationMs)})`;
	verboseLog(durationMessage, verboseId, icon, gray);
};

const getIcon = (failed, reject) => {
	if (!failed) {
		return 'success';
	}

	return reject ? 'error' : 'warning';
};
