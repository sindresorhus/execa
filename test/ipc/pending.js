import assert from 'node:assert/strict';
import {once} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import test from 'node:test';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const testBufferInitial = async buffer => {
	const subprocess = execa('ipc-echo-wait.js', {buffer, ipcInput: foobarString});
	assert.equal(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, buffer ? [foobarString] : []);
};

test('Buffers initial message to subprocess, buffer false', () => testBufferInitial(false));
test('Buffers initial message to subprocess, buffer true', () => testBufferInitial(true));

const testBufferInitialSend = async buffer => {
	const subprocess = execa('ipc-send-echo-wait.js', {buffer, ipcInput: foobarString});
	assert.equal(await subprocess.getOneMessage(), '.');
	assert.equal(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, buffer ? ['.', foobarString] : []);
};

test('sendMessage() does not empty the initial message buffering, buffer false', () => testBufferInitialSend(false));
test('sendMessage() does not empty the initial message buffering, buffer true', () => testBufferInitialSend(true));

const testBufferInitialStrict = async buffer => {
	const subprocess = execa('ipc-send-echo-strict.js', {buffer, ipcInput: foobarString});
	assert.equal(await subprocess.getOneMessage(), '.');
	await setTimeout(1e3);
	const promise = subprocess.getOneMessage();
	await subprocess.sendMessage('..');
	assert.equal(await promise, '..');

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, buffer ? ['.', '..'] : []);
};

test('sendMessage() with "strict" empties the initial message buffering, buffer false', () => testBufferInitialStrict(false));
test('sendMessage() with "strict" empties the initial message buffering, buffer true', () => testBufferInitialStrict(true));

const testNoBufferInitial = async buffer => {
	const subprocess = execa('ipc-send-print.js', {ipc: true, buffer});
	const [chunk] = await once(subprocess.stdout, 'data');
	assert.equal(chunk.toString(), '.');
	await setTimeout(1e3);
	assert.equal(await Promise.race([setTimeout(0), subprocess.getOneMessage()]), undefined);
	await subprocess.sendMessage('.');

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, buffer ? [foobarString] : []);
};

test('Does not buffer initial message to current process, buffer false', () => testNoBufferInitial(false));
test('Does not buffer initial message to current process, buffer true', () => testNoBufferInitial(true));

const testReplay = async buffer => {
	const subprocess = execa('ipc-replay.js', {buffer, ipcInput: foobarString});
	assert.equal(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage('.');
	await setTimeout(2e3);
	await subprocess.sendMessage(foobarString);
	assert.equal(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, buffer ? [foobarString, foobarString] : []);
};

test('Does not replay missed messages in subprocess, buffer false', () => testReplay(false));
test('Does not replay missed messages in subprocess, buffer true', () => testReplay(true));

const testFastSend = async buffer => {
	const subprocess = execa('ipc-send-native.js', {ipc: true, buffer});
	assert.equal(await subprocess.getOneMessage(), '.');

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, buffer ? ['.'] : []);
};

test('Subprocess can send messages right away, buffer false', () => testFastSend(false));
test('Subprocess can send messages right away, buffer true', () => testFastSend(true));
