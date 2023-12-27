import {getStdioOptionType, isRegularUrl, isUnknownStdioString} from './type.js';
import {addStreamDirection} from './direction.js';
import {normalizeStdio} from './normalize.js';
import {handleInputOption, handleInputFileOption} from './input.js';
import {handleNativeStream} from './native.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async/sync mode
export const handleInput = (addProperties, options) => {
	const stdio = normalizeStdio(options);
	const stdioStreams = stdio
		.map((stdioOption, index) => getStdioStreams(stdioOption, index, options))
		.map(stdioStream => addStreamDirection(stdioStream))
		.map(stdioStream => addStreamsProperties(stdioStream, addProperties));
	options.stdio = transformStdio(stdioStreams);
	return stdioStreams.flat();
};

// We make sure passing an array with a single item behaves the same as passing that item without an array.
// This is what users would expect.
// For example, `stdout: ['ignore']` behaves the same as `stdout: 'ignore'`.
const getStdioStreams = (stdioOption, index, options) => {
	const optionName = getOptionName(index);
	const stdioParameters = {...options, optionName, index};

	if (!Array.isArray(stdioOption)) {
		return getStdioStream(stdioOption, false, stdioParameters);
	}

	if (stdioOption.length === 0) {
		throw new TypeError(`The \`${optionName}\` option must not be an empty array.`);
	}

	const stdioOptionArray = [...new Set(stdioOption)];
	if (stdioOptionArray.length === 1) {
		return getStdioStream(stdioOptionArray[0], false, stdioParameters);
	}

	validateStdioArray(stdioOptionArray, optionName);

	return stdioOptionArray.map(stdioOptionItem => getStdioStream(stdioOptionItem, true, stdioParameters));
};

const getOptionName = index => KNOWN_OPTION_NAMES[index] ?? `stdio[${index}]`;
const KNOWN_OPTION_NAMES = ['stdin', 'stdout', 'stderr'];

const validateStdioArray = (stdioOptionArray, optionName) => {
	for (const invalidStdioOption of INVALID_STDIO_ARRAY_OPTIONS) {
		if (stdioOptionArray.includes(invalidStdioOption)) {
			throw new Error(`The \`${optionName}\` option must not include \`${invalidStdioOption}\`.`);
		}
	}
};

// Using those `stdio` values together with others for the same stream does not make sense, so we make it fail.
// However, we do allow it if the array has a single item.
const INVALID_STDIO_ARRAY_OPTIONS = ['ignore', 'ipc'];

const getStdioStream = (stdioOption, isStdioArray, {optionName, index, input, inputFile}) => {
	const type = getStdioOptionType(stdioOption);
	let stdioStream = {type, value: stdioOption, optionName, index};

	stdioStream = handleInputOption(stdioStream, input);
	stdioStream = handleInputFileOption(stdioStream, inputFile, input);
	stdioStream = handleNativeStream(stdioStream, isStdioArray);

	validateFileStdio(stdioStream);

	return stdioStream;
};

const validateFileStdio = ({type, value, optionName}) => {
	if (isRegularUrl(value)) {
		throw new TypeError(`The \`${optionName}: URL\` option must use the \`file:\` scheme.
For example, you can use the \`pathToFileURL()\` method of the \`url\` core module.`);
	}

	if (isUnknownStdioString(type, value)) {
		throw new TypeError(`The \`${optionName}: filePath\` option must either be an absolute file path or start with \`.\`.`);
	}
};

// Some `stdio` values require Execa to create streams.
// For example, file paths create file read/write streams.
// Those transformations are specified in `addProperties`, which is both direction-specific and type-specific.
const addStreamsProperties = (stdioStream, addProperties) => Array.isArray(stdioStream)
	? stdioStream.map(stdioStreamItem => addStreamProperties(stdioStreamItem, addProperties))
	: addStreamProperties(stdioStream, addProperties);

const addStreamProperties = (stdioStream, addProperties) => ({
	...stdioStream,
	...addProperties[stdioStream.direction][stdioStream.type]?.(stdioStream),
});

// When the `std*: Iterable | WebStream | URL | filePath`, `input` or `inputFile` option is used, we pipe to `spawned.std*`.
// When the `std*: Array` option is used, we emulate some of the native values ('inherit', Node.js stream and file descriptor integer). To do so, we also need to pipe to `spawned.std*`.
// Therefore the `std*` options must be either `pipe` or `overlapped`. Other values do not set `spawned.std*`.
const transformStdio = stdioStreams => stdioStreams.map(stdioStream => transformStdioItem(stdioStream));

const transformStdioItem = stdioStream => {
	if (Array.isArray(stdioStream)) {
		return stdioStream.some(({value}) => value === 'overlapped') ? 'overlapped' : 'pipe';
	}

	return stdioStream.type !== 'native' && stdioStream.value !== 'overlapped' ? 'pipe' : stdioStream.value;
};
