import {ChildProcess} from 'node:child_process';
import {callbackify} from 'node:util';
import {
	PassThrough,
	Readable,
	Writable,
	Duplex,
} from 'node:stream';
import {cleanupCustomStreams} from '../stdio/handle.js';
import {makeEarlyError} from './result.js';
import {handleResult} from './reject.js';

// When the subprocess fails to spawn.
// We ensure the returned error is always both a promise and a subprocess.
export const handleEarlyError = ({error, command, escapedCommand, fileDescriptors, options, startTime, verboseInfo}) => {
	cleanupCustomStreams(fileDescriptors);

	const subprocess = new ChildProcess();
	// The subprocess never spawned, so there is no process to signal.
	// `ChildProcess.prototype.kill()` would signal the current process group instead, since its process id is `0`.
	subprocess.kill = () => false;
	const all = createDummyStreams(subprocess, fileDescriptors);

	const earlyError = makeEarlyError({
		error,
		command,
		escapedCommand,
		fileDescriptors,
		options,
		startTime,
		isSync: false,
	});
	const promise = handleDummyPromise(earlyError, verboseInfo, options);
	return {
		subprocess,
		promise,
		all: options.all ? all : undefined,
		convertedStreams: getConvertedStreams(promise),
	};
};

const createDummyStreams = (subprocess, fileDescriptors) => {
	const stdin = createDummyStream();
	const stdout = createDummyStream();
	const stderr = createDummyStream();
	const extraStdio = Array.from({length: fileDescriptors.length - 3}, createDummyStream);
	const all = createDummyStream();
	const stdio = [stdin, stdout, stderr, ...extraStdio];
	Object.assign(subprocess, {
		stdin,
		stdout,
		stderr,
		stdio,
	});
	return all;
};

const createDummyStream = () => {
	const stream = new PassThrough();
	stream.end();
	return stream;
};

// The subprocess never started, so those streams have no contents.
// Like when the subprocess did start, they end once its promise resolves, or error with its error, as opposed to hanging forever.
const getConvertedStreams = promise => {
	const waitForPromise = async () => {
		await promise;
	};

	const endReadable = function () {
		callbackify(waitForPromise)(error => {
			if (error) {
				this.destroy(error);
			} else {
				this.push(null);
			}
		});
	};

	const endWritable = callbackify(waitForPromise);
	const writeWritable = (chunk, encoding, done) => {
		endWritable(done);
	};

	const readable = () => new Readable({read: endReadable});
	const writable = () => new Writable({write: writeWritable, final: endWritable});
	const duplex = () => new Duplex({read: endReadable, write: writeWritable, final: endWritable});
	const iterable = () => readable()[Symbol.asyncIterator]();

	return {
		readable,
		writable,
		duplex,
		readableStream: () => Readable.toWeb(readable()),
		writableStream: () => Writable.toWeb(writable()),
		transformStream: () => Duplex.toWeb(duplex()),
		iterable,
		[Symbol.asyncIterator]: iterable,
	};
};

const handleDummyPromise = async (error, verboseInfo, options) => handleResult(error, verboseInfo, options);
