import {handleStreamsVerbose} from '../verbose/output.js';
import {getStdioOptionType, isRegularUrl, isUnknownStdioString} from './type.js';
import {addStreamDirection} from './direction.js';
import {normalizeStdio} from './option.js';
import {handleNativeStream} from './native.js';
import {handleInputOptions} from './input.js';
import {handleStreamsLines} from './lines.js';
import {handleStreamsEncoding} from './encoding-final.js';
import {normalizeGenerators} from './generator.js';
import {forwardStdio} from './forward.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async/sync mode
export const handleInput = (addProperties, options, verboseInfo, isSync) => {
	const stdioState = {};
	const stdio = normalizeStdio(options);
	const [stdinStreams, ...otherStreamsGroups] = stdio.map((stdioOption, fdNumber) => getStdioStreams(stdioOption, fdNumber));
	const stdioStreamsGroups = [[...stdinStreams, ...handleInputOptions(options)], ...otherStreamsGroups]
		.map(stdioStreams => validateStreams(stdioStreams))
		.map(stdioStreams => addStreamDirection(stdioStreams))
		.map(stdioStreams => handleStreamsVerbose({stdioStreams, options, isSync, stdioState, verboseInfo}))
		.map(stdioStreams => handleStreamsLines(stdioStreams, options, isSync))
		.map(stdioStreams => handleStreamsEncoding(stdioStreams, options, isSync))
		.map(stdioStreams => normalizeGenerators(stdioStreams))
		.map(stdioStreams => addStreamsProperties(stdioStreams, addProperties));
	options.stdio = forwardStdio(stdioStreamsGroups);
	return {stdioStreamsGroups, stdioState};
};

// We make sure passing an array with a single item behaves the same as passing that item without an array.
// This is what users would expect.
// For example, `stdout: ['ignore']` behaves the same as `stdout: 'ignore'`.
const getStdioStreams = (stdioOption, fdNumber) => {
	const optionName = getOptionName(fdNumber);
	const stdioOptions = Array.isArray(stdioOption) ? stdioOption : [stdioOption];
	const rawStdioStreams = stdioOptions.map(stdioOption => getStdioStream(stdioOption, optionName, fdNumber));
	const stdioStreams = filterDuplicates(rawStdioStreams);
	const isStdioArray = stdioStreams.length > 1;
	validateStdioArray(stdioStreams, isStdioArray, optionName);
	return stdioStreams.map(stdioStream => handleNativeStream(stdioStream, isStdioArray));
};

const getOptionName = fdNumber => KNOWN_OPTION_NAMES[fdNumber] ?? `stdio[${fdNumber}]`;
const KNOWN_OPTION_NAMES = ['stdin', 'stdout', 'stderr'];

const getStdioStream = (stdioOption, optionName, fdNumber) => {
	const type = getStdioOptionType(stdioOption, optionName);
	return {type, value: stdioOption, optionName, fdNumber};
};

const filterDuplicates = stdioStreams => stdioStreams.filter((stdioStreamOne, indexOne) =>
	stdioStreams.every((stdioStreamTwo, indexTwo) =>
		stdioStreamOne.value !== stdioStreamTwo.value || indexOne >= indexTwo || stdioStreamOne.type === 'generator'));

const validateStdioArray = (stdioStreams, isStdioArray, optionName) => {
	if (stdioStreams.length === 0) {
		throw new TypeError(`The \`${optionName}\` option must not be an empty array.`);
	}

	if (!isStdioArray) {
		return;
	}

	for (const {value, optionName} of stdioStreams) {
		if (INVALID_STDIO_ARRAY_OPTIONS.has(value)) {
			throw new Error(`The \`${optionName}\` option must not include \`${value}\`.`);
		}
	}
};

// Using those `stdio` values together with others for the same stream does not make sense, so we make it fail.
// However, we do allow it if the array has a single item.
const INVALID_STDIO_ARRAY_OPTIONS = new Set(['ignore', 'ipc']);

const validateStreams = stdioStreams => {
	for (const stdioStream of stdioStreams) {
		validateFileStdio(stdioStream);
	}

	return stdioStreams;
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

// Some `stdio` values require Execa to create streams.
// For example, file paths create file read/write streams.
// Those transformations are specified in `addProperties`, which is both direction-specific and type-specific.
const addStreamsProperties = (stdioStreams, addProperties) => stdioStreams.map(stdioStream => ({
	...stdioStream,
	...addProperties[stdioStream.direction][stdioStream.type]?.(stdioStream),
}));
