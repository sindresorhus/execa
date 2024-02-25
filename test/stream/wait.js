import {platform} from 'node:process';
import {setImmediate} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio, prematureClose} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';
import {noopGenerator} from '../helpers/generator.js';
import {noopReadable, noopWritable, noopDuplex} from '../helpers/stream.js';

setFixtureDir();

const isWindows = platform === 'win32';

const noop = () => {};

const endOptionStream = ({stream}) => {
	stream.end();
};

const destroyOptionStream = ({stream, error}) => {
	stream.destroy(error);
};

const destroyChildStream = ({childProcess, fdNumber, error}) => {
	childProcess.stdio[fdNumber].destroy(error);
};

const getStreamStdio = (fdNumber, stream, useTransform) => getStdio(fdNumber, [stream, useTransform ? noopGenerator(false) : 'pipe']);

// eslint-disable-next-line max-params
const testStreamAbortWait = async (t, streamMethod, stream, fdNumber, useTransform) => {
	const childProcess = execa('noop-stdin-fd.js', [`${fdNumber}`], getStreamStdio(fdNumber, stream, useTransform));
	streamMethod({stream, childProcess, fdNumber});
	childProcess.stdin.end();
	await setImmediate();
	stream.destroy();

	const {stdout} = await childProcess;
	t.is(stdout, '');
	t.true(stream.destroyed);
};

test('Keeps running when stdin option is used and childProcess.stdin ends', testStreamAbortWait, noop, noopReadable(), 0, false);
test('Keeps running when stdin option is used and childProcess.stdin Duplex ends', testStreamAbortWait, noop, noopDuplex(), 0, false);
test('Keeps running when input stdio[*] option is used and input childProcess.stdio[*] ends', testStreamAbortWait, noop, noopReadable(), 3, false);
test('Keeps running when stdin option is used and childProcess.stdin ends, with a transform', testStreamAbortWait, noop, noopReadable(), 0, true);
test('Keeps running when stdin option is used and childProcess.stdin Duplex ends, with a transform', testStreamAbortWait, noop, noopDuplex(), 0, true);
test('Keeps running when input stdio[*] option is used and input childProcess.stdio[*] ends, with a transform', testStreamAbortWait, noop, noopReadable(), 3, true);

// eslint-disable-next-line max-params
const testStreamAbortSuccess = async (t, streamMethod, stream, fdNumber, useTransform) => {
	const childProcess = execa('noop-stdin-fd.js', [`${fdNumber}`], getStreamStdio(fdNumber, stream, useTransform));
	streamMethod({stream, childProcess, fdNumber});
	childProcess.stdin.end();

	const {stdout} = await childProcess;
	t.is(stdout, '');
	t.true(stream.destroyed);
};

