import {Duplex, Readable, PassThrough, getDefaultHighWaterMark} from 'node:stream';
import {callbackify} from 'node:util';
import {setTimeout} from 'node:timers/promises';

/*
 * Generators can be used to transform/filter standard streams.
 * Generators have a simple syntax, yet allows all of the following:
 *  - Sharing state between chunks, by using logic before the `for` loop
 *  - Flushing logic, by using logic after the `for` loop
 *  - Asynchronous logic
 *  - Emitting multiple chunks from a single source chunk, even if spaced in time, by using multiple `yield`
 *  - Filtering, by using no `yield`
 * Therefore, there is no need to allow Node.js or web transform streams.
 * The `highWaterMark` is kept as the default value, since this is what `childProcess.std*` uses.
 * We ensure `objectMode` is `false` for better buffering.
 * Chunks are currently processed serially. We could add a `concurrency` option to parallelize in the future.
 * We return a `Duplex`, created by `Duplex.from()` made of a writable stream and a readable stream, piped to each other.
 *  - The writable stream is a simple `PassThrough`, so it only forwards data to the readable part.
 *  - The `PassThrough` is read as an iterable using `passThrough.iterator()`.
 *  - This iterable is transformed to another iterable, by applying the encoding generators.
 *    Those convert the chunk type from `Buffer` to `string | Uint8Array` depending on the encoding option.
 *  - This new iterable is transformed again to another one, this time by applying the user-supplied generator.
 *  - Finally, `Readable.from()` is used to convert this final iterable to a `Readable` stream.
 */
export const generatorToTransformStream = ({value}, {encoding}) => {
	const objectMode = false;
	const highWaterMark = getDefaultHighWaterMark(objectMode);
	const passThrough = new PassThrough({objectMode, highWaterMark, destroy: destroyPassThrough});
	const iterable = passThrough.iterator();
	const encodedIterable = applyEncoding(iterable, encoding);
	const mappedIterable = value(encodedIterable);
	const readableStream = Readable.from(mappedIterable, {objectMode, highWaterMark});
	const duplexStream = Duplex.from({writable: passThrough, readable: readableStream});
	return {value: duplexStream};
};

/*
 * When an error is thrown in a generator, the PassThrough is aborted.
 * This creates a race condition for which error is propagated, due to the Duplex throwing twice:
 *  - The writable side is aborted (PassThrough)
 *  - The readable side propagate the generator's error
 * In order for the later to win that race, we need to wait one microtask.
 */
const destroyPassThrough = callbackify(async error => {
	await setTimeout(0);
	throw error;
});

// When using generators, add an internal generator that converts chunks from `Buffer` to `string` or `Uint8Array`.
// This allows generator functions to operate with those types instead.
const applyEncoding = (iterable, encoding) => encoding === 'buffer'
	? encodingStartBufferGenerator(iterable)
	: encodingStartStringGenerator(iterable);

/*
 * Chunks might be Buffer, Uint8Array or strings since:
 *  - `childProcess.stdout|stderr` emits Buffers
 *  - `childProcess.stdin.write()` accepts Buffer, Uint8Array or string
 *  - Previous generators might return Uint8Array or string
 * However, those are converted to Buffer:
 *  - on writes: `Duplex.writable` `decodeStrings: true` default option
 *  - on reads: `Duplex.readable` `readableEncoding: null` default option
 */
const encodingStartStringGenerator = async function * (chunks) {
	const textDecoder = new TextDecoder();

	for await (const chunk of chunks) {
		yield textDecoder.decode(chunk, {stream: true});
	}

	const lastChunk = textDecoder.decode();
	if (lastChunk !== '') {
		yield lastChunk;
	}
};

const encodingStartBufferGenerator = async function * (chunks) {
	for await (const chunk of chunks) {
		yield new Uint8Array(chunk);
	}
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
