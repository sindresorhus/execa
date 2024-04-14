import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
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

const assertStreamInputError = (t, {exitCode, signal, isTerminated, failed}) => {
	t.is(exitCode, 0);
	t.is(signal, undefined);
	t.false(isTerminated);
	t.true(failed);
};

const assertStreamOutputError = (t, fdNumber, {exitCode, signal, isTerminated, failed, stderr}) => {
	if (fdNumber !== 3) {
		t.is(exitCode, 1);
	}

	t.is(signal, undefined);
	t.false(isTerminated);
	t.true(failed);

	assertEpipe(t, stderr, fdNumber);
};

const testStreamInputAbort = async (t, fdNumber) => {
	const subprocess = getStreamInputSubprocess(fdNumber);
	subprocess.stdio[fdNumber].destroy();
	const error = await t.throwsAsync(subprocess, prematureClose);
	assertStreamInputError(t, error);
};

test('Aborting stdin should not make the subprocess exit', testStreamInputAbort, 0);
test('Aborting input stdio[*] should not make the subprocess exit', testStreamInputAbort, 3);

const testStreamOutputAbort = async (t, fdNumber) => {
	const subprocess = getStreamOutputSubprocess(fdNumber);
	subprocess.stdio[fdNumber].destroy();
	const error = await t.throwsAsync(subprocess);
	assertStreamOutputError(t, fdNumber, error);
};

test('Aborting stdout should not make the subprocess exit', testStreamOutputAbort, 1);
test('Aborting stderr should not make the subprocess exit', testStreamOutputAbort, 2);
test('Aborting output stdio[*] should not make the subprocess exit', testStreamOutputAbort, 3);

const testStreamInputDestroy = async (t, fdNumber) => {
	const subprocess = getStreamInputSubprocess(fdNumber);
	const cause = new Error('test');
	subprocess.stdio[fdNumber].destroy(cause);
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	assertStreamInputError(t, error);
};

test('Destroying stdin should not make the subprocess exit', testStreamInputDestroy, 0);
test('Destroying input stdio[*] should not make the subprocess exit', testStreamInputDestroy, 3);

const testStreamOutputDestroy = async (t, fdNumber) => {
	const subprocess = getStreamOutputSubprocess(fdNumber);
	const cause = new Error('test');
	subprocess.stdio[fdNumber].destroy(cause);
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	assertStreamOutputError(t, fdNumber, error);
};

test('Destroying stdout should not make the subprocess exit', testStreamOutputDestroy, 1);
test('Destroying stderr should not make the subprocess exit', testStreamOutputDestroy, 2);
test('Destroying output stdio[*] should not make the subprocess exit', testStreamOutputDestroy, 3);

const testStreamInputError = async (t, fdNumber) => {
	const subprocess = getStreamInputSubprocess(fdNumber);
	const cause = new Error('test');
	const stream = subprocess.stdio[fdNumber];
	stream.emit('error', cause);
	stream.end();
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	assertStreamInputError(t, error);
};

test('Errors on stdin should not make the subprocess exit', testStreamInputError, 0);
test('Errors on input stdio[*] should not make the subprocess exit', testStreamInputError, 3);

const testStreamOutputError = async (t, fdNumber) => {
	const subprocess = getStreamOutputSubprocess(fdNumber);
	const cause = new Error('test');
	const stream = subprocess.stdio[fdNumber];
	stream.emit('error', cause);
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	assertStreamOutputError(t, fdNumber, error);
};

test('Errors on stdout should make the subprocess exit', testStreamOutputError, 1);
test('Errors on stderr should make the subprocess exit', testStreamOutputError, 2);
test('Errors on output stdio[*] should make the subprocess exit', testStreamOutputError, 3);

const testWaitOnStreamEnd = async (t, fdNumber) => {
	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], fullStdio);
	await setTimeout(100);
	subprocess.stdio[fdNumber].end('foobar');
	const {stdout} = await subprocess;
	t.is(stdout, 'foobar');
};

test('Subprocess waits on stdin before exiting', testWaitOnStreamEnd, 0);
test('Subprocess waits on stdio[*] before exiting', testWaitOnStreamEnd, 3);
