import {readFileSync} from 'node:fs';
import {isStream as isNodeStream} from 'is-stream';
import {bufferToUint8Array} from './uint-array.js';
import {handleInput} from './handle.js';
import {TYPE_TO_MESSAGE} from './type.js';

// Normalize `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in sync mode
export const handleInputSync = (options, verboseInfo) => {
	const {fileDescriptors} = handleInput(addPropertiesSync, options, verboseInfo, true);
	validateStdioArraysSync(fileDescriptors);
	return fileDescriptors;
};

const forbiddenIfSync = ({type, optionName}) => {
	throwInvalidSyncValue(optionName, TYPE_TO_MESSAGE[type]);
};

const forbiddenNativeIfSync = ({optionName, value}) => {
	if (value === 'ipc') {
		throwInvalidSyncValue(optionName, `"${value}"`);
	}

	return {};
};

const throwInvalidSyncValue = (optionName, value) => {
	throw new TypeError(`The \`${optionName}\` option cannot be ${value} with synchronous methods.`);
};

const addProperties = {
	generator() {},
	asyncGenerator: forbiddenIfSync,
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
