import {createReadStream, createWriteStream, readFileSync, writeFileSync} from 'node:fs';
import {isAbsolute} from 'node:path';
import {Readable, Writable} from 'node:stream';
import {isStream as isNodeStream} from 'is-stream';

const arrifyStdio = (stdio = []) => Array.isArray(stdio) ? stdio : [stdio, stdio, stdio];

const isIterableStdin = stdinOption => typeof stdinOption === 'object'
	&& stdinOption !== null
	&& !isNodeStream(stdinOption)
	&& !isReadableStream(stdinOption)
	&& (typeof stdinOption[Symbol.asyncIterator] === 'function' || typeof stdinOption[Symbol.iterator] === 'function');

const getIterableStdin = stdioOption => isIterableStdin(stdioOption)
	? stdioOption
	: undefined;

const isUrlInstance = stdioOption => Object.prototype.toString.call(stdioOption) === '[object URL]';
const hasFileProtocol = url => url.protocol === 'file:';
const isFileUrl = stdioOption => isUrlInstance(stdioOption) && hasFileProtocol(stdioOption);
const isRegularUrl = stdioOption => isUrlInstance(stdioOption) && !hasFileProtocol(stdioOption);

const stringIsFilePath = stdioOption => stdioOption.startsWith('.') || isAbsolute(stdioOption);
const isFilePath = stdioOption => typeof stdioOption === 'string' && stringIsFilePath(stdioOption);
const isUnknownStdioString = stdioOption => typeof stdioOption === 'string' && !stringIsFilePath(stdioOption) && !KNOWN_STDIO.has(stdioOption);

const isReadableStream = stdioOption => Object.prototype.toString.call(stdioOption) === '[object ReadableStream]';
const isWritableStream = stdioOption => Object.prototype.toString.call(stdioOption) === '[object WritableStream]';

// Check whether the `stdin` option results in `spawned.stdin` being `undefined`.
// We use a deny list instead of an allow list to be forward compatible with new options.
const cannotPipeStdin = stdinOption => NO_PIPE_STDIO.has(stdinOption)
	|| isNodeStream(stdinOption)
	|| isReadableStream(stdinOption)
	|| typeof stdinOption === 'number'
	|| isIterableStdin(stdinOption)
	|| isFileUrl(stdinOption)
	|| isFilePath(stdinOption);

const NO_PIPE_STDIO = new Set(['ipc', 'ignore', 'inherit']);
const KNOWN_STDIO = new Set([...NO_PIPE_STDIO, 'overlapped', 'pipe']);

const validateFileSdio = (stdioOption, optionName) => {
	if (isRegularUrl(stdioOption)) {
		throw new TypeError(`The \`${optionName}: URL\` option must use the \`file:\` scheme.
For example, you can use the \`pathToFileURL()\` method of the \`url\` core module.`);
	}

	if (isUnknownStdioString(stdioOption)) {
		throw new TypeError(`The \`${optionName}: filePath\` option must either be an absolute file path or start with \`.\`.`);
	}
};

const validateInputOptions = (stdioArray, input, inputFile) => {
	if (input !== undefined && inputFile !== undefined) {
		throw new TypeError('The `input` and `inputFile` options cannot be both set.');
	}

	const noPipeStdin = cannotPipeStdin(stdioArray[0]);
	if (noPipeStdin && input !== undefined) {
		throw new TypeError('The `input` and `stdin` options cannot be both set.');
	}

	if (noPipeStdin && inputFile !== undefined) {
		throw new TypeError('The `inputFile` and `stdin` options cannot be both set.');
	}

	validateFileSdio(stdioArray[0], 'stdin');
	validateFileSdio(stdioArray[1], 'stdout');
	validateFileSdio(stdioArray[2], 'stderr');
};

const getStdioStreams = (stdioArray, {input, inputFile}) => [
	{...getStdinStream(stdioArray[0], input, inputFile), isInput: true},
	getOutputStream(stdioArray[1]),
	getOutputStream(stdioArray[2]),
];

const getStdinStream = (stdinOption, input, inputFile) => {
	const iterableStdin = getIterableStdin(stdinOption);

	if (iterableStdin !== undefined) {
		return {value: Readable.from(iterableStdin)};
	}

	if (isReadableStream(stdinOption)) {
		return {value: Readable.fromWeb(stdinOption)};
	}

	if (isFileUrl(stdinOption) || isFilePath(stdinOption)) {
		return {value: createReadStream(stdinOption), finite: true};
	}

	if (inputFile !== undefined) {
		return {value: createReadStream(inputFile), finite: true};
	}

	if (input === undefined) {
		return {};
	}

	if (isNodeStream(input)) {
		return {value: input};
	}

	return {value: input, single: true};
};

