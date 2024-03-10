import {Duplex} from 'node:stream';
import {callbackify} from 'node:util';
import {
	getSubprocessStdout,
	getReadableMethods,
	onStdoutFinished,
	onReadableDestroy,
} from './readable.js';
import {
	getSubprocessStdin,
	getWritableMethods,
	onStdinFinished,
	onWritableDestroy,
} from './writable.js';

// Create a `Duplex` stream combining both
export const createDuplex = ({subprocess, concurrentStreams}, {from, to} = {}) => {
	const {subprocessStdout, waitReadableDestroy} = getSubprocessStdout(subprocess, from, concurrentStreams);
	const {subprocessStdin, waitWritableFinal, waitWritableDestroy} = getSubprocessStdin(subprocess, to, concurrentStreams);
	const duplex = new Duplex({
		...getReadableMethods(subprocessStdout, subprocess),
		...getWritableMethods(subprocessStdin, subprocess, waitWritableFinal),
		destroy: callbackify(onDuplexDestroy.bind(undefined, {subprocessStdout, subprocessStdin, subprocess, waitReadableDestroy, waitWritableFinal, waitWritableDestroy})),
		readableHighWaterMark: subprocessStdout.readableHighWaterMark,
		writableHighWaterMark: subprocessStdin.writableHighWaterMark,
		readableObjectMode: subprocessStdout.readableObjectMode,
		writableObjectMode: subprocessStdin.writableObjectMode,
		encoding: subprocessStdout.readableEncoding,
	});
	onStdoutFinished(subprocessStdout, duplex, subprocess, subprocessStdin);
	onStdinFinished(subprocessStdin, duplex, subprocessStdout);
	return duplex;
};

const onDuplexDestroy = async ({subprocessStdout, subprocessStdin, subprocess, waitReadableDestroy, waitWritableFinal, waitWritableDestroy}, error) => {
	await Promise.all([
		onReadableDestroy({subprocessStdout, subprocess, waitReadableDestroy}, error),
		onWritableDestroy({subprocessStdin, subprocess, waitWritableFinal, waitWritableDestroy}, error),
	]);
};
