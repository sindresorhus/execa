import {Duplex, Readable, PassThrough, getDefaultHighWaterMark} from 'node:stream';

/*
Transform an array of generator functions into a `Duplex`.

The `Duplex` is created by `Duplex.from()` made of a writable stream and a readable stream, piped to each other.
- The writable stream is a simple `PassThrough`, so it only forwards data to the readable part.
- The `PassThrough` is read as an iterable using `passThrough.iterator()`.
- This iterable is transformed to another iterable, by applying the encoding generators.
	Those convert the chunk type from `Buffer` to `string | Uint8Array` depending on the encoding option.
- This new iterable is transformed again to another one, this time by applying the user-supplied generator.
- Finally, `Readable.from()` is used to convert this final iterable to a `Readable` stream.
*/
export const generatorsToDuplex = (generators, {objectMode}) => {
	const highWaterMark = getDefaultHighWaterMark(objectMode);
	const passThrough = new PassThrough({objectMode, highWaterMark, destroy: destroyPassThrough});
	let iterable = passThrough.iterator();

	for (const generator of generators) {
		iterable = generator(iterable);
	}

	const readableStream = Readable.from(iterable, {objectMode, highWaterMark});
	const duplexStream = Duplex.from({writable: passThrough, readable: readableStream});
	return duplexStream;
};

/*
When an error is thrown in a generator, the PassThrough is aborted.

This creates a race condition for which error is propagated, due to the Duplex throwing twice:
- The writable side is aborted (PassThrough)
- The readable side propagate the generator's error

In order for the later to win that race, we need to wait one microtask.
- However we wait one macrotask instead to be on the safe side
- See https://github.com/sindresorhus/execa/pull/693#discussion_r1453809450
*/
const destroyPassThrough = (error, done) => {
	setTimeout(() => {
		done(error);
	}, 0);
};
