import {isStream as isNodeStream} from 'is-stream';
import {isUint8Array} from '../encoding.js';

// The `stdin`/`stdout`/`stderr` option can be of many types. This detects it.
export const getStdioItemType = (value, optionName) => {
	if (isGenerator(value)) {
		return 'generator';
	}

	if (isUrl(value)) {
		return 'fileUrl';
	}

	if (isFilePathObject(value)) {
		return 'filePath';
	}

	if (isWebStream(value)) {
		return 'webStream';
	}

	if (isNodeStream(value, {checkOpen: false})) {
		return 'native';
	}

	if (isUint8Array(value)) {
		return 'uint8Array';
	}

	if (isIterableObject(value)) {
		return 'iterable';
	}

	if (isGeneratorOptions(value)) {
		return getGeneratorObjectType(value, optionName);
	}

	return 'native';
};

const getGeneratorObjectType = ({transform, final, binary, objectMode}, optionName) => {
	if (transform !== undefined && !isGenerator(transform)) {
		throw new TypeError(`The \`${optionName}.transform\` option must be a generator.`);
	}

	if (final !== undefined && !isGenerator(final)) {
		throw new TypeError(`The \`${optionName}.final\` option must be a generator.`);
	}

	checkBooleanOption(binary, `${optionName}.binary`);
	checkBooleanOption(objectMode, `${optionName}.objectMode`);

	return 'generator';
};

const checkBooleanOption = (value, optionName) => {
	if (value !== undefined && typeof value !== 'boolean') {
		throw new TypeError(`The \`${optionName}\` option must use a boolean.`);
	}
};

const isGenerator = value => isAsyncGenerator(value) || isSyncGenerator(value);
export const isAsyncGenerator = value => Object.prototype.toString.call(value) === '[object AsyncGeneratorFunction]';
const isSyncGenerator = value => Object.prototype.toString.call(value) === '[object GeneratorFunction]';
export const isGeneratorOptions = value => typeof value === 'object'
	&& value !== null
	&& (value.transform !== undefined || value.final !== undefined);

export const isUrl = value => Object.prototype.toString.call(value) === '[object URL]';
export const isRegularUrl = value => isUrl(value) && value.protocol !== 'file:';

const isFilePathObject = value => typeof value === 'object'
	&& value !== null
	&& Object.keys(value).length === 1
	&& isFilePathString(value.file);
export const isFilePathString = file => typeof file === 'string';

export const isUnknownStdioString = (type, value) => type === 'native'
	&& typeof value === 'string'
	&& !KNOWN_STDIO_STRINGS.has(value);
const KNOWN_STDIO_STRINGS = new Set(['ipc', 'ignore', 'inherit', 'overlapped', 'pipe']);

const isReadableStream = value => Object.prototype.toString.call(value) === '[object ReadableStream]';
export const isWritableStream = value => Object.prototype.toString.call(value) === '[object WritableStream]';
const isWebStream = value => isReadableStream(value) || isWritableStream(value);

const isIterableObject = value => typeof value === 'object'
	&& value !== null
	&& (typeof value[Symbol.asyncIterator] === 'function' || typeof value[Symbol.iterator] === 'function');

// Convert types to human-friendly strings for error messages
export const TYPE_TO_MESSAGE = {
	generator: 'a generator',
	fileUrl: 'a file URL',
	filePath: 'a file path string',
	webStream: 'a web stream',
	nodeStream: 'a Node.js stream',
	native: 'any value',
	iterable: 'an iterable',
	string: 'a string',
	uint8Array: 'a Uint8Array',
};
