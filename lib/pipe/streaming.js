import {finished} from 'node:stream/promises';
import mergeStreams from '@sindresorhus/merge-streams';
import {incrementMaxListeners} from '../stdio/utils.js';

// The piping behavior is like Bash.
// In particular, when one process exits, the other is not terminated by a signal.
// Instead, its stdout (for the source) or stdin (for the destination) closes.
// If the process uses it, it will make it error with SIGPIPE or EPIPE (for the source) or end (for the destination).
// If it does not use it, it will continue running.
// This allows for processes to gracefully exit and lower the coupling between processes.
export const pipeProcessStream = (sourceStream, destinationStream, maxListenersController) => {
	const mergedStream = MERGED_STREAMS.has(destinationStream)
		? pipeMoreProcessStream(sourceStream, destinationStream)
		: pipeFirstProcessStream(sourceStream, destinationStream);
	incrementMaxListeners(sourceStream, SOURCE_LISTENERS_PER_PIPE, maxListenersController.signal);
	return mergedStream;
};

// We use `merge-streams` to allow for multiple sources to pipe to the same destination.
const pipeFirstProcessStream = (sourceStream, destinationStream) => {
	const mergedStream = mergeStreams([sourceStream]);
	mergedStream.pipe(destinationStream, {end: false});

	onSourceStreamFinish(mergedStream, destinationStream);
	onDestinationStreamFinish(mergedStream, destinationStream);
	MERGED_STREAMS.set(destinationStream, mergedStream);
	return mergedStream;
};

const pipeMoreProcessStream = (sourceStream, destinationStream) => {
	const mergedStream = MERGED_STREAMS.get(destinationStream);
	mergedStream.add(sourceStream);
	return mergedStream;
};

const onSourceStreamFinish = async (mergedStream, destinationStream) => {
	try {
		await finished(mergedStream, {cleanup: true, readable: true, writable: false});
	} catch {}

	endDestinationStream(destinationStream);
};

export const endDestinationStream = destinationStream => {
	if (destinationStream.writable) {
		destinationStream.end();
	}
};

const onDestinationStreamFinish = async (mergedStream, destinationStream) => {
	try {
		await finished(destinationStream, {cleanup: true, readable: false, writable: true});
	} catch {}

	abortSourceStream(mergedStream);
	MERGED_STREAMS.delete(destinationStream);
};

export const abortSourceStream = mergedStream => {
	if (mergedStream.readable) {
		mergedStream.destroy();
	}
};

const MERGED_STREAMS = new WeakMap();

// Number of listeners set up on `sourceStream` by each `sourceStream.pipe(destinationStream)`
// Those are added by `merge-streams`
const SOURCE_LISTENERS_PER_PIPE = 2;
