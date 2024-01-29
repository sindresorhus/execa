import {ChildProcess} from 'node:child_process';
import {isWritableStream} from 'is-stream';

const isExecaChildProcess = target => target instanceof ChildProcess && typeof target.then === 'function';

const pipeToTarget = (spawned, streamName, target) => {
	if (!isExecaChildProcess(target)) {
		throw new TypeError('The second argument must be an Execa child process.');
	}

	if (!isWritableStream(target.stdin)) {
		throw new TypeError('The target child process\'s stdin must be available.');
	}

	spawned[streamName].pipe(target.stdin);
	return target;
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
};
