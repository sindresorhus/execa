import mergeStreams from '@sindresorhus/merge-streams';
import {waitForSubprocessStream} from './subprocess.js';

// `all` interleaves `stdout` and `stderr`
export const makeAllStream = ({stdout, stderr}, {all}) => all && (stdout || stderr)
	? mergeStreams([stdout, stderr].filter(Boolean))
	: undefined;

// Read the contents of `subprocess.all` and|or wait for its completion
export const waitForAllStream = ({subprocess, encoding, buffer, maxBuffer, lines, stripFinalNewline, verboseInfo, streamInfo}) => waitForSubprocessStream({
	stream: subprocess.all,
	fdNumber: 1,
	encoding,
	buffer,
	maxBuffer: maxBuffer[1] + maxBuffer[2],
	lines,
	isAll: true,
	allMixed: getAllMixed(subprocess),
	stripFinalNewline,
	verboseInfo,
	streamInfo,
});

// When `subprocess.stdout` is in objectMode but not `subprocess.stderr` (or the opposite), we need to use both:
//  - `getStreamAsArray()` for the chunks in objectMode, to return as an array without changing each chunk
//  - `getStreamAsArrayBuffer()` or `getStream()` for the chunks not in objectMode, to convert them from Buffers to string or Uint8Array
// We do this by emulating the Buffer -> string|Uint8Array conversion performed by `get-stream` with our own, which is identical.
const getAllMixed = ({all, stdout, stderr}) => all
	&& stdout
	&& stderr
	&& stdout.readableObjectMode !== stderr.readableObjectMode;
