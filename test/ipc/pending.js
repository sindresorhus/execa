import {once} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const testBufferInitial = async (t, buffer) => {
	const subprocess = execa('ipc-echo-wait.js', {ipc: true, buffer, ipcInput: foobarString});
	t.is(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, buffer ? [foobarString] : []);
};

test('Buffers initial message to subprocess, buffer false', testBufferInitial, false);
test('Buffers initial message to subprocess, buffer true', testBufferInitial, true);

const testNoBufferInitial = async (t, buffer) => {
	const subprocess = execa('ipc-send-print.js', {ipc: true, buffer});
	const [chunk] = await once(subprocess.stdout, 'data');
	t.is(chunk.toString(), '.');
	await setTimeout(1e3);
	t.is(await Promise.race([setTimeout(0), subprocess.getOneMessage()]), undefined);
	await subprocess.sendMessage('.');

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, buffer ? [foobarString] : []);
};

test.serial('Does not buffer initial message to current process, buffer false', testNoBufferInitial, false);
test.serial('Does not buffer initial message to current process, buffer true', testNoBufferInitial, true);

const testReplay = async (t, buffer) => {
	const subprocess = execa('ipc-replay.js', {ipc: true, buffer, ipcInput: foobarString});
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage('.');
	await setTimeout(2e3);
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, buffer ? [foobarString, foobarString] : []);
};

test.serial('Does not replay missed messages in subprocess, buffer false', testReplay, false);
test.serial('Does not replay missed messages in subprocess, buffer true', testReplay, true);

const testFastSend = async (t, buffer) => {
	const subprocess = execa('ipc-send-native.js', {ipc: true, buffer});
	t.is(await subprocess.getOneMessage(), '.');

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, buffer ? ['.'] : []);
};

test('Subprocess can send messages right away, buffer false', testFastSend, false);
test('Subprocess can send messages right away, buffer true', testFastSend, true);
