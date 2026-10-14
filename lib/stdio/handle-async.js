import {createReadStream, createWriteStream} from 'node:fs';
import {Buffer} from 'node:buffer';
import {Readable, Writable, Duplex} from 'node:stream';
import {generatorToStream} from '../transform/generator.js';
import {getInputEncoding} from '../arguments/encoding-option.js';
import {isSerializableInput, throwOnSerializableInput} from '../io/input-sync.js';
import {handleStdio} from './handle.js';
import {TYPE_TO_MESSAGE} from './type.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async mode
export const handleStdioAsync = (options, verboseInfo) => handleStdio(addPropertiesAsync, options, verboseInfo, false);

const forbiddenIfAsync = ({type, optionName}) => {
	throw new TypeError(`The \`${optionName}\` option cannot be ${TYPE_TO_MESSAGE[type]}.`);
};

// Create streams used internally for piping when using specific values for the `std*` options, in async mode.
// For example, `stdout: {file}` creates a file stream, which is piped from/to.
const addProperties = {
	fileNumber: forbiddenIfAsync,
	generator: generatorToStream,
	asyncGenerator: generatorToStream,
	nodeStream: ({value}) => ({stream: value}),
	// `Duplex.fromWeb()` uses the same `objectMode` for both sides
	webTransform: ({value: {transform, writableObjectMode, readableObjectMode}}) => ({
		stream: Duplex.from({
			writable: Writable.fromWeb(transform.writable, {objectMode: writableObjectMode}),
			readable: Readable.fromWeb(transform.readable, {objectMode: readableObjectMode}),
		}),
	}),
	duplex: ({value: {transform}}) => ({stream: transform}),
	native() {},
};

// Without transforms in object mode, iterable values are written to the subprocess, which only accepts strings and Uint8Arrays.
// `Readable.from()` emits the values of synchronous iterables on a later tick, where `subprocess.stdin.write()` throwing would crash the current process. Throwing while iterating errors the stream instead.
// Synchronous iterables must stay synchronous, otherwise their order would change when they are combined with other input sources.
const validateIterable = function * (iterable, optionName) {
	for (const value of iterable) {
		validateIterableValue(value, optionName);
		yield value;
	}
};

const validateAsyncIterable = async function * (iterable, optionName) {
	for await (const value of iterable) {
		validateIterableValue(value, optionName);
		yield value;
	}
};

const validateIterableValue = (value, optionName) => {
	if (!isSerializableInput(value)) {
		throwOnSerializableInput(optionName, value);
	}
};

// Empty input is not passed as a chunk, otherwise binary transforms, which do not split lines, would run on it
const readableFromChunk = chunk => Readable.from(chunk.length === 0 ? [] : [chunk]);

// Input transforms use UTF-8 with text encodings, since those only apply to the output
const generatorToInputStream = (stdioItem, {encoding}) => generatorToStream(stdioItem, {encoding: getInputEncoding(encoding)});

const addPropertiesAsync = {
	input: {
		...addProperties,
		generator: generatorToInputStream,
		asyncGenerator: generatorToInputStream,
		fileUrl: ({value}) => ({stream: createReadStream(value)}),
		filePath: ({value: {file}}) => ({stream: createReadStream(file)}),
		webStream: ({value}, options, objectMode) => ({stream: Readable.fromWeb(value, {objectMode})}),
		iterable: ({value, optionName}, options, objectMode) => ({stream: Readable.from(objectMode ? value : validateIterable(value, optionName))}),
		asyncIterable: ({value, optionName}, options, objectMode) => ({stream: Readable.from(objectMode ? value : validateAsyncIterable(value, optionName))}),
		string: ({value}) => ({stream: readableFromChunk(value)}),
		uint8Array: ({value}) => ({stream: readableFromChunk(Buffer.from(value))}),
	},
	output: {
		...addProperties,
		fileUrl: ({value}) => ({stream: createWriteStream(value)}),
		filePath: ({value: {file, append}}) => ({stream: createWriteStream(file, append ? {flags: 'a'} : {})}),
		// Web writers accept arbitrary chunks, including when a shared writer receives both bytes and objects.
		webStream: ({value}) => ({stream: Writable.fromWeb(value, {objectMode: true})}),
		iterable: forbiddenIfAsync,
		asyncIterable: forbiddenIfAsync,
		string: forbiddenIfAsync,
		uint8Array: forbiddenIfAsync,
	},
};
