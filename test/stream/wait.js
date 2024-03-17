import {setImmediate} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio, prematureClose, assertEpipe} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';
import {noopGenerator} from '../helpers/generator.js';
import {noopReadable, noopWritable, noopDuplex} from '../helpers/stream.js';

setFixtureDir();

const noop = () => {};

const endOptionStream = ({stream}) => {
	stream.end();
};

const destroyOptionStream = ({stream, error}) => {
	stream.destroy(error);
};

const destroySubprocessStream = ({subprocess, fdNumber, error}) => {
	subprocess.stdio[fdNumber].destroy(error);
};

const getStreamStdio = (fdNumber, stream, useTransform) => getStdio(fdNumber, [stream, useTransform ? noopGenerator(false) : 'pipe']);

// eslint-disable-next-line max-params
const testStreamAbortWait = async (t, streamMethod, stream, fdNumber, useTransform) => {
	const subprocess = execa('noop-stdin-fd.js', [`${fdNumber}`], getStreamStdio(fdNumber, stream, useTransform));
	streamMethod({stream, subprocess, fdNumber});
	subprocess.stdin.end();
	await setImmediate();
	stream.destroy();

	const {stdout} = await subprocess;
	t.is(stdout, '');
	t.true(stream.destroyed);
};

test('Keeps running when stdin option is used and subprocess.stdin ends', testStreamAbortWait, noop, noopReadable(), 0, false);
test('Keeps running when stdin option is used and subprocess.stdin Duplex ends', testStreamAbortWait, noop, noopDuplex(), 0, false);
test('Keeps running when input stdio[*] option is used and input subprocess.stdio[*] ends', testStreamAbortWait, noop, noopReadable(), 3, false);
test('Keeps running when stdin option is used and subprocess.stdin ends, with a transform', testStreamAbortWait, noop, noopReadable(), 0, true);
test('Keeps running when stdin option is used and subprocess.stdin Duplex ends, with a transform', testStreamAbortWait, noop, noopDuplex(), 0, true);
test('Keeps running when input stdio[*] option is used and input subprocess.stdio[*] ends, with a transform', testStreamAbortWait, noop, noopReadable(), 3, true);

// eslint-disable-next-line max-params
const testStreamAbortSuccess = async (t, streamMethod, stream, fdNumber, useTransform) => {
	const subprocess = execa('noop-stdin-fd.js', [`${fdNumber}`], getStreamStdio(fdNumber, stream, useTransform));
	streamMethod({stream, subprocess, fdNumber});
	subprocess.stdin.end();

	const {stdout} = await subprocess;
	t.is(stdout, '');
	t.true(stream.destroyed);
};

