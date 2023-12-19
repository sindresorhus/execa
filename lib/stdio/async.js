import {createReadStream, createWriteStream} from 'node:fs';
import {Readable, Writable} from 'node:stream';
import {handleInput} from './input.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async mode
export const handleInputAsync = options => handleInput(addPropertiesAsync, options);

const addPropertiesAsync = {
	input: {
		filePath: ({value}) => ({value: createReadStream(value)}),
		webStream: ({value}) => ({value: Readable.fromWeb(value)}),
		iterable: ({value}) => ({value: Readable.from(value)}),
	},
	output: {
		filePath: ({value}) => ({value: createWriteStream(value)}),
		webStream: ({value}) => ({value: Writable.fromWeb(value)}),
		iterable({optionName}) {
			throw new TypeError(`The \`${optionName}\` option cannot be an iterable.`);
		},
	},
};

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, after spawning, in async mode
export const pipeOutputAsync = (spawned, stdioStreams) => {
	for (const [index, stdioStream] of stdioStreams.entries()) {
		pipeStdioOption(spawned.stdio[index], stdioStream);
	}
};

const pipeStdioOption = (childStream, {type, value, direction}) => {
	if (type === 'native') {
		return;
	}

	if (direction === 'output') {
		childStream.pipe(value);
		return;
	}

	if (type === 'stringOrBuffer') {
		childStream.end(value);
		return;
	}

	value.pipe(childStream);
};
