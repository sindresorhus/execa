import {finished} from 'node:stream/promises';
import mergeStreams from '@sindresorhus/merge-streams';
import {isStandardStream} from './utils.js';

// Like `Stream.pipeline(source, destination)`, but does not destroy standard streams.
// `sources` might be a single stream, or multiple ones combined with `merge-stream`.
export const pipeStreams = (sources, destination) => {
	const finishedStreams = new Set();

	if (sources.length === 1) {
		sources[0].pipe(destination);
	} else {
		const mergedSource = mergeStreams(sources);
		mergedSource.pipe(destination);
		handleDestinationComplete(mergedSource, destination, finishedStreams);
	}

	for (const source of sources) {
		handleSourceAbortOrError(source, destination, finishedStreams);
		handleDestinationComplete(source, destination, finishedStreams);
	}
};

// `source.pipe(destination)` makes `destination` end when `source` ends.
// But it does not propagate aborts or errors. This function does it.
const handleSourceAbortOrError = async (source, destination, finishedStreams) => {
	if (isStandardStream(source) || isStandardStream(destination)) {
		return;
	}

	try {
		await onFinishedStream(source, finishedStreams);
	} catch (error) {
		destroyStream(destination, finishedStreams, error);
	}
};

// The `destination` should never complete before the `source`.
// If it does, this indicates something abnormal, so we abort or error `source`.
const handleDestinationComplete = async (source, destination, finishedStreams) => {
	if (isStandardStream(source) || isStandardStream(destination)) {
		return;
	}

	try {
		await onFinishedStream(destination, finishedStreams);
		destroyStream(source, finishedStreams);
	} catch (error) {
		destroyStream(source, finishedStreams, error);
	}
};

// Both functions above call each other recursively.
// `finishedStreams` prevents this cycle.
const onFinishedStream = async (stream, finishedStreams) => {
	try {
		return await finished(stream, {cleanup: true});
	} finally {
		finishedStreams.add(stream);
	}
};

const destroyStream = (stream, finishedStreams, error) => {
	if (!finishedStreams.has(stream)) {
		stream.destroy(error);
	}
};
