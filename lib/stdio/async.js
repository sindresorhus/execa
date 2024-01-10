import {createReadStream, createWriteStream} from 'node:fs';
import {Buffer} from 'node:buffer';
import {Readable, Writable} from 'node:stream';
import mergeStreams from '@sindresorhus/merge-streams';
import {handleInput} from './handle.js';
import {TYPE_TO_MESSAGE} from './type.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async mode
export const handleInputAsync = options => handleInput(addPropertiesAsync, options);

const forbiddenIfAsync = ({type, optionName}) => {
	throw new TypeError(`The \`${optionName}\` option cannot be ${TYPE_TO_MESSAGE[type]}.`);
};

const addPropertiesAsync = {
	input: {
		filePath: ({value}) => ({value: createReadStream(value)}),
		webStream: ({value}) => ({value: Readable.fromWeb(value)}),
		iterable: ({value}) => ({value: Readable.from(value)}),
		string: ({value}) => ({value: Readable.from(value)}),
		uint8Array: ({value}) => ({value: Readable.from(Buffer.from(value))}),
	},
	output: {
		filePath: ({value}) => ({value: createWriteStream(value)}),
		webStream: ({value}) => ({value: Writable.fromWeb(value)}),
		iterable: forbiddenIfAsync,
		uint8Array: forbiddenIfAsync,
	},
};

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, after spawning, in async mode
// When multiple input streams are used, we merge them to ensure the output stream ends only once each input stream has ended
export const pipeOutputAsync = (spawned, stdioStreams) => {
	const inputStreamsGroups = {};

	for (const stdioStream of stdioStreams) {
		pipeStdioOption(spawned.stdio[stdioStream.index], stdioStream, inputStreamsGroups);
	}

	for (const [index, inputStreams] of Object.entries(inputStreamsGroups)) {
		const value = inputStreams.length === 1 ? inputStreams[0] : mergeStreams(inputStreams);
		value.pipe(spawned.stdio[index]);
	}
};

const pipeStdioOption = (childStream, {type, value, direction, index}, inputStreamsGroups) => {
	if (type === 'native') {
		return;
	}

	if (direction === 'output') {
		childStream.pipe(value);
	} else {
		inputStreamsGroups[index] = [...(inputStreamsGroups[index] ?? []), value];
	}
};
