import {isStream as isNodeStream} from 'is-stream';
import {getStdioOptionType, isRegularUrl, isUnknownStdioString} from './type.js';
import {normalizeStdio} from './normalize.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async/sync mode
export const handleInput = (addProperties, options) => {
	const stdio = normalizeStdio(options);
	const stdioArray = arrifyStdio(stdio);
	const stdioStreams = stdioArray.map((stdioOption, index) => getStdioStream(stdioOption, index, addProperties, options));
	options.stdio = transformStdio(stdio, stdioStreams);
	return stdioStreams;
};

const arrifyStdio = (stdio = []) => Array.isArray(stdio) ? stdio : [stdio, stdio, stdio];

const getStdioStream = (stdioOption, index, addProperties, {input, inputFile}) => {
	let stdioStream = {
		type: getStdioOptionType(stdioOption),
		value: stdioOption,
		optionName: OPTION_NAMES[index],
		direction: index === 0 ? 'input' : 'output',
	};
	validateFileStdio(stdioStream);

	stdioStream = handleInputOption(stdioStream, index, input);
	stdioStream = handleInputFileOption(stdioStream, index, inputFile, input);

	return {
		...stdioStream,
		...addProperties[stdioStream.direction][stdioStream.type]?.(stdioStream),
	};
};

const OPTION_NAMES = ['stdin', 'stdout', 'stderr'];

const validateFileStdio = ({type, value, optionName}) => {
	if (type !== 'native') {
		return;
	}

	validateRegularUrl(value, optionName);

	if (isUnknownStdioString(value)) {
		throw new TypeError(`The \`${optionName}: filePath\` option must either be an absolute file path or start with \`.\`.`);
	}
};

// Override the `stdin` option with the `input` option
const handleInputOption = (stdioStream, index, input) => {
	if (input === undefined || index !== 0) {
		return stdioStream;
	}

	const optionName = 'input';
	validateInputOption(stdioStream.value, optionName);
	const type = isNodeStream(input) ? 'nodeStream' : 'stringOrBuffer';
	return {...stdioStream, value: input, type, optionName};
};

// Override the `stdin` option with the `inputFile` option
const handleInputFileOption = (stdioStream, index, inputFile, input) => {
	if (inputFile === undefined || index !== 0) {
		return stdioStream;
	}

	if (input !== undefined) {
		throw new TypeError('The `input` and `inputFile` options cannot be both set.');
	}

	const optionName = 'inputFile';
	validateInputOption(stdioStream.value, optionName);
	validateRegularUrl(inputFile, optionName);
	return {...stdioStream, value: inputFile, type: 'filePath', optionName};
};

const validateInputOption = (value, optionName) => {
	if (!CAN_USE_INPUT.has(value)) {
		throw new TypeError(`The \`${optionName}\` and \`stdin\` options cannot be both set.`);
	}
};

const CAN_USE_INPUT = new Set([undefined, null, 'overlapped', 'pipe']);

const validateRegularUrl = (value, optionName) => {
	if (isRegularUrl(value)) {
		throw new TypeError(`The \`${optionName}: URL\` option must use the \`file:\` scheme.
For example, you can use the \`pathToFileURL()\` method of the \`url\` core module.`);
	}
};

// When the `std*: Iterable | WebStream | URL | filePath`, `input` or `inputFile` option is used, we pipe to `spawned.std*`.
// Therefore the `std*` options must be either `pipe` or `overlapped`. Other values do not set `spawned.std*`.
const transformStdio = (stdio, stdioStreams) => Array.isArray(stdio)
	? stdio.map((stdioItem, index) => transformStdioItem(stdioItem, index, stdioStreams))
	: stdio;

const transformStdioItem = (stdioItem, index, stdioStreams) =>
	stdioStreams[index].type !== 'native' && stdioItem !== 'overlapped' ? 'pipe' : stdioItem;
