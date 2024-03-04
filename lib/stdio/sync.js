import {readFileSync, writeFileSync} from 'node:fs';
import {bufferToUint8Array, binaryToString} from '../utils.js';
import {handleInput} from './handle.js';
import {TYPE_TO_MESSAGE} from './type.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in sync mode
export const handleInputSync = (options, verboseInfo) => {
	const {stdioStreamsGroups} = handleInput(addPropertiesSync, options, verboseInfo, true);
	addInputOptionSync(stdioStreamsGroups, options);
	return stdioStreamsGroups;
};

const forbiddenIfSync = ({type, optionName}) => {
	throw new TypeError(`The \`${optionName}\` option cannot be ${TYPE_TO_MESSAGE[type]} in sync mode.`);
};

const addPropertiesSync = {
	input: {
		generator: forbiddenIfSync,
		fileUrl: ({value}) => ({value: bufferToUint8Array(readFileSync(value)), type: 'uint8Array'}),
		filePath: ({value}) => ({value: bufferToUint8Array(readFileSync(value.file)), type: 'uint8Array'}),
		webStream: forbiddenIfSync,
		nodeStream: forbiddenIfSync,
		iterable: forbiddenIfSync,
	},
	output: {
		generator: forbiddenIfSync,
		filePath: ({value}) => ({value: value.file}),
		webStream: forbiddenIfSync,
		nodeStream: forbiddenIfSync,
		iterable: forbiddenIfSync,
		uint8Array: forbiddenIfSync,
	},
};

const addInputOptionSync = (stdioStreamsGroups, options) => {
	const inputs = stdioStreamsGroups.flat().filter(({direction, type}) => direction === 'input' && (type === 'string' || type === 'uint8Array'));
	if (inputs.length === 0) {
		return;
	}

	options.input = inputs.length === 1
		? inputs[0].value
		: inputs.map(stdioStream => serializeInput(stdioStream)).join('');
};

const serializeInput = ({type, value}) => type === 'string' ? value : binaryToString(value);

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, after spawning, in sync mode
export const pipeOutputSync = (stdioStreamsGroups, {output}) => {
	if (output === null) {
		return;
	}

	for (const stdioStreams of stdioStreamsGroups) {
		for (const stdioStream of stdioStreams) {
			pipeStdioOptionSync(output[stdioStream.fdNumber], stdioStream);
		}
	}
};

const pipeStdioOptionSync = (result, {type, value, direction}) => {
	if (result === null || direction === 'input') {
		return;
	}

	if (type === 'fileUrl' || type === 'filePath') {
		writeFileSync(value, result);
	}
};
