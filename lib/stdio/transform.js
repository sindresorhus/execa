import {Transform, getDefaultHighWaterMark} from 'node:stream';
import {callbackify} from 'node:util';

// Transform an array of generator functions into a `Transform` stream.
// `Duplex.from(generator)` cannot be used because it does not allow setting the `objectMode` and `highWaterMark`.
export const generatorsToTransform = (generators, {transformAsync, finalAsync, writableObjectMode, readableObjectMode}) => {
	const state = {};
	const transformMethod = transformAsync
		? pushChunks.bind(undefined, transformChunk, state)
		: pushChunksSync.bind(undefined, transformChunkSync);
	const finalMethod = transformAsync || finalAsync
		? pushChunks.bind(undefined, finalChunks, state)
		: pushChunksSync.bind(undefined, finalChunksSync);
	const destroyMethod = transformAsync || finalAsync
		? destroyTransform.bind(undefined, state)
		: undefined;

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
		destroy: destroyMethod,
	});
};

const pushChunks = callbackify(async (getChunks, state, args, transformStream) => {
	state.currentIterable = getChunks(...args);

	try {
		for await (const chunk of state.currentIterable) {
			transformStream.push(chunk);
		}
	} finally {
		delete state.currentIterable;
	}
});

// For each new chunk, apply each `transform()` method
const transformChunk = async function * (chunk, generators, index) {
	if (index === generators.length) {
		yield chunk;
		return;
	}

	const {transform = identityGenerator} = generators[index];
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

// Cancel any ongoing async generator when the Transform is destroyed, e.g. when the subprocess errors
const destroyTransform = callbackify(async ({currentIterable}, error) => {
	if (currentIterable !== undefined) {
		await (error ? currentIterable.throw(error) : currentIterable.return());
		return;
	}

	if (error) {
		throw error;
	}
});

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

	const {transform = identityGenerator} = generators[index];
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

const identityGenerator = function * (chunk) {
	yield chunk;
};
