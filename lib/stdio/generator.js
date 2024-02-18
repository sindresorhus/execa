import {generatorsToTransform} from './transform.js';
import {getEncodingStartGenerator} from './encoding-end.js';
import {getLinesGenerator} from './lines.js';
import {pipeStreams} from './pipeline.js';
import {isGeneratorOptions, isAsyncGenerator} from './type.js';
import {getValidateTransformReturn} from './validate.js';

export const normalizeGenerators = stdioStreams => {
	const nonGenerators = stdioStreams.filter(({type}) => type !== 'generator');
	const generators = stdioStreams.filter(({type}) => type === 'generator');

	const newGenerators = Array.from({length: generators.length});

	for (const [index, stdioStream] of Object.entries(generators)) {
		newGenerators[index] = normalizeGenerator(stdioStream, Number(index), newGenerators);
	}

	return [...nonGenerators, ...sortGenerators(newGenerators)];
};

const normalizeGenerator = ({value, ...stdioStream}, index, newGenerators) => {
	const {transform, final, binary = false, objectMode = false} = isGeneratorOptions(value) ? value : {transform: value};
	const objectModes = stdioStream.direction === 'output'
		? getOutputObjectModes(objectMode, index, newGenerators)
		: getInputObjectModes(objectMode, index, newGenerators);
	return {...stdioStream, value: {transform, final, binary, ...objectModes}};
};

/*
`objectMode` determines the return value's type, i.e. the `readableObjectMode`.
The chunk argument's type is based on the previous generator's return value, i.e. the `writableObjectMode` is based on the previous `readableObjectMode`.
The last input's generator is read by `childProcess.stdin` which:
- should not be in `objectMode` for performance reasons.
- can only be strings, Buffers and Uint8Arrays.
Therefore its `readableObjectMode` must be `false`.
The same applies to the first output's generator's `writableObjectMode`.
*/
const getOutputObjectModes = (objectMode, index, newGenerators) => {
	const writableObjectMode = index !== 0 && newGenerators[index - 1].value.readableObjectMode;
	const readableObjectMode = objectMode;
	return {writableObjectMode, readableObjectMode};
};

const getInputObjectModes = (objectMode, index, newGenerators) => {
	const writableObjectMode = index === 0
		? objectMode
		: newGenerators[index - 1].value.readableObjectMode;
	const readableObjectMode = index !== newGenerators.length - 1 && objectMode;
	return {writableObjectMode, readableObjectMode};
};

const sortGenerators = newGenerators => newGenerators[0]?.direction === 'input' ? newGenerators.reverse() : newGenerators;

/*
Generators can be used to transform/filter standard streams.

Generators have a simple syntax, yet allows all of the following:
- Sharing `state` between chunks
- Flushing logic, by using a `final` function
- Asynchronous logic
- Emitting multiple chunks from a single source chunk, even if spaced in time, by using multiple `yield`
- Filtering, by using no `yield`

Therefore, there is no need to allow Node.js or web transform streams.

The `highWaterMark` is kept as the default value, since this is what `childProcess.std*` uses.

Chunks are currently processed serially. We could add a `concurrency` option to parallelize in the future.
*/
export const generatorToDuplexStream = ({
	value: {transform, final, binary, writableObjectMode, readableObjectMode},
	encoding,
	optionName,
}) => {
	const generators = [
		getEncodingStartGenerator(encoding),
		getLinesGenerator(encoding, binary),
		{transform, final},
		{transform: getValidateTransformReturn(readableObjectMode, optionName)},
	].filter(Boolean);
	const transformAsync = isAsyncGenerator(transform);
	const finalAsync = isAsyncGenerator(final);
	const duplexStream = generatorsToTransform(generators, {transformAsync, finalAsync, writableObjectMode, readableObjectMode});
	return {value: duplexStream};
};

// `childProcess.stdin|stdout|stderr|stdio` is directly mutated.
export const pipeGenerator = (spawned, {value, direction, index}) => {
	if (direction === 'output') {
		pipeStreams([spawned.stdio[index]], value);
	} else {
		pipeStreams([value], spawned.stdio[index]);
	}

	const streamProperty = PROCESS_STREAM_PROPERTIES[index];
	if (streamProperty !== undefined) {
		spawned[streamProperty] = value;
	}

	spawned.stdio[index] = value;
};

const PROCESS_STREAM_PROPERTIES = ['stdin', 'stdout', 'stderr'];
