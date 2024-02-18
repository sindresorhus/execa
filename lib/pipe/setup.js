import isPlainObject from 'is-plain-obj';
import {normalizePipeArguments} from './validate.js';
import {handlePipeArgumentsError} from './throw.js';
import {waitForBothProcesses} from './sequence.js';
import {pipeProcessStream} from './streaming.js';
import {unpipeOnAbort} from './abort.js';

// Pipe a process' `stdout`/`stderr`/`stdio` into another process' `stdin`
export const pipeToProcess = (sourceInfo, ...args) => {
	if (isPlainObject(args[0])) {
		return pipeToProcess.bind(undefined, {
			...sourceInfo,
			destinationOptions: {...sourceInfo.destinationOptions, ...args[0]},
		});
	}

	const {destination, ...normalizedInfo} = normalizePipeArguments(sourceInfo, ...args);
	const promise = handlePipePromise({...normalizedInfo, destination});
	promise.pipe = pipeToProcess.bind(undefined, {...sourceInfo, source: destination, sourcePromise: promise, destinationOptions: {}});
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
	const processPromises = getProcessPromises(sourcePromise, destination);
	handlePipeArgumentsError({
		sourceStream,
		sourceError,
		destinationStream,
		destinationError,
		stdioStreamsGroups,
		sourceOptions,
	});
	const maxListenersController = new AbortController();
	try {
		const mergedStream = pipeProcessStream(sourceStream, destinationStream, maxListenersController);
		return await Promise.race([
			waitForBothProcesses(processPromises),
			...unpipeOnAbort(unpipeSignal, {sourceStream, mergedStream, sourceOptions, stdioStreamsGroups}),
		]);
	} finally {
		maxListenersController.abort();
	}
};

// `.pipe()` awaits the child process promises.
// When invalid arguments are passed to `.pipe()`, we throw an error, which prevents awaiting them.
// We need to ensure this does not create unhandled rejections.
const getProcessPromises = (sourcePromise, destination) => Promise.allSettled([sourcePromise, destination]);
