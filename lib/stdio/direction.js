import process from 'node:process';
import {
	isStream as isNodeStream,
	isReadableStream as isNodeReadableStream,
	isWritableStream as isNodeWritableStream,
} from 'is-stream';
import {isWritableStream} from './type.js';

// For `stdio[fdNumber]` beyond stdin/stdout/stderr, we need to guess whether the value passed is intended for inputs or outputs.
// This allows us to know whether to pipe _into_ or _from_ the stream.
// When `stdio[fdNumber]` is a single value, this guess is fairly straightforward.
// However, when it is an array instead, we also need to make sure the different values are not incompatible with each other.
export const getStreamDirection = ({stdioItems, isStdioArray, fdNumber, optionName}) => {
	const directions = stdioItems.map(stdioItem => getStdioItemDirection(stdioItem, fdNumber, isStdioArray));

	if (directions.includes('input') && directions.includes('output')) {
		throw new TypeError(`The \`${optionName}\` option must not be an array of both readable and writable values.`);
	}

	return directions.find(Boolean) ?? DEFAULT_DIRECTION;
};

const getStdioItemDirection = (stdioItem, fdNumber, isStdioArray) => {
	const knownDirection = KNOWN_DIRECTIONS[fdNumber];
	const direction = getRequestedDirection(stdioItem);
	if (knownDirection === undefined) {
		return direction;
	}

	validateKnownDirection(stdioItem, knownDirection, isStdioArray);
	return knownDirection;
};

// `direction` is set when the user explicitly requests it, e.g. `{value: 'pipe', input: true}`.
// It takes precedence over guessing, but not over the fixed direction of `stdin`/`stdout`/`stderr`.
// The explicitly requested `direction` must not contradict a value that is intrinsically the other direction.
// For example, `{value: writableStream, input: true}` is invalid since a writable value can only be an output.
const getRequestedDirection = ({type, value, direction, optionName}) => {
	const guessedDirection = guessStreamDirection[type](value);
	if (direction === 'input' && guessedDirection === 'output') {
		throw new TypeError(`The \`${optionName}\` option is invalid: \`input: true\` cannot be used with a writable value, which is always an output.`);
	}

	return direction ?? guessedDirection;
};

// `stdin`/`stdout`/`stderr` have a fixed direction, which each value must not contradict.
// Otherwise, asynchronous methods pipe in the wrong direction and crash, e.g. with `dest.end is not a function`.
// Only values whose direction is intrinsic to a stream are checked: other values (e.g. `Uint8Array`) are already
// rejected in the wrong direction when their stream properties are added.
// A single file descriptor 0, 1 or 2, e.g. `stdin: 1`, is passed as is to `child_process.spawn()` instead of being piped by Execa, so it is not checked. Those are often the same terminal, which is both readable and writable.
const validateKnownDirection = ({type, value, optionName}, knownDirection, isStdioArray) => {
	if (!STREAM_TYPES.has(type) || (!isStdioArray && getStandardStreamDirection(value) !== undefined)) {
		return;
	}

	const guessedDirection = guessStreamDirection[type](value);
	if (guessedDirection === undefined || guessedDirection === knownDirection) {
		return;
	}

	const valueName = guessedDirection === 'input' ? 'readable' : 'writable';
	throw new TypeError(`The \`${optionName}\` option is invalid: a ${valueName} value is always an ${guessedDirection}, but \`${optionName}\` is an ${knownDirection}.`);
};

const STREAM_TYPES = new Set(['native', 'nodeStream', 'webStream']);

// `stdin`/`stdout`/`stderr` have a known direction
const KNOWN_DIRECTIONS = ['input', 'output', 'output'];

const anyDirection = () => undefined;
const alwaysInput = () => 'input';

// `string` can only be added through the `input` option, i.e. on `stdin`, so it is always an input
const guessStreamDirection = {
	generator: anyDirection,
	asyncGenerator: anyDirection,
	fileUrl: anyDirection,
	filePath: anyDirection,
	iterable: alwaysInput,
	asyncIterable: alwaysInput,
	uint8Array: alwaysInput,
	string: alwaysInput,
	webStream: value => isWritableStream(value) ? 'output' : 'input',
	nodeStream(value) {
		if (!isNodeReadableStream(value, {checkOpen: false})) {
			return 'output';
		}

		return isNodeWritableStream(value, {checkOpen: false}) ? undefined : 'input';
	},
	webTransform: anyDirection,
	duplex: anyDirection,
	native(value) {
		const standardStreamDirection = getStandardStreamDirection(value);
		if (standardStreamDirection !== undefined) {
			return standardStreamDirection;
		}

		if (isNodeStream(value, {checkOpen: false})) {
			return guessStreamDirection.nodeStream(value);
		}
	},
};

const getStandardStreamDirection = value => {
	if ([0, process.stdin].includes(value)) {
		return 'input';
	}

	if ([1, 2, process.stdout, process.stderr].includes(value)) {
		return 'output';
	}
};

// When ambiguous, we initially keep the direction as `undefined`.
// This allows arrays of `stdio` values to resolve the ambiguity.
// For example, `stdio[3]: DuplexStream` is ambiguous, but `stdio[3]: [DuplexStream, WritableStream]` is not.
// When the ambiguity remains, we default to `output` since it is the most common use case for additional file descriptors.
const DEFAULT_DIRECTION = 'output';
