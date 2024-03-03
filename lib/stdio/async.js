import {createReadStream, createWriteStream} from 'node:fs';
import {Buffer} from 'node:buffer';
import {Readable, Writable} from 'node:stream';
import mergeStreams from '@sindresorhus/merge-streams';
import {isStandardStream, incrementMaxListeners} from '../utils.js';
import {handleInput} from './handle.js';
import {pipeStreams} from './pipeline.js';
import {TYPE_TO_MESSAGE} from './type.js';
import {generatorToDuplexStream, pipeGenerator} from './generator.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async mode
export const handleInputAsync = (options, verboseInfo) => handleInput(addPropertiesAsync, options, verboseInfo, false);

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
export const pipeOutputAsync = (subprocess, stdioStreamsGroups, stdioState, controller) => {
	stdioState.subprocess = subprocess;
	const inputStreamsGroups = {};

	for (const stdioStreams of stdioStreamsGroups) {
		for (const generatorStream of stdioStreams.filter(({type}) => type === 'generator')) {
			pipeGenerator(subprocess, generatorStream);
		}

		for (const nonGeneratorStream of stdioStreams.filter(({type}) => type !== 'generator')) {
			pipeStdioOption(subprocess, nonGeneratorStream, inputStreamsGroups, controller);
		}
	}

	for (const [fdNumber, inputStreams] of Object.entries(inputStreamsGroups)) {
		const inputStream = inputStreams.length === 1 ? inputStreams[0] : mergeStreams(inputStreams);
		pipeStreams(inputStream, subprocess.stdio[fdNumber]);
	}
};

const pipeStdioOption = (subprocess, {type, value, direction, fdNumber}, inputStreamsGroups, controller) => {
	if (type === 'native') {
		return;
	}

	setStandardStreamMaxListeners(value, controller);

	if (direction === 'output') {
		pipeStreams(subprocess.stdio[fdNumber], value);
	} else {
		inputStreamsGroups[fdNumber] = [...(inputStreamsGroups[fdNumber] ?? []), value];
	}
};

// Multiple subprocesses might be piping from/to `process.std*` at the same time.
// This is not necessarily an error and should not print a `maxListeners` warning.
const setStandardStreamMaxListeners = (stream, {signal}) => {
	if (isStandardStream(stream)) {
		incrementMaxListeners(stream, MAX_LISTENERS_INCREMENT, signal);
	}
};

// `source.pipe(destination)` adds at most 1 listener for each event.
// If `stdin` option is an array, the values might be combined with `merge-streams`.
// That library also listens for `source` end, which adds 1 more listener.
const MAX_LISTENERS_INCREMENT = 2;

// The stream error handling is performed by the piping logic above, which cannot be performed before subprocess spawning.
// If the subprocess spawning fails (e.g. due to an invalid command), the streams need to be manually destroyed.
// We need to create those streams before subprocess spawning, in case their creation fails, e.g. when passing an invalid generator as argument.
// Like this, an exception would be thrown, which would prevent spawning a subprocess.
export const cleanupStdioStreams = stdioStreamsGroups => {
	for (const {value, type} of stdioStreamsGroups.flat()) {
		if (type !== 'native' && !isStandardStream(value)) {
			value.destroy();
		}
	}
};
