import {setTimeout, scheduler} from 'node:timers/promises';
import {foobarObject, foobarString} from './input.js';
import {casedSuffix, prefix, suffix} from './generator.js';

const getWebTransform = transform => objectMode => ({
	transform: new TransformStream({transform}),
	objectMode,
});

export const addNoopWebTransform = (webTransform, addNoopTransform, objectMode) => addNoopTransform
	? [webTransform, noopWebTransform(objectMode)]
	: [webTransform];

export const noopWebTransform = getWebTransform((value, controller) => {
	controller.enqueue(value);
});

export const serializeWebTransform = getWebTransform((object, controller) => {
	controller.enqueue(JSON.stringify(object));
});

export const getOutputWebTransform = (input, outerObjectMode) => getWebTransform((_, controller) => {
	controller.enqueue(input);
}, undefined, outerObjectMode);

export const outputObjectWebTransform = () => getOutputWebTransform(foobarObject)(true);

export const getOutputsWebTransform = inputs => getWebTransform((_, controller) => {
	for (const input of inputs) {
		controller.enqueue(input);
	}
});

export const noYieldWebTransform = getWebTransform(() => {});

export const multipleYieldWebTransform = getWebTransform(async (line, controller) => {
	controller.enqueue(prefix);
	await scheduler.yield();
	controller.enqueue(line);
	await scheduler.yield();
	controller.enqueue(suffix);
});

export const uppercaseBufferWebTransform = getWebTransform((string, controller) => {
	controller.enqueue(string.toString().toUpperCase());
});

export const throwingWebTransform = getWebTransform(() => {
	throw new Error('Generator error');
});

export const appendWebTransform = getWebTransform((string, controller) => {
	controller.enqueue(`${string}${casedSuffix}`);
});

export const timeoutWebTransform = timeout => getWebTransform(async (_, controller) => {
	await setTimeout(timeout);
	controller.enqueue(foobarString);
});
