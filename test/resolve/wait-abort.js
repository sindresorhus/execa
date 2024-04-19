import {setImmediate} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {prematureClose} from '../helpers/stdio.js';
import {noopReadable, noopWritable, noopDuplex} from '../helpers/stream.js';
import {
	endOptionStream,
	destroyOptionStream,
	destroySubprocessStream,
	getStreamStdio,
} from '../helpers/wait.js';

setFixtureDirectory();

const noop = () => {};

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
