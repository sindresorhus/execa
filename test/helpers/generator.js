import {setImmediate, setInterval} from 'node:timers/promises';
import {foobarObject} from './input.js';

export const noopAsyncGenerator = () => ({
	async * transform(line) {
		yield line;
	},
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

export const serializeGenerator = {
	* transform(object) {
		yield JSON.stringify(object);
	},
	objectMode: true,
};

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

export const getOutputGenerator = (input, objectMode) => ({
	transform: identityGenerator(input),
	objectMode,
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

export const uppercaseGenerator = function * (line) {
	yield line.toUpperCase();
};

// eslint-disable-next-line require-yield
export const throwingGenerator = function * () {
	throw new Error('Generator error');
};

export const GENERATOR_ERROR_REGEXP = /Generator error/;
