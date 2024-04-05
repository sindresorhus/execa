import {text} from 'node:stream/consumers';
import {finished} from 'node:stream/promises';
import getStream from 'get-stream';
import isPlainObj from 'is-plain-obj';
import {execa} from '../../index.js';
import {foobarString} from '../helpers/input.js';

export const arrayFromAsync = async (asyncIterable, lines = []) => {
	for await (const line of asyncIterable) {
		lines.push(line);
	}

	return lines;
};

export const finishedStream = stream => finished(stream, {cleanup: true});

export const assertWritableAborted = (t, writable) => {
	t.false(writable.writableEnded);
	t.is(writable.errored, null);
	t.false(writable.writable);
};

export const assertReadableAborted = (t, readable) => {
	t.false(readable.readableEnded);
	t.is(readable.errored, null);
	t.false(readable.readable);
};

export const assertProcessNormalExit = (t, error, exitCode = 0) => {
	t.is(error.exitCode, exitCode);
	t.is(error.signal, undefined);
};

export const assertStreamOutput = async (t, stream, expectedOutput = foobarString) => {
	t.is(await text(stream), expectedOutput);
};

export const assertStreamDataEvents = async (t, stream, expectedOutput = foobarString) => {
	t.is(await getStream(stream), expectedOutput);
};

export const assertIterableChunks = async (t, asyncIterable, expectedChunks) => {
	t.deepEqual(await arrayFromAsync(asyncIterable), expectedChunks);
};

export const assertStreamChunks = async (t, stream, expectedOutput) => {
	t.deepEqual(await stream.toArray(), expectedOutput);
};

export const assertSubprocessOutput = async (t, subprocess, expectedOutput = foobarString, fdNumber = 1) => {
	const result = await subprocess;
	t.deepEqual(result.stdio[fdNumber], expectedOutput);
};

export const assertStreamError = (t, stream, error) => assertPromiseError(t, finishedStream(stream), error);

export const assertStreamReadError = (t, stream, error) => assertPromiseError(t, text(stream), error);

export const assertSubprocessError = (t, subprocess, error) => assertPromiseError(t, subprocess, error);

export const assertPromiseError = async (t, promise, error) => {
	const thrownError = await t.throwsAsync(promise);

	if (isPlainObj(error) && error.cause !== undefined) {
		t.is(thrownError.cause, error.cause);
	} else {
		t.is(thrownError, error);
	}

	return thrownError;
};

export const getReadableSubprocess = (output = foobarString, options = {}) => execa('noop-fd.js', ['1', output], options);

export const getWritableSubprocess = () => execa('noop-stdin-fd.js', ['2']);

export const getReadWriteSubprocess = options => execa('stdin.js', options);
