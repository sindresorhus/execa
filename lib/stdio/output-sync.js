import {writeFileSync} from 'node:fs';
import {joinToString, joinToUint8Array, bufferToUint8Array, isUint8Array, concatUint8Arrays} from './uint-array.js';
import {getGenerators, runGeneratorsSync} from './generator.js';
import {splitLinesSync} from './split.js';
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

const transformOutputResultSync = ({result, fileDescriptors, fdNumber, state}, {buffer, encoding, lines, stripFinalNewline}) => {
	if (result === null) {
		return;
	}

	const {stdioItems, objectMode} = fileDescriptors[fdNumber];
	const uint8ArrayResult = bufferToUint8Array(result);
	const generators = getGenerators(stdioItems);
	const chunks = runOutputGeneratorsSync([uint8ArrayResult], generators, encoding, state);
	const {serializedResult, finalResult} = serializeChunks({chunks, objectMode, encoding, lines, stripFinalNewline});
	const returnedResult = buffer ? finalResult : undefined;

	try {
		if (state.error === undefined) {
			writeToFiles(serializedResult, stdioItems);
		}

		return returnedResult;
	} catch (error) {
		state.error = error;
		return returnedResult;
	}
};

const runOutputGeneratorsSync = (chunks, generators, encoding, state) => {
	try {
		return runGeneratorsSync(chunks, generators, encoding);
	} catch (error) {
		state.error = error;
		return chunks;
	}
};

const serializeChunks = ({chunks, objectMode, encoding, lines, stripFinalNewline}) => {
	if (objectMode) {
		return {finalResult: chunks};
	}

	if (encoding === 'buffer') {
		const serializedResult = joinToUint8Array(chunks);
		return {serializedResult, finalResult: serializedResult};
	}

	const serializedResult = joinToString(chunks, encoding);
	if (lines) {
		return {serializedResult, finalResult: splitLinesSync(serializedResult, !stripFinalNewline)};
	}

	return {serializedResult, finalResult: serializedResult};
};

const writeToFiles = (serializedResult, stdioItems) => {
	for (const {type, path} of stdioItems) {
		if (FILE_TYPES.has(type)) {
			writeFileSync(path, serializedResult);
		}
	}
};

export const getAllSync = ([, stdout, stderr], {all}) => {
	if (!all) {
		return;
	}

	if (stdout === undefined) {
		return stderr;
	}

	if (stderr === undefined) {
		return stdout;
	}

	if (Array.isArray(stdout)) {
		return Array.isArray(stderr) ? [...stdout, ...stderr] : [...stdout, stderr];
	}

	if (Array.isArray(stderr)) {
		return [stdout, ...stderr];
	}

	if (isUint8Array(stdout) && isUint8Array(stderr)) {
		return concatUint8Arrays([stdout, stderr]);
	}

	return `${stdout}${stderr}`;
};
