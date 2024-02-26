import {normalizePipeArguments} from './validate.js';
import {handlePipeArgumentsError} from './throw.js';
import {waitForBothProcesses} from './sequence.js';
import {pipeProcessStream} from './streaming.js';
import {unpipeOnAbort} from './abort.js';

// Pipe a process' `stdout`/`stderr`/`stdio` into another process' `stdin`
export const pipeToProcess = (sourceInfo, ...args) => {
	const {destination, ...normalizedInfo} = normalizePipeArguments(sourceInfo, ...args);
	const promise = handlePipePromise({...normalizedInfo, destination});
	promise.pipe = pipeToProcess.bind(undefined, {...sourceInfo, source: destination, sourcePromise: promise});
	return promise;
};

const handlePipePromise = async ({
	sourcePromise,
	sourceStream,
	sourceOptions,
	sourceError,
	destination,
	destinationStream,
	destinationError,
	unpipeSignal,
	stdioStreamsGroups,
}) => {
	handlePipeArgumentsError({
		sourcePromise,
		sourceStream,
		sourceError,
		destination,
		destinationStream,
		destinationError,
		stdioStreamsGroups,
		sourceOptions,
	});
	const maxListenersController = new AbortController();
	try {
		const mergedStream = pipeProcessStream(sourceStream, destinationStream, maxListenersController);
		return await Promise.race([
			waitForBothProcesses(sourcePromise, destination),
			...unpipeOnAbort(unpipeSignal, {sourceStream, mergedStream, sourceOptions, stdioStreamsGroups}),
		]);
	} finally {
		maxListenersController.abort();
	}
};
