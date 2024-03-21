import mergeStreams from '@sindresorhus/merge-streams';
import {generatorToDuplexStream} from '../stdio/generator.js';
import {waitForSubprocessStream} from './subprocess.js';

// `all` interleaves `stdout` and `stderr`
export const makeAllStream = ({stdout, stderr}, {all}) => all && (stdout || stderr)
	? mergeStreams([stdout, stderr].filter(Boolean))
	: undefined;

// Read the contents of `subprocess.all` and|or wait for its completion
export const waitForAllStream = ({subprocess, encoding, buffer, maxBuffer, streamInfo}) => waitForSubprocessStream({
	stream: getAllStream(subprocess, encoding),
	subprocess,
	fdNumber: 1,
	encoding,
	buffer,
	maxBuffer: maxBuffer * 2,
	streamInfo,
});

// When `subprocess.stdout` is in objectMode but not `subprocess.stderr` (or the opposite), we need to use both:
//  - `getStreamAsArray()` for the chunks in objectMode, to return as an array without changing each chunk
//  - `getStreamAsArrayBuffer()` or `getStream()` for the chunks not in objectMode, to convert them from Buffers to string or Uint8Array
// We do this by emulating the Buffer -> string|Uint8Array conversion performed by `get-stream` with our own, which is identical.
const getAllStream = ({all, stdout, stderr}, encoding) => all && stdout && stderr && stdout.readableObjectMode !== stderr.readableObjectMode
	? all.pipe(generatorToDuplexStream({value: allStreamGenerator, encoding, forceEncoding: true}).value)
	: all;

const allStreamGenerator = {
	* final() {},
	writableObjectMode: true,
	readableObjectMode: true,
};
