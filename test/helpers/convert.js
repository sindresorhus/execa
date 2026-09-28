import {text} from 'node:stream/consumers';
import {finished} from 'node:stream/promises';
import assert from 'node:assert/strict';
import getStream from 'get-stream';
import isPlainObj from 'is-plain-obj';
import {execa} from '../../index.js';
import {assertRejects} from './assert.js';
import {foobarString} from './input.js';

export const arrayFromAsync = async (asyncIterable, lines = []) => {
	for await (const line of asyncIterable) {
		lines.push(line);
	}

	return lines;
};

export const finishedStream = stream => finished(stream, {cleanup: true});

export const assertWritableAborted = writable => {
	assert.equal(writable.writableEnded, false);
	assert.equal(writable.errored, null);
	assert.equal(writable.writable, false);
};

export const assertReadableAborted = readable => {
	assert.equal(readable.readableEnded, false);
	assert.equal(readable.errored, null);
	assert.equal(readable.readable, false);
};

export const assertProcessNormalExit = (error, exitCode = 0) => {
	assert.equal(error.exitCode, exitCode);
	assert.equal(error.signal, undefined);
};

export const assertStreamOutput = async (stream, expectedOutput = foobarString) => {
	assert.equal(await text(stream), expectedOutput);
};

export const assertStreamDataEvents = async (stream, expectedOutput = foobarString) => {
	assert.equal(await getStream(stream), expectedOutput);
};

export const assertIterableChunks = async (asyncIterable, expectedChunks) => {
	assert.deepEqual(await arrayFromAsync(asyncIterable), expectedChunks);
};

export const assertStreamChunks = async (stream, expectedOutput) => {
	assert.deepEqual(await stream.toArray(), expectedOutput);
};

export const assertSubprocessOutput = async (subprocess, expectedOutput = foobarString, fdNumber = 1) => {
	const result = await subprocess;
	assert.deepEqual(result.stdio[fdNumber], expectedOutput);
};

export const assertStreamError = (stream, error) => assertPromiseError(finishedStream(stream), error);

export const assertStreamReadError = (stream, error) => assertPromiseError(text(stream), error);

export const assertSubprocessError = (subprocess, error) => assertPromiseError(subprocess, error);

export const assertPromiseError = async (promise, error) => {
	const thrownError = await assertRejects(promise);

	if (isPlainObj(error) && error.cause !== undefined) {
		assert.equal(thrownError.cause, error.cause);
	} else {
		assert.equal(thrownError, error);
	}

	return thrownError;
};

export const getReadableSubprocess = (output = foobarString, options = {}) => execa('noop-fd.js', ['1', output], options);

export const getWritableSubprocess = () => execa('noop-stdin-fd.js', ['2']);

export const getReadWriteSubprocess = options => execa('stdin.js', options);
