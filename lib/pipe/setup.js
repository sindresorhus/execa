import isPlainObject from 'is-plain-obj';
import {SUBPROCESS_OPTIONS} from '../arguments/fd-options.js';
import {initializeConcurrentStreams} from '../convert/concurrent.js';
import {createIterable} from '../convert/iterable.js';
import {createReadable} from '../convert/readable.js';
import {createReadableStream} from '../convert/web.js';
import {internalGetOneMessageOptions} from '../ipc/get-one.js';
import {internalGetEachMessageOptions} from '../ipc/get-each.js';
import {normalizePipeArguments} from './pipe-arguments.js';
import {handlePipeArgumentsError} from './throw.js';
import {waitForBothSubprocesses} from './sequence.js';
import {pipeSubprocessStream} from './streaming.js';
import {unpipeOnAbort} from './abort.js';

// Pipe a subprocess' `stdout`/`stderr`/`stdio` into another subprocess' `stdin`
export const pipeToSubprocess = (sourceInfo, ...pipeArguments) => {
	if (isPlainObject(pipeArguments[0])) {
		return pipeToSubprocess.bind(undefined, {
			...sourceInfo,
			boundOptions: {...sourceInfo.boundOptions, ...pipeArguments[0]},
		});
	}

	const {destination, ...normalizedInfo} = normalizePipeArguments(sourceInfo, ...pipeArguments);
	const pipeFailureController = new AbortController();
	const promise = handlePipePromise({...normalizedInfo, destination, pipeFailureController});
	promise.pipe = pipeToSubprocess.bind(undefined, {
		...sourceInfo,
		source: destination,
		sourcePromise: promise,
		boundOptions: {},
	});
	forwardDestinationMethods(promise, destination, pipeFailureController.signal);
	return promise;
};

/*
The return value of `.pipe()` exposes the destination subprocess' output, but its iteration and stream conversion methods must await the whole pipe so source failures are propagated too. The destination is `undefined` when `.pipe()` was passed invalid arguments, in which case the promise rejects and there is nothing to forward.
*/
const forwardDestinationMethods = (promise, destination, pipeFailureSignal) => {
	if (destination === undefined) {
		return;
	}

	forwardReadableMethods(promise, destination);
	forwardIpcMethods(promise, destination, pipeFailureSignal);
};

const forwardReadableMethods = (promise, destination) => {
	const subprocessOptions = SUBPROCESS_OPTIONS.get(destination);
	SUBPROCESS_OPTIONS.set(promise, subprocessOptions);
	promise.stdio = destination.stdio;
	promise.all = destination.all;

	const {options: {encoding}} = subprocessOptions;
	const concurrentStreams = initializeConcurrentStreams();
	promise[Symbol.asyncIterator] = createIterable.bind(undefined, promise, encoding, {});
	promise.iterable = createIterable.bind(undefined, promise, encoding);
	promise.readable = createPipeReadable.bind(undefined, promise, {
		subprocess: promise,
		concurrentStreams,
		encoding,
	});
	promise.readableStream = createReadableStream.bind(undefined, promise);
	forwardAll(promise, destination);
};

const forwardAll = (promise, destination) => {
	if (destination.all === undefined) {
		promise.all = undefined;
		return;
	}

	Object.defineProperty(promise, 'all', {
		get() {
			setAllProperty(promise, destination.all);
			const all = promise.readable({from: 'all'});
			setAllProperty(promise, all);
			return all;
		},
		enumerable: true,
		configurable: true,
	});
};

const setAllProperty = (promise, value) => {
	Object.defineProperty(promise, 'all', {
		value,
		writable: true,
		enumerable: true,
		configurable: true,
	});
};

const createPipeReadable = (promise, readableOptions, ...arguments_) => {
	const readable = createReadable(readableOptions, ...arguments_);
	destroyOnPipeFailure(promise, readable);
	return readable;
};

const destroyOnPipeFailure = async (promise, readable) => {
	try {
		await promise;
	} catch (error) {
		readable.destroy(error);
	}
};

