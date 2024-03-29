import {makeEarlyError} from '../return/error.js';
import {abortSourceStream, endDestinationStream} from '../stdio/pipeline.js';

export const handlePipeArgumentsError = ({
	sourceStream,
	sourceError,
	destinationStream,
	destinationError,
	fileDescriptors,
	sourceOptions,
	startTime,
}) => {
	const error = getPipeArgumentsError({sourceStream, sourceError, destinationStream, destinationError});
	if (error !== undefined) {
		throw createNonCommandError({error, fileDescriptors, sourceOptions, startTime});
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

export const createNonCommandError = ({error, fileDescriptors, sourceOptions, startTime}) => makeEarlyError({
	error,
	command: PIPE_COMMAND_MESSAGE,
	escapedCommand: PIPE_COMMAND_MESSAGE,
	fileDescriptors,
	options: sourceOptions,
	startTime,
	isSync: false,
});

const PIPE_COMMAND_MESSAGE = 'source.pipe(destination)';
