import {makeEarlyError} from '../return/error.js';
import {abortSourceStream, endDestinationStream} from './streaming.js';

export const handlePipeArgumentsError = ({
	sourcePromise,
	sourceStream,
	sourceError,
	destination,
	destinationStream,
	destinationError,
	stdioStreamsGroups,
	sourceOptions,
}) => {
	const error = getPipeArgumentsError({sourceStream, sourceError, destinationStream, destinationError});
	if (error === undefined) {
		return;
	}

	preventUnhandledRejection(sourcePromise, destination);
	throw createNonCommandError({error, stdioStreamsGroups, sourceOptions});
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

// `.pipe()` awaits the child process promises.
// When invalid arguments are passed to `.pipe()`, we throw an error, which prevents awaiting them.
// We need to ensure this does not create unhandled rejections.
const preventUnhandledRejection = (sourcePromise, destination) => {
	Promise.allSettled([sourcePromise, destination]);
};

export const createNonCommandError = ({error, stdioStreamsGroups, sourceOptions}) => makeEarlyError({
	error,
	command: PIPE_COMMAND_MESSAGE,
	escapedCommand: PIPE_COMMAND_MESSAGE,
	stdioStreamsGroups,
	options: sourceOptions,
});

const PIPE_COMMAND_MESSAGE = 'source.pipe(destination)';
