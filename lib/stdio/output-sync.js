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
		transformOutputResultSync({result, fileDescriptors, fdNumber, options, state}));
	return {output: transformedOutput, ...state};
};

const transformOutputResultSync = ({result, fileDescriptors, fdNumber, options, state}) => {
	if (result === null) {
		return result;
	}

	const allStdioItems = fileDescriptors
		.filter(fileDescriptor => fileDescriptor.fdNumber === fdNumber && fileDescriptor.direction === 'output')
		.flatMap(({stdioItems}) => stdioItems);
	const uint8ArrayResult = bufferToUint8Array(result);
	const generators = getGenerators(allStdioItems);
	const chunks = runOutputGeneratorsSync([uint8ArrayResult], generators, state);
	const transformedResult = serializeChunks(chunks, generators, options);

	try {
		if (state.error === undefined) {
			writeToFiles(transformedResult, allStdioItems);
		}

		return transformedResult;
	} catch (error) {
		state.error = error;
		return transformedResult;
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

const serializeChunks = (chunks, generators, {encoding}) => {
	if (generators.at(-1)?.value?.readableObjectMode) {
		return chunks;
	}

	return encoding === 'buffer' ? joinToUint8Array(chunks) : joinToString(chunks, true);
};

const writeToFiles = (transformedResult, allStdioItems) => {
	for (const {type, path} of allStdioItems) {
		if (type === 'fileUrl' || type === 'filePath') {
			writeFileSync(path, transformedResult);
		}
	}
};
