import {getStdioOptionType, isRegularUrl, isUnknownStdioString} from './type.js';
import {addStreamDirection} from './direction.js';
import {normalizeStdio} from './normalize.js';
import {handleInputOption, handleInputFileOption} from './input.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async/sync mode
export const handleInput = (addProperties, options) => {
	const stdio = normalizeStdio(options);
	const stdioStreams = stdio
		.map((stdioOption, index) => getStdioStream(stdioOption, index, options))
		.map(stdioStream => addStreamDirection(stdioStream))
		.map(stdioStream => addStreamProperties(stdioStream, addProperties));
	options.stdio = transformStdio(stdioStreams);
	return stdioStreams;
};

const getStdioStream = (stdioOption, index, {input, inputFile}) => {
	const optionName = getOptionName(index);
	const type = getStdioOptionType(stdioOption);
	let stdioStream = {type, value: stdioOption, optionName, index};

	stdioStream = handleInputOption(stdioStream, input);
	stdioStream = handleInputFileOption(stdioStream, inputFile, input);

	validateFileStdio(stdioStream);

	return stdioStream;
};

const getOptionName = index => KNOWN_OPTION_NAMES[index] ?? `stdio[${index}]`;
const KNOWN_OPTION_NAMES = ['stdin', 'stdout', 'stderr'];

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
const addStreamProperties = (stdioStream, addProperties) => ({
	...stdioStream,
	...addProperties[stdioStream.direction][stdioStream.type]?.(stdioStream),
});

// When the `std*: Iterable | WebStream | URL | filePath`, `input` or `inputFile` option is used, we pipe to `spawned.std*`.
// Therefore the `std*` options must be either `pipe` or `overlapped`. Other values do not set `spawned.std*`.
const transformStdio = stdioStreams => stdioStreams.map(stdioStream => transformStdioItem(stdioStream));

const transformStdioItem = stdioStream => stdioStream.type !== 'native' && stdioStream.value !== 'overlapped' ? 'pipe' : stdioStream.value;
