import {finished} from 'node:stream/promises';
import mergeStreams from '@sindresorhus/merge-streams';
import {incrementMaxListeners} from '../utils/max-listeners.js';
import {pipeStreams} from '../io/pipeline.js';

// The piping behavior is like Bash.
// In particular, when one subprocess exits, the other is not terminated by a signal.
// Instead, its stdout (for the source) or stdin (for the destination) closes.
// If the subprocess uses it, it will make it error with SIGPIPE or EPIPE (for the source) or end (for the destination).
// If it does not use it, it will continue running.
// This allows for subprocesses to gracefully exit and lower the coupling between subprocesses.
export const pipeSubprocessStream = (sourceStream, destinationStream, maxListenersController) => {
	const mergedStream = MERGED_STREAMS.has(destinationStream)
		? pipeMoreSubprocessStream(sourceStream, destinationStream)
		: pipeFirstSubprocessStream(sourceStream, destinationStream);
	incrementMaxListeners(sourceStream, SOURCE_LISTENERS_PER_PIPE, maxListenersController.signal);
	incrementMaxListeners(destinationStream, DESTINATION_LISTENERS_PER_PIPE, maxListenersController.signal);
	cleanupMergedStreamsMap(destinationStream);
	return mergedStream;
};

// We use `merge-streams` to allow for multiple sources to pipe to the same destination.
const pipeFirstSubprocessStream = (sourceStream, destinationStream) => {
	const mergedStream = mergeStreams([sourceStream]);
	addMergeSource(mergedStream, sourceStream);
	pipeStreams(mergedStream, destinationStream, () => unpipeSourcesOnDestinationEnd(mergedStream));
	MERGED_STREAMS.set(destinationStream, mergedStream);
	return mergedStream;
};

const pipeMoreSubprocessStream = (sourceStream, destinationStream) => {
	const mergedStream = MERGED_STREAMS.get(destinationStream);
	mergedStream.add(sourceStream);
	addMergeSource(mergedStream, sourceStream);
	return mergedStream;
};

/*
One source stream can be piped to multiple destinations, e.g. `subprocess.pipe(first)` and `subprocess.pipe(second)`.
When a destination ends, its source must only be aborted when it is its last destination, so the other destinations keep receiving data.
Sources with several destinations are then only removed from the ended destination's merge stream, instead of being aborted.
This also holds when a source has been piped to one destination and unpiped from another one.
*/
const MERGE_SOURCES = new WeakMap();
const SOURCE_MERGES = new WeakMap();

const addMergeSource = (mergedStream, sourceStream) => {
	addToSetMap(MERGE_SOURCES, mergedStream, sourceStream);
	addToSetMap(SOURCE_MERGES, sourceStream, mergedStream);
};

const addToSetMap = (map, key, value) => {
	if (!map.has(key)) {
		map.set(key, new Set());
	}

	map.get(key).add(value);
};

// Stop piping a source into a destination, e.g. with the `unpipeSignal` option
export const unpipeSubprocessStream = async (mergedStream, sourceStream) => {
	MERGE_SOURCES.get(mergedStream)?.delete(sourceStream);
	SOURCE_MERGES.get(sourceStream)?.delete(mergedStream);
	await mergedStream.remove(sourceStream);
};

const unpipeSourcesOnDestinationEnd = async mergedStream => {
	for (const sourceStream of MERGE_SOURCES.get(mergedStream)) {
		const mergedStreams = SOURCE_MERGES.get(sourceStream);
		mergedStreams.delete(mergedStream);
		if (mergedStreams.size > 0) {
			// Other destinations still need that source, so it must not be aborted
			// eslint-disable-next-line no-await-in-loop
			await mergedStream.remove(sourceStream);
		}
	}
};

const cleanupMergedStreamsMap = async destinationStream => {
	try {
		await finished(destinationStream, {cleanup: true, readable: false, writable: true});
	} catch {}

	MERGED_STREAMS.delete(destinationStream);
};

const MERGED_STREAMS = new WeakMap();

// Number of listeners set up on `sourceStream` by each `sourceStream.pipe(destinationStream)`
// Those are added by `merge-streams`
const SOURCE_LISTENERS_PER_PIPE = 2;
// Number of listeners set up on `destinationStream` by each `sourceStream.pipe(destinationStream)`
// Those are added by `finished()` in `cleanupMergedStreamsMap()`
const DESTINATION_LISTENERS_PER_PIPE = 1;
