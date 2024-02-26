import {ChildProcess} from 'node:child_process';
import {PassThrough} from 'node:stream';
import {cleanupStdioStreams} from '../stdio/async.js';
import {makeEarlyError} from './error.js';

// When the child process fails to spawn.
// We ensure the returned error is always both a promise and a child process.
export const handleEarlyError = ({error, command, escapedCommand, stdioStreamsGroups, options}) => {
	cleanupStdioStreams(stdioStreamsGroups);

	const spawned = new ChildProcess();
	createDummyStreams(spawned);

	const errorInstance = makeEarlyError({error, command, escapedCommand, stdioStreamsGroups, options});
	const promise = handleDummyPromise(errorInstance, options);
	return {spawned, promise, options, stdioStreamsGroups};
};

const createDummyStreams = spawned => {
	const stdin = createDummyStream();
	const stdout = createDummyStream();
	const stderr = createDummyStream();
	const all = createDummyStream();
	const stdio = [stdin, stdout, stderr];
	Object.assign(spawned, {stdin, stdout, stderr, all, stdio});
};

const createDummyStream = () => {
	const stream = new PassThrough();
	stream.end();
	return stream;
};

const handleDummyPromise = async (error, {reject}) => {
	if (reject) {
		throw error;
	}

	return error;
};
