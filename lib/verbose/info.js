import {hrtime} from 'node:process';
import {debuglog} from 'node:util';

export const getVerboseInfo = ({verbose = verboseDefault}) => {
	if (verbose === 'none') {
		return {verbose};
	}

	const verboseId = VERBOSE_ID++;
	const startTime = hrtime.bigint();
	return {verbose, verboseId, startTime};
};

const verboseDefault = debuglog('execa').enabled ? 'full' : 'none';

export const getCommandDuration = startTime => Number(hrtime.bigint() - startTime) / 1e6;

// Prepending the `pid` is useful when multiple commands print their output at the same time.
// However, we cannot use the real PID since this is not available with `child_process.spawnSync()`.
// Also, we cannot use the real PID if we want to print it before `child_process.spawn()` is run.
// As a pro, it is shorter than a normal PID and never re-uses the same id.
// As a con, it cannot be used to send signals.
let VERBOSE_ID = 0n;