test('Passes when stdin option aborts', testStreamAbortSuccess, destroyOptionStream, noopReadable(), 0, false);
test('Passes when stdin option Duplex aborts', testStreamAbortSuccess, destroyOptionStream, noopDuplex(), 0, false);
test('Passes when input stdio[*] option aborts', testStreamAbortSuccess, destroyOptionStream, noopReadable(), 3, false);
test('Passes when stdout option ends with no more writes', testStreamAbortSuccess, endOptionStream, noopWritable(), 1, false);
test('Passes when stderr option ends with no more writes', testStreamAbortSuccess, endOptionStream, noopWritable(), 2, false);
test('Passes when output stdio[*] option ends with no more writes', testStreamAbortSuccess, endOptionStream, noopWritable(), 3, false);
test('Passes when subprocess.stdout aborts with no more writes', testStreamAbortSuccess, destroySubprocessStream, noopWritable(), 1, false);
test('Passes when subprocess.stdout Duplex aborts with no more writes', testStreamAbortSuccess, destroySubprocessStream, noopDuplex(), 1, false);
test('Passes when subprocess.stderr aborts with no more writes', testStreamAbortSuccess, destroySubprocessStream, noopWritable(), 2, false);
test('Passes when subprocess.stderr Duplex aborts with no more writes', testStreamAbortSuccess, destroySubprocessStream, noopDuplex(), 2, false);
test('Passes when output subprocess.stdio[*] aborts with no more writes', testStreamAbortSuccess, destroySubprocessStream, noopWritable(), 3, false);
test('Passes when output subprocess.stdio[*] Duplex aborts with no more writes', testStreamAbortSuccess, destroySubprocessStream, noopDuplex(), 3, false);
test('Passes when stdin option aborts, with a transform', testStreamAbortSuccess, destroyOptionStream, noopReadable(), 0, true);
test('Passes when stdin option Duplex aborts, with a transform', testStreamAbortSuccess, destroyOptionStream, noopDuplex(), 0, true);
test('Passes when input stdio[*] option aborts, with a transform', testStreamAbortSuccess, destroyOptionStream, noopReadable(), 3, true);
test('Passes when stdout option ends with no more writes, with a transform', testStreamAbortSuccess, endOptionStream, noopWritable(), 1, true);
test('Passes when stderr option ends with no more writes, with a transform', testStreamAbortSuccess, endOptionStream, noopWritable(), 2, true);
test('Passes when output stdio[*] option ends with no more writes, with a transform', testStreamAbortSuccess, endOptionStream, noopWritable(), 3, true);
test('Passes when subprocess.stdout aborts with no more writes, with a transform', testStreamAbortSuccess, destroySubprocessStream, noopWritable(), 1, true);
test('Passes when subprocess.stdout Duplex aborts with no more writes, with a transform', testStreamAbortSuccess, destroySubprocessStream, noopDuplex(), 1, true);
test('Passes when subprocess.stderr aborts with no more writes, with a transform', testStreamAbortSuccess, destroySubprocessStream, noopWritable(), 2, true);
test('Passes when subprocess.stderr Duplex aborts with no more writes, with a transform', testStreamAbortSuccess, destroySubprocessStream, noopDuplex(), 2, true);
test('Passes when output subprocess.stdio[*] aborts with no more writes, with a transform', testStreamAbortSuccess, destroySubprocessStream, noopWritable(), 3, true);
test('Passes when output subprocess.stdio[*] Duplex aborts with no more writes, with a transform', testStreamAbortSuccess, destroySubprocessStream, noopDuplex(), 3, true);

// eslint-disable-next-line max-params
const testStreamAbortFail = async (t, streamMethod, stream, fdNumber, useTransform) => {
	const subprocess = execa('noop-stdin-fd.js', [`${fdNumber}`], getStreamStdio(fdNumber, stream, useTransform));
	streamMethod({stream, subprocess, fdNumber});
	if (fdNumber !== 0) {
		subprocess.stdin.end();
	}

	const error = await t.throwsAsync(subprocess);
	t.like(error, {...prematureClose, exitCode: 0});
	t.true(stream.destroyed);
};

