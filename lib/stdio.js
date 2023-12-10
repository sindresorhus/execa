import {createReadStream, readFileSync} from 'node:fs';
import {Readable} from 'node:stream';
import {isStream} from 'is-stream';

const aliases = ['stdin', 'stdout', 'stderr'];

const arrifyStdio = (stdio = []) => Array.isArray(stdio) ? stdio : [stdio, stdio, stdio];

const isIterableStdin = stdinOption => typeof stdinOption === 'object'
	&& stdinOption !== null
	&& !isStream(stdinOption)
	&& (typeof stdinOption[Symbol.asyncIterator] === 'function' || typeof stdinOption[Symbol.iterator] === 'function');

const getIterableStdin = stdioArray => isIterableStdin(stdioArray[0])
	? stdioArray[0]
	: undefined;

// Check whether the `stdin` option results in `spawned.stdin` being `undefined`.
// We use a deny list instead of an allow list to be forward compatible with new options.
const cannotPipeStdio = stdioOption => NO_PIPE_STDIN.has(stdioOption)
	|| isStream(stdioOption)
	|| typeof stdioOption === 'number'
	|| isIterableStdin(stdioOption);

const NO_PIPE_STDIN = new Set(['ipc', 'ignore', 'inherit']);

const validateInputOptions = (stdioArray, input, inputFile) => {
	if (input !== undefined && inputFile !== undefined) {
		throw new TypeError('The `input` and `inputFile` options cannot be both set.');
	}

	const noPipeStdin = cannotPipeStdio(stdioArray[0]);
	if (noPipeStdin && input !== undefined) {
		throw new TypeError('The `input` and `stdin` options cannot be both set.');
	}

	if (noPipeStdin && inputFile !== undefined) {
		throw new TypeError('The `inputFile` and `stdin` options cannot be both set.');
	}
};

const getStdioStreams = (stdioArray, {input, inputFile}) => {
	const iterableStdin = getIterableStdin(stdioArray);

	if (iterableStdin !== undefined) {
		return {stdinStream: Readable.from(iterableStdin)};
	}

	if (inputFile !== undefined) {
		return {stdinStream: createReadStream(inputFile)};
	}

	if (input === undefined) {
		return {};
	}

	if (isStream(input)) {
		return {stdinStream: input};
	}

	return {stdinInput: input};
};

// When the `stdin: iterable`, `input` or `inputFile` option is used, we pipe to `spawned.stdin`.
// Therefore the `stdin` option must be either `pipe` or `overlapped`. Other values do not set `spawned.stdin`.
const willPipeStdin = (index, {stdinStream, stdinInput}) =>
	index === 0 && (stdinStream !== undefined || stdinInput !== undefined);

const transformStdioItem = (stdioItem, index, stdioStreams) =>
	willPipeStdin(index, stdioStreams) && stdioItem !== 'overlapped' ? 'pipe' : stdioItem;

const transformStdio = (stdio, stdioStreams) => Array.isArray(stdio)
	? stdio.map((stdioItem, index) => transformStdioItem(stdioItem, index, stdioStreams))
	: stdio;

// Handle `input`, `inputFile` and `stdin` options, before spawning, in async mode
export const handleStdioOption = options => {
	const stdio = normalizeStdio(options);
	const stdioArray = arrifyStdio(stdio);
	validateInputOptions(stdioArray, options.input, options.inputFile);
	const stdioStreams = getStdioStreams(stdioArray, options);
	options.stdio = transformStdio(stdio, stdioStreams);
	return stdioStreams;
};

// Handle `input`, `inputFile` and `stdin` options, after spawning, in async mode
export const pipeStdioOption = (spawned, {stdinStream, stdinInput}) => {
	if (stdinStream !== undefined) {
		stdinStream.pipe(spawned.stdin);
		return;
	}

	if (stdinInput !== undefined) {
		spawned.stdin.end(stdinInput);
	}
};

const validateInputOptionsSync = (stdioArray, input) => {
	if (getIterableStdin(stdioArray) !== undefined) {
		throw new TypeError('The `stdin` option cannot be an iterable in sync mode');
	}

	if (isStream(input)) {
		throw new TypeError('The `input` option cannot be a stream in sync mode');
	}
};

const getInputOption = (stdio, {input, inputFile}) => {
	const stdioArray = arrifyStdio(stdio);
	validateInputOptions(stdioArray, input, inputFile);
	validateInputOptionsSync(stdioArray, input);

	if (inputFile !== undefined) {
		return readFileSync(inputFile);
	}

	return input;
};

// Handle `input`, `inputFile` and `stdin` options, before spawning, in sync mode
export const handleInputOption = options => {
	const stdio = normalizeStdio(options);

	const input = getInputOption(stdio, options);
	if (input !== undefined) {
		options.input = input;
	}

	options.stdio = stdio;
};

const hasAlias = options => aliases.some(alias => options[alias] !== undefined);

export const normalizeStdio = options => {
	if (!options) {
		return;
	}

	const {stdio} = options;

	if (stdio === undefined) {
		return aliases.map(alias => options[alias]);
	}

	if (hasAlias(options)) {
		throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${aliases.map(alias => `\`${alias}\``).join(', ')}`);
	}

	if (typeof stdio === 'string') {
		return stdio;
	}

	if (!Array.isArray(stdio)) {
		throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
	}

	const length = Math.max(stdio.length, aliases.length);
	return Array.from({length}, (value, index) => stdio[index]);
};

// `ipc` is pushed unless it is already present
export const normalizeStdioNode = options => {
	const stdio = normalizeStdio(options);

	if (stdio === 'ipc') {
		return 'ipc';
	}

	if (stdio === undefined || typeof stdio === 'string') {
		return [stdio, stdio, stdio, 'ipc'];
	}

	if (stdio.includes('ipc')) {
		return stdio;
	}

	return [...stdio, 'ipc'];
};
