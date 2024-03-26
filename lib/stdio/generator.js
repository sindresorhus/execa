import {BINARY_ENCODINGS} from '../arguments/encoding.js';
import {generatorsToTransform} from './transform.js';
import {getEncodingTransformGenerator} from './encoding-transform.js';
import {getSplitLinesGenerator, getAppendNewlineGenerator} from './split.js';
import {pipeStreams} from './pipeline.js';
import {isGeneratorOptions, isAsyncGenerator} from './type.js';
import {getValidateTransformReturn} from './validate.js';

export const getObjectMode = (stdioItems, direction, options) => {
	const generators = getGenerators(stdioItems, direction, options);
	if (generators.length === 0) {
		return false;
	}

	const {value: {readableObjectMode, writableObjectMode}} = generators.at(-1);
	return direction === 'input' ? writableObjectMode : readableObjectMode;
};

export const normalizeGenerators = (stdioItems, direction, options) => [
	...stdioItems.filter(({type}) => type !== 'generator'),
	...getGenerators(stdioItems, direction, options),
];

const getGenerators = (stdioItems, direction, {encoding}) => {
	const generators = stdioItems.filter(({type}) => type === 'generator');
	const newGenerators = Array.from({length: generators.length});

	for (const [index, stdioItem] of Object.entries(generators)) {
		newGenerators[index] = normalizeGenerator({stdioItem, index: Number(index), newGenerators, direction, encoding});
	}

	return sortGenerators(newGenerators, direction);
};

const normalizeGenerator = ({stdioItem, stdioItem: {value}, index, newGenerators, direction, encoding}) => {
	const {
		transform,
		final,
		binary: binaryOption = false,
		preserveNewlines = false,
		objectMode,
	} = isGeneratorOptions(value) ? value : {transform: value};
	const binary = binaryOption || BINARY_ENCODINGS.has(encoding);
	const objectModes = direction === 'output'
		? getOutputObjectModes(objectMode, index, newGenerators)
		: getInputObjectModes(objectMode, index, newGenerators);
	return {...stdioItem, value: {transform, final, binary, preserveNewlines, ...objectModes}};
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
const getOutputObjectModes = (objectMode, index, newGenerators) => {
	const writableObjectMode = index !== 0 && newGenerators[index - 1].value.readableObjectMode;
	const readableObjectMode = objectMode ?? writableObjectMode;
	return {writableObjectMode, readableObjectMode};
};

const getInputObjectModes = (objectMode, index, newGenerators) => {
	const writableObjectMode = index === 0
		? objectMode === true
		: newGenerators[index - 1].value.readableObjectMode;
	const readableObjectMode = index !== newGenerators.length - 1 && (objectMode ?? writableObjectMode);
	return {writableObjectMode, readableObjectMode};
};

const sortGenerators = (newGenerators, direction) => direction === 'input' ? newGenerators.reverse() : newGenerators;

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
export const pipeGenerator = (subprocess, stream, direction, fdNumber) => {
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
