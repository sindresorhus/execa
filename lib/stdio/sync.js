import {readFileSync, writeFileSync} from 'node:fs';
import {isStream as isNodeStream} from 'is-stream';
import {handleInput} from './handle.js';
import {TYPE_TO_MESSAGE} from './type.js';
import {bufferToUint8Array} from './utils.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in sync mode
export const handleInputSync = options => {
	const stdioStreamsGroups = handleInput(addPropertiesSync, options);
	addInputOptionSync(stdioStreamsGroups, options);
	return stdioStreamsGroups;
};

const forbiddenIfStreamSync = ({value, optionName}) => {
	if (isNodeStream(value)) {
		forbiddenIfSync({type: 'nodeStream', optionName});
	}

	return {};
};

const forbiddenIfSync = ({type, optionName}) => {
	throw new TypeError(`The \`${optionName}\` option cannot be ${TYPE_TO_MESSAGE[type]} in sync mode.`);
};

const addPropertiesSync = {
	input: {
		fileUrl: ({value}) => ({value: bufferToUint8Array(readFileSync(value)), type: 'uint8Array'}),
		filePath: ({value}) => ({value: bufferToUint8Array(readFileSync(value.file)), type: 'uint8Array'}),
		webStream: forbiddenIfSync,
		nodeStream: forbiddenIfSync,
		iterable: forbiddenIfSync,
		native: forbiddenIfStreamSync,
	},
	output: {
		filePath: ({value}) => ({value: value.file}),
		webStream: forbiddenIfSync,
		nodeStream: forbiddenIfSync,
		iterable: forbiddenIfSync,
		uint8Array: forbiddenIfSync,
		native: forbiddenIfStreamSync,
	},
};

const addInputOptionSync = (stdioStreamsGroups, options) => {
	const inputs = stdioStreamsGroups.flat().filter(({type}) => type === 'string' || type === 'uint8Array');
	if (inputs.length === 0) {
		return;
	}

	options.input = inputs.length === 1
		? inputs[0].value
		: inputs.map(stdioStream => serializeInput(stdioStream)).join('');
};

const serializeInput = ({type, value}) => type === 'string' ? value : new TextDecoder().decode(value);

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, after spawning, in sync mode
export const pipeOutputSync = (stdioStreamsGroups, result) => {
	if (result.output === null) {
		return;
	}

	for (const stdioStreams of stdioStreamsGroups) {
		for (const stdioStream of stdioStreams) {
			pipeStdioOptionSync(result.output[stdioStream.index], stdioStream);
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
