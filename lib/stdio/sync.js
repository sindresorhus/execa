import {readFileSync, writeFileSync} from 'node:fs';
import {isStream as isNodeStream} from 'is-stream';
import {bufferToUint8Array, uint8ArrayToString, isUint8Array} from '../utils.js';
import {handleInput} from './handle.js';
import {TYPE_TO_MESSAGE} from './type.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in sync mode
export const handleInputSync = (options, verboseInfo) => {
	const {fileDescriptors} = handleInput(addPropertiesSync, options, verboseInfo, true);
	validateStdioArraysSync(fileDescriptors);
	addInputOptionsSync(fileDescriptors, options);
	return fileDescriptors;
};

const forbiddenIfSync = ({type, optionName}) => {
	throwInvalidSyncValue(optionName, TYPE_TO_MESSAGE[type]);
};

const forbiddenNativeIfSync = ({optionName, value}) => {
	if (value === 'ipc' || value === 'overlapped') {
		throwInvalidSyncValue(optionName, `"${value}"`);
	}

	return {};
};

const throwInvalidSyncValue = (optionName, value) => {
	throw new TypeError(`The \`${optionName}\` option cannot be ${value} with synchronous methods.`);
};

const addProperties = {
	generator: forbiddenIfSync,
	webStream: forbiddenIfSync,
	nodeStream: forbiddenIfSync,
	webTransform: forbiddenIfSync,
	duplex: forbiddenIfSync,
	asyncIterable: forbiddenIfSync,
	native: forbiddenNativeIfSync,
};

const addPropertiesSync = {
	input: {
		...addProperties,
		fileUrl: ({value}) => ({contents: [bufferToUint8Array(readFileSync(value))]}),
		filePath: ({value: {file}}) => ({contents: [bufferToUint8Array(readFileSync(file))]}),
		iterable: ({value}) => ({contents: [...value]}),
		string: ({value}) => ({contents: [value]}),
		uint8Array: ({value}) => ({contents: [value]}),
	},
	output: {
		...addProperties,
		fileUrl: ({value}) => ({path: value}),
		filePath: ({value: {file}}) => ({path: file}),
		iterable: forbiddenIfSync,
		string: forbiddenIfSync,
		uint8Array: forbiddenIfSync,
	},
};

const validateStdioArraysSync = fileDescriptors => {
	for (const {stdioItems} of fileDescriptors) {
		validateStdioArraySync(stdioItems);
	}
};

const validateStdioArraySync = stdioItems => {
	if (stdioItems.length === 1) {
		return;
	}

	const singleValueName = stdioItems.map(stdioItem => getSingleValueSync(stdioItem)).find(Boolean);
	if (singleValueName === undefined) {
		return;
	}

	const inputOption = stdioItems.find(({optionName}) => OPTION_NAMES.has(optionName));
	if (inputOption !== undefined) {
		throw new TypeError(`The \`${singleValueName}\` and the \`${inputOption.optionName}\` options cannot be both set with synchronous methods.`);
	}

	throw new TypeError(`The \`${singleValueName}\` option cannot be set as an array of values with synchronous methods.`);
};

const getSingleValueSync = ({type, value, optionName}) => {
	if (type !== 'native') {
		return;
	}

	if (value === 'inherit') {
		return `${optionName}: "inherit"`;
	}

	if (typeof value === 'number') {
		return `${optionName}: ${value}`;
	}

	if (isNodeStream(value, {checkOpen: false})) {
		return `${optionName}: Stream`;
	}
};

const OPTION_NAMES = new Set(['input', 'inputFile']);

const addInputOptionsSync = (fileDescriptors, options) => {
	for (const fdNumber of getInputFdNumbers(fileDescriptors)) {
		addInputOptionSync(fileDescriptors, fdNumber, options);
	}
};

const getInputFdNumbers = fileDescriptors => new Set(fileDescriptors
	.filter(({direction}) => direction === 'input')
	.map(({fdNumber}) => fdNumber));

const addInputOptionSync = (fileDescriptors, fdNumber, options) => {
	const allStdioItems = fileDescriptors
		.filter(fileDescriptor => fileDescriptor.fdNumber === fdNumber)
		.flatMap(({stdioItems}) => stdioItems)
		.filter(({contents}) => contents !== undefined);
	if (allStdioItems.length === 0) {
		return;
	}

	if (fdNumber !== 0) {
		const [{type, optionName}] = allStdioItems;
		throw new TypeError(`Only the \`stdin\` option, not \`${optionName}\`, can be ${TYPE_TO_MESSAGE[type]} with synchronous methods.`);
	}

	const allContents = allStdioItems.map(({contents}) => contents);
	options.input = serializeAllContents(allContents.flat());
};

const serializeAllContents = allContents => {
	const invalidContents = allContents.find(contents => typeof contents !== 'string' && !isUint8Array(contents));
	if (invalidContents !== undefined) {
		throw new TypeError(`The \`stdin\` option is invalid: only strings or Uint8Arrays can be yielded from iterables when using the synchronous methods: ${invalidContents}.`);
	}

	return allContents.length === 1
		? allContents[0]
		: allContents.map(contents => serializeContents(contents)).join('');
};

const serializeContents = contents => typeof contents === 'string' ? contents : uint8ArrayToString(contents);

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, after spawning, in sync mode
export const pipeOutputSync = (fileDescriptors, {output}) => {
	if (output === null) {
		return;
	}

	for (const {stdioItems, fdNumber, direction} of fileDescriptors) {
		for (const {type, path} of stdioItems) {
			pipeStdioItemSync(output[fdNumber], type, path, direction);
		}
	}
};

const pipeStdioItemSync = (result, type, path, direction) => {
	if (result === null || direction === 'input') {
		return;
	}

	if (type === 'fileUrl' || type === 'filePath') {
		writeFileSync(path, result);
	}
};
