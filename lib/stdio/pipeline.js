import {finished} from 'node:stream/promises';
import {setImmediate} from 'node:timers/promises';
import mergeStreams from '@sindresorhus/merge-streams';
import {isStandardStream} from './utils.js';

// Like `Stream.pipeline(source, destination)`, but does not destroy standard streams.
// Also, it prevents some race conditions described below.
// `sources` might be a single stream, or multiple ones combined with `merge-stream`.
export const pipeStreams = (sources, destination, controller) => {
	if (sources.length === 1) {
		sources[0].pipe(destination);
	} else {
		const mergedSource = mergeStreams(sources);
		mergedSource.pipe(destination);
		handleDestinationComplete(mergedSource, destination, controller);
	}

	for (const source of sources) {
		handleSourceAbortOrError(source, destination, controller);
		handleDestinationComplete(source, destination, controller);
	}
};

// `source.pipe(destination)` makes `destination` end when `source` ends.
// But it does not propagate aborts or errors. This function does it.
const handleSourceAbortOrError = async (source, destination, {signal}) => {
	if (isStandardStream(destination)) {
		return;
	}

	try {
		await finished(source, {cleanup: true, signal});
	} catch {
		await destroyStream(destination);
	}
};

// The `destination` should never complete before the `source`.
// If it does, this indicates something abnormal, so we abort `source`.
const handleDestinationComplete = async (source, destination, {signal}) => {
	if (isStandardStream(source)) {
		return;
	}

	try {
		await finished(destination, {cleanup: true, signal});
	} catch {} finally {
		await destroyStream(source);
	}
};

// Propagating errors across different streams in the same pipeline can create race conditions.
// For example, a `Duplex` stream might propagate an error on its writable side and another on its readable side.
// This leads to different errors being thrown at the top-level based on the result of that race condition.
// We solve this by waiting for one macrotask with `setImmediate()`.
const destroyStream = async stream => {
	await setImmediate();
	stream.destroy();
};