test('Passes when stdin option aborts', testStreamAbortSuccess, destroyOptionStream, noopReadable(), 0, false);
test('Passes when stdin option Duplex aborts', testStreamAbortSuccess, destroyOptionStream, noopDuplex(), 0, false);
test('Passes when input stdio[*] option aborts', testStreamAbortSuccess, destroyOptionStream, noopReadable(), 3, false);
test('Passes when stdout option ends with no more writes', testStreamAbortSuccess, endOptionStream, noopWritable(), 1, false);
test('Passes when stderr option ends with no more writes', testStreamAbortSuccess, endOptionStream, noopWritable(), 2, false);
test('Passes when output stdio[*] option ends with no more writes', testStreamAbortSuccess, endOptionStream, noopWritable(), 3, false);
test('Passes when childProcess.stdout aborts with no more writes', testStreamAbortSuccess, destroyChildStream, noopWritable(), 1, false);
test('Passes when childProcess.stdout Duplex aborts with no more writes', testStreamAbortSuccess, destroyChildStream, noopDuplex(), 1, false);
test('Passes when childProcess.stderr aborts with no more writes', testStreamAbortSuccess, destroyChildStream, noopWritable(), 2, false);
test('Passes when childProcess.stderr Duplex aborts with no more writes', testStreamAbortSuccess, destroyChildStream, noopDuplex(), 2, false);
test('Passes when output childProcess.stdio[*] aborts with no more writes', testStreamAbortSuccess, destroyChildStream, noopWritable(), 3, false);
test('Passes when output childProcess.stdio[*] Duplex aborts with no more writes', testStreamAbortSuccess, destroyChildStream, noopDuplex(), 3, false);
test('Passes when stdin option aborts, with a transform', testStreamAbortSuccess, destroyOptionStream, noopReadable(), 0, true);
test('Passes when stdin option Duplex aborts, with a transform', testStreamAbortSuccess, destroyOptionStream, noopDuplex(), 0, true);
test('Passes when input stdio[*] option aborts, with a transform', testStreamAbortSuccess, destroyOptionStream, noopReadable(), 3, true);
test('Passes when stdout option ends with no more writes, with a transform', testStreamAbortSuccess, endOptionStream, noopWritable(), 1, true);
test('Passes when stderr option ends with no more writes, with a transform', testStreamAbortSuccess, endOptionStream, noopWritable(), 2, true);
test('Passes when output stdio[*] option ends with no more writes, with a transform', testStreamAbortSuccess, endOptionStream, noopWritable(), 3, true);
test('Passes when childProcess.stdout aborts with no more writes, with a transform', testStreamAbortSuccess, destroyChildStream, noopWritable(), 1, true);
test('Passes when childProcess.stdout Duplex aborts with no more writes, with a transform', testStreamAbortSuccess, destroyChildStream, noopDuplex(), 1, true);
test('Passes when childProcess.stderr aborts with no more writes, with a transform', testStreamAbortSuccess, destroyChildStream, noopWritable(), 2, true);
test('Passes when childProcess.stderr Duplex aborts with no more writes, with a transform', testStreamAbortSuccess, destroyChildStream, noopDuplex(), 2, true);
test('Passes when output childProcess.stdio[*] aborts with no more writes, with a transform', testStreamAbortSuccess, destroyChildStream, noopWritable(), 3, true);
test('Passes when output childProcess.stdio[*] Duplex aborts with no more writes, with a transform', testStreamAbortSuccess, destroyChildStream, noopDuplex(), 3, true);

// eslint-disable-next-line max-params
const testStreamAbortFail = async (t, streamMethod, stream, fdNumber, useTransform) => {
	const childProcess = execa('noop-stdin-fd.js', [`${fdNumber}`], getStreamStdio(fdNumber, stream, useTransform));
	streamMethod({stream, childProcess, fdNumber});
	if (fdNumber !== 0) {
		childProcess.stdin.end();
	}

	const error = await t.throwsAsync(childProcess);
	t.like(error, {...prematureClose, exitCode: 0});
	t.true(stream.destroyed);
};

