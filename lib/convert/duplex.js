import {Duplex} from 'node:stream';
import {callbackify} from 'node:util';
import {BINARY_ENCODINGS} from '../arguments/encoding-option.js';
import {getFromStream, getToStream} from '../arguments/fd-options.js';
import {copyOptions, checkBooleanOption} from '../utils/options.js';
import {addConcurrentStream} from './concurrent.js';
import {
	getReadableOptions,
	getReadableMethods,
	onStdoutFinished,
	onReadableDestroy,
} from './readable.js';
import {
	addWritableConcurrentStreams,
	getWritableMethods,
	onStdinFinished,
	onWritableDestroy,
} from './writable.js';

// Create a `Duplex` stream combining both `subprocess.readable()` and `subprocess.writable()`
export const createDuplex = ({subprocess, concurrentStreams, encoding}, options) => {
	const {from, to, binary: binaryOption = true, preserveNewlines = true} = copyOptions(options);
	checkBooleanOption(binaryOption, 'binary');
	checkBooleanOption(preserveNewlines, 'preserveNewlines');
	const binary = binaryOption || BINARY_ENCODINGS.has(encoding);
	// Validate both directions before registering lifecycle waits, since a thrown option error must not leave a concurrent stream behind.
	const subprocessStdout = getFromStream(subprocess, from);
	const subprocessStdin = getToStream(subprocess, to);
	const waitReadableDestroy = addConcurrentStream(concurrentStreams, subprocessStdout, 'readableDestroy');
	const {waitWritableFinal, waitWritableDestroy} = addWritableConcurrentStreams(concurrentStreams, subprocessStdin);
	const {readableEncoding, readableObjectMode, readableHighWaterMark} = getReadableOptions(subprocessStdout, binary);
	const {read, onStdoutDataDone} = getReadableMethods({
		subprocessStdout,
		subprocess,
		binary,
		encoding,
		preserveNewlines,
	});
	const duplex = new Duplex({
		read,
		...getWritableMethods(subprocessStdin, subprocess, waitWritableFinal),
		destroy: callbackify(onDuplexDestroy.bind(undefined, {
			subprocessStdout,
			subprocessStdin,
			subprocess,
			waitReadableDestroy,
			waitWritableFinal,
			waitWritableDestroy,
		})),
		readableHighWaterMark,
		writableHighWaterMark: subprocessStdin.writableHighWaterMark,
		readableObjectMode,
		writableObjectMode: subprocessStdin.writableObjectMode,
		encoding: readableEncoding,
	});
	onStdoutFinished({
		subprocessStdout,
		onStdoutDataDone,
		readable: duplex,
		subprocess,
		subprocessStdin,
	});
	onStdinFinished(subprocessStdin, duplex, subprocessStdout, subprocess);
	return duplex;
};

const onDuplexDestroy = async ({subprocessStdout, subprocessStdin, subprocess, waitReadableDestroy, waitWritableFinal, waitWritableDestroy}, error) => {
	await Promise.all([
		onReadableDestroy({subprocessStdout, subprocess, waitReadableDestroy}, error),
		onWritableDestroy({
			subprocessStdin,
			subprocess,
			waitWritableFinal,
			waitWritableDestroy,
		}, error),
	]);
};
