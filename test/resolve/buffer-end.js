import assert from 'node:assert/strict';
import {once} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import test from 'node:test';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {fullStdio, getStdio} from '../helpers/stdio.js';

setFixtureDirectory();

const testBufferIgnore = async (fdNumber, all) => {
	await assert.doesNotReject(execa('max-buffer.js', [`${fdNumber}`], {...getStdio(fdNumber, 'ignore'), buffer: false, all}));
};

test('Subprocess buffers stdout, which does not prevent exit if ignored', () => testBufferIgnore(1, false));
test('Subprocess buffers stderr, which does not prevent exit if ignored', () => testBufferIgnore(2, false));
test('Subprocess buffers all, which does not prevent exit if ignored', () => testBufferIgnore(1, true));

const testBufferNotRead = async (fdNumber, all) => {
	const subprocess = execa('max-buffer.js', [`${fdNumber}`], {...fullStdio, buffer: false, all});
	await assert.doesNotReject(subprocess);
};

test('Subprocess buffers stdout, which does not prevent exit if not read and buffer is false', () => testBufferNotRead(1, false));
test('Subprocess buffers stderr, which does not prevent exit if not read and buffer is false', () => testBufferNotRead(2, false));
test('Subprocess buffers stdio[*], which does not prevent exit if not read and buffer is false', () => testBufferNotRead(3, false));
test('Subprocess buffers all, which does not prevent exit if not read and buffer is false', () => testBufferNotRead(1, true));

const testBufferRead = async (fdNumber, all) => {
	const subprocess = execa('max-buffer.js', [`${fdNumber}`], {...fullStdio, buffer: false, all});
	const stream = all ? subprocess.all : subprocess.stdio[fdNumber];
	stream.resume();
	await assert.doesNotReject(subprocess);
};

test('Subprocess buffers stdout, which does not prevent exit if read and buffer is false', () => testBufferRead(1, false));
test('Subprocess buffers stderr, which does not prevent exit if read and buffer is false', () => testBufferRead(2, false));
test('Subprocess buffers stdio[*], which does not prevent exit if read and buffer is false', () => testBufferRead(3, false));
test('Subprocess buffers all, which does not prevent exit if read and buffer is false', () => testBufferRead(1, true));

const testBufferExit = async (fdNumber, fixtureName, reject) => {
	const subprocess = execa(fixtureName, [`${fdNumber}`], {...fullStdio, reject});
	await setTimeout(100);
	const {stdio} = await subprocess;
	assert.equal(stdio[fdNumber], 'foobar');
};

test('Subprocess buffers stdout before it is read', () => testBufferExit(1, 'noop-delay.js', true));
test('Subprocess buffers stderr before it is read', () => testBufferExit(2, 'noop-delay.js', true));
test('Subprocess buffers stdio[*] before it is read', () => testBufferExit(3, 'noop-delay.js', true));
test('Subprocess buffers stdout right away, on successfully exit', () => testBufferExit(1, 'noop-fd.js', true));
test('Subprocess buffers stderr right away, on successfully exit', () => testBufferExit(2, 'noop-fd.js', true));
test('Subprocess buffers stdio[*] right away, on successfully exit', () => testBufferExit(3, 'noop-fd.js', true));
test('Subprocess buffers stdout right away, on failure', () => testBufferExit(1, 'noop-fail.js', false));
test('Subprocess buffers stderr right away, on failure', () => testBufferExit(2, 'noop-fail.js', false));
test('Subprocess buffers stdio[*] right away, on failure', () => testBufferExit(3, 'noop-fail.js', false));

const testBufferDirect = async fdNumber => {
	const subprocess = execa('noop-fd.js', [`${fdNumber}`], fullStdio);
	const data = await once(subprocess.stdio[fdNumber], 'data');
	assert.equal(data.toString().trim(), 'foobar');
	const result = await subprocess;
	assert.equal(result.stdio[fdNumber], 'foobar');
};

test('Subprocess buffers stdout right away, even if directly read', () => testBufferDirect(1));
test('Subprocess buffers stderr right away, even if directly read', () => testBufferDirect(2));
test('Subprocess buffers stdio[*] right away, even if directly read', () => testBufferDirect(3));

const testBufferDestroyOnEnd = async fdNumber => {
	const subprocess = execa('noop-fd.js', [`${fdNumber}`], fullStdio);
	const result = await subprocess;
	assert.equal(result.stdio[fdNumber], 'foobar');
	assert.ok(subprocess.stdio[fdNumber].destroyed);
};

test('subprocess.stdout must be read right away', () => testBufferDestroyOnEnd(1));
test('subprocess.stderr must be read right away', () => testBufferDestroyOnEnd(2));
test('subprocess.stdio[*] must be read right away', () => testBufferDestroyOnEnd(3));
