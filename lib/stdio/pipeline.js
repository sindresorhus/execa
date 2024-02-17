import {finished} from 'node:stream/promises';
import mergeStreams from '@sindresorhus/merge-streams';
import {isStreamAbort} from '../wait.js';
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
		handleStreamError(destination, mergedSource, finishedStreams);
	}

	for (const source of sources) {
		handleStreamError(source, destination, finishedStreams);
		handleStreamError(destination, source, finishedStreams);
	}
};

// `source.pipe(destination)` makes `destination` end when `source` ends.
// But it does not propagate aborts or errors. This function does it.
// We do the same thing in the other direction as well.
const handleStreamError = async (stream, otherStream, finishedStreams) => {
	if (isStandardStream(stream) || isStandardStream(otherStream)) {
		return;
	}

	try {
		await onFinishedStream(stream, finishedStreams);
	} catch (error) {
		destroyStream(otherStream, finishedStreams, error);
	}
};

// Both functions above call each other recursively.
// `finishedStreams` prevents this cycle.
const onFinishedStream = async (stream, finishedStreams) => {
	try {
		await finished(stream, {cleanup: true});
	} finally {
		finishedStreams.add(stream);
	}
};

const destroyStream = (stream, finishedStreams, error) => {
	if (finishedStreams.has(stream)) {
		return;
	}

	if (isStreamAbort(error)) {
		stream.destroy();
	} else {
		stream.destroy(error);
	}
};
