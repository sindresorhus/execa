import {STANDARD_STREAMS_ALIASES} from '../utils.js';

export const normalizePipeArguments = ({source, sourcePromise, stdioStreamsGroups}, ...args) => {
	const sourceOptions = PROCESS_OPTIONS.get(source);
	const {
		destination,
		destinationStream,
		destinationError,
		pipeOptions: {from, unpipeSignal} = {},
	} = getDestinationStream(...args);
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

const getDestinationStream = (...args) => {
	try {
		const {destination, pipeOptions} = getDestination(...args);
		const destinationStream = destination.stdin;
		if (destinationStream === null) {
			throw new TypeError('The destination child process\'s stdin must be available. Please set its "stdin" option to "pipe".');
		}

		return {destination, destinationStream, pipeOptions};
	} catch (error) {
		return {destinationError: error};
	}
};

const getDestination = (firstArgument, ...args) => {
	if (!PROCESS_OPTIONS.has(firstArgument)) {
		throw new TypeError(`The first argument must be an Execa child process: ${firstArgument}`);
	}

	return {destination: firstArgument, pipeOptions: args[0]};
};

export const PROCESS_OPTIONS = new WeakMap();

const getSourceStream = (source, stdioStreamsGroups, from, sourceOptions) => {
	try {
		const streamIndex = getStreamIndex(stdioStreamsGroups, from);
		const sourceStream = streamIndex === 'all' ? source.all : source.stdio[streamIndex];

		if (sourceStream === null || sourceStream === undefined) {
			throw new TypeError(getInvalidStdioOptionMessage(streamIndex, from, sourceOptions));
		}

		return {sourceStream};
	} catch (error) {
		return {sourceError: error};
	}
};

const getStreamIndex = (stdioStreamsGroups, from = 'stdout') => {
	const streamIndex = STANDARD_STREAMS_ALIASES.includes(from)
		? STANDARD_STREAMS_ALIASES.indexOf(from)
		: from;

	if (streamIndex === 'all') {
		return streamIndex;
	}

	if (streamIndex === 0) {
		throw new TypeError('The "from" option must not be "stdin".');
	}

	if (!Number.isInteger(streamIndex) || streamIndex < 0) {
		throw new TypeError(`The "from" option must not be "${streamIndex}".
It must be "stdout", "stderr", "all" or a file descriptor integer.
It is optional and defaults to "stdout".`);
	}

	const stdioStreams = stdioStreamsGroups[streamIndex];
	if (stdioStreams === undefined) {
		throw new TypeError(`The "from" option must not be ${streamIndex}. That file descriptor does not exist.
Please set the "stdio" option to ensure that file descriptor exists.`);
	}

	if (stdioStreams[0].direction === 'input') {
		throw new TypeError(`The "from" option must not be ${streamIndex}. It must be a readable stream, not writable.`);
	}

	return streamIndex;
};

const getInvalidStdioOptionMessage = (streamIndex, from, sourceOptions) => {
	if (streamIndex === 'all' && !sourceOptions.all) {
		return 'The "all" option must be true to use `childProcess.pipe(destinationProcess, {from: "all"})`.';
	}

	const {optionName, optionValue} = getInvalidStdioOption(streamIndex, sourceOptions);
	const pipeOptions = from === undefined ? '' : `, {from: ${serializeOptionValue(from)}}`;
	return `The \`${optionName}: ${serializeOptionValue(optionValue)}\` option is incompatible with using \`childProcess.pipe(destinationProcess${pipeOptions})\`.
Please set this option with "pipe" instead.`;
};

const getInvalidStdioOption = (streamIndex, {stdout, stderr, stdio}) => {
	const usedIndex = streamIndex === 'all' ? 1 : streamIndex;

	if (usedIndex === 1 && stdout !== undefined) {
		return {optionName: 'stdout', optionValue: stdout};
	}

	if (usedIndex === 2 && stderr !== undefined) {
		return {optionName: 'stderr', optionValue: stderr};
	}

	return {optionName: `stdio[${usedIndex}]`, optionValue: stdio[usedIndex]};
};

const serializeOptionValue = optionValue => {
	if (typeof optionValue === 'string') {
		return `"${optionValue}"`;
	}

	return typeof optionValue === 'number' ? `${optionValue}` : 'Stream';
};
