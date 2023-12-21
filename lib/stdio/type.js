import {isAbsolute} from 'node:path';
import {
	isStream as isNodeStream,
	isReadableStream as isNodeReadableStream,
	isWritableStream as isNodeWritableStream,
} from 'is-stream';

// The `stdin`/`stdout`/`stderr` option can be of many types. This detects it.
export const getStdioOptionType = stdioOption => {
	if (isFileUrl(stdioOption) || isFilePath(stdioOption)) {
		return 'filePath';
	}

	if (isWebStream(stdioOption)) {
		return 'webStream';
	}

	if (isNodeStream(stdioOption)) {
		return 'native';
	}

	if (isIterableObject(stdioOption)) {
		return 'iterable';
	}

	return 'native';
};

const isUrlInstance = stdioOption => Object.prototype.toString.call(stdioOption) === '[object URL]';
const hasFileProtocol = url => url.protocol === 'file:';
const isFileUrl = stdioOption => isUrlInstance(stdioOption) && hasFileProtocol(stdioOption);
export const isRegularUrl = stdioOption => isUrlInstance(stdioOption) && !hasFileProtocol(stdioOption);

const stringIsFilePath = stdioOption => stdioOption.startsWith('.') || isAbsolute(stdioOption);
const isFilePath = stdioOption => typeof stdioOption === 'string' && stringIsFilePath(stdioOption);

export const isUnknownStdioString = (type, stdioOption) => type === 'native' && typeof stdioOption === 'string' && !KNOWN_STDIO_STRINGS.has(stdioOption);
const KNOWN_STDIO_STRINGS = new Set(['ipc', 'ignore', 'inherit', 'overlapped', 'pipe']);

const isReadableStream = stdioOption => Object.prototype.toString.call(stdioOption) === '[object ReadableStream]';
const isWritableStream = stdioOption => Object.prototype.toString.call(stdioOption) === '[object WritableStream]';
const isWebStream = stdioOption => isReadableStream(stdioOption) || isWritableStream(stdioOption);

const isIterableObject = stdinOption => typeof stdinOption === 'object'
	&& stdinOption !== null
	&& (typeof stdinOption[Symbol.asyncIterator] === 'function' || typeof stdinOption[Symbol.iterator] === 'function');

// For `stdio[index]` beyond stdin/stdout/stderr, we need to guess whether the value passed is intended for inputs or outputs.
// When ambiguous, we default to `output` since it is the most common use case for additional file descriptors.
// For the same reason, Duplex streams and TransformStreams are considered as outputs.
// `nodeStream` and `stringOrBuffer` types always apply to `stdin`, i.e. missing here.
export const isInputDirection = {
	filePath: () => false,
	webStream: stdioOption => !isWritableStream(stdioOption),
	native: stdioOption => (isNodeReadableStream(stdioOption) && !isNodeWritableStream(stdioOption)) || stdioOption === 0,
	iterable: () => true,
};

// Convert types to human-friendly strings for error messages
export const TYPE_TO_MESSAGE = {
	filePath: 'a file path',
	webStream: 'a web stream',
	nodeStream: 'a Node.js stream',
	native: 'any value',
	iterable: 'an iterable',
	stringOrBuffer: 'a string or Uint8Array',
};