test('Throws abort error when childProcess.stdin aborts', testStreamAbortFail, destroyChildStream, noopReadable(), 0, false);
test('Throws abort error when childProcess.stdin Duplex aborts', testStreamAbortFail, destroyChildStream, noopDuplex(), 0, false);
test('Throws abort error when input childProcess.stdio[*] aborts', testStreamAbortFail, destroyChildStream, noopReadable(), 3, false);
test('Throws abort error when stdout option aborts with no more writes', testStreamAbortFail, destroyOptionStream, noopWritable(), 1, false);
test('Throws abort error when stdout option Duplex aborts with no more writes', testStreamAbortFail, destroyOptionStream, noopDuplex(), 1, false);
test('Throws abort error when stderr option aborts with no more writes', testStreamAbortFail, destroyOptionStream, noopWritable(), 2, false);
test('Throws abort error when stderr option Duplex aborts with no more writes', testStreamAbortFail, destroyOptionStream, noopDuplex(), 2, false);
test('Throws abort error when output stdio[*] option aborts with no more writes', testStreamAbortFail, destroyOptionStream, noopWritable(), 3, false);
test('Throws abort error when output stdio[*] Duplex option aborts with no more writes', testStreamAbortFail, destroyOptionStream, noopDuplex(), 3, false);
test('Throws abort error when childProcess.stdin aborts, with a transform', testStreamAbortFail, destroyChildStream, noopReadable(), 0, true);
test('Throws abort error when childProcess.stdin Duplex aborts, with a transform', testStreamAbortFail, destroyChildStream, noopDuplex(), 0, true);
test('Throws abort error when input childProcess.stdio[*] aborts, with a transform', testStreamAbortFail, destroyChildStream, noopReadable(), 3, true);
test('Throws abort error when stdout option aborts with no more writes, with a transform', testStreamAbortFail, destroyOptionStream, noopWritable(), 1, true);
test('Throws abort error when stdout option Duplex aborts with no more writes, with a transform', testStreamAbortFail, destroyOptionStream, noopDuplex(), 1, true);
test('Throws abort error when stderr option aborts with no more writes, with a transform', testStreamAbortFail, destroyOptionStream, noopWritable(), 2, true);
test('Throws abort error when stderr option Duplex aborts with no more writes, with a transform', testStreamAbortFail, destroyOptionStream, noopDuplex(), 2, true);
test('Throws abort error when output stdio[*] option aborts with no more writes, with a transform', testStreamAbortFail, destroyOptionStream, noopWritable(), 3, true);
test('Throws abort error when output stdio[*] Duplex option aborts with no more writes, with a transform', testStreamAbortFail, destroyOptionStream, noopDuplex(), 3, true);

// eslint-disable-next-line max-params
const testStreamEpipeSuccess = async (t, streamMethod, stream, fdNumber, useTransform) => {
	const childProcess = execa('noop-stdin-fd.js', [`${fdNumber}`], getStreamStdio(fdNumber, stream, useTransform));
	streamMethod({stream, childProcess, fdNumber});
	childProcess.stdin.end(foobarString);

	const {stdio} = await childProcess;
	t.is(stdio[fdNumber], foobarString);
	t.true(stream.destroyed);
};

test('Passes when stdout option ends with more writes', testStreamEpipeSuccess, endOptionStream, noopWritable(), 1, false);
test('Passes when stderr option ends with more writes', testStreamEpipeSuccess, endOptionStream, noopWritable(), 2, false);
test('Passes when output stdio[*] option ends with more writes', testStreamEpipeSuccess, endOptionStream, noopWritable(), 3, false);
test('Passes when stdout option ends with more writes, with a transform', testStreamEpipeSuccess, endOptionStream, noopWritable(), 1, true);
test('Passes when stderr option ends with more writes, with a transform', testStreamEpipeSuccess, endOptionStream, noopWritable(), 2, true);
test('Passes when output stdio[*] option ends with more writes, with a transform', testStreamEpipeSuccess, endOptionStream, noopWritable(), 3, true);

// eslint-disable-next-line max-params
const testStreamEpipeFail = async (t, streamMethod, stream, fdNumber, useTransform) => {
	const childProcess = execa('noop-stdin-fd.js', [`${fdNumber}`], getStreamStdio(fdNumber, stream, useTransform));
	streamMethod({stream, childProcess, fdNumber});
	await setImmediate();
	childProcess.stdin.end(foobarString);

	const {exitCode, stdio, stderr} = await t.throwsAsync(childProcess);
	t.is(exitCode, 1);
	t.is(stdio[fdNumber], '');
	t.true(stream.destroyed);
	if (fdNumber !== 2 && !isWindows) {
		t.true(stderr.includes('EPIPE'));
	}
};

