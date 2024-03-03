import {execa} from '../async.js';
import {create$} from '../script.js';
import {normalizeArguments} from '../arguments/options.js';
import {STANDARD_STREAMS_ALIASES} from '../utils.js';

export const normalizePipeArguments = ({source, sourcePromise, stdioStreamsGroups, destinationOptions}, ...args) => {
	const sourceOptions = PROCESS_OPTIONS.get(source);
	const {
		destination,
		destinationStream,
		destinationError,
		pipeOptions: {from, unpipeSignal} = {},
	} = getDestinationStream(destinationOptions, ...args);
	const {sourceStream, sourceError} = getSourceStream(source, stdioStreamsGroups, from, sourceOptions);
	return {
		sourcePromise,
		sourceStream,
		sourceOptions,
		sourceError,
		destination,
		destinationStream,
		destinationError,
		unpipeSignal,
		stdioStreamsGroups,
	};
};

const getDestinationStream = (destinationOptions, ...args) => {
	try {
		const {destination, pipeOptions} = getDestination(destinationOptions, ...args);
		const destinationStream = destination.stdin;
		if (destinationStream === null) {
			throw new TypeError('The destination child process\'s stdin must be available. Please set its "stdin" option to "pipe".');
		}

		return {destination, destinationStream, pipeOptions};
	} catch (error) {
		return {destinationError: error};
	}
};

const getDestination = (destinationOptions, firstArgument, ...args) => {
	if (Array.isArray(firstArgument)) {
		const destination = create$({...destinationOptions, ...PIPED_PROCESS_OPTIONS})(firstArgument, ...args);
		return {destination, pipeOptions: destinationOptions};
	}

	if (typeof firstArgument === 'string' || firstArgument instanceof URL) {
		if (Object.keys(destinationOptions).length > 0) {
			throw new TypeError('Please use .pipe("file", ..., options) or .pipe(execa("file", ..., options)) instead of .pipe(options)(execa("file", ...)).');
		}

		const [rawFile, rawArgs, rawOptions] = normalizeArguments(firstArgument, ...args);
		const destination = execa(rawFile, rawArgs, {...rawOptions, ...PIPED_PROCESS_OPTIONS});
		return {destination, pipeOptions: rawOptions};
	}

	if (PROCESS_OPTIONS.has(firstArgument)) {
		if (Object.keys(destinationOptions).length > 0) {
			throw new TypeError('Please use .pipe(options)`command` or .pipe($(options)`command`) instead of .pipe(options)($`command`).');
		}

		return {destination: firstArgument, pipeOptions: args[0]};
	}

	throw new TypeError(`The first argument must be a template string, an options object, or an Execa child process: ${firstArgument}`);
};

const PIPED_PROCESS_OPTIONS = {stdin: 'pipe', piped: true};

export const PROCESS_OPTIONS = new WeakMap();

const getSourceStream = (source, stdioStreamsGroups, from, sourceOptions) => {
	try {
		const fdNumber = getFdNumber(stdioStreamsGroups, from);
		const sourceStream = fdNumber === 'all' ? source.all : source.stdio[fdNumber];

		if (sourceStream === null || sourceStream === undefined) {
			throw new TypeError(getInvalidStdioOptionMessage(fdNumber, from, sourceOptions));
		}

		return {sourceStream};
	} catch (error) {
		return {sourceError: error};
	}
};

const getFdNumber = (stdioStreamsGroups, from = 'stdout') => {
	const fdNumber = STANDARD_STREAMS_ALIASES.includes(from)
		? STANDARD_STREAMS_ALIASES.indexOf(from)
		: from;

	if (fdNumber === 'all') {
		return fdNumber;
	}

	if (fdNumber === 0) {
		throw new TypeError('The "from" option must not be "stdin".');
	}

	if (!Number.isInteger(fdNumber) || fdNumber < 0) {
		throw new TypeError(`The "from" option must not be "${fdNumber}".
It must be "stdout", "stderr", "all" or a file descriptor integer.
It is optional and defaults to "stdout".`);
	}

	const stdioStreams = stdioStreamsGroups[fdNumber];
	if (stdioStreams === undefined) {
		throw new TypeError(`The "from" option must not be ${fdNumber}. That file descriptor does not exist.
Please set the "stdio" option to ensure that file descriptor exists.`);
	}

	if (stdioStreams[0].direction === 'input') {
		throw new TypeError(`The "from" option must not be ${fdNumber}. It must be a readable stream, not writable.`);
	}

	return fdNumber;
};

const getInvalidStdioOptionMessage = (fdNumber, from, sourceOptions) => {
	if (fdNumber === 'all' && !sourceOptions.all) {
		return 'The "all" option must be true to use `childProcess.pipe(destinationProcess, {from: "all"})`.';
	}

	const {optionName, optionValue} = getInvalidStdioOption(fdNumber, sourceOptions);
	const pipeOptions = from === undefined ? '' : `, {from: ${serializeOptionValue(from)}}`;
	return `The \`${optionName}: ${serializeOptionValue(optionValue)}\` option is incompatible with using \`childProcess.pipe(destinationProcess${pipeOptions})\`.
Please set this option with "pipe" instead.`;
};

const getInvalidStdioOption = (fdNumber, {stdout, stderr, stdio}) => {
	const usedDescriptor = fdNumber === 'all' ? 1 : fdNumber;

	if (usedDescriptor === 1 && stdout !== undefined) {
		return {optionName: 'stdout', optionValue: stdout};
	}

	if (usedDescriptor === 2 && stderr !== undefined) {
		return {optionName: 'stderr', optionValue: stderr};
	}

	return {optionName: `stdio[${usedDescriptor}]`, optionValue: stdio[usedDescriptor]};
};

const serializeOptionValue = optionValue => {
	if (typeof optionValue === 'string') {
		return `"${optionValue}"`;
	}

	return typeof optionValue === 'number' ? `${optionValue}` : 'Stream';
};
