import {getStdioItemType, isRegularUrl, isUnknownStdioString, FILE_TYPES} from './type.js';
import {getStreamDirection} from './direction.js';
import {normalizeStdio} from './option.js';
import {handleNativeStream} from './native.js';
import {handleInputOptions} from './input.js';
import {normalizeTransforms, getObjectMode} from './generator.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async/sync mode
export const handleInput = (addProperties, options, verboseInfo, isSync) => {
	const stdio = normalizeStdio(options, isSync);
	const fileDescriptors = stdio.map((stdioOption, fdNumber) =>
		getFileDescriptor({stdioOption, fdNumber, addProperties, options, isSync}));
	options.stdio = fileDescriptors.map(({stdioItems}) => forwardStdio(stdioItems));
	return fileDescriptors;
};

// We make sure passing an array with a single item behaves the same as passing that item without an array.
// This is what users would expect.
// For example, `stdout: ['ignore']` behaves the same as `stdout: 'ignore'`.
const getFileDescriptor = ({stdioOption, fdNumber, addProperties, options, isSync}) => {
	const optionName = getOptionName(fdNumber);
	const {stdioItems: initialStdioItems, isStdioArray} = initializeStdioItems({stdioOption, fdNumber, options, optionName});
	const direction = getStreamDirection(initialStdioItems, fdNumber, optionName);
	const stdioItems = initialStdioItems.map(stdioItem => handleNativeStream({stdioItem, isStdioArray, fdNumber, direction, isSync}));
	const normalizedStdioItems = normalizeTransforms(stdioItems, optionName, direction, options);
	const objectMode = getObjectMode(normalizedStdioItems, direction);
	validateFileObjectMode(normalizedStdioItems, objectMode);
	const finalStdioItems = normalizedStdioItems.map(stdioItem => addStreamProperties(stdioItem, addProperties, direction, options));
	return {streamName: optionName, direction, objectMode, stdioItems: finalStdioItems};
};

const getOptionName = fdNumber => KNOWN_OPTION_NAMES[fdNumber] ?? `stdio[${fdNumber}]`;
const KNOWN_OPTION_NAMES = ['stdin', 'stdout', 'stderr'];

const initializeStdioItems = ({stdioOption, fdNumber, options, optionName}) => {
	const values = Array.isArray(stdioOption) ? stdioOption : [stdioOption];
	const initialStdioItems = [
		...values.map(value => initializeStdioItem(value, optionName)),
		...handleInputOptions(options, fdNumber),
	];

	const stdioItems = filterDuplicates(initialStdioItems);
	const isStdioArray = stdioItems.length > 1;
	validateStdioArray(stdioItems, isStdioArray, optionName);
	validateStreams(stdioItems);
	return {stdioItems, isStdioArray};
};

const initializeStdioItem = (value, optionName) => ({
	type: getStdioItemType(value, optionName),
	value,
	optionName,
});

const filterDuplicates = stdioItems => stdioItems.filter((stdioItemOne, indexOne) =>
	stdioItems.every((stdioItemTwo, indexTwo) => stdioItemOne.value !== stdioItemTwo.value
		|| indexOne >= indexTwo
		|| stdioItemOne.type === 'generator'
		|| stdioItemOne.type === 'asyncGenerator'));

const validateStdioArray = (stdioItems, isStdioArray, optionName) => {
	if (stdioItems.length === 0) {
		throw new TypeError(`The \`${optionName}\` option must not be an empty array.`);
	}

	if (!isStdioArray) {
		return;
	}

	for (const {value, optionName} of stdioItems) {
		if (INVALID_STDIO_ARRAY_OPTIONS.has(value)) {
			throw new Error(`The \`${optionName}\` option must not include \`${value}\`.`);
		}
	}
};

// Using those `stdio` values together with others for the same stream does not make sense, so we make it fail.
// However, we do allow it if the array has a single item.
const INVALID_STDIO_ARRAY_OPTIONS = new Set(['ignore', 'ipc']);

const validateStreams = stdioItems => {
	for (const stdioItem of stdioItems) {
		validateFileStdio(stdioItem);
	}
};

const validateFileStdio = ({type, value, optionName}) => {
	if (isRegularUrl(value)) {
		throw new TypeError(`The \`${optionName}: URL\` option must use the \`file:\` scheme.
For example, you can use the \`pathToFileURL()\` method of the \`url\` core module.`);
	}

	if (isUnknownStdioString(type, value)) {
		throw new TypeError(`The \`${optionName}: { file: '...' }\` option must be used instead of \`${optionName}: '...'\`.`);
	}
};

const validateFileObjectMode = (stdioItems, objectMode) => {
	if (!objectMode) {
		return;
	}

	const fileStdioItem = stdioItems.find(({type}) => FILE_TYPES.has(type));
	if (fileStdioItem !== undefined) {
		throw new TypeError(`The \`${fileStdioItem.optionName}\` option cannot use both files and transforms in objectMode.`);
	}
};

// Some `stdio` values require Execa to create streams.
// For example, file paths create file read/write streams.
// Those transformations are specified in `addProperties`, which is both direction-specific and type-specific.
const addStreamProperties = (stdioItem, addProperties, direction, options) => ({
	...stdioItem,
	...addProperties[direction][stdioItem.type](stdioItem, options),
});

// When the `std*: Iterable | WebStream | URL | filePath`, `input` or `inputFile` option is used, we pipe to `subprocess.std*`.
// When the `std*: Array` option is used, we emulate some of the native values ('inherit', Node.js stream and file descriptor integer). To do so, we also need to pipe to `subprocess.std*`.
// Therefore the `std*` options must be either `pipe` or `overlapped`. Other values do not set `subprocess.std*`.
const forwardStdio = stdioItems => {
	if (stdioItems.length > 1) {
		return stdioItems.some(({value}) => value === 'overlapped') ? 'overlapped' : 'pipe';
	}

	const [{type, value}] = stdioItems;
	return type === 'native' ? value : 'pipe';
};
