import {setImmediate} from 'node:timers/promises';
import {foobarObject} from './input.js';

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

export const getOutputGenerator = (input, objectMode) => ({
	* transform() {
		yield input;
	},
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
