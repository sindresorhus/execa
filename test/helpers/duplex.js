import {Transform} from 'node:stream';
import {setTimeout, scheduler} from 'node:timers/promises';
import {callbackify} from 'node:util';
import {foobarObject, foobarString} from './input.js';
import {casedSuffix, prefix, suffix} from './generator.js';

const getDuplex = (transform, encoding) => objectMode => ({
	duplex: new Transform({
		transform: callbackify(async function (value) {
			return transform.call(this, value);
		}),
		objectMode,
		encoding,
	}),
});

export const addNoopDuplex = (duplex, addNoopTransform, objectMode) => addNoopTransform
	? [duplex, noopDuplex(objectMode)]
	: [duplex];

export const noopDuplex = getDuplex(value => value);

export const serializeDuplex = getDuplex(object => JSON.stringify(object));

export const getOutputDuplex = input => getDuplex(() => input);

export const outputObjectDuplex = () => getOutputDuplex(foobarObject)(true);

export const getOutputsDuplex = inputs => getDuplex(function () {
	for (const input of inputs) {
		this.push(input);
	}
});

export const noYieldDuplex = getDuplex(() => {});

export const multipleYieldDuplex = getDuplex(async function (line) {
	this.push(prefix);
	await scheduler.yield();
	this.push(line);
	await scheduler.yield();
	this.push(suffix);
});

export const uppercaseBufferDuplex = getDuplex(buffer => buffer.toString().toUpperCase());

export const uppercaseEncodingDuplex = encoding => getDuplex(buffer => buffer.toString().toUpperCase(), encoding);

export const throwingDuplex = getDuplex(() => {
	throw new Error('Generator error');
});

export const appendDuplex = getDuplex(string => `${string}${casedSuffix}`);

export const timeoutDuplex = timeout => getDuplex(async () => {
	await setTimeout(timeout);
	return foobarString;
});
