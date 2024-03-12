import isPlainObject from 'is-plain-obj';
import {normalizePipeArguments} from './validate.js';
import {handlePipeArgumentsError} from './throw.js';
import {waitForBothSubprocesses} from './sequence.js';
import {pipeSubprocessStream} from './streaming.js';
import {unpipeOnAbort} from './abort.js';

// Pipe a subprocess' `stdout`/`stderr`/`stdio` into another subprocess' `stdin`
export const pipeToSubprocess = (sourceInfo, ...args) => {
	if (isPlainObject(args[0])) {
		return pipeToSubprocess.bind(undefined, {
			...sourceInfo,
			boundOptions: {...sourceInfo.boundOptions, ...args[0]},
		});
	}

	const {destination, ...normalizedInfo} = normalizePipeArguments(sourceInfo, ...args);
	const promise = handlePipePromise({...normalizedInfo, destination});
	promise.pipe = pipeToSubprocess.bind(undefined, {...sourceInfo, source: destination, sourcePromise: promise, boundOptions: {}});
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
	startTime,
}) => {
	const subprocessPromises = getSubprocessPromises(sourcePromise, destination);
	handlePipeArgumentsError({
		sourceStream,
		sourceError,
		destinationStream,
		destinationError,
		stdioStreamsGroups,
		sourceOptions,
		startTime,
	});
	const maxListenersController = new AbortController();
	try {
		const mergedStream = pipeSubprocessStream(sourceStream, destinationStream, maxListenersController);
		return await Promise.race([
			waitForBothSubprocesses(subprocessPromises),
			...unpipeOnAbort(unpipeSignal, {sourceStream, mergedStream, sourceOptions, stdioStreamsGroups, startTime}),
		]);
	} finally {
		maxListenersController.abort();
	}
};

// `.pipe()` awaits the subprocess promises.
// When invalid arguments are passed to `.pipe()`, we throw an error, which prevents awaiting them.
// We need to ensure this does not create unhandled rejections.
const getSubprocessPromises = (sourcePromise, destination) => Promise.allSettled([sourcePromise, destination]);
