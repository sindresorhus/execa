import isPlainObj from 'is-plain-obj';
import {BINARY_ENCODINGS} from '../arguments/encoding.js';
import {generatorsToTransform} from './transform.js';
import {getEncodingTransformGenerator} from './encoding-transform.js';
import {getSplitLinesGenerator, getAppendNewlineGenerator} from './split.js';
import {pipeStreams} from './pipeline.js';
import {isAsyncGenerator} from './type.js';
import {getValidateTransformReturn} from './validate.js';

export const getObjectMode = (stdioItems, direction, options) => {
	const transforms = getTransforms(stdioItems, direction, options);
	if (transforms.length === 0) {
		return false;
	}

	const {value: {readableObjectMode, writableObjectMode}} = transforms.at(-1);
	return direction === 'input' ? writableObjectMode : readableObjectMode;
};

export const normalizeTransforms = (stdioItems, direction, options) => [
	...stdioItems.filter(({type}) => type !== 'generator'),
	...getTransforms(stdioItems, direction, options),
];

const getTransforms = (stdioItems, direction, {encoding}) => {
	const transforms = stdioItems.filter(({type}) => type === 'generator');
	const newTransforms = Array.from({length: transforms.length});

	for (const [index, stdioItem] of Object.entries(transforms)) {
		newTransforms[index] = normalizeTransform({stdioItem, index: Number(index), newTransforms, direction, encoding});
	}

	return sortTransforms(newTransforms, direction);
};

const normalizeTransform = ({stdioItem, stdioItem: {value}, index, newTransforms, direction, encoding}) => {
	const {
		transform,
		final,
		binary: binaryOption = false,
		preserveNewlines = false,
		objectMode,
	} = isPlainObj(value) ? value : {transform: value};
	const binary = binaryOption || BINARY_ENCODINGS.has(encoding);
	const {writableObjectMode, readableObjectMode} = getObjectModes(objectMode, index, newTransforms, direction);
	return {...stdioItem, value: {transform, final, binary, preserveNewlines, writableObjectMode, readableObjectMode}};
};

/*
`objectMode` determines the return value's type, i.e. the `readableObjectMode`.
The chunk argument's type is based on the previous generator's return value, i.e. the `writableObjectMode` is based on the previous `readableObjectMode`.
The last input's generator is read by `subprocess.stdin` which:
- should not be in `objectMode` for performance reasons.
- can only be strings, Buffers and Uint8Arrays.
Therefore its `readableObjectMode` must be `false`.
The same applies to the first output's generator's `writableObjectMode`.
*/
const getObjectModes = (objectMode, index, newTransforms, direction) => direction === 'output'
	? getOutputObjectModes(objectMode, index, newTransforms)
	: getInputObjectModes(objectMode, index, newTransforms);

const getOutputObjectModes = (objectMode, index, newTransforms) => {
	const writableObjectMode = index !== 0 && newTransforms[index - 1].value.readableObjectMode;
	const readableObjectMode = objectMode ?? writableObjectMode;
	return {writableObjectMode, readableObjectMode};
};

const getInputObjectModes = (objectMode, index, newTransforms) => {
	const writableObjectMode = index === 0
		? objectMode === true
		: newTransforms[index - 1].value.readableObjectMode;
	const readableObjectMode = index !== newTransforms.length - 1 && (objectMode ?? writableObjectMode);
	return {writableObjectMode, readableObjectMode};
};

const sortTransforms = (newTransforms, direction) => direction === 'input' ? newTransforms.reverse() : newTransforms;

/*
Generators can be used to transform/filter standard streams.

Generators have a simple syntax, yet allows all of the following:
- Sharing `state` between chunks
- Flushing logic, by using a `final` function
- Asynchronous logic
- Emitting multiple chunks from a single source chunk, even if spaced in time, by using multiple `yield`
- Filtering, by using no `yield`

Therefore, there is no need to allow Node.js or web transform streams.

The `highWaterMark` is kept as the default value, since this is what `subprocess.std*` uses.

Chunks are currently processed serially. We could add a `concurrency` option to parallelize in the future.
*/
export const generatorToDuplexStream = ({
	value: {transform, final, binary, writableObjectMode, readableObjectMode, preserveNewlines},
	forceEncoding,
	optionName,
}) => {
	const state = {};
	const generators = [
		getEncodingTransformGenerator(binary, writableObjectMode, forceEncoding),
		getSplitLinesGenerator({binary, preserveNewlines, writableObjectMode, state}),
		{transform, final},
		{transform: getValidateTransformReturn(readableObjectMode, optionName)},
		getAppendNewlineGenerator({binary, preserveNewlines, readableObjectMode, state}),
	].filter(Boolean);
	const transformAsync = isAsyncGenerator(transform);
	const finalAsync = isAsyncGenerator(final);
	const stream = generatorsToTransform(generators, {transformAsync, finalAsync, writableObjectMode, readableObjectMode});
	return {stream};
};

// `subprocess.stdin|stdout|stderr|stdio` is directly mutated.
export const pipeTransform = (subprocess, stream, direction, fdNumber) => {
	if (direction === 'output') {
		pipeStreams(subprocess.stdio[fdNumber], stream);
	} else {
		pipeStreams(stream, subprocess.stdio[fdNumber]);
	}

	const streamProperty = SUBPROCESS_STREAM_PROPERTIES[fdNumber];
	if (streamProperty !== undefined) {
		subprocess[streamProperty] = stream;
	}

	subprocess.stdio[fdNumber] = stream;
};

const SUBPROCESS_STREAM_PROPERTIES = ['stdin', 'stdout', 'stderr'];
