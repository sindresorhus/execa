import process from 'node:process';
import {
	isStream as isNodeStream,
	isReadableStream as isNodeReadableStream,
	isWritableStream as isNodeWritableStream,
} from 'is-stream';
import {isWritableStream} from './type.js';

// For `stdio[index]` beyond stdin/stdout/stderr, we need to guess whether the value passed is intended for inputs or outputs.
// This allows us to know whether to pipe _into_ or _from_ the stream.
// When `stdio[index]` is a single value, this guess is fairly straightforward.
// However, when it is an array instead, we also need to make sure the different values are not incompatible with each other.
export const addStreamDirection = stdioStreams => {
	const directions = stdioStreams.map(stdioStream => getStreamDirection(stdioStream));

	if (directions.includes('input') && directions.includes('output')) {
		throw new TypeError(`The \`${stdioStreams[0].optionName}\` option must not be an array of both readable and writable values.`);
	}

	const direction = directions.find(Boolean);
	return stdioStreams.map(stdioStream => addDirection(stdioStream, direction));
};

const getStreamDirection = stdioStream => KNOWN_DIRECTIONS[stdioStream.index] ?? guessStreamDirection[stdioStream.type](stdioStream.value);

// `stdin`/`stdout`/`stderr` have a known direction
const KNOWN_DIRECTIONS = ['input', 'output', 'output'];

// `string` can only be added through the `input` option, i.e. does not need to be handled here
const guessStreamDirection = {
	fileUrl: () => undefined,
	filePath: () => undefined,
	iterable: () => 'input',
	uint8Array: () => 'input',
	webStream: stdioOption => isWritableStream(stdioOption) ? 'output' : 'input',
	nodeStream(stdioOption) {
		if (isNodeReadableStream(stdioOption)) {
			return isNodeWritableStream(stdioOption) ? undefined : 'input';
		}

		return 'output';
	},
	native(stdioOption) {
		if ([0, process.stdin].includes(stdioOption)) {
			return 'input';
		}

		if ([1, 2, process.stdout, process.stderr].includes(stdioOption)) {
			return 'output';
		}

		if (isNodeStream(stdioOption)) {
			return guessStreamDirection.nodeStream(stdioOption);
		}
	},
};

const addDirection = (stdioStream, direction = DEFAULT_DIRECTION) => ({...stdioStream, direction});

// When ambiguous, we initially keep the direction as `undefined`.
// This allows arrays of `stdio` values to resolve the ambiguity.
// For example, `stdio[3]: DuplexStream` is ambiguous, but `stdio[3]: [DuplexStream, WritableStream]` is not.
// When the ambiguity remains, we default to `output` since it is the most common use case for additional file descriptors.
const DEFAULT_DIRECTION = 'output';
