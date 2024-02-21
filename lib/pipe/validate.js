import {ChildProcess} from 'node:child_process';
import {STANDARD_STREAMS_ALIASES} from '../stdio/utils.js';
import {makeEarlyError} from '../error.js';
import {abortSourceStream, endDestinationStream} from './streaming.js';

export const normalizePipeArguments = (destination, from, {spawned: source, stdioStreamsGroups, options}) => {
	const {destinationStream, destinationError} = getDestinationStream(destination);
	const {sourceStream, sourceError} = getSourceStream(source, stdioStreamsGroups, from, options);
	handlePipeArgumentsError({sourceStream, sourceError, destinationStream, destinationError, stdioStreamsGroups, options});
	return {source, sourceStream, destinationStream};
};

const getDestinationStream = destination => {
	try {
		if (!isExecaChildProcess(destination)) {
			throw new TypeError('The first argument must be an Execa child process.');
		}

		const destinationStream = destination.stdin;
		if (destinationStream === null) {
			throw new TypeError('The destination child process\'s stdin must be available. Please set its "stdin" option to "pipe".');
		}

		return {destinationStream};
	} catch (error) {
		return {destinationError: error};
	}
};

const isExecaChildProcess = destination => destination instanceof ChildProcess
	&& typeof destination.then === 'function'
	&& typeof destination.pipe === 'function';

const getSourceStream = (source, stdioStreamsGroups, from, options) => {
	try {
		const streamIndex = getStreamIndex(stdioStreamsGroups, from);
		const sourceStream = streamIndex === 'all' ? source.all : source.stdio[streamIndex];

		if (sourceStream === null || sourceStream === undefined) {
			throw new TypeError(getInvalidStdioOptionMessage(streamIndex, from, options));
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

const getInvalidStdioOptionMessage = (streamIndex, from, options) => {
	if (streamIndex === 'all' && !options.all) {
		return 'The "all" option must be true to use `childProcess.pipe(destinationProcess, {from: "all"})`.';
	}

	const {optionName, optionValue} = getInvalidStdioOption(streamIndex, options);
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

const handlePipeArgumentsError = ({sourceStream, sourceError, destinationStream, destinationError, stdioStreamsGroups, options}) => {
	const error = getPipeArgumentsError({sourceStream, sourceError, destinationStream, destinationError});
	if (error !== undefined) {
		throw createNonCommandError({error, stdioStreamsGroups, options});
	}
};

const getPipeArgumentsError = ({sourceStream, sourceError, destinationStream, destinationError}) => {
	if (sourceError !== undefined && destinationError !== undefined) {
		return destinationError;
	}

	if (destinationError !== undefined) {
		abortSourceStream(sourceStream);
		return destinationError;
	}

	if (sourceError !== undefined) {
		endDestinationStream(destinationStream);
		return sourceError;
	}
};

export const createNonCommandError = ({error, stdioStreamsGroups, options}) => makeEarlyError({
	error,
	command: PIPE_COMMAND_MESSAGE,
	escapedCommand: PIPE_COMMAND_MESSAGE,
	stdioStreamsGroups,
	options,
});

const PIPE_COMMAND_MESSAGE = 'source.pipe(destination)';
