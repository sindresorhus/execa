import {normalizePipeArguments} from './validate.js';
import {waitForBothProcesses} from './sequence.js';
import {pipeProcessStream} from './streaming.js';
import {unpipeOnAbort} from './abort.js';

// Pipe a process' `stdout`/`stderr`/`stdio` into another process' `stdin`
export const pipeToProcess = (sourceInfo, destination, pipeOptions) => {
	const promise = handlePipePromise(sourceInfo, destination, pipeOptions);
	promise.pipe = pipeToProcess.bind(undefined, {...sourceInfo, spawned: destination});
	return promise;
};

const handlePipePromise = async (sourceInfo, destination, {from, signal} = {}) => {
	const {source, sourceStream, destinationStream} = normalizePipeArguments(destination, from, sourceInfo);
	const maxListenersController = new AbortController();
	try {
		const mergedStream = pipeProcessStream(sourceStream, destinationStream, maxListenersController);
		return await Promise.race([
			waitForBothProcesses(source, destination),
			...unpipeOnAbort(signal, sourceStream, mergedStream, sourceInfo),
		]);
	} finally {
		maxListenersController.abort();
	}
};

export const dummyPipeToProcess = (source, destination) => {
	const promise = Promise.all([source, destination]);
	promise.pipe = dummyPipeToProcess.bind(undefined, promise);
	return promise;
};
