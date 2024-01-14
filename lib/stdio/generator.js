import {generatorsToDuplex} from './duplex.js';
import {getEncodingStartGenerator} from './encoding.js';
import {getLinesGenerator} from './lines.js';
import {isGeneratorOptions} from './type.js';

/*
Generators can be used to transform/filter standard streams.

Generators have a simple syntax, yet allows all of the following:
- Sharing state between chunks, by using logic before the `for` loop
- Flushing logic, by using logic after the `for` loop
- Asynchronous logic
- Emitting multiple chunks from a single source chunk, even if spaced in time, by using multiple `yield`
- Filtering, by using no `yield`

Therefore, there is no need to allow Node.js or web transform streams.

The `highWaterMark` is kept as the default value, since this is what `childProcess.std*` uses.

We ensure `objectMode` is `false` for better buffering.

Chunks are currently processed serially. We could add a `concurrency` option to parallelize in the future.
*/
export const generatorToDuplexStream = ({value, encoding}) => {
	const {transform, binary} = isGeneratorOptions(value) ? value : {transform: value};
	const generators = [
		getEncodingStartGenerator(encoding),
		getLinesGenerator(encoding, binary),
		transform,
	].filter(Boolean);
	const duplexStream = generatorsToDuplex(generators, {objectMode: false});
	return {value: duplexStream};
};

// `childProcess.stdin|stdout|stderr|stdio` is directly mutated.
export const pipeGenerator = (spawned, {value, direction, index}) => {
	if (direction === 'output') {
		spawned.stdio[index].pipe(value);
	}	else {
		value.pipe(spawned.stdio[index]);
	}

	const streamProperty = PROCESS_STREAM_PROPERTIES[index];
	if (streamProperty !== undefined) {
		spawned[streamProperty] = value;
	}

	spawned.stdio[index] = value;
};

const PROCESS_STREAM_PROPERTIES = ['stdin', 'stdout', 'stderr'];
