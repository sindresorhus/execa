import {ChildProcess} from 'node:child_process';
import {PassThrough, Readable, Writable, Duplex} from 'node:stream';
import {cleanupStdioStreams} from '../stdio/async.js';
import {makeEarlyError} from './error.js';
import {handleResult} from './output.js';

// When the subprocess fails to spawn.
// We ensure the returned error is always both a promise and a subprocess.
export const handleEarlyError = ({error, command, escapedCommand, stdioStreamsGroups, options, startTime, verboseInfo}) => {
	cleanupStdioStreams(stdioStreamsGroups);

	const subprocess = new ChildProcess();
	createDummyStreams(subprocess, stdioStreamsGroups);
	Object.assign(subprocess, {readable, writable, duplex});

	const earlyError = makeEarlyError({error, command, escapedCommand, stdioStreamsGroups, options, startTime, isSync: false});
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

const readable = () => new Readable({read() {}});
const writable = () => new Writable({write() {}});
const duplex = () => new Duplex({read() {}, write() {}});

const handleDummyPromise = async (error, verboseInfo, options) => handleResult(error, verboseInfo, options);
