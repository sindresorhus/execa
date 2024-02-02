import {createReadStream, createWriteStream} from 'node:fs';
import {Buffer} from 'node:buffer';
import {Readable, Writable} from 'node:stream';
import mergeStreams from '@sindresorhus/merge-streams';
import {handleInput} from './handle.js';
import {TYPE_TO_MESSAGE} from './type.js';
import {generatorToDuplexStream, pipeGenerator} from './generator.js';
import {pipeStreams, isStandardStream} from './utils.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async mode
export const handleInputAsync = options => handleInput(addPropertiesAsync, options, false);

const forbiddenIfAsync = ({type, optionName}) => {
	throw new TypeError(`The \`${optionName}\` option cannot be ${TYPE_TO_MESSAGE[type]}.`);
};

const addPropertiesAsync = {
	input: {
		generator: generatorToDuplexStream,
		fileUrl: ({value}) => ({value: createReadStream(value)}),
		filePath: ({value}) => ({value: createReadStream(value.file)}),
		webStream: ({value}) => ({value: Readable.fromWeb(value)}),
		iterable: ({value}) => ({value: Readable.from(value)}),
		string: ({value}) => ({value: Readable.from(value)}),
		uint8Array: ({value}) => ({value: Readable.from(Buffer.from(value))}),
	},
	output: {
		generator: generatorToDuplexStream,
		fileUrl: ({value}) => ({value: createWriteStream(value)}),
		filePath: ({value}) => ({value: createWriteStream(value.file)}),
		webStream: ({value}) => ({value: Writable.fromWeb(value)}),
		iterable: forbiddenIfAsync,
		uint8Array: forbiddenIfAsync,
	},
};

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, after spawning, in async mode
// When multiple input streams are used, we merge them to ensure the output stream ends only once each input stream has ended
export const pipeOutputAsync = (spawned, stdioStreamsGroups) => {
	const inputStreamsGroups = {};

	for (const stdioStreams of stdioStreamsGroups) {
		for (const generatorStream of stdioStreams.filter(({type}) => type === 'generator')) {
			pipeGenerator(spawned, generatorStream);
		}

		for (const nonGeneratorStream of stdioStreams.filter(({type}) => type !== 'generator')) {
			pipeStdioOption(spawned, nonGeneratorStream, inputStreamsGroups);
		}
	}

	for (const [index, inputStreams] of Object.entries(inputStreamsGroups)) {
		const value = inputStreams.length === 1 ? inputStreams[0] : mergeStreams(inputStreams);
		pipeStreams(value, spawned.stdio[index]);
	}
};

const pipeStdioOption = (spawned, {type, value, direction, index}, inputStreamsGroups) => {
	if (type === 'native') {
		return;
	}

	if (direction === 'output') {
		pipeStreams(spawned.stdio[index], value);
	} else {
		inputStreamsGroups[index] = [...(inputStreamsGroups[index] ?? []), value];
	}
};

// The stream error handling is performed by the piping logic above, which cannot be performed before process spawning.
// If the process spawning fails (e.g. due to an invalid command), the streams need to be manually destroyed.
// We need to create those streams before process spawning, in case their creation fails, e.g. when passing an invalid generator as argument.
// Like this, an exception would be thrown, which would prevent spawning a process.
export const cleanupStdioStreams = stdioStreamsGroups => {
	for (const {value, type} of stdioStreamsGroups.flat()) {
		if (type !== 'native' && !isStandardStream(value)) {
			value.destroy();
		}
	}
};
