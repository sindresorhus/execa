import {
	isStream as isNodeStream,
	isReadableStream as isNodeReadableStream,
	isWritableStream as isNodeWritableStream,
} from 'is-stream';
import {isWritableStream} from './type.js';

// For `stdio[index]` beyond stdin/stdout/stderr, we need to guess whether the value passed is intended for inputs or outputs.
// This allows us to know whether to pipe _into_ or _from_ the stream.
export const addStreamDirection = stdioStream => {
	const direction = getStreamDirection(stdioStream);
	return addDirection(stdioStream, direction);
};

const getStreamDirection = stdioStream => KNOWN_DIRECTIONS[stdioStream.index] ?? guessStreamDirection[stdioStream.type](stdioStream.value);

// `stdin`/`stdout`/`stderr` have a known direction
const KNOWN_DIRECTIONS = ['input', 'output', 'output'];

// `stringOrBuffer` type always applies to `stdin`, i.e. does not need to be handled here
const guessStreamDirection = {
	filePath: () => undefined,
	iterable: () => 'input',
	webStream: stdioOption => isWritableStream(stdioOption) ? 'output' : 'input',
	nodeStream(stdioOption) {
		if (isNodeReadableStream(stdioOption)) {
			return isNodeWritableStream(stdioOption) ? undefined : 'input';
		}

		return 'output';
	},
	native(stdioOption) {
		if (isNodeStream(stdioOption)) {
			return guessStreamDirection.nodeStream(stdioOption);
		}
	},
};

const addDirection = (stdioStream, direction = DEFAULT_DIRECTION) => ({...stdioStream, direction});

// When the ambiguity remains, we default to `output` since it is the most common use case for additional file descriptors.
const DEFAULT_DIRECTION = 'output';
