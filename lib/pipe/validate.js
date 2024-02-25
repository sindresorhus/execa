import {execa} from '../async.js';
import {create$} from '../script.js';
import {normalizeArguments} from '../arguments/options.js';
import {STANDARD_STREAMS_ALIASES} from '../utils.js';
import {getStartTime} from '../return/duration.js';

export const normalizePipeArguments = ({source, sourcePromise, boundOptions}, ...args) => {
	const startTime = getStartTime();
	const {
		destination,
		destinationStream,
		destinationError,
		from,
		unpipeSignal,
	} = getDestinationStream(boundOptions, args);
	const {sourceStream, sourceError} = getSourceStream(source, from);
	const {options: sourceOptions, stdioStreamsGroups} = SUBPROCESS_OPTIONS.get(source);
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
		startTime,
	};
};

const getDestinationStream = (boundOptions, args) => {
	try {
		const {
			destination,
			pipeOptions: {from, to, unpipeSignal} = {},
		} = getDestination(boundOptions, ...args);
		const destinationStream = getWritable(destination, to);
		return {destination, destinationStream, from, unpipeSignal};
	} catch (error) {
		return {destinationError: error};
	}
};

const getDestination = (boundOptions, firstArgument, ...args) => {
	if (Array.isArray(firstArgument)) {
		const destination = create$({...boundOptions, ...PIPED_SUBPROCESS_OPTIONS})(firstArgument, ...args);
		return {destination, pipeOptions: boundOptions};
	}

	if (typeof firstArgument === 'string' || firstArgument instanceof URL) {
		if (Object.keys(boundOptions).length > 0) {
			throw new TypeError('Please use .pipe("file", ..., options) or .pipe(execa("file", ..., options)) instead of .pipe(options)("file", ...).');
		}

		const [rawFile, rawArgs, rawOptions] = normalizeArguments(firstArgument, ...args);
		const destination = execa(rawFile, rawArgs, {...rawOptions, ...PIPED_SUBPROCESS_OPTIONS});
		return {destination, pipeOptions: rawOptions};
	}

	if (SUBPROCESS_OPTIONS.has(firstArgument)) {
		if (Object.keys(boundOptions).length > 0) {
			throw new TypeError('Please use .pipe(options)`command` or .pipe($(options)`command`) instead of .pipe(options)($`command`).');
		}

		return {destination: firstArgument, pipeOptions: args[0]};
	}

	throw new TypeError(`The first argument must be a template string, an options object, or an Execa subprocess: ${firstArgument}`);
};

const PIPED_SUBPROCESS_OPTIONS = {stdin: 'pipe', piped: true};

export const SUBPROCESS_OPTIONS = new WeakMap();

const getWritable = (destination, to = 'stdin') => {
	const isWritable = true;
	const {options, stdioStreamsGroups} = SUBPROCESS_OPTIONS.get(destination);
	const fdNumber = getFdNumber(stdioStreamsGroups, to, isWritable);
	const destinationStream = destination.stdio[fdNumber];

	if (destinationStream === null) {
		throw new TypeError(getInvalidStdioOptionMessage(fdNumber, to, options, isWritable));
	}

	return destinationStream;
};

const getSourceStream = (source, from) => {
	try {
		const sourceStream = getReadable(source, from);
		return {sourceStream};
	} catch (error) {
		return {sourceError: error};
	}
};

const getReadable = (source, from = 'stdout') => {
	const isWritable = false;
	const {options, stdioStreamsGroups} = SUBPROCESS_OPTIONS.get(source);
	const fdNumber = getFdNumber(stdioStreamsGroups, from, isWritable);
	const sourceStream = fdNumber === 'all' ? source.all : source.stdio[fdNumber];

	if (sourceStream === null || sourceStream === undefined) {
		throw new TypeError(getInvalidStdioOptionMessage(fdNumber, from, options, isWritable));
	}

	return sourceStream;
};

const getFdNumber = (stdioStreamsGroups, fdName, isWritable) => {
	const fdNumber = STANDARD_STREAMS_ALIASES.includes(fdName)
		? STANDARD_STREAMS_ALIASES.indexOf(fdName)
		: fdName;

	if (fdNumber === 'all') {
		return fdNumber;
	}

	if (!Number.isInteger(fdNumber) || fdNumber < 0) {
		const {validOptions, defaultValue} = isWritable
			? {validOptions: '"stdin"', defaultValue: 'stdin'}
			: {validOptions: '"stdout", "stderr", "all"', defaultValue: 'stdout'};
		throw new TypeError(`"${getOptionName(isWritable)}" must not be "${fdNumber}".
It must be ${validOptions} or a file descriptor integer.
It is optional and defaults to "${defaultValue}".`);
	}

	const stdioStreams = stdioStreamsGroups[fdNumber];
	if (stdioStreams === undefined) {
		throw new TypeError(`"${getOptionName(isWritable)}" must not be ${fdNumber}. That file descriptor does not exist.
Please set the "stdio" option to ensure that file descriptor exists.`);
	}

	if (stdioStreams[0].direction === 'input' && !isWritable) {
		throw new TypeError(`"${getOptionName(isWritable)}" must not be ${fdNumber}. It must be a readable stream, not writable.`);
	}

	if (stdioStreams[0].direction !== 'input' && isWritable) {
		throw new TypeError(`"${getOptionName(isWritable)}" must not be ${fdNumber}. It must be a writable stream, not readable.`);
	}

	return fdNumber;
};

const getInvalidStdioOptionMessage = (fdNumber, fdName, options, isWritable) => {
	if (fdNumber === 'all' && !options.all) {
		return 'The "all" option must be true to use "from: \'all\'".';
	}

	const {optionName, optionValue} = getInvalidStdioOption(fdNumber, options);
	return `The "${optionName}: ${serializeOptionValue(optionValue)}" option is incompatible with using "${getOptionName(isWritable)}: ${serializeOptionValue(fdName)}".
Please set this option with "pipe" instead.`;
};

const getInvalidStdioOption = (fdNumber, {stdin, stdout, stderr, stdio}) => {
	const usedDescriptor = fdNumber === 'all' ? 1 : fdNumber;

	if (usedDescriptor === 0 && stdin !== undefined) {
		return {optionName: 'stdin', optionValue: stdin};
	}

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
		return `'${optionValue}'`;
	}

	return typeof optionValue === 'number' ? `${optionValue}` : 'Stream';
};

const getOptionName = isWritable => isWritable ? 'to' : 'from';
