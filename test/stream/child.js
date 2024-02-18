import {platform} from 'node:process';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio, getStdio, prematureClose} from '../helpers/stdio.js';
import {infiniteGenerator} from '../helpers/generator.js';

setFixtureDir();

const isWindows = platform === 'win32';

const getStreamInputProcess = index => execa('stdin-fd.js', [`${index}`], index === 3
	? getStdio(3, [new Uint8Array(), infiniteGenerator])
	: {});
const getStreamOutputProcess = index => execa('noop-repeat.js', [`${index}`], index === 3 ? fullStdio : {});

const assertStreamInputError = (t, {exitCode, signal, isTerminated, failed}) => {
	t.is(exitCode, 0);
	t.is(signal, undefined);
	t.false(isTerminated);
	t.true(failed);
};

const assertStreamOutputError = (t, index, {exitCode, signal, isTerminated, failed, stderr}) => {
	if (index !== 3) {
		t.is(exitCode, 1);
	}

	t.is(signal, undefined);
	t.false(isTerminated);
	t.true(failed);

	if (index === 1 && !isWindows) {
		t.true(stderr.includes('EPIPE'));
	}
};

const testStreamInputAbort = async (t, index) => {
	const childProcess = getStreamInputProcess(index);
	childProcess.stdio[index].destroy();
	const error = await t.throwsAsync(childProcess, prematureClose);
	assertStreamInputError(t, error);
};

test('Aborting stdin should not make the process exit', testStreamInputAbort, 0);
test('Aborting input stdio[*] should not make the process exit', testStreamInputAbort, 3);

const testStreamOutputAbort = async (t, index) => {
	const childProcess = getStreamOutputProcess(index);
	childProcess.stdio[index].destroy();
	const error = await t.throwsAsync(childProcess);
	assertStreamOutputError(t, index, error);
};

test('Aborting stdout should not make the process exit', testStreamOutputAbort, 1);
test('Aborting stderr should not make the process exit', testStreamOutputAbort, 2);
test('Aborting output stdio[*] should not make the process exit', testStreamOutputAbort, 3);

const testStreamInputDestroy = async (t, index) => {
	const childProcess = getStreamInputProcess(index);
	const error = new Error('test');
	childProcess.stdio[index].destroy(error);
	t.is(await t.throwsAsync(childProcess), error);
	assertStreamInputError(t, error);
};

test('Destroying stdin should not make the process exit', testStreamInputDestroy, 0);
test('Destroying input stdio[*] should not make the process exit', testStreamInputDestroy, 3);

const testStreamOutputDestroy = async (t, index) => {
	const childProcess = getStreamOutputProcess(index);
	const error = new Error('test');
	childProcess.stdio[index].destroy(error);
	t.is(await t.throwsAsync(childProcess), error);
	assertStreamOutputError(t, index, error);
};

test('Destroying stdout should not make the process exit', testStreamOutputDestroy, 1);
test('Destroying stderr should not make the process exit', testStreamOutputDestroy, 2);
test('Destroying output stdio[*] should not make the process exit', testStreamOutputDestroy, 3);

const testStreamInputError = async (t, index) => {
	const childProcess = getStreamInputProcess(index);
	const error = new Error('test');
	const stream = childProcess.stdio[index];
	stream.emit('error', error);
	stream.end();
	t.is(await t.throwsAsync(childProcess), error);
	assertStreamInputError(t, error);
};

test('Errors on stdin should not make the process exit', testStreamInputError, 0);
test('Errors on input stdio[*] should not make the process exit', testStreamInputError, 3);

const testStreamOutputError = async (t, index) => {
	const childProcess = getStreamOutputProcess(index);
	const error = new Error('test');
	const stream = childProcess.stdio[index];
	stream.emit('error', error);
	t.is(await t.throwsAsync(childProcess), error);
	assertStreamOutputError(t, index, error);
};

test('Errors on stdout should not make the process exit', testStreamOutputError, 1);
test('Errors on stderr should not make the process exit', testStreamOutputError, 2);
test('Errors on output stdio[*] should not make the process exit', testStreamOutputError, 3);

const testWaitOnStreamEnd = async (t, index) => {
	const childProcess = execa('stdin-fd.js', [`${index}`], fullStdio);
	await setTimeout(100);
	childProcess.stdio[index].end('foobar');
	const {stdout} = await childProcess;
	t.is(stdout, 'foobar');
};

test('Process waits on stdin before exiting', testWaitOnStreamEnd, 0);
test('Process waits on stdio[*] before exiting', testWaitOnStreamEnd, 3);