test('Throws abort error when subprocess.stdin aborts', testStreamAbortFail, destroySubprocessStream, noopReadable(), 0, false);
test('Throws abort error when subprocess.stdin Duplex aborts', testStreamAbortFail, destroySubprocessStream, noopDuplex(), 0, false);
test('Throws abort error when input subprocess.stdio[*] aborts', testStreamAbortFail, destroySubprocessStream, noopReadable(), 3, false);
test('Throws abort error when stdout option aborts with no more writes', testStreamAbortFail, destroyOptionStream, noopWritable(), 1, false);
test('Throws abort error when stdout option Duplex aborts with no more writes', testStreamAbortFail, destroyOptionStream, noopDuplex(), 1, false);
test('Throws abort error when stderr option aborts with no more writes', testStreamAbortFail, destroyOptionStream, noopWritable(), 2, false);
test('Throws abort error when stderr option Duplex aborts with no more writes', testStreamAbortFail, destroyOptionStream, noopDuplex(), 2, false);
test('Throws abort error when output stdio[*] option aborts with no more writes', testStreamAbortFail, destroyOptionStream, noopWritable(), 3, false);
test('Throws abort error when output stdio[*] Duplex option aborts with no more writes', testStreamAbortFail, destroyOptionStream, noopDuplex(), 3, false);
test('Throws abort error when subprocess.stdin aborts, with a transform', testStreamAbortFail, destroySubprocessStream, noopReadable(), 0, true);
test('Throws abort error when subprocess.stdin Duplex aborts, with a transform', testStreamAbortFail, destroySubprocessStream, noopDuplex(), 0, true);
test('Throws abort error when input subprocess.stdio[*] aborts, with a transform', testStreamAbortFail, destroySubprocessStream, noopReadable(), 3, true);
test('Throws abort error when stdout option aborts with no more writes, with a transform', testStreamAbortFail, destroyOptionStream, noopWritable(), 1, true);
test('Throws abort error when stdout option Duplex aborts with no more writes, with a transform', testStreamAbortFail, destroyOptionStream, noopDuplex(), 1, true);
test('Throws abort error when stderr option aborts with no more writes, with a transform', testStreamAbortFail, destroyOptionStream, noopWritable(), 2, true);
test('Throws abort error when stderr option Duplex aborts with no more writes, with a transform', testStreamAbortFail, destroyOptionStream, noopDuplex(), 2, true);
test('Throws abort error when output stdio[*] option aborts with no more writes, with a transform', testStreamAbortFail, destroyOptionStream, noopWritable(), 3, true);
test('Throws abort error when output stdio[*] Duplex option aborts with no more writes, with a transform', testStreamAbortFail, destroyOptionStream, noopDuplex(), 3, true);

// eslint-disable-next-line max-params
const testStreamEpipeFail = async (t, streamMethod, stream, fdNumber, useTransform) => {
	const subprocess = execa('noop-stdin-fd.js', [`${fdNumber}`], getStreamStdio(fdNumber, stream, useTransform));
	streamMethod({stream, subprocess, fdNumber});
	await setImmediate();
	subprocess.stdin.end(foobarString);

	const {exitCode, stdio, stderr} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.is(stdio[fdNumber], '');
	t.true(stream.destroyed);
	assertEpipe(t, stderr, fdNumber);
};

