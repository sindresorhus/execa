import {on} from 'node:events';
import {getEncodingTransformGenerator} from '../stdio/encoding-transform.js';
import {getSplitLinesGenerator} from '../stdio/split.js';

// Iterate over lines of `subprocess.stdout`, used by `subprocess.readable|duplex|iterable()`
export const iterateOnSubprocessStream = ({subprocessStdout, subprocess, binary, shouldEncode, preserveNewlines}) => {
	const controller = new AbortController();
	stopReadingOnExit(subprocess, controller);
	return iterateOnStream({
		stream: subprocessStdout,
		controller,
		writableObjectMode: subprocessStdout.readableObjectMode,
		binary,
		shouldEncode,
		shouldSplit: true,
		preserveNewlines,
	});
};

const stopReadingOnExit = async (subprocess, controller) => {
	try {
		await subprocess;
	} catch {} finally {
		controller.abort();
	}
};

// Iterate over lines of `subprocess.stdout`, used by `result.stdout` + `lines: true` option
export const iterateForResult = ({stream, onStreamEnd, lines, encoding, stripFinalNewline}) => {
	const controller = new AbortController();
	stopReadingOnStreamEnd(controller, onStreamEnd);
	return iterateOnStream({
		stream,
		controller,
		writableObjectMode: false,
		binary: encoding === 'buffer',
		shouldEncode: true,
		shouldSplit: lines,
		preserveNewlines: !stripFinalNewline,
	});
};

const stopReadingOnStreamEnd = async (controller, onStreamEnd) => {
	try {
		await onStreamEnd;
	} catch {} finally {
		controller.abort();
	}
};

const iterateOnStream = ({stream, controller, writableObjectMode, binary, shouldEncode, shouldSplit, preserveNewlines}) => {
	const onStdoutChunk = on(stream, 'data', {
		signal: controller.signal,
		highWaterMark: HIGH_WATER_MARK,
		// Backward compatibility with older name for this option
		// See https://github.com/nodejs/node/pull/52080#discussion_r1525227861
		// @todo Remove after removing support for Node 21
		highWatermark: HIGH_WATER_MARK,
	});
	return iterateOnData({onStdoutChunk, controller, writableObjectMode, binary, shouldEncode, shouldSplit, preserveNewlines});
};

// @todo: replace with `getDefaultHighWaterMark(true)` after dropping support for Node <18.17.0
export const DEFAULT_OBJECT_HIGH_WATER_MARK = 16;

// The `highWaterMark` of `events.on()` is measured in number of events, not in bytes.
// Not knowing the average amount of bytes per `data` event, we use the same heuristic as streams in objectMode, since they have the same issue.
// Therefore, we use the value of `getDefaultHighWaterMark(true)`.
// Note: this option does not exist on Node 18, but this is ok since the logic works without it. It just consumes more memory.
const HIGH_WATER_MARK = DEFAULT_OBJECT_HIGH_WATER_MARK;

const iterateOnData = async function * ({onStdoutChunk, controller, writableObjectMode, binary, shouldEncode, shouldSplit, preserveNewlines}) {
	const {encodeChunk, encodeChunkFinal, splitLines, splitLinesFinal} = getTransforms({writableObjectMode, binary, shouldEncode, shouldSplit, preserveNewlines});

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

const getTransforms = ({writableObjectMode, binary, shouldEncode, shouldSplit, preserveNewlines}) => {
	const {
		transform: encodeChunk = identityGenerator,
		final: encodeChunkFinal = noopGenerator,
	} = getEncodingTransformGenerator(binary, writableObjectMode || !shouldEncode) ?? {};
	const {
		transform: splitLines = identityGenerator,
		final: splitLinesFinal = noopGenerator,
	} = getSplitLinesGenerator(binary, preserveNewlines, writableObjectMode || !shouldSplit, {}) ?? {};
	return {encodeChunk, encodeChunkFinal, splitLines, splitLinesFinal};
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
