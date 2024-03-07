import {makeEarlyError} from '../return/error.js';
import {abortSourceStream, endDestinationStream} from '../stdio/pipeline.js';

export const handlePipeArgumentsError = ({
	sourceStream,
	sourceError,
	destinationStream,
	destinationError,
	stdioStreamsGroups,
	sourceOptions,
	startTime,
}) => {
	const error = getPipeArgumentsError({sourceStream, sourceError, destinationStream, destinationError});
	if (error !== undefined) {
		throw createNonCommandError({error, stdioStreamsGroups, sourceOptions, startTime});
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

export const createNonCommandError = ({error, stdioStreamsGroups, sourceOptions, startTime}) => makeEarlyError({
	error,
	command: PIPE_COMMAND_MESSAGE,
	escapedCommand: PIPE_COMMAND_MESSAGE,
	stdioStreamsGroups,
	options: sourceOptions,
	startTime,
});

const PIPE_COMMAND_MESSAGE = 'source.pipe(destination)';
