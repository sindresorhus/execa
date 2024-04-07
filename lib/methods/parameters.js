import isPlainObject from 'is-plain-obj';
import {safeNormalizeFileUrl} from '../arguments/file-url.js';

export const normalizeParameters = (rawFile, rawArgs = [], rawOptions = {}) => {
	const filePath = safeNormalizeFileUrl(rawFile, 'First argument');
	const [args, options] = isPlainObject(rawArgs)
		? [[], rawArgs]
		: [rawArgs, rawOptions];

	if (!Array.isArray(args)) {
		throw new TypeError(`Second argument must be either an array of arguments or an options object: ${args}`);
	}

	if (args.some(arg => typeof arg === 'object' && arg !== null)) {
		throw new TypeError(`Second argument must be an array of strings: ${args}`);
	}

	const normalizedArgs = args.map(String);
	const nullByteArg = normalizedArgs.find(arg => arg.includes('\0'));
	if (nullByteArg !== undefined) {
		throw new TypeError(`Arguments cannot contain null bytes ("\\0"): ${nullByteArg}`);
	}

	if (!isPlainObject(options)) {
		throw new TypeError(`Last argument must be an options object: ${options}`);
	}

	return [filePath, normalizedArgs, options];
};
