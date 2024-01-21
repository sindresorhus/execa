import {Transform, getDefaultHighWaterMark} from 'node:stream';
import {callbackify} from 'node:util';

// Transform an array of generator functions into a `Transform` stream.
// `Duplex.from(generator)` cannot be used because it does not allow setting the `objectMode` and `highWaterMark`.
export const generatorsToTransform = (generators, {writableObjectMode, readableObjectMode}) => new Transform({
	writableObjectMode,
	writableHighWaterMark: getDefaultHighWaterMark(writableObjectMode),
	readableObjectMode,
	readableHighWaterMark: getDefaultHighWaterMark(readableObjectMode),
	transform(chunk, encoding, done) {
		pushChunks(transformChunk.bind(undefined, chunk, generators, 0), this, done);
	},
	flush(done) {
		pushChunks(finalChunks.bind(undefined, generators), this, done);
	},
});

const pushChunks = callbackify(async (getChunks, transformStream) => {
	for await (const chunk of getChunks()) {
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
