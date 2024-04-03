import {writeFileSync} from 'node:fs';
import {joinToString, joinToUint8Array, bufferToUint8Array} from './uint-array.js';
import {getGenerators, runGeneratorsSync} from './generator.js';

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

const transformOutputResultSync = ({result, fileDescriptors, fdNumber, state}, {encoding, lines}) => {
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

	try {
		if (state.error === undefined) {
			writeToFiles(serializedResult, allStdioItems);
		}

		return finalResult;
	} catch (error) {
		state.error = error;
		return finalResult;
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

const writeToFiles = (transformedResult, allStdioItems) => {
	for (const {type, path} of allStdioItems) {
		if (type === 'fileUrl' || type === 'filePath') {
			writeFileSync(path, transformedResult);
		}
	}
};
