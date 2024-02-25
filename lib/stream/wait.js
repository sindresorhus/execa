import {finished} from 'node:stream/promises';

// Wraps `finished(stream)` to handle the following case:
//  - When the child process exits, Node.js automatically calls `childProcess.stdin.destroy()`, which we need to ignore.
//  - However, we still need to throw if `childProcess.stdin.destroy()` is called before child process exit.
export const waitForStream = async (stream, fdNumber, streamInfo, {isSameDirection, stopOnExit = false} = {}) => {
	const {originalStreams: [originalStdin], exitPromise} = streamInfo;

	const abortController = new AbortController();
	try {
		await Promise.race([
			...(stopOnExit || stream === originalStdin ? [exitPromise] : []),
			finished(stream, {cleanup: true, signal: abortController.signal}),
		]);
	} catch (error) {
		handleStreamError(error, fdNumber, streamInfo, isSameDirection);
	} finally {
		abortController.abort();
	}
};

// We ignore EPIPEs on writable streams and aborts on readable streams since those can happen normally.
// When one stream errors, the error is propagated to the other streams on the same file descriptor.
// Those other streams might have a different direction due to the above.
// When this happens, the direction of both the initial stream and the others should then be taken into account.
// Therefore, we keep track of which file descriptor is currently propagating stream errors.
export const handleStreamError = (error, fdNumber, streamInfo, isSameDirection) => {
	if (!shouldIgnoreStreamError(error, fdNumber, streamInfo, isSameDirection)) {
		throw error;
	}
};

const shouldIgnoreStreamError = (error, fdNumber, {stdioStreamsGroups, propagating}, isSameDirection = true) => {
	if (propagating.has(fdNumber)) {
		return isStreamEpipe(error) || isStreamAbort(error);
	}

	propagating.add(fdNumber);
	return isInputFileDescriptor(fdNumber, stdioStreamsGroups) === isSameDirection
		? isStreamEpipe(error)
		: isStreamAbort(error);
};

// Unfortunately, we cannot use the stream's class or properties to know whether it is readable or writable.
// For example, `childProcess.stdin` is technically a Duplex, but can only be used as a writable.
// Therefore, we need to use the file descriptor's direction (`stdin` is input, `stdout` is output, etc.).
// However, while `childProcess.std*` and transforms follow that direction, any stream passed the `std*` option has the opposite direction.
// For example, `childProcess.stdin` is a writable, but the `stdin` option is a readable.
export const isInputFileDescriptor = (fdNumber, stdioStreamsGroups) => stdioStreamsGroups[fdNumber][0].direction === 'input';

// When `stream.destroy()` is called without an `error` argument, stream is aborted.
// This is the only way to abort a readable stream, which can be useful in some instances.
// Therefore, we ignore this error on readable streams.
export const isStreamAbort = error => error?.code === 'ERR_STREAM_PREMATURE_CLOSE';

// When `stream.write()` is called but the underlying source has been closed, `EPIPE` is emitted.
// When piping processes, the source process usually decides when to stop piping.
// However, there are some instances when the destination does instead, such as `... | head -n1`.
// It notifies the source by using `EPIPE`.
// Therefore, we ignore this error on writable streams.
const isStreamEpipe = error => error?.code === 'EPIPE';
