import {ChildProcess} from 'node:child_process';
import {isWritableStream} from 'is-stream';

export const pipeToProcess = ({spawned, stdioStreamsGroups, options}, targetProcess, streamName = 'stdout') => {
	validateTargetProcess(targetProcess);

	const inputStream = getInputStream(spawned, streamName, stdioStreamsGroups);
	validateStdioOption(inputStream, spawned, streamName, options);

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

const getInputStream = (spawned, streamName, stdioStreamsGroups) => {
	if (VALID_STREAM_NAMES.has(streamName)) {
		return spawned[streamName];
	}

	if (streamName === 'stdin') {
		throw new TypeError('The second argument must not be "stdin".');
	}

	if (!Number.isInteger(streamName) || streamName < 0) {
		throw new TypeError(`The second argument must not be "${streamName}".
It must be "stdout", "stderr", "all" or a file descriptor integer.
It is optional and defaults to "stdout".`);
	}

	const stdioStreams = stdioStreamsGroups[streamName];
	if (stdioStreams === undefined) {
		throw new TypeError(`The second argument must not be ${streamName}: that file descriptor does not exist.
Please set the "stdio" option to ensure that file descriptor exists.`);
	}

	if (stdioStreams[0].direction === 'input') {
		throw new TypeError(`The second argument must not be ${streamName}: it must be a readable stream, not writable.`);
	}

	return spawned.stdio[streamName];
};

const VALID_STREAM_NAMES = new Set(['stdout', 'stderr', 'all']);

const validateStdioOption = (inputStream, spawned, streamName, options) => {
	if (inputStream !== null && inputStream !== undefined) {
		return;
	}

	if (streamName === 'all' && !options.all) {
		throw new TypeError('The "all" option must be true to use `childProcess.pipe(targetProcess, "all")`.');
	}

	throw new TypeError(`The "${getInvalidStdioOption(inputStream, spawned, options)}" option's value is incompatible with using \`childProcess.pipe(targetProcess)\`.
Please set this option with "pipe" instead.`);
};

const getInvalidStdioOption = (inputStream, spawned, options) => {
	if (inputStream === spawned.stdout && options.stdout !== undefined) {
		return 'stdout';
	}

	if (inputStream === spawned.stderr && options.stderr !== undefined) {
		return 'stderr';
	}

	return 'stdio';
};
