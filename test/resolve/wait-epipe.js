import assert from 'node:assert/strict';
import {setImmediate} from 'node:timers/promises';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {assertEpipe} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';
import {noopWritable, noopDuplex} from '../helpers/stream.js';
import {
	endOptionStream,
	destroyOptionStream,
	destroySubprocessStream,
	getStreamStdio,
} from '../helpers/wait.js';

setFixtureDirectory();

const testStreamEpipeFail = async (streamMethod, stream, fdNumber, useTransform) => {
	const subprocess = execa('noop-stdin-fd.js', [`${fdNumber}`], getStreamStdio(fdNumber, stream, useTransform));
	streamMethod({stream, subprocess, fdNumber});
	await setImmediate();
	subprocess.stdin.end(foobarString);

	const {exitCode, stdio, stderr} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(stdio[fdNumber], '');
	assert.equal(stream.destroyed, true);
	assertEpipe(stderr, fdNumber);
};

test('Throws EPIPE when stdout option ends with more writes', () => testStreamEpipeFail(endOptionStream, noopWritable(), 1, false));
test('Throws EPIPE when stdout option aborts with more writes', () => testStreamEpipeFail(destroyOptionStream, noopWritable(), 1, false));
test('Throws EPIPE when stdout option Duplex aborts with more writes', () => testStreamEpipeFail(destroyOptionStream, noopDuplex(), 1, false));
test('Throws EPIPE when stderr option ends with more writes', () => testStreamEpipeFail(endOptionStream, noopWritable(), 2, false));
test('Throws EPIPE when stderr option aborts with more writes', () => testStreamEpipeFail(destroyOptionStream, noopWritable(), 2, false));
test('Throws EPIPE when stderr option Duplex aborts with more writes', () => testStreamEpipeFail(destroyOptionStream, noopDuplex(), 2, false));
test('Throws EPIPE when output stdio[*] option ends with more writes', () => testStreamEpipeFail(endOptionStream, noopWritable(), 3, false));
test('Throws EPIPE when output stdio[*] option aborts with more writes', () => testStreamEpipeFail(destroyOptionStream, noopWritable(), 3, false));
test('Throws EPIPE when output stdio[*] option Duplex aborts with more writes', () => testStreamEpipeFail(destroyOptionStream, noopDuplex(), 3, false));
test('Throws EPIPE when subprocess.stdout aborts with more writes', () => testStreamEpipeFail(destroySubprocessStream, noopWritable(), 1, false));
test('Throws EPIPE when subprocess.stdout Duplex aborts with more writes', () => testStreamEpipeFail(destroySubprocessStream, noopDuplex(), 1, false));
test('Throws EPIPE when subprocess.stderr aborts with more writes', () => testStreamEpipeFail(destroySubprocessStream, noopWritable(), 2, false));
test('Throws EPIPE when subprocess.stderr Duplex aborts with more writes', () => testStreamEpipeFail(destroySubprocessStream, noopDuplex(), 2, false));
test('Throws EPIPE when output subprocess.stdio[*] aborts with more writes', () => testStreamEpipeFail(destroySubprocessStream, noopWritable(), 3, false));
test('Throws EPIPE when output subprocess.stdio[*] Duplex aborts with more writes', () => testStreamEpipeFail(destroySubprocessStream, noopDuplex(), 3, false));
test('Throws EPIPE when stdout option ends with more writes, with a transform', () => testStreamEpipeFail(endOptionStream, noopWritable(), 1, true));
test('Throws EPIPE when stdout option aborts with more writes, with a transform', () => testStreamEpipeFail(destroyOptionStream, noopWritable(), 1, true));
test('Throws EPIPE when stdout option Duplex aborts with more writes, with a transform', () => testStreamEpipeFail(destroyOptionStream, noopDuplex(), 1, true));
test('Throws EPIPE when stderr option ends with more writes, with a transform', () => testStreamEpipeFail(endOptionStream, noopWritable(), 2, true));
test('Throws EPIPE when stderr option aborts with more writes, with a transform', () => testStreamEpipeFail(destroyOptionStream, noopWritable(), 2, true));
test('Throws EPIPE when stderr option Duplex aborts with more writes, with a transform', () => testStreamEpipeFail(destroyOptionStream, noopDuplex(), 2, true));
test('Throws EPIPE when output stdio[*] option ends with more writes, with a transform', () => testStreamEpipeFail(endOptionStream, noopWritable(), 3, true));
test('Throws EPIPE when output stdio[*] option aborts with more writes, with a transform', () => testStreamEpipeFail(destroyOptionStream, noopWritable(), 3, true));
test('Throws EPIPE when output stdio[*] option Duplex aborts with more writes, with a transform', () => testStreamEpipeFail(destroyOptionStream, noopDuplex(), 3, true));
test('Throws EPIPE when subprocess.stdout aborts with more writes, with a transform', () => testStreamEpipeFail(destroySubprocessStream, noopWritable(), 1, true));
test('Throws EPIPE when subprocess.stdout Duplex aborts with more writes, with a transform', () => testStreamEpipeFail(destroySubprocessStream, noopDuplex(), 1, true));
test('Throws EPIPE when subprocess.stderr aborts with more writes, with a transform', () => testStreamEpipeFail(destroySubprocessStream, noopWritable(), 2, true));
test('Throws EPIPE when subprocess.stderr Duplex aborts with more writes, with a transform', () => testStreamEpipeFail(destroySubprocessStream, noopDuplex(), 2, true));
test('Throws EPIPE when output subprocess.stdio[*] aborts with more writes, with a transform', () => testStreamEpipeFail(destroySubprocessStream, noopWritable(), 3, true));
test('Throws EPIPE when output subprocess.stdio[*] Duplex aborts with more writes, with a transform', () => testStreamEpipeFail(destroySubprocessStream, noopDuplex(), 3, true));
