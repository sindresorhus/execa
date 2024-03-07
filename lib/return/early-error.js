import {ChildProcess} from 'node:child_process';
import {PassThrough} from 'node:stream';
import {cleanupStdioStreams} from '../stdio/async.js';
import {makeEarlyError} from './error.js';
import {handleResult} from './output.js';

// When the child process fails to spawn.
// We ensure the returned error is always both a promise and a child process.
export const handleEarlyError = ({error, command, escapedCommand, stdioStreamsGroups, options, startTime, verboseInfo}) => {
	cleanupStdioStreams(stdioStreamsGroups);

	const spawned = new ChildProcess();
	createDummyStreams(spawned);

	const earlyError = makeEarlyError({error, command, escapedCommand, stdioStreamsGroups, options, startTime});
	const promise = handleDummyPromise(earlyError, verboseInfo, options);
	return {spawned, promise};
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

const handleDummyPromise = async (error, verboseInfo, options) => handleResult(error, verboseInfo, options);
