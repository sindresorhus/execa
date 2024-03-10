import {ChildProcess} from 'node:child_process';
import {PassThrough} from 'node:stream';
import {cleanupStdioStreams} from '../stdio/async.js';
import {makeEarlyError} from './error.js';
import {handleResult} from './output.js';

// When the subprocess fails to spawn.
// We ensure the returned error is always both a promise and a subprocess.
export const handleEarlyError = ({error, command, escapedCommand, stdioStreamsGroups, options, startTime, verboseInfo}) => {
	cleanupStdioStreams(stdioStreamsGroups);

	const subprocess = new ChildProcess();
	createDummyStreams(subprocess, stdioStreamsGroups);

	const earlyError = makeEarlyError({error, command, escapedCommand, stdioStreamsGroups, options, startTime});
	const promise = handleDummyPromise(earlyError, verboseInfo, options);
	return {subprocess, promise};
};

const createDummyStreams = (subprocess, stdioStreamsGroups) => {
	const stdin = createDummyStream();
	const stdout = createDummyStream();
	const stderr = createDummyStream();
	const extraStdio = Array.from({length: stdioStreamsGroups.length - 3}, createDummyStream);
	const all = createDummyStream();
	const stdio = [stdin, stdout, stderr, ...extraStdio];
	Object.assign(subprocess, {stdin, stdout, stderr, all, stdio});
};

const createDummyStream = () => {
	const stream = new PassThrough();
	stream.end();
	return stream;
};

const handleDummyPromise = async (error, verboseInfo, options) => handleResult(error, verboseInfo, options);
