import {isAbsolute} from 'node:path';
import {isStream as isNodeStream} from 'is-stream';

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
export const isUnknownStdioString = stdioOption => typeof stdioOption === 'string' && !stringIsFilePath(stdioOption) && !KNOWN_STDIO_STRINGS.has(stdioOption);
const KNOWN_STDIO_STRINGS = new Set(['ipc', 'ignore', 'inherit', 'overlapped', 'pipe']);

const isReadableStream = stdioOption => Object.prototype.toString.call(stdioOption) === '[object ReadableStream]';
const isWritableStream = stdioOption => Object.prototype.toString.call(stdioOption) === '[object WritableStream]';
const isWebStream = stdioOption => isReadableStream(stdioOption) || isWritableStream(stdioOption);

const isIterableObject = stdinOption => typeof stdinOption === 'object'
	&& stdinOption !== null
	&& (typeof stdinOption[Symbol.asyncIterator] === 'function' || typeof stdinOption[Symbol.iterator] === 'function');

// Convert types to human-friendly strings for error messages
export const TYPE_TO_MESSAGE = {
	filePath: 'a file path',
	webStream: 'a web stream',
	nodeStream: 'a Node.js stream',
	native: 'any value',
	iterable: 'an iterable',
	stringOrBuffer: 'a string or Uint8Array',
};
