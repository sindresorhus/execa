import {Writable} from 'node:stream';
import {callbackify} from 'node:util';
import {getToStream} from '../arguments/fd-options.js';
import {isStreamAbort} from '../resolve/wait-stream.js';
import {copyOptions} from '../utils/options.js';
import {addConcurrentStream, waitForConcurrentStreams} from './concurrent.js';
import {
	safeWaitForSubprocessStdout,
	waitForSubprocessStdin,
	throwDestroyError,
	destroyOtherStream,
} from './shared.js';

// Create a `Writable` stream that forwards to `stdin` and awaits the subprocess
export const createWritable = ({subprocess, concurrentStreams}, options) => {
	const {to} = copyOptions(options);
	// Retrieve `stdin` (or other stream depending on `to`)
	const subprocessStdin = getToStream(subprocess, to);
	const {waitWritableFinal, waitWritableDestroy} = addWritableConcurrentStreams(concurrentStreams, subprocessStdin);
	const writable = new Writable({
		...getWritableMethods(subprocessStdin, subprocess, waitWritableFinal),
		destroy: callbackify(onWritableDestroy.bind(undefined, {
			subprocessStdin,
			subprocess,
			waitWritableFinal,
			waitWritableDestroy,
		})),
		highWaterMark: subprocessStdin.writableHighWaterMark,
		objectMode: subprocessStdin.writableObjectMode,
	});
	onStdinFinished(subprocessStdin, writable, undefined, subprocess);
	return writable;
};

// Register both writable lifecycle waits for an already validated stream.
export const addWritableConcurrentStreams = (concurrentStreams, subprocessStdin) => {
	const waitWritableFinal = addConcurrentStream(concurrentStreams, subprocessStdin, 'writableFinal');
	const waitWritableDestroy = addConcurrentStream(concurrentStreams, subprocessStdin, 'writableDestroy');
	return {waitWritableFinal, waitWritableDestroy};
};

export const getWritableMethods = (subprocessStdin, subprocess, waitWritableFinal) => ({
	write: onWrite.bind(undefined, subprocessStdin),
	final: callbackify(onWritableFinal.bind(undefined, subprocessStdin, subprocess, waitWritableFinal)),
});

// Forwards data from `writable` to `stdin`
const onWrite = (subprocessStdin, chunk, encoding, done) => {
	if (subprocessStdin.write(chunk, encoding)) {
		done();
	} else {
		subprocessStdin.once('drain', done);
	}
};

// Ensures that the writable `final` and readable `end` events awaits the subprocess.
// Like this, any subprocess failure is propagated as a stream `error` event, instead of being lost.
// The user does not need to `await` the subprocess anymore, but now needs to await the stream completion or error.
// When multiple writables are targeting the same stream, they wait for each other, unless the subprocess ends first.
const onWritableFinal = async (subprocessStdin, subprocess, waitWritableFinal) => {
	if (!await waitForConcurrentStreams(waitWritableFinal, subprocess)) {
		return;
	}

	if (subprocessStdin.writable) {
		subprocessStdin.end();
	}

	await subprocess;
};

// When `subprocess.stdin` ends/aborts/errors, do the same on `writable`.
export const onStdinFinished = async (subprocessStdin, writable, subprocessStdout, subprocess) => {
	try {
		await waitForSubprocessStdin(subprocessStdin);
		await subprocess;
		if (writable.writable) {
			writable.end();
		}
	} catch (error) {
		await safeWaitForSubprocessStdout(subprocessStdout);
		// `writable.writable` is already `false` once `writable.end()` is called, although its pending writes still wait for `stdin`
		destroyOtherStream(writable, !writable.writableFinished, await getSubprocessError(subprocess, error));
	}
};

const getSubprocessError = async (subprocess, error) => {
	if (!shouldUseSubprocessError(error)) {
		return error;
	}

	try {
		await subprocess;
	} catch (subprocessError) {
		return subprocessError;
	}

	return error;
};

// `EPIPE` happens when the subprocess fails without reading its `stdin`, e.g. when it fails to spawn
const shouldUseSubprocessError = error => error === undefined
	|| isStreamAbort(error)
	|| error.code === 'EPIPE';

// When `writable` aborts/errors, do the same on `subprocess.stdin`
export const onWritableDestroy = async ({subprocessStdin, subprocess, waitWritableFinal, waitWritableDestroy}, error) => {
	await waitForConcurrentStreams(waitWritableFinal, subprocess);
	if (await waitForConcurrentStreams(waitWritableDestroy, subprocess)) {
		destroyOtherWritable(subprocessStdin, error);
		await subprocess;
	}

	throwDestroyError(error);
};

const destroyOtherWritable = (stream, error) => {
	destroyOtherStream(stream, stream.writable, error);
};
