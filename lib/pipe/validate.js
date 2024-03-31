import {normalizeArguments} from '../arguments/normalize.js';
import {STANDARD_STREAMS_ALIASES} from '../utils.js';
import {getStartTime} from '../return/duration.js';
import {serializeOptionValue} from '../stdio/native.js';

export const normalizePipeArguments = ({source, sourcePromise, boundOptions, createNested}, ...args) => {
	const startTime = getStartTime();
	const {
		destination,
		destinationStream,
		destinationError,
		from,
		unpipeSignal,
	} = getDestinationStream(boundOptions, createNested, args);
	const {sourceStream, sourceError} = getSourceStream(source, from);
	const {options: sourceOptions, fileDescriptors} = SUBPROCESS_OPTIONS.get(source);
	return {
		sourcePromise,
		sourceStream,
		sourceOptions,
		sourceError,
		destination,
		destinationStream,
		destinationError,
		unpipeSignal,
		fileDescriptors,
		startTime,
	};
};

const getDestinationStream = (boundOptions, createNested, args) => {
	try {
		const {
			destination,
			pipeOptions: {from, to, unpipeSignal} = {},
		} = getDestination(boundOptions, createNested, ...args);
		const destinationStream = getWritable(destination, to);
		return {destination, destinationStream, from, unpipeSignal};
	} catch (error) {
		return {destinationError: error};
	}
};

const getDestination = (boundOptions, createNested, firstArgument, ...args) => {
	if (Array.isArray(firstArgument)) {
		const destination = createNested(mapDestinationArguments, boundOptions)(firstArgument, ...args);
		return {destination, pipeOptions: boundOptions};
	}

	if (typeof firstArgument === 'string' || firstArgument instanceof URL) {
		if (Object.keys(boundOptions).length > 0) {
			throw new TypeError('Please use .pipe("file", ..., options) or .pipe(execa("file", ..., options)) instead of .pipe(options)("file", ...).');
		}

		const [rawFile, rawArgs, rawOptions] = normalizeArguments(firstArgument, ...args);
		const destination = createNested(mapDestinationArguments)(rawFile, rawArgs, rawOptions);
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

const mapDestinationArguments = ({options}) => ({options: {...options, stdin: 'pipe', piped: true}});

export const SUBPROCESS_OPTIONS = new WeakMap();

export const getWritable = (destination, to = 'stdin') => {
	const isWritable = true;
	const {options, fileDescriptors} = SUBPROCESS_OPTIONS.get(destination);
	const fdNumber = getFdNumber(fileDescriptors, to, isWritable);
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

export const getReadable = (source, from = 'stdout') => {
	const isWritable = false;
	const {options, fileDescriptors} = SUBPROCESS_OPTIONS.get(source);
	const fdNumber = getFdNumber(fileDescriptors, from, isWritable);
	const sourceStream = fdNumber === 'all' ? source.all : source.stdio[fdNumber];

	if (sourceStream === null || sourceStream === undefined) {
		throw new TypeError(getInvalidStdioOptionMessage(fdNumber, from, options, isWritable));
	}

	return sourceStream;
};

const getFdNumber = (fileDescriptors, fdName, isWritable) => {
	const fdNumber = parseFdNumber(fdName, isWritable);
	validateFdNumber(fdNumber, fdName, isWritable, fileDescriptors);
	return fdNumber;
};

const parseFdNumber = (fdName, isWritable) => {
	if (fdName === 'all') {
		return fdName;
	}

	if (STANDARD_STREAMS_ALIASES.includes(fdName)) {
		return STANDARD_STREAMS_ALIASES.indexOf(fdName);
	}

	const regexpResult = FD_REGEXP.exec(fdName);
	if (regexpResult !== null) {
		return Number(regexpResult[1]);
	}

	const {validOptions, defaultValue} = isWritable
		? {validOptions: '"stdin"', defaultValue: 'stdin'}
		: {validOptions: '"stdout", "stderr", "all"', defaultValue: 'stdout'};
	throw new TypeError(`"${getOptionName(isWritable)}" must not be "${fdName}".
It must be ${validOptions} or "fd3", "fd4" (and so on).
It is optional and defaults to "${defaultValue}".`);
};

const FD_REGEXP = /^fd(\d+)$/;

const validateFdNumber = (fdNumber, fdName, isWritable, fileDescriptors) => {
	const usedDescriptor = getUsedDescriptor(fdNumber);
	const fileDescriptor = fileDescriptors.find(fileDescriptor => fileDescriptor.fdNumber === usedDescriptor);
	if (fileDescriptor === undefined) {
		throw new TypeError(`"${getOptionName(isWritable)}" must not be ${fdName}. That file descriptor does not exist.
Please set the "stdio" option to ensure that file descriptor exists.`);
	}

	if (fileDescriptor.direction === 'input' && !isWritable) {
		throw new TypeError(`"${getOptionName(isWritable)}" must not be ${fdName}. It must be a readable stream, not writable.`);
	}

	if (fileDescriptor.direction !== 'input' && isWritable) {
		throw new TypeError(`"${getOptionName(isWritable)}" must not be ${fdName}. It must be a writable stream, not readable.`);
	}
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
	const usedDescriptor = getUsedDescriptor(fdNumber);

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

const getUsedDescriptor = fdNumber => fdNumber === 'all' ? 1 : fdNumber;

const getOptionName = isWritable => isWritable ? 'to' : 'from';
