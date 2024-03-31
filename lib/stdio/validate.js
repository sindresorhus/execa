import {Buffer} from 'node:buffer';
import {isUint8Array} from './uint-array.js';

export const getValidateTransformInput = (writableObjectMode, optionName) => writableObjectMode
	? undefined
	: validateStringTransformInput.bind(undefined, optionName);

const validateStringTransformInput = function * (optionName, chunk) {
	if (typeof chunk !== 'string' && !isUint8Array(chunk) && !Buffer.isBuffer(chunk)) {
		throw new TypeError(`The \`${optionName}\` option's transform must use "objectMode: true" to receive as input: ${typeof chunk}.`);
	}

	yield chunk;
};

export const getValidateTransformReturn = (readableObjectMode, optionName) => readableObjectMode
	? validateObjectTransformReturn.bind(undefined, optionName)
	: validateStringTransformReturn.bind(undefined, optionName);

const validateObjectTransformReturn = function * (optionName, chunk) {
	validateEmptyReturn(optionName, chunk);
	yield chunk;
};

const validateStringTransformReturn = function * (optionName, chunk) {
	validateEmptyReturn(optionName, chunk);

	if (typeof chunk !== 'string' && !isUint8Array(chunk)) {
		const typeName = Buffer.isBuffer(chunk) ? 'a buffer' : typeof chunk;
		throw new TypeError(`The \`${optionName}\` option's function must yield a string or an Uint8Array, not ${typeName}.`);
	}

	yield chunk;
};

const validateEmptyReturn = (optionName, chunk) => {
	if (chunk === null || chunk === undefined) {
		throw new TypeError(`The \`${optionName}\` option's function must not call \`yield ${chunk}\`.
Instead, \`yield\` should either be called with a value, or not be called at all. For example:
  if (condition) { yield value; }`);
	}
};
