import {isUint8Array} from '../utils.js';

// Split chunks line-wise for generators passed to the `std*` options
export const getSplitLinesGenerator = ({encoding, binary, newline, writableObjectMode, state}) => {
	if (binary || writableObjectMode) {
		return;
	}

	const info = encoding === 'buffer' ? linesUint8ArrayInfo : linesStringInfo;
	state.previousChunks = info.emptyValue;
	return {
		transform: splitGenerator.bind(undefined, state, newline, info),
		final: linesFinal.bind(undefined, state),
	};
};

const concatUint8Array = (firstChunk, secondChunk) => {
	const chunk = new Uint8Array(firstChunk.length + secondChunk.length);
	chunk.set(firstChunk, 0);
	chunk.set(secondChunk, firstChunk.length);
	return chunk;
};

const linesUint8ArrayInfo = {
	emptyValue: new Uint8Array(0),
	windowsNewline: new Uint8Array([0x0D, 0x0A]),
	unixNewline: new Uint8Array([0x0A]),
	CR: 0x0D,
	LF: 0x0A,
	concatBytes: concatUint8Array,
	isValidType: isUint8Array,
};

const concatString = (firstChunk, secondChunk) => `${firstChunk}${secondChunk}`;
const isString = chunk => typeof chunk === 'string';

const linesStringInfo = {
	emptyValue: '',
	windowsNewline: '\r\n',
	unixNewline: '\n',
	CR: '\r',
	LF: '\n',
	concatBytes: concatString,
	isValidType: isString,
};

const linesInfo = [linesStringInfo, linesUint8ArrayInfo];

// This imperative logic is much faster than using `String.split()` and uses very low memory.
// Also, it allows sharing it with `Uint8Array`.
const splitGenerator = function * (state, newline, {emptyValue, CR, LF, concatBytes}, chunk) {
	let {previousChunks} = state;
	let start = -1;

	for (let end = 0; end < chunk.length; end += 1) {
		if (chunk[end] === LF) {
			const newlineLength = getNewlineLength({chunk, end, CR, newline, state});
			let line = chunk.slice(start + 1, end + 1 - newlineLength);

			if (previousChunks.length > 0) {
				line = concatBytes(previousChunks, line);
				previousChunks = emptyValue;
			}

			yield line;
			start = end;
		}
	}

	if (start !== chunk.length - 1) {
		previousChunks = concatBytes(previousChunks, chunk.slice(start + 1));
	}

	state.previousChunks = previousChunks;
};

const getNewlineLength = ({chunk, end, CR, newline, state}) => {
	if (newline) {
		return 0;
	}

	state.isWindowsNewline = end !== 0 && chunk[end - 1] === CR;
	return state.isWindowsNewline ? 2 : 1;
};

const linesFinal = function * ({previousChunks}) {
	if (previousChunks.length > 0) {
		yield previousChunks;
	}
};

// When `newline: false` is used, we strip the newline of each line.
// This re-adds them after the user `transform` code has run.
export const getAppendNewlineGenerator = ({binary, newline, readableObjectMode, state}) => binary || newline || readableObjectMode
	? undefined
	: {transform: appendNewlineGenerator.bind(undefined, state)};

const appendNewlineGenerator = function * ({isWindowsNewline = false}, chunk) {
	const {unixNewline, windowsNewline, LF, concatBytes} = linesInfo.find(({isValidType}) => isValidType(chunk));

	if (chunk.at(-1) === LF) {
		yield chunk;
		return;
	}

	const newlineString = isWindowsNewline ? windowsNewline : unixNewline;
	yield concatBytes(chunk, newlineString);
};