const forwardIpcMethods = (promise, destination, pipeFailureSignal) => {
	promise.sendMessage = destination.sendMessage;
	promise.getOneMessage = getOnePipeMessage.bind(undefined, destination, pipeFailureSignal);
	promise.getEachMessage = getEachPipeMessage.bind(undefined, promise, destination, pipeFailureSignal);
};

const getOnePipeMessage = (destination, pipeFailureSignal, ...arguments_) => {
	const controller = new AbortController();
	const messagePromise = destination.getOneMessage(...addPipeOptions(arguments_, controller.signal, internalGetOneMessageOptions));
	return waitForOnePipeMessage(pipeFailureSignal, messagePromise, controller);
};

const waitForOnePipeMessage = async (pipeFailureSignal, messagePromise, controller) => {
	try {
		return await Promise.race([messagePromise, getSignalRejection(pipeFailureSignal, controller.signal)]);
	} finally {
		controller.abort();
	}
};

const getSignalRejection = (signal, listenerSignal) => new Promise((_, reject) => {
	if (signal.aborted) {
		reject(signal.reason);
		return;
	}

	signal.addEventListener('abort', () => {
		reject(signal.reason);
	}, {once: true, signal: listenerSignal});
});

const getEachPipeMessage = (promise, destination, pipeFailureSignal, ...arguments_) => {
	const controller = new AbortController();
	// Create the destination iterator before awaiting the pipe so option validation stays synchronous.
	const iterator = destination.getEachMessage(...addPipeOptions(arguments_, controller.signal, internalGetEachMessageOptions));
	abortOnSignal(pipeFailureSignal, controller);
	return iterateOnPipeMessages(promise, iterator, controller);
};

const iterateOnPipeMessages = async function * (promise, iterator, controller) {
	try {
		yield * iterator;
	} finally {
		controller.abort();
		await promise;
	}
};

const addPipeOptions = (arguments_, signal, internalOptionsSymbol) => {
	if (arguments_[0] === null) {
		// Preserve the public validation error from `getEachMessage(null)` instead of masking it with a pipe failure.
		return arguments_;
	}

	const [options] = arguments_;
	// The returned pipe promise is awaited by the forwarded IPC iterator, so the destination IPC iterator must not also await the destination subprocess on close.
	return [{...options, [internalOptionsSymbol]: {signal, shouldAwait: false}}];
};

const abortOnSignal = (signal, controller) => {
	if (signal.aborted) {
		controller.abort();
		return;
	}

	// Interrupt pending IPC reads when the pipe rejects, including `unpipeSignal` cancellation while the destination keeps running.
	signal.addEventListener('abort', () => {
		controller.abort();
	}, {once: true, signal: controller.signal});
};

// `writable()`, `duplex()`, `writableStream()` and `transformStream()` are intentionally not forwarded: they write to the destination's `stdin`, which is already being piped from the source.

// Asynchronous logic when piping subprocesses
const handlePipePromise = async ({
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
	pipeFailureController,
}) => {
	const maxListenersController = new AbortController();
	try {
		const subprocessPromises = getSubprocessPromises(sourcePromise, destination);
		handlePipeArgumentsError({
			sourceStream,
			sourceError,
			destinationStream,
			destinationError,
			fileDescriptors,
			sourceOptions,
			startTime,
		});
		const mergedStream = pipeSubprocessStream(sourceStream, destinationStream, maxListenersController);
		return await Promise.race([
			waitForBothSubprocesses(subprocessPromises),
			...unpipeOnAbort(unpipeSignal, {
				sourceStream,
				mergedStream,
				sourceOptions,
				fileDescriptors,
				startTime,
			}),
		]);
	} catch (error) {
		pipeFailureController.abort(error);
		throw error;
	} finally {
		maxListenersController.abort();
	}
};

// `.pipe()` awaits the subprocess promises.
// When invalid arguments are passed to `.pipe()`, we throw an error, which prevents awaiting them.
// We need to ensure this does not create unhandled rejections.
const getSubprocessPromises = (sourcePromise, destination) => Promise.allSettled([sourcePromise, destination]);
