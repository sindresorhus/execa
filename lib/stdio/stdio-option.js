import {STANDARD_STREAMS_ALIASES} from '../utils/standard-stream.js';
import {normalizeIpcStdioArray} from '../ipc/array.js';
import {isFullVerbose} from '../verbose/values.js';
import {isStdioValueObject} from './type.js';

// Add support for `stdin`/`stdout`/`stderr` as an alias for `stdio`.
// Also normalize the `stdio` option.
// A rest pattern is not used to read the other options, since the object it creates inherits from `Object.prototype`, which a prototype pollution could then use to inject option values
export const normalizeStdioOption = (options, verboseInfo, isSync) => {
	const {stdio, ipc, buffer} = options;
	const stdioArray = getStdioArray(stdio, options).map((stdioOption, fdNumber) => addDefaultValue(stdioOption, fdNumber));
	validateIpcStdioOption(stdioArray);
	return isSync
		? normalizeStdioSync(stdioArray, buffer, verboseInfo)
		: normalizeIpcStdioArray(stdioArray, ipc);
};

// The `stdio: 'ipc'` value (raw `child_process` syntax) was replaced by the `ipc: true` option
const validateIpcStdioOption = stdioArray => {
	if (stdioArray.some(stdioOption => hasIpcStdioOption(stdioOption))) {
		throw new Error('The `ipc: true` option must be used instead of `stdio: \'ipc\'`.');
	}
};

const hasIpcStdioOption = stdioOption => {
	if (Array.isArray(stdioOption)) {
		return stdioOption.some(item => hasIpcStdioItem(item));
	}

	return hasIpcStdioItem(stdioOption);
};

const hasIpcStdioItem = stdioOption => {
	if (isStdioValueObject(stdioOption)) {
		return stdioOption.value === 'ipc';
	}

	return stdioOption === 'ipc';
};

const getStdioArray = (stdio, options) => {
	if (stdio === undefined) {
		return STANDARD_STREAMS_ALIASES.map(alias => options[alias]);
	}

	if (hasAlias(options)) {
		throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${STANDARD_STREAMS_ALIASES.map(alias => `\`${alias}\``).join(', ')}`);
	}

	if (typeof stdio === 'string') {
		return [stdio, stdio, stdio];
	}

	if (!Array.isArray(stdio)) {
		throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
	}

	const length = Math.max(stdio.length, STANDARD_STREAMS_ALIASES.length);
	return Array.from({length}, (_, fdNumber) => stdio[fdNumber]);
};

const hasAlias = options => STANDARD_STREAMS_ALIASES.some(alias => options[alias] !== undefined);

const addDefaultValue = (stdioOption, fdNumber) => {
	if (Array.isArray(stdioOption)) {
		return stdioOption.map(item => addDefaultValue(item, fdNumber));
	}

	if (stdioOption === null || stdioOption === undefined) {
		return fdNumber >= STANDARD_STREAMS_ALIASES.length ? 'ignore' : 'pipe';
	}

	return stdioOption;
};

// Using `buffer: false` with synchronous methods implies `stdout`/`stderr`: `ignore`.
// Unless the output is needed, e.g. due to `verbose: 'full'` or to redirecting to a file.
// This is only done for `stdout`/`stderr`, since `ignore` redirects them to `/dev/null`.
// With additional file descriptors, it does not pass them to the subprocess at all, which would make it fail when writing to them.
const normalizeStdioSync = (stdioArray, buffer, verboseInfo) => stdioArray.map((stdioOption, fdNumber) =>
	!buffer[fdNumber]
	&& isStandardOutputFd(fdNumber)
	&& !isFullVerbose(verboseInfo, fdNumber)
	&& isOutputPipeOnly(stdioOption, fdNumber)
		? 'ignore'
		: stdioOption);

const isOutputPipeOnly = (stdioOption, fdNumber) => isOutputPipe(stdioOption, fdNumber)
	|| (Array.isArray(stdioOption) && stdioOption.every(item => isOutputPipe(item, fdNumber)));

const isOutputPipe = (stdioOption, fdNumber) => stdioOption === 'pipe'
	|| isOutputPipeObject(stdioOption, fdNumber);

const isOutputPipeObject = (stdioOption, fdNumber) => isStdioValueObject(stdioOption)
	&& stdioOption.value === 'pipe'
	&& (stdioOption.input === undefined || stdioOption.input === false || isFixedOutputPipe(fdNumber, stdioOption.input));

// On `stdout`/`stderr`, the direction is always output, so `input: true` is ignored and the pipe stays output.
const isFixedOutputPipe = (fdNumber, input) => input === true && isStandardOutputFd(fdNumber);

const isStandardOutputFd = fdNumber => fdNumber === 1 || fdNumber === 2;
