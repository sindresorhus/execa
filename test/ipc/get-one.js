import {once} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';
import {alwaysPass} from '../helpers/ipc.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

const testBufferInitial = async (t, buffer) => {
	const subprocess = execa('ipc-echo-wait.js', {ipc: true, buffer});
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess;
};

test('Buffers initial message to subprocess, buffer false', testBufferInitial, false);
test('Buffers initial message to subprocess, buffer true', testBufferInitial, true);

test('Buffers initial message to current process, buffer false', async t => {
	const subprocess = execa('ipc-send-print.js', {ipc: true, buffer: false});
	const [chunk] = await once(subprocess.stdout, 'data');
	t.is(chunk.toString(), '.');
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage('.');
	await subprocess;
});

test.serial('Does not buffer initial message to current process, buffer true', async t => {
	const subprocess = execa('ipc-send-print.js', {ipc: true});
	const [chunk] = await once(subprocess.stdout, 'data');
	t.is(chunk.toString(), '.');
	await setTimeout(1e3);
	t.is(await Promise.race([setTimeout(0), subprocess.getOneMessage()]), undefined);
	await subprocess.sendMessage('.');
	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
});

test('subprocess.getOneMessage() can filter messages', async t => {
	const subprocess = execa('ipc-send-twice.js', {ipc: true});
	const message = await subprocess.getOneMessage({filter: message => message === foobarArray[1]});
	t.is(message, foobarArray[1]);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, foobarArray);
});

test('exports.getOneMessage() can filter messages', async t => {
	const subprocess = execa('ipc-echo-filter.js', {ipc: true});
	await subprocess.sendMessage(foobarArray[0]);
	await subprocess.sendMessage(foobarArray[1]);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarArray[1]]);
});

test('Throwing from subprocess.getOneMessage() filter disconnects', async t => {
	const subprocess = execa('ipc-send-get.js', {ipc: true});
	const error = new Error(foobarString);
	t.is(await t.throwsAsync(subprocess.getOneMessage({
		filter() {
			throw error;
		},
	})), error);

	const {exitCode, isTerminated, message, ipcOutput} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(message.includes('Error: getOneMessage() could not complete'));
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Throwing from exports.getOneMessage() filter disconnects', async t => {
	const subprocess = execa('ipc-get-filter-throw.js', {ipc: true, ipcInput: 0});
	await t.throwsAsync(subprocess.getOneMessage(), {
		message: /subprocess.getOneMessage\(\) could not complete/,
	});

	const {exitCode, isTerminated, message, ipcOutput} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(message.includes(`Error: ${foobarString}`));
	t.deepEqual(ipcOutput, []);
});

test.serial('Can retrieve initial IPC messages under heavy load', async t => {
	await Promise.all(
		Array.from({length: PARALLEL_COUNT}, async (_, index) => {
			const subprocess = execa('ipc-send-argv.js', [`${index}`], {ipc: true, buffer: false});
			t.is(await subprocess.getOneMessage(), `${index}`);
			await subprocess;
		}),
	);
});

const testTwice = async (t, buffer, filter) => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});
	t.deepEqual(
		await Promise.all([subprocess.getOneMessage({filter}), subprocess.getOneMessage({filter})]),
		[foobarString, foobarString],
	);
	await subprocess;
};

test('subprocess.getOneMessage() can be called twice at the same time, buffer false', testTwice, false, undefined);
test('subprocess.getOneMessage() can be called twice at the same time, buffer true', testTwice, true, undefined);
test('subprocess.getOneMessage() can be called twice at the same time, buffer false, filter', testTwice, false, alwaysPass);
test('subprocess.getOneMessage() can be called twice at the same time, buffer true, filter', testTwice, true, alwaysPass);

const testCleanupListeners = async (t, buffer, filter) => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});

	t.is(subprocess.listenerCount('message'), buffer ? 1 : 0);
	t.is(subprocess.listenerCount('disconnect'), buffer ? 1 : 0);

	const promise = subprocess.getOneMessage({filter});
	t.is(subprocess.listenerCount('message'), 1);
	t.is(subprocess.listenerCount('disconnect'), 1);

	t.is(await promise, foobarString);
	await subprocess;

	t.is(subprocess.listenerCount('message'), 0);
	t.is(subprocess.listenerCount('disconnect'), 0);
};

test('Cleans up subprocess.getOneMessage() listeners, buffer false', testCleanupListeners, false, undefined);
test('Cleans up subprocess.getOneMessage() listeners, buffer true', testCleanupListeners, true, undefined);
test('Cleans up subprocess.getOneMessage() listeners, buffer false, filter', testCleanupListeners, false, alwaysPass);
test('Cleans up subprocess.getOneMessage() listeners, buffer true, filter', testCleanupListeners, true, alwaysPass);

const testParentDisconnect = async (t, buffer, filter) => {
	const subprocess = execa('ipc-get-send-get.js', [`${filter}`], {ipc: true, buffer});
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);

	subprocess.disconnect();

	const {exitCode, isTerminated, message} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	if (buffer) {
		t.true(message.includes('Error: getOneMessage() could not complete'));
	}
};

test('subprocess.disconnect() interrupts exports.getOneMessage(), buffer false', testParentDisconnect, false, false);
test('subprocess.disconnect() interrupts exports.getOneMessage(), buffer true', testParentDisconnect, true, false);
test('subprocess.disconnect() interrupts exports.getOneMessage(), buffer false, filter', testParentDisconnect, false, true);
test('subprocess.disconnect() interrupts exports.getOneMessage(), buffer true, filter', testParentDisconnect, true, false);

const testSubprocessDisconnect = async (t, buffer, filter) => {
	const subprocess = execa('empty.js', {ipc: true, buffer});
	const {message} = await t.throwsAsync(subprocess.getOneMessage({filter}));
	t.true(message.includes('subprocess.getOneMessage() could not complete'));
	await subprocess;
};

test('Subprocess exit interrupts subprocess.getOneMessage(), buffer false', testSubprocessDisconnect, false, undefined);
test('Subprocess exit interrupts subprocess.getOneMessage(), buffer true', testSubprocessDisconnect, true, undefined);
test('Subprocess exit interrupts subprocess.getOneMessage(), buffer false, filter', testSubprocessDisconnect, false, alwaysPass);
test('Subprocess exit interrupts subprocess.getOneMessage(), buffer true, filter', testSubprocessDisconnect, true, alwaysPass);