test('Throws EPIPE when stdout option aborts with more writes', testStreamEpipeFail, destroyOptionStream, noopWritable(), 1, false);
test('Throws EPIPE when stdout option Duplex aborts with more writes', testStreamEpipeFail, destroyOptionStream, noopDuplex(), 1, false);
test('Throws EPIPE when stderr option aborts with more writes', testStreamEpipeFail, destroyOptionStream, noopWritable(), 2, false);
test('Throws EPIPE when stderr option Duplex aborts with more writes', testStreamEpipeFail, destroyOptionStream, noopDuplex(), 2, false);
test('Throws EPIPE when output stdio[*] option aborts with more writes', testStreamEpipeFail, destroyOptionStream, noopWritable(), 3, false);
test('Throws EPIPE when output stdio[*] option Duplex aborts with more writes', testStreamEpipeFail, destroyOptionStream, noopDuplex(), 3, false);
test('Throws EPIPE when childProcess.stdout aborts with more writes', testStreamEpipeFail, destroyChildStream, noopWritable(), 1, false);
test('Throws EPIPE when childProcess.stdout Duplex aborts with more writes', testStreamEpipeFail, destroyChildStream, noopDuplex(), 1, false);
test('Throws EPIPE when childProcess.stderr aborts with more writes', testStreamEpipeFail, destroyChildStream, noopWritable(), 2, false);
test('Throws EPIPE when childProcess.stderr Duplex aborts with more writes', testStreamEpipeFail, destroyChildStream, noopDuplex(), 2, false);
test('Throws EPIPE when output childProcess.stdio[*] aborts with more writes', testStreamEpipeFail, destroyChildStream, noopWritable(), 3, false);
test('Throws EPIPE when output childProcess.stdio[*] Duplex aborts with more writes', testStreamEpipeFail, destroyChildStream, noopDuplex(), 3, false);
test('Throws EPIPE when stdout option aborts with more writes, with a transform', testStreamEpipeFail, destroyOptionStream, noopWritable(), 1, true);
test('Throws EPIPE when stdout option Duplex aborts with more writes, with a transform', testStreamEpipeFail, destroyOptionStream, noopDuplex(), 1, true);
test('Throws EPIPE when stderr option aborts with more writes, with a transform', testStreamEpipeFail, destroyOptionStream, noopWritable(), 2, true);
test('Throws EPIPE when stderr option Duplex aborts with more writes, with a transform', testStreamEpipeFail, destroyOptionStream, noopDuplex(), 2, true);
test('Throws EPIPE when output stdio[*] option aborts with more writes, with a transform', testStreamEpipeFail, destroyOptionStream, noopWritable(), 3, true);
test('Throws EPIPE when output stdio[*] option Duplex aborts with more writes, with a transform', testStreamEpipeFail, destroyOptionStream, noopDuplex(), 3, true);
test('Throws EPIPE when childProcess.stdout aborts with more writes, with a transform', testStreamEpipeFail, destroyChildStream, noopWritable(), 1, true);
test('Throws EPIPE when childProcess.stdout Duplex aborts with more writes, with a transform', testStreamEpipeFail, destroyChildStream, noopDuplex(), 1, true);
test('Throws EPIPE when childProcess.stderr aborts with more writes, with a transform', testStreamEpipeFail, destroyChildStream, noopWritable(), 2, true);
test('Throws EPIPE when childProcess.stderr Duplex aborts with more writes, with a transform', testStreamEpipeFail, destroyChildStream, noopDuplex(), 2, true);
test('Throws EPIPE when output childProcess.stdio[*] aborts with more writes, with a transform', testStreamEpipeFail, destroyChildStream, noopWritable(), 3, true);
test('Throws EPIPE when output childProcess.stdio[*] Duplex aborts with more writes, with a transform', testStreamEpipeFail, destroyChildStream, noopDuplex(), 3, true);

