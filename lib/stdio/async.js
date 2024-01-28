import {addAbortListener} from 'node:events';
import {createReadStream, createWriteStream} from 'node:fs';
import {Buffer} from 'node:buffer';
import {Readable, Writable} from 'node:stream';
import {handleInput} from './handle.js';
import {pipeStreams} from './pipeline.js';
import {TYPE_TO_MESSAGE} from './type.js';
import {generatorToDuplexStream, pipeGenerator} from './generator.js';
import {isStandardStream} from './utils.js';

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
export const pipeOutputAsync = (spawned, stdioStreamsGroups, controller) => {
	const inputStreamsGroups = {};

	for (const stdioStreams of stdioStreamsGroups) {
		for (const generatorStream of stdioStreams.filter(({type}) => type === 'generator')) {
			pipeGenerator(spawned, generatorStream);
		}

		for (const nonGeneratorStream of stdioStreams.filter(({type}) => type !== 'generator')) {
			pipeStdioOption(spawned, nonGeneratorStream, inputStreamsGroups, controller);
		}
	}

	for (const [index, inputStreams] of Object.entries(inputStreamsGroups)) {
		pipeStreams(inputStreams, spawned.stdio[index]);
	}
};

const pipeStdioOption = (spawned, {type, value, direction, index}, inputStreamsGroups, controller) => {
	if (type === 'native') {
		return;
	}

	setStandardStreamMaxListeners(value, controller);

	if (direction === 'output') {
		pipeStreams([spawned.stdio[index]], value);
	} else {
		inputStreamsGroups[index] = [...(inputStreamsGroups[index] ?? []), value];
	}
};

// Multiple processes might be piping from/to `process.std*` at the same time.
// This is not necessarily an error and should not print a `maxListeners` warning.
const setStandardStreamMaxListeners = (stream, {signal}) => {
	if (!isStandardStream(stream)) {
		return;
	}

	const maxListeners = stream.getMaxListeners();
	if (maxListeners === 0 || maxListeners === Number.POSITIVE_INFINITY) {
		return;
	}

	stream.setMaxListeners(maxListeners + maxListenersIncrement);
	addAbortListener(signal, () => {
		stream.setMaxListeners(stream.getMaxListeners() - maxListenersIncrement);
	});
};

// `source.pipe(destination)` adds at most 1 listener for each event.
// If `stdin` option is an array, the values might be combined with `merge-streams`.
// That library also listens for `source` end, which adds 1 more listener.
const maxListenersIncrement = 2;

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
