import {getStdioOptionType, isRegularUrl, isUnknownStdioString, isInputDirection} from './type.js';
import {normalizeStdio} from './normalize.js';
import {handleInputOption, handleInputFileOption} from './input.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async/sync mode
export const handleInput = (addProperties, options) => {
	const stdio = normalizeStdio(options);
	const stdioStreams = stdio.map((stdioOption, index) => getStdioStream(stdioOption, index, addProperties, options));
	options.stdio = transformStdio(stdioStreams);
	return stdioStreams;
};

const getStdioStream = (stdioOption, index, addProperties, {input, inputFile}) => {
	let stdioStream = getInitialStdioStream(stdioOption, index);

	stdioStream = handleInputOption(stdioStream, index, input);
	stdioStream = handleInputFileOption(stdioStream, index, inputFile, input);

	validateFileStdio(stdioStream);

	return {
		...stdioStream,
		...addProperties[stdioStream.direction][stdioStream.type]?.(stdioStream),
	};
};

const getInitialStdioStream = (stdioOption, index) => {
	const type = getStdioOptionType(stdioOption);
	const {
		optionName = `stdio[${index}]`,
		direction = isInputDirection[type](stdioOption) ? 'input' : 'output',
	} = KNOWN_STREAMS[index] ?? {};
	return {type, value: stdioOption, optionName, direction};
};

const KNOWN_STREAMS = [
	{optionName: 'stdin', direction: 'input'},
	{optionName: 'stdout', direction: 'output'},
	{optionName: 'stderr', direction: 'output'},
];

const validateFileStdio = ({type, value, optionName}) => {
	if (isRegularUrl(value)) {
		throw new TypeError(`The \`${optionName}: URL\` option must use the \`file:\` scheme.
For example, you can use the \`pathToFileURL()\` method of the \`url\` core module.`);
	}

	if (isUnknownStdioString(type, value)) {
		throw new TypeError(`The \`${optionName}: filePath\` option must either be an absolute file path or start with \`.\`.`);
	}
};

// When the `std*: Iterable | WebStream | URL | filePath`, `input` or `inputFile` option is used, we pipe to `spawned.std*`.
// Therefore the `std*` options must be either `pipe` or `overlapped`. Other values do not set `spawned.std*`.
const transformStdio = stdioStreams => stdioStreams.map(stdioStream => transformStdioItem(stdioStream));

const transformStdioItem = stdioStream => stdioStream.type !== 'native' && stdioStream.value !== 'overlapped' ? 'pipe' : stdioStream.value;