// eslint-disable-next-line max-params
const testStreamError = async (t, streamMethod, stream, fdNumber, useTransform) => {
	const childProcess = execa('empty.js', getStreamStdio(fdNumber, stream, useTransform));
	const error = new Error('test');
	streamMethod({stream, childProcess, fdNumber, error});

	t.is(await t.throwsAsync(childProcess), error);
	const {exitCode, signal, isTerminated, failed} = error;
	t.is(exitCode, 0);
	t.is(signal, undefined);
	t.false(isTerminated);
	t.true(failed);
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
test('Throws stream error when childProcess.stdin errors', testStreamError, destroyChildStream, noopReadable(), 0, false);
test('Throws stream error when childProcess.stdin Duplex errors', testStreamError, destroyChildStream, noopDuplex(), 0, false);
test('Throws stream error when childProcess.stdout errors', testStreamError, destroyChildStream, noopWritable(), 1, false);
test('Throws stream error when childProcess.stdout Duplex errors', testStreamError, destroyChildStream, noopDuplex(), 1, false);
test('Throws stream error when childProcess.stderr errors', testStreamError, destroyChildStream, noopWritable(), 2, false);
test('Throws stream error when childProcess.stderr Duplex errors', testStreamError, destroyChildStream, noopDuplex(), 2, false);
test('Throws stream error when output childProcess.stdio[*] errors', testStreamError, destroyChildStream, noopWritable(), 3, false);
test('Throws stream error when output childProcess.stdio[*] Duplex errors', testStreamError, destroyChildStream, noopDuplex(), 3, false);
test('Throws stream error when input childProcess.stdio[*] errors', testStreamError, destroyChildStream, noopReadable(), 3, false);
test('Throws stream error when stdin option errors, with a transform', testStreamError, destroyOptionStream, noopReadable(), 0, true);
test('Throws stream error when stdin option Duplex errors, with a transform', testStreamError, destroyOptionStream, noopDuplex(), 0, true);
test('Throws stream error when stdout option errors, with a transform', testStreamError, destroyOptionStream, noopWritable(), 1, true);
test('Throws stream error when stdout option Duplex errors, with a transform', testStreamError, destroyOptionStream, noopDuplex(), 1, true);
test('Throws stream error when stderr option errors, with a transform', testStreamError, destroyOptionStream, noopWritable(), 2, true);
test('Throws stream error when stderr option Duplex errors, with a transform', testStreamError, destroyOptionStream, noopDuplex(), 2, true);
test('Throws stream error when output stdio[*] option errors, with a transform', testStreamError, destroyOptionStream, noopWritable(), 3, true);
test('Throws stream error when output stdio[*] Duplex option errors, with a transform', testStreamError, destroyOptionStream, noopDuplex(), 3, true);
test('Throws stream error when input stdio[*] option errors, with a transform', testStreamError, destroyOptionStream, noopReadable(), 3, true);
test('Throws stream error when childProcess.stdin errors, with a transform', testStreamError, destroyChildStream, noopReadable(), 0, true);
test('Throws stream error when childProcess.stdin Duplex errors, with a transform', testStreamError, destroyChildStream, noopDuplex(), 0, true);
test('Throws stream error when childProcess.stdout errors, with a transform', testStreamError, destroyChildStream, noopWritable(), 1, true);
test('Throws stream error when childProcess.stdout Duplex errors, with a transform', testStreamError, destroyChildStream, noopDuplex(), 1, true);
test('Throws stream error when childProcess.stderr errors, with a transform', testStreamError, destroyChildStream, noopWritable(), 2, true);
test('Throws stream error when childProcess.stderr Duplex errors, with a transform', testStreamError, destroyChildStream, noopDuplex(), 2, true);
test('Throws stream error when output childProcess.stdio[*] errors, with a transform', testStreamError, destroyChildStream, noopWritable(), 3, true);
test('Throws stream error when output childProcess.stdio[*] Duplex errors, with a transform', testStreamError, destroyChildStream, noopDuplex(), 3, true);
test('Throws stream error when input childProcess.stdio[*] errors, with a transform', testStreamError, destroyChildStream, noopReadable(), 3, true);
