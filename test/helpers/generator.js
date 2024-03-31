import {setImmediate, setInterval, setTimeout, scheduler} from 'node:timers/promises';
import {foobarObject, foobarString} from './input.js';

const getGenerator = transform => (objectMode, binary, preserveNewlines) => ({
	transform,
	objectMode,
	binary,
	preserveNewlines,
});

export const addNoopGenerator = (transform, addNoopTransform, objectMode, binary) => addNoopTransform
	? [transform, noopGenerator(objectMode, binary)]
	: [transform];

export const noopGenerator = getGenerator(function * (value) {
	yield value;
});

export const noopAsyncGenerator = getGenerator(async function * (value) {
	yield value;
});

export const serializeGenerator = getGenerator(function * (object) {
	yield JSON.stringify(object);
});

export const getOutputGenerator = input => getGenerator(function * () {
	yield input;
});

export const outputObjectGenerator = () => getOutputGenerator(foobarObject)(true);

export const getOutputAsyncGenerator = input => getGenerator(async function * () {
	yield input;
});

export const getOutputsGenerator = inputs => getGenerator(function * () {
	yield * inputs;
});

export const getOutputsAsyncGenerator = inputs => getGenerator(async function * () {
	for (const input of inputs) {
		yield input;
		// eslint-disable-next-line no-await-in-loop
		await setImmediate();
	}
});

const noYieldTransform = function * () {};

export const noYieldGenerator = getGenerator(noYieldTransform);

export const prefix = '> ';
export const suffix = ' <';

export const multipleYieldGenerator = getGenerator(async function * (line = foobarString) {
	yield prefix;
	await scheduler.yield();
	yield line;
	await scheduler.yield();
	yield suffix;
});

export const convertTransformToFinal = (transform, final) => {
	if (!final) {
		return transform;
	}

	const generatorOptions = typeof transform === 'function' ? {transform} : transform;
	return ({...generatorOptions, transform: noYieldTransform, final: generatorOptions.transform});
};

export const infiniteGenerator = getGenerator(async function * () {
	for await (const value of setInterval(100, foobarString)) {
		yield value;
	}
});

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export const uppercaseBufferGenerator = getGenerator(function * (buffer) {
	yield textEncoder.encode(textDecoder.decode(buffer).toUpperCase());
});

export const uppercaseGenerator = getGenerator(function * (string) {
	yield string.toUpperCase();
});

// eslint-disable-next-line require-yield
export const throwingGenerator = error => getGenerator(function * () {
	throw error;
});

export const appendGenerator = getGenerator(function * (string) {
	yield `${string}${casedSuffix}`;
});

export const appendAsyncGenerator = getGenerator(async function * (string) {
	yield `${string}${casedSuffix}`;
});

export const casedSuffix = 'k';

export const resultGenerator = inputs => getGenerator(function * (input) {
	inputs.push(input);
	yield input;
});

export const timeoutGenerator = timeout => getGenerator(async function * () {
	await setTimeout(timeout);
	yield foobarString;
});
