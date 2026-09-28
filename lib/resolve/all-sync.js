import {isUint8Array, concatUint8Arrays} from '../utils/uint-array.js';
import {splitLinesSync} from '../transform/split.js';
import {getStripFinalNewline} from '../io/strip-newline.js';

// The file descriptors which `result.all` interleaves. Those are the ones with an output, like with the `all` stream.
export const getAllSyncFds = ([, stdout, stderr]) => [
	...(stdout === undefined ? [] : [1]),
	...(stderr === undefined ? [] : [2]),
];

// Retrieve `result.all` with synchronous methods
export const getAllSync = ([, stdout, stderr], allFds, options) => {
	if (!options.all) {
		return;
	}

	if (stdout === undefined) {
		return splitAllLines(stderr, allFds, options);
	}

	if (stderr === undefined) {
		return splitAllLines(stdout, allFds, options);
	}

	// Like asynchronous methods, `all` is split into lines as soon as the `lines` option applies to either file descriptor.
	// A file descriptor which uses the `lines` option is already split with its own `stripFinalNewline` value, like `result.stdout` and `result.stderr` are. The other one is split with the `stripFinalNewline` value of `result.all`.
	// This differs from asynchronous methods, which cannot tell which file descriptor the merged output's last newline belongs to.
	if (hasLines(options)) {
		return [splitAllLines(stdout, allFds, options), splitAllLines(stderr, allFds, options)].flat();
	}

	// Without the `lines` option, arrays can only come from object mode, which does not apply to the other file descriptor
	if (Array.isArray(stdout) || Array.isArray(stderr)) {
		return [stdout, stderr].flat();
	}

	return isUint8Array(stdout) && isUint8Array(stderr) ? concatUint8Arrays([stdout, stderr]) : `${stdout}${stderr}`;
};

const hasLines = ({lines}) => Boolean(lines[1] || lines[2]);

// Each file descriptor is either already split into lines, or is a string which still needs to be split
const splitAllLines = (value, allFds, options) => value === undefined || Array.isArray(value) || !hasLines(options)
	? value
	: splitLinesSync(value, !getStripFinalNewline(options.stripFinalNewline, 'all', allFds), false);
