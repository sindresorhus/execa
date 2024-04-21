import {debuglog} from 'node:util';

// Default value for the `verbose` option
export const verboseDefault = debuglog('execa').enabled ? 'full' : 'none';

// Information computed before spawning, used by the `verbose` option
export const getVerboseInfo = verbose => {
	const verboseId = isVerbose(verbose) ? VERBOSE_ID++ : undefined;
	validateVerbose(verbose);
	return {verbose, verboseId};
};

// Prepending the `pid` is useful when multiple commands print their output at the same time.
// However, we cannot use the real PID since this is not available with `child_process.spawnSync()`.
// Also, we cannot use the real PID if we want to print it before `child_process.spawn()` is run.
// As a pro, it is shorter than a normal PID and never re-uses the same id.
// As a con, it cannot be used to send signals.
let VERBOSE_ID = 0n;

// The `verbose` option can have different values for `stdout`/`stderr`
export const isVerbose = verbose => verbose.some(fdVerbose => fdVerbose !== 'none');

const validateVerbose = verbose => {
	for (const verboseItem of verbose) {
		if (verboseItem === false) {
			throw new TypeError('The "verbose: false" option was renamed to "verbose: \'none\'".');
		}

		if (verboseItem === true) {
			throw new TypeError('The "verbose: true" option was renamed to "verbose: \'short\'".');
		}

		if (!VERBOSE_VALUES.has(verboseItem)) {
			const allowedValues = [...VERBOSE_VALUES].map(allowedValue => `'${allowedValue}'`).join(', ');
			throw new TypeError(`The "verbose" option must not be ${verboseItem}. Allowed values are: ${allowedValues}.`);
		}
	}
};

const VERBOSE_VALUES = new Set(['none', 'short', 'full']);
