import {createReadStream, createWriteStream} from 'node:fs';
import {Buffer} from 'node:buffer';
import {Readable, Writable, Duplex} from 'node:stream';
import mergeStreams from '@sindresorhus/merge-streams';
import {isStandardStream, incrementMaxListeners} from '../utils.js';
import {handleInput} from './handle.js';
import {pipeStreams} from './pipeline.js';
import {TYPE_TO_MESSAGE} from './type.js';
import {generatorToDuplexStream, pipeTransform, TRANSFORM_TYPES} from './generator.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async mode
export const handleInputAsync = (options, verboseInfo) => handleInput(addPropertiesAsync, options, verboseInfo, false);

const forbiddenIfAsync = ({type, optionName}) => {
	throw new TypeError(`The \`${optionName}\` option cannot be ${TYPE_TO_MESSAGE[type]}.`);
};

const addProperties = {
	generator: generatorToDuplexStream,
	asyncGenerator: generatorToDuplexStream,
	nodeStream: ({value}) => ({stream: value}),
	webTransform({value: {transform, writableObjectMode, readableObjectMode}}) {
		const objectMode = writableObjectMode || readableObjectMode;
		const stream = Duplex.fromWeb(transform, {objectMode});
		return {stream};
	},
	duplex: ({value: {transform}}) => ({stream: transform}),
	native() {},
};

const addPropertiesAsync = {
	input: {
		...addProperties,
		fileUrl: ({value}) => ({stream: createReadStream(value)}),
		filePath: ({value: {file}}) => ({stream: createReadStream(file)}),
		webStream: ({value}) => ({stream: Readable.fromWeb(value)}),
		iterable: ({value}) => ({stream: Readable.from(value)}),
		asyncIterable: ({value}) => ({stream: Readable.from(value)}),
		string: ({value}) => ({stream: Readable.from(value)}),
		uint8Array: ({value}) => ({stream: Readable.from(Buffer.from(value))}),
	},
	output: {
		...addProperties,
		fileUrl: ({value}) => ({stream: createWriteStream(value)}),
		filePath: ({value: {file}}) => ({stream: createWriteStream(file)}),
		webStream: ({value}) => ({stream: Writable.fromWeb(value)}),
		iterable: forbiddenIfAsync,
		asyncIterable: forbiddenIfAsync,
		string: forbiddenIfAsync,
		uint8Array: forbiddenIfAsync,
	},
};

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, after spawning, in async mode
// When multiple input streams are used, we merge them to ensure the output stream ends only once each input stream has ended
export const pipeOutputAsync = (subprocess, fileDescriptors, controller) => {
	const inputStreamsGroups = {};

	for (const [fdNumber, {stdioItems, direction}] of Object.entries(fileDescriptors)) {
		for (const {stream} of stdioItems.filter(({type}) => TRANSFORM_TYPES.has(type))) {
			pipeTransform(subprocess, stream, direction, fdNumber);
		}

		for (const {stream} of stdioItems.filter(({type}) => !TRANSFORM_TYPES.has(type))) {
			pipeStdioItem({subprocess, stream, direction, fdNumber, inputStreamsGroups, controller});
		}
	}

	for (const [fdNumber, inputStreams] of Object.entries(inputStreamsGroups)) {
		const inputStream = inputStreams.length === 1 ? inputStreams[0] : mergeStreams(inputStreams);
		pipeStreams(inputStream, subprocess.stdio[fdNumber]);
	}
};

const pipeStdioItem = ({subprocess, stream, direction, fdNumber, inputStreamsGroups, controller}) => {
	if (stream === undefined) {
		return;
	}

	setStandardStreamMaxListeners(stream, controller);

	if (direction === 'output') {
		pipeStreams(subprocess.stdio[fdNumber], stream);
	} else {
		inputStreamsGroups[fdNumber] = [...(inputStreamsGroups[fdNumber] ?? []), stream];
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
export const cleanupCustomStreams = fileDescriptors => {
	for (const {stdioItems} of fileDescriptors) {
		for (const {stream} of stdioItems) {
			if (stream !== undefined && !isStandardStream(stream)) {
				stream.destroy();
			}
		}
	}
};
