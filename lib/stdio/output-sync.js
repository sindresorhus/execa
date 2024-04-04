import {writeFileSync} from 'node:fs';
import {joinToString, joinToUint8Array, bufferToUint8Array} from './uint-array.js';
import {getGenerators, runGeneratorsSync} from './generator.js';
import {FILE_TYPES} from './type.js';

// Apply `stdout`/`stderr` options, after spawning, in sync mode
export const transformOutputSync = (fileDescriptors, {output}, options) => {
	if (output === null) {
		return {output: Array.from({length: 3})};
	}

	const state = {};
	const transformedOutput = output.map((result, fdNumber) =>
		transformOutputResultSync({result, fileDescriptors, fdNumber, state}, options));
	return {output: transformedOutput, ...state};
};

const transformOutputResultSync = ({result, fileDescriptors, fdNumber, state}, {buffer, encoding, lines}) => {
	if (result === null) {
		return result;
	}

	const selectedFileDescriptors = fileDescriptors.filter(fileDescriptor => fileDescriptor.fdNumber === fdNumber && fileDescriptor.direction === 'output');
	const allStdioItems = selectedFileDescriptors.flatMap(({stdioItems}) => stdioItems);
	const allOutputLines = selectedFileDescriptors.map(({outputLines}) => outputLines);
	const uint8ArrayResult = bufferToUint8Array(result);
	const generators = getGenerators(allStdioItems);
	const chunks = runOutputGeneratorsSync([uint8ArrayResult], generators, state);
	const {serializedResult, finalResult} = serializeChunks({chunks, generators, allOutputLines, encoding, lines});
	const returnedResult = buffer ? finalResult : undefined;

	try {
		if (state.error === undefined) {
			writeToFiles(serializedResult, allStdioItems);
		}

		return returnedResult;
	} catch (error) {
		state.error = error;
		return returnedResult;
	}
};

const runOutputGeneratorsSync = (chunks, generators, state) => {
	try {
		return runGeneratorsSync(chunks, generators);
	} catch (error) {
		state.error = error;
		return chunks;
	}
};

const serializeChunks = ({chunks, generators, allOutputLines, encoding, lines}) => {
	if (generators.at(-1)?.value?.readableObjectMode) {
		return {finalResult: chunks};
	}

	const serializedResult = encoding === 'buffer' ? joinToUint8Array(chunks) : joinToString(chunks, true);
	const finalResult = lines ? allOutputLines.flat() : serializedResult;
	return {serializedResult, finalResult};
};

const writeToFiles = (serializedResult, allStdioItems) => {
	for (const {type, path} of allStdioItems) {
		if (FILE_TYPES.has(type)) {
			writeFileSync(path, serializedResult);
		}
	}
};
