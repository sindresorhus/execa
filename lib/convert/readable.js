import {on} from 'node:events';
import {Readable} from 'node:stream';
import {callbackify} from 'node:util';
import {getReadable} from '../pipe/validate.js';
import {addConcurrentStream, waitForConcurrentStreams} from './concurrent.js';
import {
	safeWaitForSubprocessStdin,
	waitForSubprocessStdout,
	waitForSubprocess,
	destroyOtherStream,
} from './shared.js';

// Create a `Readable` stream that forwards from `stdout` and awaits the subprocess
export const createReadable = ({subprocess, concurrentStreams}, {from} = {}) => {
	const {subprocessStdout, waitReadableDestroy} = getSubprocessStdout(subprocess, from, concurrentStreams);
	const readable = new Readable({
		...getReadableMethods(subprocessStdout, subprocess),
		destroy: callbackify(onReadableDestroy.bind(undefined, {subprocessStdout, subprocess, waitReadableDestroy})),
		highWaterMark: subprocessStdout.readableHighWaterMark,
		objectMode: subprocessStdout.readableObjectMode,
		encoding: subprocessStdout.readableEncoding,
	});
	onStdoutFinished(subprocessStdout, readable, subprocess);
	return readable;
};

// Retrieve `stdout` (or other stream depending on `from`)
export const getSubprocessStdout = (subprocess, from, concurrentStreams) => {
	const subprocessStdout = getReadable(subprocess, from);
	const waitReadableDestroy = addConcurrentStream(concurrentStreams, subprocessStdout, 'readableDestroy');
	return {subprocessStdout, waitReadableDestroy};
};

export const getReadableMethods = (subprocessStdout, subprocess) => {
	const controller = new AbortController();
	stopReadingOnExit(subprocess, controller);
	const onStdoutData = on(subprocessStdout, 'data', {
		signal: controller.signal,
		highWaterMark: HIGH_WATER_MARK,
		// Backward compatibility with older name for this option
		// See https://github.com/nodejs/node/pull/52080#discussion_r1525227861
		// @todo Remove after removing support for Node 21
		highWatermark: HIGH_WATER_MARK,
	});

	return {
		read() {
			onRead(this, onStdoutData);
		},
	};
};

const stopReadingOnExit = async (subprocess, controller) => {
	try {
		await subprocess;
	} catch {} finally {
		controller.abort();
	}
};

// The `highWaterMark` of `events.on()` is measured in number of events, not in bytes.
// Not knowing the average amount of bytes per `data` event, we use the same heuristic as streams in objectMode, since they have the same issue.
// Therefore, we use the value of `getDefaultHighWaterMark(true)`.
// Note: this option does not exist on Node 18, but this is ok since the logic works without it. It just consumes more memory.
const HIGH_WATER_MARK = 16;

// Forwards data from `stdout` to `readable`
const onRead = async (readable, onStdoutData) => {
	try {
		const {value, done} = await onStdoutData.next();
		if (!done) {
			readable.push(value[0]);
		}
	} catch {}
};

// When `subprocess.stdout` ends/aborts/errors, do the same on `readable`.
// Await the subprocess, for the same reason as above.
export const onStdoutFinished = async (subprocessStdout, readable, subprocess, subprocessStdin) => {
	try {
		await waitForSubprocessStdout(subprocessStdout);
		await subprocess;
		await safeWaitForSubprocessStdin(subprocessStdin);

		if (readable.readable) {
			readable.push(null);
		}
	} catch (error) {
		await safeWaitForSubprocessStdin(subprocessStdin);
		destroyOtherReadable(readable, error);
	}
};

// When `readable` aborts/errors, do the same on `subprocess.stdout`
export const onReadableDestroy = async ({subprocessStdout, subprocess, waitReadableDestroy}, error) => {
	if (await waitForConcurrentStreams(waitReadableDestroy, subprocess)) {
		destroyOtherReadable(subprocessStdout, error);
		await waitForSubprocess(subprocess, error);
	}
};

const destroyOtherReadable = (stream, error) => {
	destroyOtherStream(stream, stream.readable, error);
};
