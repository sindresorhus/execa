import {on} from 'node:events';
import {getEncodingTransformGenerator} from '../stdio/encoding-transform.js';
import {getSplitLinesGenerator} from '../stdio/split.js';

export const iterateOnStdout = ({subprocessStdout, subprocess, binary, preserveNewlines, isStream}) => {
	const controller = new AbortController();
	stopReadingOnExit(subprocess, controller);
	const onStdoutChunk = on(subprocessStdout, 'data', {
		signal: controller.signal,
		highWaterMark: HIGH_WATER_MARK,
		// Backward compatibility with older name for this option
		// See https://github.com/nodejs/node/pull/52080#discussion_r1525227861
		// @todo Remove after removing support for Node 21
		highWatermark: HIGH_WATER_MARK,
	});
	const onStdoutData = iterateOnData({subprocessStdout, onStdoutChunk, controller, binary, preserveNewlines, isStream});
	return onStdoutData;
};

const stopReadingOnExit = async (subprocess, controller) => {
	try {
		await subprocess;
	} catch {} finally {
		controller.abort();
	}
};

// @todo: replace with `getDefaultHighWaterMark(true)` after dropping support for Node <18.17.0
export const DEFAULT_OBJECT_HIGH_WATER_MARK = 16;

// The `highWaterMark` of `events.on()` is measured in number of events, not in bytes.
// Not knowing the average amount of bytes per `data` event, we use the same heuristic as streams in objectMode, since they have the same issue.
// Therefore, we use the value of `getDefaultHighWaterMark(true)`.
// Note: this option does not exist on Node 18, but this is ok since the logic works without it. It just consumes more memory.
const HIGH_WATER_MARK = DEFAULT_OBJECT_HIGH_WATER_MARK;

const iterateOnData = async function * ({subprocessStdout, onStdoutChunk, controller, binary, preserveNewlines, isStream}) {
	const {
		encodeChunk = identityGenerator,
		encodeChunkFinal = noopGenerator,
		splitLines = identityGenerator,
		splitLinesFinal = noopGenerator,
	} = getTransforms({subprocessStdout, binary, preserveNewlines, isStream});

	try {
		for await (const [chunk] of onStdoutChunk) {
			yield * handleChunk(encodeChunk, splitLines, chunk);
		}
	} catch (error) {
		if (!controller.signal.aborted) {
			throw error;
		}
	} finally {
		yield * handleFinalChunks(encodeChunkFinal, splitLines, splitLinesFinal);
	}
};

const getTransforms = ({subprocessStdout, binary, preserveNewlines, isStream}) => {
	if (subprocessStdout.readableObjectMode) {
		return {};
	}

	const writableObjectMode = false;

	if (!binary) {
		return getTextTransforms(binary, preserveNewlines, writableObjectMode);
	}

	return isStream ? {} : getBinaryTransforms(writableObjectMode);
};

const getTextTransforms = (binary, preserveNewlines, writableObjectMode) => {
	const encoding = 'utf8';
	const {transform: encodeChunk, final: encodeChunkFinal} = getEncodingTransformGenerator(encoding, writableObjectMode, false);
	const {transform: splitLines, final: splitLinesFinal} = getSplitLinesGenerator({encoding, binary, preserveNewlines, writableObjectMode, state: {}});
	return {encodeChunk, encodeChunkFinal, splitLines, splitLinesFinal};
};

const getBinaryTransforms = writableObjectMode => {
	const encoding = 'buffer';
	const {transform: encodeChunk} = getEncodingTransformGenerator(encoding, writableObjectMode, false);
	return {encodeChunk};
};

const identityGenerator = function * (chunk) {
	yield chunk;
};

const noopGenerator = function * () {};

const handleChunk = function * (encodeChunk, splitLines, chunk) {
	for (const encodedChunk of encodeChunk(chunk)) {
		yield * splitLines(encodedChunk);
	}
};

const handleFinalChunks = function * (encodeChunkFinal, splitLines, splitLinesFinal) {
	for (const encodedChunk of encodeChunkFinal()) {
		yield * splitLines(encodedChunk);
	}

	yield * splitLinesFinal();
};
