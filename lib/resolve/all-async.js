import mergeStreams from '@sindresorhus/merge-streams';
import {setAllStream} from '../utils/standard-stream.js';
import {resumeStream} from '../io/contents.js';
import {waitForSubprocessStream} from './stdio.js';

// `all` interleaves `stdout` and `stderr`
export const makeAllStream = ({stdout, stderr}, {all}) => {
	if (!all) {
		return;
	}

	const fileDescriptors = [[stdout, 1], [stderr, 2]].filter(([stream]) => stream);
	if (fileDescriptors.length === 0) {
		return;
	}

	return setAllStream(mergeStreams(fileDescriptors.map(([stream]) => stream)));
};

// The file descriptors which `result.all` contains, which the `all` options must follow
// Unlike `subprocess.all`, this excludes the file descriptors which are not buffered, since their output is not included
export const getAllFds = ({stdout, stderr}, [, bufferStdout, bufferStderr]) => [
	...(stdout !== null && bufferStdout ? [1] : []),
	...(stderr !== null && bufferStderr ? [2] : []),
];

// Read the contents of `subprocess.all` and|or wait for its completion
export const waitForAllStream = ({subprocess, all, encoding, buffer, maxBuffer, lines, stripFinalNewline, verboseInfo, streamInfo}) => {
	const {stream, buffer: bufferAll, drainedStream} = getAllStream(subprocess, all, buffer);
	return Promise.all([
		waitForSubprocessStream({
			stream,
			buffer: bufferAll,
			fdNumber: 'all',
			encoding,
			maxBuffer: maxBuffer[1] + maxBuffer[2],
			lines: lines[1] || lines[2],
			allFds: getAllFds(subprocess, buffer),
			allMixed: getAllMixed(subprocess, all),
			stripFinalNewline,
			verboseInfo,
			streamInfo,
		}),
		// When only one of the two file descriptors is buffered, its stream is read instead of the merged one.
		// The merged one is then drained, otherwise it would apply backpressure on that file descriptor and hang the subprocess.
		drainedStream === undefined ? undefined : resumeStream(drainedStream),
	]).then(([output]) => output);
};

const getAllStream = ({stdout, stderr}, all, [, bufferStdout, bufferStderr]) => {
	const buffer = bufferStdout || bufferStderr;
	if (!buffer) {
		return {stream: all, buffer};
	}

	if (!all) {
		return {stream: undefined, buffer};
	}

	if (!bufferStdout) {
		return {stream: stderr, buffer, drainedStream: all};
	}

	if (!bufferStderr) {
		return {stream: stdout, buffer, drainedStream: all};
	}

	return {stream: all, buffer};
};

// When `subprocess.stdout` is in objectMode but not `subprocess.stderr` (or the opposite), we need to use both:
//  - `getStreamAsArray()` for the chunks in objectMode, to return as an array without changing each chunk
//  - `getStreamAsArrayBuffer()` or `getStream()` for the chunks not in objectMode, to convert them from Buffers to string or Uint8Array
// We do this by emulating the Buffer -> string|Uint8Array conversion performed by `get-stream` with our own, which is identical.
const getAllMixed = ({stdout, stderr}, all) => all
	&& stdout
	&& stderr
	&& stdout.readableObjectMode !== stderr.readableObjectMode;
