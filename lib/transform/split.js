import {getStringEncoding} from '../arguments/encoding-option.js';

// Split chunks line-wise for generators passed to the `std*` options
export const getSplitLinesGenerator = (binary, preserveNewlines, skipped, state) => binary || skipped
	? undefined
	: initializeSplitLines(preserveNewlines, state);

// Same but for synchronous methods
export const splitLinesSync = (chunk, preserveNewlines, objectMode) => objectMode
	? chunk.flatMap(item => splitLinesItemSync(item, preserveNewlines))
	: splitLinesItemSync(chunk, preserveNewlines);

const splitLinesItemSync = (chunk, preserveNewlines) => {
	const {transform, final} = initializeSplitLines(preserveNewlines, {});
	return [...transform(chunk), ...final()];
};

const initializeSplitLines = (preserveNewlines, state) => {
	state.previousChunks = '';
	return {
		transform: splitGenerator.bind(undefined, state, preserveNewlines),
		final: linesFinal.bind(undefined, state),
	};
};

// This imperative logic is much faster than using `String.split()` and uses very low memory.
const splitGenerator = function * (state, preserveNewlines, chunk) {
	if (typeof chunk !== 'string') {
		yield chunk;
		return;
	}

	let {previousChunks} = state;
	let start = -1;

	for (let end = 0; end < chunk.length; end += 1) {
		if (chunk[end] !== '\n') {
			continue;
		}

		// The `\r` of a `\r\n` sequence is stripped further below, once `previousChunks` has been prepended.
		// Otherwise, a `\r\n` sequence split across two chunks would not be detected.
		let line = chunk.slice(start + 1, preserveNewlines ? end + 1 : end);

		if (previousChunks.length > 0) {
			line = concatString(previousChunks, line);
			previousChunks = '';
		}

		yield preserveNewlines ? line : stripCarriageReturn(line, state);
		start = end;
	}

	if (start !== chunk.length - 1) {
		previousChunks = concatString(previousChunks, chunk.slice(start + 1));
	}

	state.previousChunks = previousChunks;
};

const stripCarriageReturn = (line, state) => {
	state.isWindowsNewline = line.endsWith('\r');
	return state.isWindowsNewline ? line.slice(0, -1) : line;
};

const linesFinal = function * ({previousChunks}) {
	if (previousChunks.length > 0) {
		yield previousChunks;
	}
};

// Unless `preserveNewlines: true` is used, we strip the newline of each line.
// This re-adds them after the user `transform` code has run.
// The re-added newline must be encoded with the `encoding` option when the chunk is bytes: a UTF-8 newline would misalign `utf16le` bytes.
export const getAppendNewlineGenerator = ({binary, preserveNewlines, readableObjectMode, state, encoding}) => binary || preserveNewlines || readableObjectMode
	? undefined
	: {transform: appendNewlineGenerator.bind(undefined, state, getStringEncoding(binary, encoding))};

const appendNewlineGenerator = function * ({isWindowsNewline = false}, stringEncoding, chunk) {
	const {unixNewline, windowsNewline, concat} = typeof chunk === 'string'
		? linesStringInfo
		: LINES_BYTES_INFO[stringEncoding];

	if (endsWithNewline(chunk, unixNewline)) {
		yield chunk;
		return;
	}

	const newline = isWindowsNewline ? windowsNewline : unixNewline;
	yield concat(chunk, newline);
};

const endsWithNewline = (chunk, unixNewline) => typeof chunk === 'string'
	? chunk.endsWith(unixNewline)
	: chunk.length >= unixNewline.length
		&& chunk.subarray(-unixNewline.length).every((byte, index) => byte === unixNewline[index]);

const concatString = (firstChunk, secondChunk) => `${firstChunk}${secondChunk}`;

const linesStringInfo = {
	windowsNewline: '\r\n',
	unixNewline: '\n',
	concat: concatString,
};

const concatUint8Array = (firstChunk, secondChunk) => {
	const chunk = new Uint8Array(firstChunk.length + secondChunk.length);
	chunk.set(firstChunk, 0);
	chunk.set(secondChunk, firstChunk.length);
	return chunk;
};

// Only indexed with text encodings, since the `binary` option and binary encodings disable this generator
const LINES_BYTES_INFO = {
	__proto__: null,
	utf8: {
		windowsNewline: new Uint8Array([0x0D, 0x0A]),
		unixNewline: new Uint8Array([0x0A]),
		concat: concatUint8Array,
	},
	utf16le: {
		windowsNewline: new Uint8Array([0x0D, 0x00, 0x0A, 0x00]),
		unixNewline: new Uint8Array([0x0A, 0x00]),
		concat: concatUint8Array,
	},
};
