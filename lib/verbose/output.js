import {inspect} from 'node:util';
import {escapeLines} from '../arguments/escape.js';
import {isBinaryEncoding} from '../encoding.js';
import {PIPED_STDIO_VALUES} from '../stdio/forward.js';
import {verboseLog} from './log.js';

export const handleStreamsVerbose = ({stdioStreams, options, isSync, stdioState, verboseInfo}) => {
	if (!shouldLogOutput(stdioStreams, options, isSync, verboseInfo)) {
		return stdioStreams;
	}

	const [{fdNumber}] = stdioStreams;
	return [...stdioStreams, {
		...stdioStreams[0],
		type: 'generator',
		value: verboseGenerator.bind(undefined, {stdioState, fdNumber, verboseInfo}),
	}];
};

// `ignore` opts-out of `verbose` for a specific stream.
// `ipc` cannot use piping.
// `inherit` would result in double printing.
// They can also lead to double printing when passing file descriptor integers or `process.std*`.
// This only leaves with `pipe` and `overlapped`.
const shouldLogOutput = (stdioStreams, {encoding}, isSync, {verbose}) => verbose === 'full'
	&& !isSync
	&& !isBinaryEncoding(encoding)
	&& fdUsesVerbose(stdioStreams)
	&& (stdioStreams.some(({type, value}) => type === 'native' && PIPED_STDIO_VALUES.has(value))
	|| stdioStreams.every(({type}) => type === 'generator'));

// Printing input streams would be confusing.
// Files and streams can produce big outputs, which we don't want to print.
// We could print `stdio[3+]` but it often is redirected to files and streams, with the same issue.
// So we only print stdout and stderr.
const fdUsesVerbose = ([{fdNumber}]) => fdNumber === 1 || fdNumber === 2;

const verboseGenerator = function * ({stdioState: {subprocess: {stdio}}, fdNumber, verboseInfo}, line) {
	if (!isPiping(stdio[fdNumber])) {
		logOutput(line, verboseInfo);
	}

	yield line;
};

// When `subprocess.stdout|stderr.pipe()` is called, `verbose` becomes a noop.
// This prevents the following problems:
//  - `.pipe()` achieves the same result as using `stdout: 'inherit'`, `stdout: stream`, etc. which also make `verbose` a noop.
//    For example, `subprocess.stdout.pipe(process.stdin)` would print each line twice.
//  - When chaining subprocesses with `subprocess.pipe(otherSubprocess)`, only the last one should print its output.
// Detecting whether `.pipe()` is impossible without monkey-patching it, so we use the following undocumented property.
// This is not a critical behavior since changes of the following property would only make `verbose` more verbose.
const isPiping = stream => stream._readableState.pipes.length > 0;

// When `verbose` is `full`, print stdout|stderr
const logOutput = (line, {verboseId}) => {
	const lines = typeof line === 'string' ? line : inspect(line);
	const escapedLines = escapeLines(lines);
	const spacedLines = escapedLines.replaceAll('\t', ' '.repeat(TAB_SIZE));
	verboseLog(spacedLines, verboseId, 'output');
};

// Same as `util.inspect()`
const TAB_SIZE = 2;
