import {ChildProcess} from 'node:child_process';
import {isWritableStream} from 'is-stream';
import {STANDARD_STREAMS_ALIASES} from './stdio/utils.js';

export const pipeToProcess = ({spawned, stdioStreamsGroups, options}, targetProcess, streamName) => {
	validateTargetProcess(targetProcess);

	const streamIndex = getStreamIndex(streamName);
	const inputStream = getInputStream(spawned, streamIndex, stdioStreamsGroups);
	validateStdioOption(inputStream, streamIndex, streamName, options);

	inputStream.pipe(targetProcess.stdin);
	return targetProcess;
};

const validateTargetProcess = targetProcess => {
	if (!isExecaChildProcess(targetProcess)) {
		throw new TypeError('The first argument must be an Execa child process.');
	}

	if (!isWritableStream(targetProcess.stdin)) {
		throw new TypeError('The target child process\'s stdin must be available.');
	}
};

const isExecaChildProcess = target => target instanceof ChildProcess && typeof target.then === 'function';

const getStreamIndex = (streamName = 'stdout') => STANDARD_STREAMS_ALIASES.includes(streamName)
	? STANDARD_STREAMS_ALIASES.indexOf(streamName)
	: streamName;

const getInputStream = (spawned, streamIndex, stdioStreamsGroups) => {
	if (streamIndex === 'all') {
		return spawned.all;
	}

	if (streamIndex === 0) {
		throw new TypeError('The second argument must not be "stdin".');
	}

	if (!Number.isInteger(streamIndex) || streamIndex < 0) {
		throw new TypeError(`The second argument must not be "${streamIndex}".
It must be "stdout", "stderr", "all" or a file descriptor integer.
It is optional and defaults to "stdout".`);
	}

	const stdioStreams = stdioStreamsGroups[streamIndex];
	if (stdioStreams === undefined) {
		throw new TypeError(`The second argument must not be ${streamIndex}: that file descriptor does not exist.
Please set the "stdio" option to ensure that file descriptor exists.`);
	}

	if (stdioStreams[0].direction === 'input') {
		throw new TypeError(`The second argument must not be ${streamIndex}: it must be a readable stream, not writable.`);
	}

	return spawned.stdio[streamIndex];
};

const validateStdioOption = (inputStream, streamIndex, streamName, options) => {
	if (inputStream !== null && inputStream !== undefined) {
		return;
	}

	if (streamIndex === 'all' && !options.all) {
		throw new TypeError('The "all" option must be true to use `childProcess.pipe(targetProcess, "all")`.');
	}

	const {optionName, optionValue} = getInvalidStdioOption(streamIndex, options);
	const pipeArgument = streamName === undefined ? '' : `, ${streamName}`;
	throw new TypeError(`The \`${optionName}: ${serializeOptionValue(optionValue)}\` option is incompatible with using \`childProcess.pipe(targetProcess${pipeArgument})\`.
Please set this option with "pipe" instead.`);
};

const getInvalidStdioOption = (streamIndex, {stdout, stderr, stdio}) => {
	const usedIndex = streamIndex === 'all' ? 1 : streamIndex;

	if (usedIndex === 1 && stdout !== undefined) {
		return {optionName: 'stdout', optionValue: stdout};
	}

	if (usedIndex === 2 && stderr !== undefined) {
		return {optionName: 'stderr', optionValue: stderr};
	}

	return {optionName: `stdio[${usedIndex}]`, optionValue: stdio[usedIndex]};
};

const serializeOptionValue = optionValue => {
	if (typeof optionValue === 'string') {
		return `"${optionValue}"`;
	}

	return typeof optionValue === 'number' ? `${optionValue}` : 'Stream';
};
