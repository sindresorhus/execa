import {once} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio, getStdio} from '../helpers/stdio.js';

setFixtureDir();

const testBufferIgnore = async (t, index, all) => {
	await t.notThrowsAsync(execa('max-buffer.js', [`${index}`], {...getStdio(index, 'ignore'), buffer: false, all}));
};

test('Process buffers stdout, which does not prevent exit if ignored', testBufferIgnore, 1, false);
test('Process buffers stderr, which does not prevent exit if ignored', testBufferIgnore, 2, false);
test('Process buffers all, which does not prevent exit if ignored', testBufferIgnore, 1, true);

const testBufferNotRead = async (t, index, all) => {
	const subprocess = execa('max-buffer.js', [`${index}`], {...fullStdio, buffer: false, all});
	await t.notThrowsAsync(subprocess);
};

test('Process buffers stdout, which does not prevent exit if not read and buffer is false', testBufferNotRead, 1, false);
test('Process buffers stderr, which does not prevent exit if not read and buffer is false', testBufferNotRead, 2, false);
test('Process buffers stdio[*], which does not prevent exit if not read and buffer is false', testBufferNotRead, 3, false);
test('Process buffers all, which does not prevent exit if not read and buffer is false', testBufferNotRead, 1, true);

const testBufferRead = async (t, index, all) => {
	const subprocess = execa('max-buffer.js', [`${index}`], {...fullStdio, buffer: false, all});
	const stream = all ? subprocess.all : subprocess.stdio[index];
	stream.resume();
	await t.notThrowsAsync(subprocess);
};

test('Process buffers stdout, which does not prevent exit if read and buffer is false', testBufferRead, 1, false);
test('Process buffers stderr, which does not prevent exit if read and buffer is false', testBufferRead, 2, false);
test('Process buffers stdio[*], which does not prevent exit if read and buffer is false', testBufferRead, 3, false);
test('Process buffers all, which does not prevent exit if read and buffer is false', testBufferRead, 1, true);

const testBufferExit = async (t, index, fixtureName, reject) => {
	const childProcess = execa(fixtureName, [`${index}`], {...fullStdio, reject});
	await setTimeout(100);
	const {stdio} = await childProcess;
	t.is(stdio[index], 'foobar');
};

test('Process buffers stdout before it is read', testBufferExit, 1, 'noop-delay.js', true);
test('Process buffers stderr before it is read', testBufferExit, 2, 'noop-delay.js', true);
test('Process buffers stdio[*] before it is read', testBufferExit, 3, 'noop-delay.js', true);
test('Process buffers stdout right away, on successfully exit', testBufferExit, 1, 'noop-fd.js', true);
test('Process buffers stderr right away, on successfully exit', testBufferExit, 2, 'noop-fd.js', true);
test('Process buffers stdio[*] right away, on successfully exit', testBufferExit, 3, 'noop-fd.js', true);
test('Process buffers stdout right away, on failure', testBufferExit, 1, 'noop-fail.js', false);
test('Process buffers stderr right away, on failure', testBufferExit, 2, 'noop-fail.js', false);
test('Process buffers stdio[*] right away, on failure', testBufferExit, 3, 'noop-fail.js', false);

const testBufferDirect = async (t, index) => {
	const childProcess = execa('noop-fd.js', [`${index}`], fullStdio);
	const data = await once(childProcess.stdio[index], 'data');
	t.is(data.toString().trim(), 'foobar');
	const result = await childProcess;
	t.is(result.stdio[index], 'foobar');
};

test('Process buffers stdout right away, even if directly read', testBufferDirect, 1);
test('Process buffers stderr right away, even if directly read', testBufferDirect, 2);
test('Process buffers stdio[*] right away, even if directly read', testBufferDirect, 3);

const testBufferDestroyOnEnd = async (t, index) => {
	const childProcess = execa('noop-fd.js', [`${index}`], fullStdio);
	const result = await childProcess;
	t.is(result.stdio[index], 'foobar');
	t.true(childProcess.stdio[index].destroyed);
};

test('childProcess.stdout must be read right away', testBufferDestroyOnEnd, 1);
test('childProcess.stderr must be read right away', testBufferDestroyOnEnd, 2);
test('childProcess.stdio[*] must be read right away', testBufferDestroyOnEnd, 3);
