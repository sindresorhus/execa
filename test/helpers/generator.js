import {setImmediate, setInterval} from 'node:timers/promises';
import {foobarObject} from './input.js';

export const noopAsyncGenerator = (objectMode, binary) => ({
	async * transform(line) {
		yield line;
	},
	objectMode,
	binary,
});

export const addNoopGenerator = (transform, addNoopTransform) => addNoopTransform
	? [transform, noopGenerator(undefined, true)]
	: [transform];

export const noopGenerator = (objectMode, binary) => ({
	* transform(line) {
		yield line;
	},
	objectMode,
	binary,
});

export const serializeGenerator = (objectMode, binary) => ({
	* transform(object) {
		yield JSON.stringify(object);
	},
	objectMode,
	binary,
});

export const getOutputsGenerator = (inputs, objectMode) => ({
	* transform() {
		yield * inputs;
	},
	objectMode,
});

export const identityGenerator = input => function * () {
	yield input;
};

export const identityAsyncGenerator = input => async function * () {
	yield input;
};

export const getOutputGenerator = (input, objectMode, binary) => ({
	transform: identityGenerator(input),
	objectMode,
	binary,
});

export const outputObjectGenerator = getOutputGenerator(foobarObject, true);

export const getChunksGenerator = (chunks, objectMode, binary) => ({
	async * transform() {
		for (const chunk of chunks) {
			yield chunk;
			// eslint-disable-next-line no-await-in-loop
			await setImmediate();
		}
	},
	objectMode,
	binary,
});

const noYieldTransform = function * () {};

export const noYieldGenerator = objectMode => ({
	transform: noYieldTransform,
	objectMode,
});

export const convertTransformToFinal = (transform, final) => {
	if (!final) {
		return transform;
	}

	const generatorOptions = typeof transform === 'function' ? {transform} : transform;
	return ({...generatorOptions, transform: noYieldTransform, final: generatorOptions.transform});
};

export const infiniteGenerator = async function * () {
	for await (const value of setInterval(100, 'foo')) {
		yield value;
	}
};

export const uppercaseGenerator = (objectMode, binary) => ({
	* transform(line) {
		yield line.toUpperCase();
	},
	objectMode,
	binary,
});

// eslint-disable-next-line require-yield
export const throwingGenerator = function * () {
	throw new Error('Generator error');
};

export const GENERATOR_ERROR_REGEXP = /Generator error/;
