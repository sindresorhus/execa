import {createWriteStream} from 'node:fs';
import {ChildProcess} from 'node:child_process';
import {isWritableStream} from 'is-stream';

const isExecaChildProcess = target => target instanceof ChildProcess && isWritableStream(target.stdin) && typeof target.then === 'function';

const pipeToTarget = (spawned, streamName, target) => {
	if (typeof target === 'string') {
		spawned[streamName].pipe(createWriteStream(target));
		return spawned;
	}

	if (isWritableStream(target)) {
		spawned[streamName].pipe(target);
		return spawned;
	}

	if (isExecaChildProcess(target)) {
		spawned[streamName].pipe(target.stdin);
		return target;
	}

	throw new TypeError('The second argument must be a string, a stream or an Execa child process.');
};

export const addPipeMethods = spawned => {
	if (spawned.stdout !== null) {
		spawned.pipeStdout = pipeToTarget.bind(undefined, spawned, 'stdout');
	}

	if (spawned.stderr !== null) {
		spawned.pipeStderr = pipeToTarget.bind(null, spawned, 'stderr');
	}

	if (spawned.all !== undefined) {
		spawned.pipeAll = pipeToTarget.bind(null, spawned, 'all');
	}
};
