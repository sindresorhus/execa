import {writeFileSync, appendFileSync} from 'node:fs';
import {shouldLogOutput, logLinesSync} from '../verbose/output.js';
import {runGeneratorsSync} from '../transform/generator.js';
import {splitLinesSync} from '../transform/split.js';
import {joinToString, joinToUint8Array, bufferToUint8Array} from '../utils/uint-array.js';
import {FILE_TYPES} from '../stdio/type.js';
import {getFileTarget} from '../stdio/duplicate.js';
import {truncateMaxBufferSync} from './max-buffer.js';

// Apply `stdout`/`stderr` options, after spawning, in sync mode
export const transformOutputSync = ({fileDescriptors, syncResult: {output}, options, verboseInfo}) => {
	if (output === null) {
		return {output: Array.from({length: 3})};
	}

	const state = {};
	const outputFiles = new Set();
	const transformedOutput = output.map((result, fdNumber) =>
		transformOutputResultSync({
			result,
			fileDescriptors,
			fdNumber,
			state,
			outputFiles,
			verboseInfo,
		}, options));
	return {output: transformedOutput, ...state};
};

const transformOutputResultSync = (
	{result, fileDescriptors, fdNumber, state, outputFiles, verboseInfo},
	{buffer, encoding, lines, stripFinalNewline, maxBuffer},
) => {
	if (result === null) {
		return;
	}

	const truncatedResult = truncateMaxBufferSync(result, fdNumber, {maxBuffer, buffer});
	const uint8ArrayResult = bufferToUint8Array(truncatedResult);
	const {stdioItems, objectMode} = fileDescriptors[fdNumber];
	const chunks = runOutputGeneratorsSync([uint8ArrayResult], stdioItems, encoding, state);
	const {serializedResult, finalResult = serializedResult} = serializeChunks({
		chunks,
		objectMode,
		encoding,
		lines,
		stripFinalNewline,
		fdNumber,
	});

	logOutputSync({
		serializedResult,
		fdNumber,
		state,
		verboseInfo,
		encoding,
		stdioItems,
		objectMode,
	});

	const returnedResult = buffer[fdNumber] ? finalResult : undefined;

	try {
		if (state.error === undefined) {
			writeToFiles(serializedResult, stdioItems, outputFiles);
		}

		return returnedResult;
	} catch (error) {
		state.error = error;
		return returnedResult;
	}
};

// Applies transform generators to `stdout`/`stderr`
const runOutputGeneratorsSync = (chunks, stdioItems, encoding, state) => {
	try {
		return runGeneratorsSync(chunks, stdioItems, encoding, false);
	} catch (error) {
		state.error = error;
		return chunks;
	}
};

// The contents is converted to three stages:
//  - serializedResult: used when the target is a file path/URL or a file descriptor (including 'inherit')
//  - finalResult/returnedResult: returned as `result.std*`
const serializeChunks = ({chunks, objectMode, encoding, lines, stripFinalNewline, fdNumber}) => {
	if (objectMode) {
		return {serializedResult: chunks};
	}

	if (encoding === 'buffer') {
		return {serializedResult: joinToUint8Array(chunks)};
	}

	const serializedResult = joinToString(chunks, encoding);
	if (lines[fdNumber]) {
		return {serializedResult, finalResult: splitLinesSync(serializedResult, !stripFinalNewline[fdNumber], objectMode)};
	}

	return {serializedResult};
};

const logOutputSync = ({serializedResult, fdNumber, state, verboseInfo, encoding, stdioItems, objectMode}) => {
	if (!shouldLogOutput({
		stdioItems,
		encoding,
		verboseInfo,
		fdNumber,
	})) {
		return;
	}

	const linesArray = splitLinesSync(serializedResult, false, objectMode);

	try {
		logLinesSync(linesArray, fdNumber, verboseInfo);
	} catch (error) {
		state.error ??= error;
	}
};

// When the `std*` target is a file path/URL or a file descriptor
const writeToFiles = (serializedResult, stdioItems, outputFiles) => {
	const fileItems = stdioItems.filter(({type}) => FILE_TYPES.has(type));
	const writtenPaths = new Set();

	for (const stdioItem of fileItems) {
		const {type, append} = stdioItem;
		// A `filePath` and a `fileUrl` can target the same file, so they must share the same key
		const path = type === 'fileNumber' ? stdioItem.path : getFileTarget(stdioItem);

		// A single file descriptor can target the same file twice, e.g. `stdout: [{file}, {file}]`.
		// Its output is a single stream, so it must only be written once.
		if (writtenPaths.has(path)) {
			continue;
		}

		writtenPaths.add(path);
		// Like with asynchronous methods, when several file descriptors target the same file, the first one decides whether it is appended to
		if (append || outputFiles.has(path)) {
			appendFileSync(path, serializedResult);
		} else {
			writeFileSync(path, serializedResult);
		}

		outputFiles.add(path);
	}
};
