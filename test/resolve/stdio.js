import assert from 'node:assert/strict';
import {setTimeout} from 'node:timers/promises';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {
	fullStdio,
	getStdio,
	prematureClose,
	assertEpipe,
} from '../helpers/stdio.js';
import {infiniteGenerator} from '../helpers/generator.js';

setFixtureDirectory();

const getStreamInputSubprocess = fdNumber => execa('stdin-fd.js', [`${fdNumber}`], fdNumber === 3
	? getStdio(3, [new Uint8Array(), infiniteGenerator()])
	: {});
const getStreamOutputSubprocess = fdNumber => execa('noop-repeat.js', [`${fdNumber}`], fdNumber === 3 ? fullStdio : {});

const assertStreamInputError = ({exitCode, signal, isTerminated, failed}) => {
	assert.equal(exitCode, 0);
	assert.equal(signal, undefined);
	assert.equal(isTerminated, false);
	assert.equal(failed, true);
};

const assertStreamOutputError = (fdNumber, {exitCode, signal, isTerminated, failed, stderr}) => {
	if (fdNumber !== 3) {
		assert.equal(exitCode, 1);
	}

	assert.equal(signal, undefined);
	assert.equal(isTerminated, false);
	assert.equal(failed, true);

	assertEpipe(stderr, fdNumber);
};

const testStreamInputAbort = async fdNumber => {
	const subprocess = getStreamInputSubprocess(fdNumber);
	subprocess.stdio[fdNumber].destroy();
	const error = await assertRejects(subprocess, prematureClose);
	assertStreamInputError(error);
};

test('Aborting stdin should not make the subprocess exit', () => testStreamInputAbort(0));
test('Aborting input stdio[*] should not make the subprocess exit', () => testStreamInputAbort(3));

const testStreamOutputAbort = async fdNumber => {
	const subprocess = getStreamOutputSubprocess(fdNumber);
	subprocess.stdio[fdNumber].destroy();
	const error = await assertRejects(subprocess);
	assertStreamOutputError(fdNumber, error);
};

test('Aborting stdout should not make the subprocess exit', () => testStreamOutputAbort(1));
test('Aborting stderr should not make the subprocess exit', () => testStreamOutputAbort(2));
test('Aborting output stdio[*] should not make the subprocess exit', () => testStreamOutputAbort(3));

const testStreamInputDestroy = async fdNumber => {
	const subprocess = getStreamInputSubprocess(fdNumber);
	const cause = new Error('test');
	subprocess.stdio[fdNumber].destroy(cause);
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assertStreamInputError(error);
};

test('Destroying stdin should not make the subprocess exit', () => testStreamInputDestroy(0));
test('Destroying input stdio[*] should not make the subprocess exit', () => testStreamInputDestroy(3));

const testStreamOutputDestroy = async fdNumber => {
	const subprocess = getStreamOutputSubprocess(fdNumber);
	const cause = new Error('test');
	subprocess.stdio[fdNumber].destroy(cause);
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assertStreamOutputError(fdNumber, error);
};

test('Destroying stdout should not make the subprocess exit', () => testStreamOutputDestroy(1));
test('Destroying stderr should not make the subprocess exit', () => testStreamOutputDestroy(2));
test('Destroying output stdio[*] should not make the subprocess exit', () => testStreamOutputDestroy(3));

const testStreamInputError = async fdNumber => {
	const subprocess = getStreamInputSubprocess(fdNumber);
	const cause = new Error('test');
	const stream = subprocess.stdio[fdNumber];
	stream.emit('error', cause);
	stream.end();
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assertStreamInputError(error);
};

test('Errors on stdin should not make the subprocess exit', () => testStreamInputError(0));
test('Errors on input stdio[*] should not make the subprocess exit', () => testStreamInputError(3));

const testStreamOutputError = async fdNumber => {
	const subprocess = getStreamOutputSubprocess(fdNumber);
	const cause = new Error('test');
	const stream = subprocess.stdio[fdNumber];
	stream.emit('error', cause);
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assertStreamOutputError(fdNumber, error);
};

test('Errors on stdout should make the subprocess exit', () => testStreamOutputError(1));
test('Errors on stderr should make the subprocess exit', () => testStreamOutputError(2));
test('Errors on output stdio[*] should make the subprocess exit', () => testStreamOutputError(3));

const testWaitOnStreamEnd = async fdNumber => {
	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], fullStdio);
	await setTimeout(100);
	subprocess.stdio[fdNumber].end('foobar');
	const {stdout} = await subprocess;
	assert.equal(stdout, 'foobar');
};

test('Subprocess waits on stdin before exiting', () => testWaitOnStreamEnd(0));
test('Subprocess waits on stdio[*] before exiting', () => testWaitOnStreamEnd(3));

// A failed spawn has no output at all, so `result.stdio` must still have one entry per
// file descriptor, the same as a successful spawn and the same as asynchronous methods.
const testFailedSpawnStdioLength = async (stdio, expectedLength, execaMethod) => {
	const {stdio: stdioResult} = await execaMethod('unknown-file.js', {stdio, reject: false});
	assert.equal(stdioResult.length, expectedLength);
};

test('result.stdio has one entry per file descriptor when the spawn fails', () => testFailedSpawnStdioLength(fullStdio.stdio, 4, execa));
test('result.stdio has one entry per file descriptor when the spawn fails, sync', () => testFailedSpawnStdioLength(fullStdio.stdio, 4, execaSync));
