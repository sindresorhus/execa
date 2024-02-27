import test from 'ava';
import {execa} from '../../index.js';
import {getStdio, STANDARD_STREAMS} from '../helpers/stdio.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const testDestroyStandard = async (t, fdNumber) => {
	const childProcess = execa('forever.js', {...getStdio(fdNumber, [STANDARD_STREAMS[fdNumber], 'pipe']), timeout: 1});
	await t.throwsAsync(childProcess, {message: /timed out/});
	t.false(STANDARD_STREAMS[fdNumber].destroyed);
};

test('Does not destroy process.stdin on child process errors', testDestroyStandard, 0);
test('Does not destroy process.stdout on child process errors', testDestroyStandard, 1);
test('Does not destroy process.stderr on child process errors', testDestroyStandard, 2);

const testDestroyStandardSpawn = async (t, fdNumber) => {
	await t.throwsAsync(execa('forever.js', {...getStdio(fdNumber, [STANDARD_STREAMS[fdNumber], 'pipe']), uid: -1}));
	t.false(STANDARD_STREAMS[fdNumber].destroyed);
};

test('Does not destroy process.stdin on spawn process errors', testDestroyStandardSpawn, 0);
test('Does not destroy process.stdout on spawn process errors', testDestroyStandardSpawn, 1);
test('Does not destroy process.stderr on spawn process errors', testDestroyStandardSpawn, 2);

const testDestroyStandardStream = async (t, fdNumber) => {
	const childProcess = execa('forever.js', getStdio(fdNumber, [STANDARD_STREAMS[fdNumber], 'pipe']));
	const error = new Error('test');
	childProcess.stdio[fdNumber].destroy(error);
	childProcess.kill();
	const thrownError = await t.throwsAsync(childProcess);
	t.is(thrownError, error);
	t.false(STANDARD_STREAMS[fdNumber].destroyed);
};

test('Does not destroy process.stdin on stream process errors', testDestroyStandardStream, 0);
test('Does not destroy process.stdout on stream process errors', testDestroyStandardStream, 1);
test('Does not destroy process.stderr on stream process errors', testDestroyStandardStream, 2);
