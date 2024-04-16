import {normalizeArguments} from '../arguments/normalize.js';
import {getStartTime} from '../return/duration.js';
import {SUBPROCESS_OPTIONS, getWritable, getReadable} from '../convert/fd-options.js';

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

const getSourceStream = (source, from) => {
	try {
		const sourceStream = getReadable(source, from);
		return {sourceStream};
	} catch (error) {
		return {sourceError: error};
	}
};
