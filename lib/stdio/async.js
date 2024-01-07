import {createReadStream, createWriteStream} from 'node:fs';
import {Readable, Writable} from 'node:stream';
import mergeStreams from '@sindresorhus/merge-streams';
import {handleInput} from './handle.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async mode
export const handleInputAsync = options => handleInput(addPropertiesAsync, options);

const addPropertiesAsync = {
	input: {
		filePath: ({value}) => ({value: createReadStream(value), autoDestroy: true}),
		webStream: ({value}) => ({value: Readable.fromWeb(value), autoDestroy: true}),
		iterable: ({value}) => ({value: Readable.from(value), autoDestroy: true}),
	},
	output: {
		filePath: ({value}) => ({value: createWriteStream(value), autoDestroy: true}),
		webStream: ({value}) => ({value: Writable.fromWeb(value), autoDestroy: true}),
		iterable({optionName}) {
			throw new TypeError(`The \`${optionName}\` option cannot be an iterable.`);
		},
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
		return;
	}

	if (type === 'stringOrBuffer') {
		childStream.end(value);
		return;
	}

	inputStreamsGroups[index] = [...(inputStreamsGroups[index] ?? []), value];
};
