import {readFileSync, writeFileSync} from 'node:fs';
import {bufferToUint8Array, uint8ArrayToString} from '../encoding.js';
import {handleInput} from './handle.js';
import {TYPE_TO_MESSAGE} from './type.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in sync mode
export const handleInputSync = (options, verboseInfo) => {
	const {fileDescriptors} = handleInput(addPropertiesSync, options, verboseInfo, true);
	addInputOptionSync(fileDescriptors, options);
	return fileDescriptors;
};

const forbiddenIfSync = ({type, optionName}) => {
	throw new TypeError(`The \`${optionName}\` option cannot be ${TYPE_TO_MESSAGE[type]} in sync mode.`);
};

const addPropertiesSync = {
	input: {
		generator: forbiddenIfSync,
		fileUrl: ({value}) => ({contents: bufferToUint8Array(readFileSync(value))}),
		filePath: ({value: {file}}) => ({contents: bufferToUint8Array(readFileSync(file))}),
		webStream: forbiddenIfSync,
		nodeStream: forbiddenIfSync,
		iterable: forbiddenIfSync,
		string: ({value}) => ({contents: value}),
		uint8Array: ({value}) => ({contents: value}),
		native() {},
	},
	output: {
		generator: forbiddenIfSync,
		fileUrl: ({value}) => ({path: value}),
		filePath: ({value: {file}}) => ({path: file}),
		webStream: forbiddenIfSync,
		nodeStream: forbiddenIfSync,
		iterable: forbiddenIfSync,
		string: forbiddenIfSync,
		uint8Array: forbiddenIfSync,
		native() {},
	},
};

const addInputOptionSync = (fileDescriptors, options) => {
	const allContents = fileDescriptors
		.filter(({direction}) => direction === 'input')
		.flatMap(({stdioItems}) => stdioItems)
		.map(({contents}) => contents)
		.filter(contents => contents !== undefined);
	if (allContents.length === 0) {
		return;
	}

	options.input = allContents.length === 1
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
