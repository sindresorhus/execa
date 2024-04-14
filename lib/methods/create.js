import isPlainObject from 'is-plain-obj';
import {FD_SPECIFIC_OPTIONS} from '../arguments/specific.js';
import {normalizeParameters} from './parameters.js';
import {isTemplateString, parseTemplates} from './template.js';
import {execaCoreSync} from './main-sync.js';
import {execaCoreAsync} from './main-async.js';

export const createExeca = (mapArguments, boundOptions, deepOptions, setBoundExeca) => {
	const createNested = (mapArguments, boundOptions, setBoundExeca) => createExeca(mapArguments, boundOptions, deepOptions, setBoundExeca);
	const boundExeca = (...execaArguments) => callBoundExeca({
		mapArguments,
		deepOptions,
		boundOptions,
		setBoundExeca,
		createNested,
	}, ...execaArguments);

	if (setBoundExeca !== undefined) {
		setBoundExeca(boundExeca, createNested, boundOptions);
	}

	return boundExeca;
};

const callBoundExeca = ({mapArguments, deepOptions = {}, boundOptions = {}, setBoundExeca, createNested}, firstArgument, ...nextArguments) => {
	if (isPlainObject(firstArgument)) {
		return createNested(mapArguments, mergeOptions(boundOptions, firstArgument), setBoundExeca);
	}

	const {file, commandArguments, options, isSync} = parseArguments({
		mapArguments,
		firstArgument,
		nextArguments,
		deepOptions,
		boundOptions,
	});
	return isSync
		? execaCoreSync(file, commandArguments, options)
		: execaCoreAsync(file, commandArguments, options, createNested);
};

const parseArguments = ({mapArguments, firstArgument, nextArguments, deepOptions, boundOptions}) => {
	const callArguments = isTemplateString(firstArgument)
		? parseTemplates(firstArgument, nextArguments)
		: [firstArgument, ...nextArguments];
	const [initialFile, initialArguments, initialOptions] = normalizeParameters(...callArguments);
	const mergedOptions = mergeOptions(mergeOptions(deepOptions, boundOptions), initialOptions);
	const {
		file = initialFile,
		commandArguments = initialArguments,
		options = mergedOptions,
		isSync = false,
	} = mapArguments({file: initialFile, commandArguments: initialArguments, options: mergedOptions});
	return {
		file,
		commandArguments,
		options,
		isSync,
	};
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
