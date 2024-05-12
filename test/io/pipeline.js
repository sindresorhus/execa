import test from 'ava';
import {execa} from '../../index.js';
import {getStdio, STANDARD_STREAMS} from '../helpers/stdio.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getEarlyErrorSubprocess, expectedEarlyError} from '../helpers/early-error.js';

setFixtureDirectory();

const testDestroyStandard = async (t, fdNumber) => {
	const subprocess = execa('forever.js', {...getStdio(fdNumber, [STANDARD_STREAMS[fdNumber], 'pipe']), timeout: 1});
	await t.throwsAsync(subprocess, {message: /timed out/});
	t.false(STANDARD_STREAMS[fdNumber].destroyed);
};

test('Does not destroy process.stdin on subprocess errors', testDestroyStandard, 0);
test('Does not destroy process.stdout on subprocess errors', testDestroyStandard, 1);
test('Does not destroy process.stderr on subprocess errors', testDestroyStandard, 2);

const testDestroyStandardSpawn = async (t, fdNumber) => {
	const error = await t.throwsAsync(getEarlyErrorSubprocess(getStdio(fdNumber, [STANDARD_STREAMS[fdNumber], 'pipe'])));
	t.like(error, expectedEarlyError);
	t.false(STANDARD_STREAMS[fdNumber].destroyed);
};

test('Does not destroy process.stdin on subprocess early errors', testDestroyStandardSpawn, 0);
test('Does not destroy process.stdout on subprocess early errors', testDestroyStandardSpawn, 1);
test('Does not destroy process.stderr on subprocess early errors', testDestroyStandardSpawn, 2);

const testDestroyStandardStream = async (t, fdNumber) => {
	const subprocess = execa('forever.js', getStdio(fdNumber, [STANDARD_STREAMS[fdNumber], 'pipe']));
	const cause = new Error('test');
	subprocess.stdio[fdNumber].destroy(cause);
	subprocess.kill();
	t.like(await t.throwsAsync(subprocess), {cause});
	t.false(STANDARD_STREAMS[fdNumber].destroyed);
};

test('Does not destroy process.stdin on stream subprocess errors', testDestroyStandardStream, 0);
test('Does not destroy process.stdout on stream subprocess errors', testDestroyStandardStream, 1);
test('Does not destroy process.stderr on stream subprocess errors', testDestroyStandardStream, 2);
