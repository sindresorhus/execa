import {ChildProcess} from 'node:child_process';
import {PassThrough} from 'node:stream';
import {mergePromise} from '../promise.js';
import {dummyPipeToProcess} from '../pipe/setup.js';
import {cleanupStdioStreams} from '../stdio/async.js';
import {makeAllStream} from '../stream/all.js';
import {makeEarlyError} from './error.js';

// When the child process fails to spawn.
// We ensure the returned error is always both a promise and a child process.
export const handleEarlyError = ({error, command, escapedCommand, stdioStreamsGroups, options}) => {
	cleanupStdioStreams(stdioStreamsGroups);
	const spawned = createDummyProcess(options);
	const errorInstance = makeEarlyError({error, command, escapedCommand, stdioStreamsGroups, options});
	mergePromise(spawned, handleDummyPromise(errorInstance, options));
	return spawned;
};

const createDummyProcess = options => {
	const spawned = new ChildProcess();
	createDummyStreams(spawned);
	spawned.all = makeAllStream(spawned, options);
	spawned.pipe = dummyPipeToProcess.bind(undefined, spawned);
	return spawned;
};

const createDummyStreams = spawned => {
	const stdin = createDummyStream();
	const stdout = createDummyStream();
	const stderr = createDummyStream();
	const stdio = [stdin, stdout, stderr];
	Object.assign(spawned, {stdin, stdout, stderr, stdio});
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