test('Throws EPIPE when stdout option ends with more writes', testStreamEpipeFail, endOptionStream, noopWritable(), 1, false);
test('Throws EPIPE when stdout option aborts with more writes', testStreamEpipeFail, destroyOptionStream, noopWritable(), 1, false);
test('Throws EPIPE when stdout option Duplex aborts with more writes', testStreamEpipeFail, destroyOptionStream, noopDuplex(), 1, false);
test('Throws EPIPE when stderr option ends with more writes', testStreamEpipeFail, endOptionStream, noopWritable(), 2, false);
test('Throws EPIPE when stderr option aborts with more writes', testStreamEpipeFail, destroyOptionStream, noopWritable(), 2, false);
test('Throws EPIPE when stderr option Duplex aborts with more writes', testStreamEpipeFail, destroyOptionStream, noopDuplex(), 2, false);
test('Throws EPIPE when output stdio[*] option ends with more writes', testStreamEpipeFail, endOptionStream, noopWritable(), 3, false);
test('Throws EPIPE when output stdio[*] option aborts with more writes', testStreamEpipeFail, destroyOptionStream, noopWritable(), 3, false);
test('Throws EPIPE when output stdio[*] option Duplex aborts with more writes', testStreamEpipeFail, destroyOptionStream, noopDuplex(), 3, false);
test('Throws EPIPE when subprocess.stdout aborts with more writes', testStreamEpipeFail, destroySubprocessStream, noopWritable(), 1, false);
test('Throws EPIPE when subprocess.stdout Duplex aborts with more writes', testStreamEpipeFail, destroySubprocessStream, noopDuplex(), 1, false);
test('Throws EPIPE when subprocess.stderr aborts with more writes', testStreamEpipeFail, destroySubprocessStream, noopWritable(), 2, false);
test('Throws EPIPE when subprocess.stderr Duplex aborts with more writes', testStreamEpipeFail, destroySubprocessStream, noopDuplex(), 2, false);
test('Throws EPIPE when output subprocess.stdio[*] aborts with more writes', testStreamEpipeFail, destroySubprocessStream, noopWritable(), 3, false);
test('Throws EPIPE when output subprocess.stdio[*] Duplex aborts with more writes', testStreamEpipeFail, destroySubprocessStream, noopDuplex(), 3, false);
test('Throws EPIPE when stdout option ends with more writes, with a transform', testStreamEpipeFail, endOptionStream, noopWritable(), 1, true);
test('Throws EPIPE when stdout option aborts with more writes, with a transform', testStreamEpipeFail, destroyOptionStream, noopWritable(), 1, true);
test('Throws EPIPE when stdout option Duplex aborts with more writes, with a transform', testStreamEpipeFail, destroyOptionStream, noopDuplex(), 1, true);
test('Throws EPIPE when stderr option ends with more writes, with a transform', testStreamEpipeFail, endOptionStream, noopWritable(), 2, true);
test('Throws EPIPE when stderr option aborts with more writes, with a transform', testStreamEpipeFail, destroyOptionStream, noopWritable(), 2, true);
test('Throws EPIPE when stderr option Duplex aborts with more writes, with a transform', testStreamEpipeFail, destroyOptionStream, noopDuplex(), 2, true);
test('Throws EPIPE when output stdio[*] option ends with more writes, with a transform', testStreamEpipeFail, endOptionStream, noopWritable(), 3, true);
test('Throws EPIPE when output stdio[*] option aborts with more writes, with a transform', testStreamEpipeFail, destroyOptionStream, noopWritable(), 3, true);
test('Throws EPIPE when output stdio[*] option Duplex aborts with more writes, with a transform', testStreamEpipeFail, destroyOptionStream, noopDuplex(), 3, true);
test('Throws EPIPE when subprocess.stdout aborts with more writes, with a transform', testStreamEpipeFail, destroySubprocessStream, noopWritable(), 1, true);
test('Throws EPIPE when subprocess.stdout Duplex aborts with more writes, with a transform', testStreamEpipeFail, destroySubprocessStream, noopDuplex(), 1, true);
test('Throws EPIPE when subprocess.stderr aborts with more writes, with a transform', testStreamEpipeFail, destroySubprocessStream, noopWritable(), 2, true);
test('Throws EPIPE when subprocess.stderr Duplex aborts with more writes, with a transform', testStreamEpipeFail, destroySubprocessStream, noopDuplex(), 2, true);
test('Throws EPIPE when output subprocess.stdio[*] aborts with more writes, with a transform', testStreamEpipeFail, destroySubprocessStream, noopWritable(), 3, true);
test('Throws EPIPE when output subprocess.stdio[*] Duplex aborts with more writes, with a transform', testStreamEpipeFail, destroySubprocessStream, noopDuplex(), 3, true);

// eslint-disable-next-line max-params
const testStreamError = async (t, streamMethod, stream, fdNumber, useTransform) => {
	const subprocess = execa('empty.js', getStreamStdio(fdNumber, stream, useTransform));
	const cause = new Error('test');
	streamMethod({stream, subprocess, fdNumber, error: cause});

	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.exitCode, 0);
	t.is(error.signal, undefined);
	t.false(error.isTerminated);
	t.true(error.failed);
	t.true(stream.destroyed);
};

