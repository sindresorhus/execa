import {finished} from 'node:stream/promises';
import {isStreamAbort} from '../resolve/wait-stream.js';

export const safeWaitForSubprocessStdin = async subprocessStdin => {
	if (subprocessStdin === undefined) {
		return;
	}

	try {
		await waitForSubprocessStdin(subprocessStdin);
	} catch {}
};

export const safeWaitForSubprocessStdout = async subprocessStdout => {
	if (subprocessStdout === undefined) {
		return;
	}

	try {
		await waitForSubprocessStdout(subprocessStdout);
	} catch {}
};

export const waitForSubprocessStdin = async subprocessStdin => {
	await finished(subprocessStdin, {cleanup: true, readable: false, writable: true});
};

export const waitForSubprocessStdout = async subprocessStdout => {
	await finished(subprocessStdout, {cleanup: true, readable: true, writable: false});
};

// When `readable` or `writable` aborts/errors, the caller awaits the subprocess, for the reason mentioned above.
// Then, the error passed to `stream.destroy(error)` is emitted, including when the subprocess has already ended.
export const throwDestroyError = error => {
	if (error) {
		throw error;
	}
};

export const destroyOtherStream = (stream, isOpen, error) => {
	if (error && !isStreamAbort(error)) {
		stream.destroy(error);
	} else if (isOpen) {
		stream.destroy();
	}
};
