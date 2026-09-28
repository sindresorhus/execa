import assert from 'node:assert/strict';
import test from 'node:test';
import {assertRejects, assertLike} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {getStdio, STANDARD_STREAMS} from '../helpers/stdio.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getEarlyErrorSubprocess, expectedEarlyError} from '../helpers/early-error.js';

setFixtureDirectory();

const testDestroyStandard = async fdNumber => {
	const subprocess = execa('forever.js', {...getStdio(fdNumber, [STANDARD_STREAMS[fdNumber], 'pipe']), timeout: 1});
	await assertRejects(subprocess, {message: /timed out/});
	assert.ok(!STANDARD_STREAMS[fdNumber].destroyed);
};

test('Does not destroy process.stdin on subprocess errors', () => testDestroyStandard(0));
test('Does not destroy process.stdout on subprocess errors', () => testDestroyStandard(1));
test('Does not destroy process.stderr on subprocess errors', () => testDestroyStandard(2));

const testDestroyStandardSpawn = async fdNumber => {
	const error = await assertRejects(getEarlyErrorSubprocess(getStdio(fdNumber, [STANDARD_STREAMS[fdNumber], 'pipe'])));
	assertLike(error, expectedEarlyError);
	assert.ok(!STANDARD_STREAMS[fdNumber].destroyed);
};

test('Does not destroy process.stdin on subprocess early errors', () => testDestroyStandardSpawn(0));
test('Does not destroy process.stdout on subprocess early errors', () => testDestroyStandardSpawn(1));
test('Does not destroy process.stderr on subprocess early errors', () => testDestroyStandardSpawn(2));

const testDestroyStandardStream = async fdNumber => {
	const subprocess = execa('forever.js', getStdio(fdNumber, [STANDARD_STREAMS[fdNumber], 'pipe']));
	const cause = new Error('test');
	subprocess.stdio[fdNumber].destroy(cause);
	subprocess.kill();
	assertLike(await assertRejects(subprocess), {cause});
	assert.ok(!STANDARD_STREAMS[fdNumber].destroyed);
};

test('Does not destroy process.stdin on stream subprocess errors', () => testDestroyStandardStream(0));
test('Does not destroy process.stdout on stream subprocess errors', () => testDestroyStandardStream(1));
test('Does not destroy process.stderr on stream subprocess errors', () => testDestroyStandardStream(2));