const getOutputStream = stdioOption => {
	if (isWritableStream(stdioOption)) {
		return {value: Writable.fromWeb(stdioOption)};
	}

	if (isFileUrl(stdioOption) || isFilePath(stdioOption)) {
		return {value: createWriteStream(stdioOption), finite: true};
	}

	return {};
};

// When the `stdin: Iterable | ReadableStream | URL | filePath`, `input` or `inputFile` option is used, we pipe to `spawned.std*`.
// Therefore the `std*` options must be either `pipe` or `overlapped`. Other values do not set `spawned.std*`.
const transformStdioItem = (stdioItem, index, stdioStreams) =>
	stdioStreams[index]?.value !== undefined && stdioItem !== 'overlapped' ? 'pipe' : stdioItem;

const transformStdio = (stdio, stdioStreams) => Array.isArray(stdio)
	? stdio.map((stdioItem, index) => transformStdioItem(stdioItem, index, stdioStreams))
	: stdio;

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async mode
export const handleStdioOption = options => {
	const stdio = normalizeStdio(options);
	const stdioArray = arrifyStdio(stdio);
	validateInputOptions(stdioArray, options.input, options.inputFile);
	const stdioStreams = getStdioStreams(stdioArray, options);
	options.stdio = transformStdio(stdio, stdioStreams);
	return stdioStreams;
};

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, after spawning, in async mode
export const pipeStdioOptions = (spawned, stdioStreams) => {
	for (const [index, stdioStream] of stdioStreams.entries()) {
		pipeStdioOption(spawned.stdio[index], stdioStream);
	}
};

const pipeStdioOption = (childStream, {single, value, isInput}) => {
	if (value === undefined) {
		return;
	}

	if (!isInput) {
		childStream.pipe(value);
		return;
	}

	if (single) {
		childStream.end(value);
		return;
	}

	value.pipe(childStream);
};

const transformStdioItemSync = stdioItem => isFileUrl(stdioItem) || isFilePath(stdioItem) ? 'pipe' : stdioItem;

const transformStdioSync = stdio => Array.isArray(stdio)
	? stdio.map(stdioItem => transformStdioItemSync(stdioItem))
	: stdio;

const validateInputOptionsSync = (stdinOption, input) => {
	if (getIterableStdin(stdinOption) !== undefined) {
		throw new TypeError('The `stdin` option cannot be an iterable in sync mode');
	}

	if (isReadableStream(stdinOption)) {
		throw new TypeError('The `stdin` option cannot be a stream in sync mode');
	}

	if (isNodeStream(input)) {
		throw new TypeError('The `input` option cannot be a stream in sync mode');
	}
};

const validateOutputOptionsSync = (stdioOption, optionName) => {
	if (isWritableStream(stdioOption)) {
		throw new TypeError(`The \`${optionName}\` option cannot be a stream in sync mode`);
	}
};

const validateOptionsSync = (stdioArray, {input, inputFile}) => {
	validateInputOptions(stdioArray, input, inputFile);
	validateInputOptionsSync(stdioArray[0], input);
	validateOutputOptionsSync(stdioArray[1], 'stdout');
	validateOutputOptionsSync(stdioArray[2], 'stderr');
};

const getInputOption = (stdinOption, {input, inputFile}) => {
	if (isFileUrl(stdinOption) || isFilePath(stdinOption)) {
		return readFileSync(stdinOption);
	}

	if (inputFile !== undefined) {
		return readFileSync(inputFile);
	}

	return input;
};

// Handle `input`, `inputFile` and `stdin` options, before spawning, in sync mode
export const handleInputSync = options => {
	const stdio = normalizeStdio(options);
	const stdioArray = arrifyStdio(stdio);
	validateOptionsSync(stdioArray, options);

	const input = getInputOption(stdioArray[0], options);
	if (input !== undefined) {
		options.input = input;
	}

	options.stdio = transformStdioSync(stdio);
	return stdioArray;
};

// Handle `stdout` and `stderr` options, before spawning, in sync mode
const handleOutputOption = (stdioOption, result) => {
	if (result === null) {
		return;
	}

	if (isFileUrl(stdioOption) || isFilePath(stdioOption)) {
		writeFileSync(stdioOption, result);
	}
};

export const handleOutputSync = (stdioArray, {stdout, stderr}) => {
	handleOutputOption(stdioArray[1], stdout);
	handleOutputOption(stdioArray[2], stderr);
};

const aliases = ['stdin', 'stdout', 'stderr'];

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
