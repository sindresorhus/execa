import {debuglog} from 'node:util';

export const verboseDefault = debuglog('execa').enabled ? 'full' : 'none';

export const getVerboseInfo = verbose => {
	const verboseId = isVerbose(verbose) ? VERBOSE_ID++ : undefined;
	return {verbose, verboseId};
};

// Prepending the `pid` is useful when multiple commands print their output at the same time.
// However, we cannot use the real PID since this is not available with `child_process.spawnSync()`.
// Also, we cannot use the real PID if we want to print it before `child_process.spawn()` is run.
// As a pro, it is shorter than a normal PID and never re-uses the same id.
// As a con, it cannot be used to send signals.
let VERBOSE_ID = 0n;

export const isVerbose = verbose => verbose.some(fdVerbose => fdVerbose !== 'none');
