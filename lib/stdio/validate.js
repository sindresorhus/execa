import {isBinary} from '../utils.js';

export const getValidateTransformReturn = (readableObjectMode, optionName) => readableObjectMode
	? validateObjectTransformReturn.bind(undefined, optionName)
	: validateStringTransformReturn.bind(undefined, optionName);

const validateObjectTransformReturn = function * (optionName, chunk) {
	validateEmptyReturn(optionName, chunk);
	yield chunk;
};

const validateStringTransformReturn = function * (optionName, chunk) {
	validateEmptyReturn(optionName, chunk);

	if (typeof chunk !== 'string' && !isBinary(chunk)) {
		throw new TypeError(`The \`${optionName}\` option's function must yield a string or an Uint8Array, not ${typeof chunk}.`);
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
