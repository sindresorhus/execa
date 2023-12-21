import {setTimeout} from 'node:timers/promises';

export const stringGenerator = function * () {
	yield * ['foo', 'bar'];
};

const textEncoder = new TextEncoder();
const binaryFoo = textEncoder.encode('foo');
const binaryBar = textEncoder.encode('bar');

export const binaryGenerator = function * () {
	yield * [binaryFoo, binaryBar];
};

export const asyncGenerator = async function * () {
	await setTimeout(0);
	yield * ['foo', 'bar'];
};

// eslint-disable-next-line require-yield
export const throwingGenerator = function * () {
	throw new Error('generator error');
};
