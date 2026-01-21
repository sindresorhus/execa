import isPlainObject from 'is-plain-obj';
import {FD_SPECIFIC_OPTIONS} from '../arguments/specific.js';

// Deep merge specific options like `env`. Shallow merge the other ones.
// Use spread (which only copies own properties) to safely read from boundOptions without prototype pollution
export const mergeOptions = (boundOptions, options) => {
	const safeBoundOptions = {__proto__: null, ...boundOptions};
	const mergedOptions = Object.fromEntries(
		Object.entries(options).map(([optionName, optionValue]) => [
			optionName,
			mergeOption(optionName, safeBoundOptions[optionName], optionValue),
		]),
	);
	return {...safeBoundOptions, ...mergedOptions};
};

const mergeOption = (optionName, boundOptionValue, optionValue) => {
	if (DEEP_OPTIONS.has(optionName) && isPlainObject(boundOptionValue) && isPlainObject(optionValue)) {
		return {...boundOptionValue, ...optionValue};
	}

	return optionValue;
};

const DEEP_OPTIONS = new Set(['env', ...FD_SPECIFIC_OPTIONS]);
