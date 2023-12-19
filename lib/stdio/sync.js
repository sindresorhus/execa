import {readFileSync, writeFileSync} from 'node:fs';
import {handleInput} from './input.js';
import {TYPE_TO_MESSAGE} from './type.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in sync mode
export const handleInputSync = options => {
	const stdioStreams = handleInput(addPropertiesSync, options);
	addInputOptionSync(stdioStreams, options);
	return stdioStreams;
};

const forbiddenIfSync = ({type, optionName}) => {
	throw new TypeError(`The \`${optionName}\` option cannot be ${TYPE_TO_MESSAGE[type]} in sync mode.`);
};

const addPropertiesSync = {
	input: {
		filePath: ({value}) => ({value: readFileSync(value), type: 'stringOrBuffer'}),
		webStream: forbiddenIfSync,
		nodeStream: forbiddenIfSync,
		iterable: forbiddenIfSync,
	},
	output: {
		webStream: forbiddenIfSync,
		nodeStream: forbiddenIfSync,
		iterable: forbiddenIfSync,
	},
};

const addInputOptionSync = (stdioStreams, options) => {
	const inputValue = stdioStreams.find(({type}) => type === 'stringOrBuffer')?.value;
	if (inputValue !== undefined) {
		options.input = inputValue;
	}
};

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, after spawning, in sync mode
export const pipeOutputSync = (stdioStreams, result) => {
	if (result.output === null) {
		return;
	}

	for (const [index, stdioStream] of stdioStreams.entries()) {
		pipeStdioOptionSync(result.output[index], stdioStream);
	}
};

const pipeStdioOptionSync = (result, {type, value, direction}) => {
	if (result === null || direction === 'input') {
		return;
	}

	if (type === 'filePath') {
		writeFileSync(value, result);
	}
};