test('Throws stream error when stdin option errors', testStreamError, destroyOptionStream, noopReadable(), 0, false);
test('Throws stream error when stdin option Duplex errors', testStreamError, destroyOptionStream, noopDuplex(), 0, false);
test('Throws stream error when stdout option errors', testStreamError, destroyOptionStream, noopWritable(), 1, false);
test('Throws stream error when stdout option Duplex errors', testStreamError, destroyOptionStream, noopDuplex(), 1, false);
test('Throws stream error when stderr option errors', testStreamError, destroyOptionStream, noopWritable(), 2, false);
test('Throws stream error when stderr option Duplex errors', testStreamError, destroyOptionStream, noopDuplex(), 2, false);
test('Throws stream error when output stdio[*] option errors', testStreamError, destroyOptionStream, noopWritable(), 3, false);
test('Throws stream error when output stdio[*] Duplex option errors', testStreamError, destroyOptionStream, noopDuplex(), 3, false);
test('Throws stream error when input stdio[*] option errors', testStreamError, destroyOptionStream, noopReadable(), 3, false);
test('Throws stream error when subprocess.stdin errors', testStreamError, destroySubprocessStream, noopReadable(), 0, false);
test('Throws stream error when subprocess.stdin Duplex errors', testStreamError, destroySubprocessStream, noopDuplex(), 0, false);
test('Throws stream error when subprocess.stdout errors', testStreamError, destroySubprocessStream, noopWritable(), 1, false);
test('Throws stream error when subprocess.stdout Duplex errors', testStreamError, destroySubprocessStream, noopDuplex(), 1, false);
test('Throws stream error when subprocess.stderr errors', testStreamError, destroySubprocessStream, noopWritable(), 2, false);
test('Throws stream error when subprocess.stderr Duplex errors', testStreamError, destroySubprocessStream, noopDuplex(), 2, false);
test('Throws stream error when output subprocess.stdio[*] errors', testStreamError, destroySubprocessStream, noopWritable(), 3, false);
test('Throws stream error when output subprocess.stdio[*] Duplex errors', testStreamError, destroySubprocessStream, noopDuplex(), 3, false);
test('Throws stream error when input subprocess.stdio[*] errors', testStreamError, destroySubprocessStream, noopReadable(), 3, false);
test('Throws stream error when stdin option errors, with a transform', testStreamError, destroyOptionStream, noopReadable(), 0, true);
test('Throws stream error when stdin option Duplex errors, with a transform', testStreamError, destroyOptionStream, noopDuplex(), 0, true);
test('Throws stream error when stdout option errors, with a transform', testStreamError, destroyOptionStream, noopWritable(), 1, true);
test('Throws stream error when stdout option Duplex errors, with a transform', testStreamError, destroyOptionStream, noopDuplex(), 1, true);
test('Throws stream error when stderr option errors, with a transform', testStreamError, destroyOptionStream, noopWritable(), 2, true);
test('Throws stream error when stderr option Duplex errors, with a transform', testStreamError, destroyOptionStream, noopDuplex(), 2, true);
test('Throws stream error when output stdio[*] option errors, with a transform', testStreamError, destroyOptionStream, noopWritable(), 3, true);
test('Throws stream error when output stdio[*] Duplex option errors, with a transform', testStreamError, destroyOptionStream, noopDuplex(), 3, true);
test('Throws stream error when input stdio[*] option errors, with a transform', testStreamError, destroyOptionStream, noopReadable(), 3, true);
test('Throws stream error when subprocess.stdin errors, with a transform', testStreamError, destroySubprocessStream, noopReadable(), 0, true);
test('Throws stream error when subprocess.stdin Duplex errors, with a transform', testStreamError, destroySubprocessStream, noopDuplex(), 0, true);
test('Throws stream error when subprocess.stdout errors, with a transform', testStreamError, destroySubprocessStream, noopWritable(), 1, true);
test('Throws stream error when subprocess.stdout Duplex errors, with a transform', testStreamError, destroySubprocessStream, noopDuplex(), 1, true);
test('Throws stream error when subprocess.stderr errors, with a transform', testStreamError, destroySubprocessStream, noopWritable(), 2, true);
test('Throws stream error when subprocess.stderr Duplex errors, with a transform', testStreamError, destroySubprocessStream, noopDuplex(), 2, true);
test('Throws stream error when output subprocess.stdio[*] errors, with a transform', testStreamError, destroySubprocessStream, noopWritable(), 3, true);
test('Throws stream error when output subprocess.stdio[*] Duplex errors, with a transform', testStreamError, destroySubprocessStream, noopDuplex(), 3, true);
test('Throws stream error when input subprocess.stdio[*] errors, with a transform', testStreamError, destroySubprocessStream, noopReadable(), 3, true);
