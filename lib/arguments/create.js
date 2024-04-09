import isPlainObject from 'is-plain-obj';
import {execaCoreAsync} from '../async.js';
import {execaCoreSync} from '../sync.js';
import {normalizeArguments} from './normalize.js';
import {isTemplateString, parseTemplates} from './template.js';
import {FD_SPECIFIC_OPTIONS} from './specific.js';

export const createExeca = (mapArguments, boundOptions, deepOptions, setBoundExeca) => {
	const createNested = (mapArguments, boundOptions, setBoundExeca) => createExeca(mapArguments, boundOptions, deepOptions, setBoundExeca);
	const boundExeca = (...args) => callBoundExeca({mapArguments, deepOptions, boundOptions, setBoundExeca, createNested}, ...args);

	if (setBoundExeca !== undefined) {
		setBoundExeca(boundExeca, createNested, boundOptions);
	}

	return boundExeca;
};

const callBoundExeca = ({mapArguments, deepOptions = {}, boundOptions = {}, setBoundExeca, createNested}, firstArgument, ...nextArguments) => {
	if (isPlainObject(firstArgument)) {
		return createNested(mapArguments, mergeOptions(boundOptions, firstArgument), setBoundExeca);
	}

	const {file, args, options, isSync} = parseArguments({mapArguments, firstArgument, nextArguments, deepOptions, boundOptions});
	return isSync
		? execaCoreSync(file, args, options)
		: execaCoreAsync(file, args, options, createNested);
};

const parseArguments = ({mapArguments, firstArgument, nextArguments, deepOptions, boundOptions}) => {
	const callArguments = isTemplateString(firstArgument)
		? parseTemplates(firstArgument, nextArguments)
		: [firstArgument, ...nextArguments];
	const [rawFile, rawArgs, rawOptions] = normalizeArguments(...callArguments);
	const mergedOptions = mergeOptions(mergeOptions(deepOptions, boundOptions), rawOptions);
	const {
		file = rawFile,
		args = rawArgs,
		options = mergedOptions,
		isSync = false,
	} = mapArguments({file: rawFile, args: rawArgs, options: mergedOptions});
	return {file, args, options, isSync};
};

// Deep merge specific options like `env`. Shallow merge the other ones.
const mergeOptions = (boundOptions, options) => {
	const newOptions = Object.fromEntries(
		Object.entries(options).map(([optionName, optionValue]) => [
			optionName,
			mergeOption(optionName, boundOptions[optionName], optionValue),
		]),
	);
	return {...boundOptions, ...newOptions};
};

const mergeOption = (optionName, boundOptionValue, optionValue) => {
	if (DEEP_OPTIONS.has(optionName) && isPlainObject(boundOptionValue) && isPlainObject(optionValue)) {
		return {...boundOptionValue, ...optionValue};
	}

	return optionValue;
};

const DEEP_OPTIONS = new Set(['env', ...FD_SPECIFIC_OPTIONS]);
