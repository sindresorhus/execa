import {writeFileSync, appendFileSync} from 'node:fs';
import {shouldLogOutput, logLinesSync} from '../verbose/output.js';
import {runGeneratorsSync} from '../transform/generator.js';
import {splitLinesSync} from '../transform/split.js';
import {joinToString, joinToUint8Array, bufferToUint8Array} from '../utils/uint-array.js';
import {FILE_TYPES} from '../stdio/type.js';
import {getFileTarget} from '../stdio/duplicate.js';
import {truncateMaxBufferSync} from './max-buffer.js';

// Apply `stdout`/`stderr` options, after spawning, in sync mode
export const transformOutputSync = ({fileDescriptors, syncResult, options, verboseInfo}) => {
	const output = syncResult.output ?? getSpawnFailureOutput(options);
	const outputFiles = new Set();
	// Transforms, `verbose` and file writes apply to a single file descriptor each, so their errors must not affect the other ones
	const errors = [];
	const transformedOutput = output.map((result, fdNumber) =>
		transformOutputResultSync({
			result,
			fileDescriptors,
			fdNumber,
			errors,
			outputFiles,
			verboseInfo,
		}, options));
	return {output: transformedOutput, error: errors.find(error => error !== undefined)};
};

// When the subprocess fails to spawn, `spawnSync()` returns no output. Like with asynchronous methods, each piped output is empty instead.
// This is the output `spawnSync()` returns when the subprocess succeeds without printing anything: `stdin` and non-piped file descriptors are `null`. Input pipes on other file descriptors cannot be used with synchronous methods.
const getSpawnFailureOutput = ({stdio}) => stdio.map((stdioOption, fdNumber) => fdNumber !== 0 && stdioOption === 'pipe' ? new Uint8Array() : null);

const transformOutputResultSync = (
	{result, fileDescriptors, fdNumber, errors, outputFiles, verboseInfo},
	{buffer, encoding, lines, stripFinalNewline, maxBuffer},
) => {
	if (result === null) {
		return;
	}

	const truncatedResult = truncateMaxBufferSync(result, fdNumber, {maxBuffer, buffer});
	const uint8ArrayResult = bufferToUint8Array(truncatedResult);
	const {stdioItems, objectMode} = fileDescriptors[fdNumber];
	// Empty output must not be passed as a chunk: with a binary encoding, no line is split, so transforms would wrongly run on it
	const {chunks, error: transformError} = runOutputGeneratorsSync(uint8ArrayResult.length === 0 ? [] : [uint8ArrayResult], stdioItems, encoding);
	const {serializedResult, finalResult = serializedResult} = serializeChunks({
		chunks,
		objectMode,
		encoding,
		lines,
		stripFinalNewline,
		fdNumber,
	});

	const logError = logOutputSync({
		serializedResult,
		fdNumber,
		verboseInfo,
		encoding,
		stdioItems,
		objectMode,
	});

	const error = transformError ?? logError;
	errors.push(error);

	const returnedResult = buffer[fdNumber] ? finalResult : undefined;

	try {
		if (error === undefined) {
			writeToFiles(chunks, stdioItems, outputFiles);
		}

		return returnedResult;
	} catch (writeError) {
		errors.push(writeError);
		return returnedResult;
	}
};

// Applies transform generators to `stdout`/`stderr`
const runOutputGeneratorsSync = (chunks, stdioItems, encoding) => {
	try {
		// `error` is set, so that a polluted `Object.prototype.error` is not read when destructuring
		return {chunks: runGeneratorsSync(chunks, stdioItems, encoding, false), error: undefined};
	} catch (error) {
		return {chunks, error};
	}
};

// The contents is converted to three stages:
//  - serializedResult: used by `verbose`
//  - finalResult/returnedResult: returned as `result.std*`
const serializeChunks = ({chunks, objectMode, encoding, lines, stripFinalNewline, fdNumber}) => {
	if (objectMode) {
		return {serializedResult: chunks};
	}

	if (encoding === 'buffer') {
		return {serializedResult: joinToUint8Array(chunks)};
	}

	const serializedResult = joinToString(chunks, encoding);
	return lines[fdNumber] ? {serializedResult, finalResult: splitLinesSync(serializedResult, !stripFinalNewline[fdNumber], objectMode)} : {serializedResult};
};

const logOutputSync = ({serializedResult, fdNumber, verboseInfo, encoding, stdioItems, objectMode}) => {
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
		return error;
	}
};

// When the `std*` target is a file path/URL or a file descriptor
// Object mode cannot be used with those targets.
const writeToFiles = (chunks, stdioItems, outputFiles) => {
	const fileItems = stdioItems.filter(({type}) => FILE_TYPES.has(type));
	if (fileItems.length === 0) {
		return;
	}

	// Like with asynchronous methods, the bytes are written as is, not the text decoded with the `encoding` option, which would change them
	const contents = joinToUint8Array(chunks);
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
			appendFileSync(path, contents);
		} else {
			writeFileSync(path, contents);
		}

		outputFiles.add(path);
	}
};
