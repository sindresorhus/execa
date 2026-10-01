import {normalizeParameters} from '../methods/parameters.js';
import {getStartTime} from '../return/duration.js';
import {SUBPROCESS_OPTIONS, getToStream, getFromStream} from '../arguments/fd-options.js';
import {isDenoExecPath} from '../arguments/file-url.js';
import {copyOptions} from '../utils/options.js';

// Normalize and validate arguments passed to `source.pipe(destination)`
export const normalizePipeArguments = ({source, sourcePromise, boundOptions, createNested}, ...pipeArguments) => {
	const startTime = getStartTime();
	const {
		destination,
		destinationStream,
		destinationError,
		from,
		unpipeSignal,
	} = getDestinationStream(boundOptions, createNested, pipeArguments);
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

const getDestinationStream = (boundOptions, createNested, pipeArguments) => {
	let destinationInfo;

	try {
		destinationInfo = getDestination(boundOptions, createNested, ...pipeArguments);
	} catch (error) {
		return {destinationError: error};
	}

	const {destination, pipeOptions} = destinationInfo;

	try {
		const {from, to, unpipeSignal} = copyOptions(pipeOptions);
		const destinationStream = getToStream(destination, to);
		return {
			destination,
			destinationStream,
			from,
			unpipeSignal,
		};
	} catch (error) {
		abortDestination(destination, pipeArguments[0]);
		return {destinationError: error};
	}
};

/*
The destination has already been spawned at that point, since the `to` option is validated afterwards.
When Execa spawned it, nothing else can end it, so it is terminated. Otherwise, it would keep running, e.g. waiting for its `stdin` forever, which also prevents the current process from exiting. A destination passed by the user is left to them.
In both cases, its error must be handled, otherwise it becomes an unhandled rejection which crashes the current process, e.g. with `source.pipe(execa('command'), {to: 'fd9'})`. This does not prevent the user from awaiting it.
*/
const abortDestination = (destination, firstArgument) => {
	if (destination !== firstArgument) {
		destination.kill();
	}

	destination.catch(() => {});
};

// Piping subprocesses can use three syntaxes:
//  - source.pipe('command', commandArguments, pipeOptionsOrDestinationOptions)
//  - source.pipe`command commandArgument` or source.pipe(pipeOptionsOrDestinationOptions)`command commandArgument`
//  - source.pipe(execa(...), pipeOptions)
const getDestination = (boundOptions, createNested, firstArgument, ...pipeArguments) => {
	if (Array.isArray(firstArgument)) {
		const destination = createNested(mapDestinationArguments, boundOptions)(firstArgument, ...pipeArguments);
		return {destination, pipeOptions: boundOptions};
	}

	if (typeof firstArgument === 'string' || firstArgument instanceof URL || isDenoExecPath(firstArgument)) {
		if (Object.keys(boundOptions).length > 0) {
			throw new TypeError('Please use .pipe("file", ..., options) or .pipe(execa("file", ..., options)) instead of .pipe(options)("file", ...).');
		}

		const [rawFile, rawArguments, rawOptions] = normalizeParameters(firstArgument, ...pipeArguments);
		const destination = createNested(mapDestinationArguments)(rawFile, rawArguments, rawOptions);
		return {destination, pipeOptions: rawOptions};
	}

	if (SUBPROCESS_OPTIONS.has(firstArgument)) {
		if (Object.keys(boundOptions).length > 0) {
			throw new TypeError('Please use .pipe(options)`command` or .pipe($(options)`command`) instead of .pipe(options)($`command`).');
		}

		return {destination: firstArgument, pipeOptions: pipeArguments[0]};
	}

	throw new TypeError(`The first argument must be a template string, an options object, or an Execa subprocess: ${firstArgument}`);
};

// Force `stdin: 'pipe'` with the destination subprocess
const mapDestinationArguments = ({options}) => ({
	options: {
		__proto__: null,
		...options,
		// Piping writes to the destination's `stdin`, which is forced even if the user set another value.
		// However, `stdin` cannot be combined with `stdio`, which is needed for `to: 'fd3'` and higher.
		...((options.stdio === undefined) && {stdin: 'pipe'}),
		piped: true,
	},
});

const getSourceStream = (source, from) => {
	try {
		const sourceStream = getFromStream(source, from);
		return {sourceStream};
	} catch (error) {
		return {sourceError: error};
	}
};
