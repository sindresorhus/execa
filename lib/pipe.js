import {createWriteStream, createReadStream} from 'node:fs';
import {ChildProcess} from 'node:child_process';
import {isWritableStream, isReadableStream} from 'is-stream';

const isExecaChildProcess = target => target instanceof ChildProcess && typeof target.then === 'function';

const pipeToTarget = (spawned, streamName, target) => {
	if (typeof target === 'string') {
		spawned[streamName].pipe(createWriteStream(target));
		return spawned;
	}

	if (isWritableStream(target)) {
		spawned[streamName].pipe(target);
		return spawned;
	}

	if (!isExecaChildProcess(target)) {
		throw new TypeError('The second argument must be a string, a stream or an Execa child process.');
	}

	if (!isWritableStream(target.stdin)) {
		throw new TypeError('The target child process\'s stdin must be available.');
	}

	spawned[streamName].pipe(target.stdin);
	return target;
};

const pipeFromSource = (spawned, source) => {
	if (typeof source === 'string') {
		createReadStream(source).pipe(spawned.stdin);
		return spawned;
	}

	if (isReadableStream(source)) {
		source.pipe(spawned.stdin);
		return spawned;
	}

	if (!isExecaChildProcess(source)) {
		throw new TypeError('The second argument must be a string, a stream or an Execa child process.');
	}

	if (!isReadableStream(source.stdout)) {
		throw new TypeError('The source child process\'s stdout must be available.');
	}

	source.stdout.pipe(spawned.stdin);
	return spawned;
};

export const addPipeMethods = spawned => {
	if (spawned.stdout !== null) {
		spawned.pipeStdout = pipeToTarget.bind(undefined, spawned, 'stdout');
	}

	if (spawned.stderr !== null) {
		spawned.pipeStderr = pipeToTarget.bind(undefined, spawned, 'stderr');
	}

	if (spawned.all !== undefined) {
		spawned.pipeAll = pipeToTarget.bind(undefined, spawned, 'all');
	}

	if (spawned.stdin !== null) {
		spawned.pipeToStdinFrom = pipeFromSource.bind(undefined, spawned);
	}
};
