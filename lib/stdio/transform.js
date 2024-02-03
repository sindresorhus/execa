import {Transform, getDefaultHighWaterMark} from 'node:stream';
import {callbackify} from 'node:util';

// Transform an array of generator functions into a `Transform` stream.
// `Duplex.from(generator)` cannot be used because it does not allow setting the `objectMode` and `highWaterMark`.
export const generatorsToTransform = (generators, {transformAsync, finalAsync, writableObjectMode, readableObjectMode}) => {
	const transformMethod = transformAsync
		? pushChunks.bind(undefined, transformChunk)
		: pushChunksSync.bind(undefined, transformChunkSync);
	const finalMethod = transformAsync || finalAsync
		? pushChunks.bind(undefined, finalChunks)
		: pushChunksSync.bind(undefined, finalChunksSync);

	return new Transform({
		writableObjectMode,
		writableHighWaterMark: getDefaultHighWaterMark(writableObjectMode),
		readableObjectMode,
		readableHighWaterMark: getDefaultHighWaterMark(readableObjectMode),
		transform(chunk, encoding, done) {
			transformMethod([chunk, generators, 0], this, done);
		},
		flush(done) {
			finalMethod([generators], this, done);
		},
	});
};

const pushChunks = callbackify(async (getChunks, args, transformStream) => {
	for await (const chunk of getChunks(...args)) {
		transformStream.push(chunk);
	}
});

// For each new chunk, apply each `transform()` method
const transformChunk = async function * (chunk, generators, index) {
	if (index === generators.length) {
		yield chunk;
		return;
	}

	const {transform} = generators[index];
	for await (const transformedChunk of transform(chunk)) {
		yield * transformChunk(transformedChunk, generators, index + 1);
	}
};

// At the end, apply each `final()` method, followed by the `transform()` method of the next transforms
const finalChunks = async function * (generators) {
	for (const [index, {final}] of Object.entries(generators)) {
		yield * generatorFinalChunks(final, Number(index), generators);
	}
};

const generatorFinalChunks = async function * (final, index, generators) {
	if (final === undefined) {
		return;
	}

	for await (const finalChunk of final()) {
		yield * transformChunk(finalChunk, generators, index + 1);
	}
};

// Duplicate the code above but as synchronous functions.
// This is a performance optimization when the `transform`/`flush` function is synchronous, which is the common case.
const pushChunksSync = (getChunksSync, args, transformStream, done) => {
	try {
		for (const chunk of getChunksSync(...args)) {
			transformStream.push(chunk);
		}

		done();
	} catch (error) {
		done(error);
	}
};

const transformChunkSync = function * (chunk, generators, index) {
	if (index === generators.length) {
		yield chunk;
		return;
	}

	const {transform} = generators[index];
	for (const transformedChunk of transform(chunk)) {
		yield * transformChunkSync(transformedChunk, generators, index + 1);
	}
};

const finalChunksSync = function * (generators) {
	for (const [index, {final}] of Object.entries(generators)) {
		yield * generatorFinalChunksSync(final, Number(index), generators);
	}
};

const generatorFinalChunksSync = function * (final, index, generators) {
	if (final === undefined) {
		return;
	}

	for (const finalChunk of final()) {
		yield * transformChunkSync(finalChunk, generators, index + 1);
	}
};
