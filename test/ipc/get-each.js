import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';
import {iterateAllMessages} from '../helpers/ipc.js';

setFixtureDirectory();

test('Can iterate over IPC messages', async t => {
	let count = 0;
	const subprocess = execa('ipc-send-twice.js', {ipc: true});
	for await (const message of subprocess.getEachMessage()) {
		t.is(message, foobarArray[count++]);
	}

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, foobarArray);
});

test('Can iterate over IPC messages in subprocess', async t => {
	const subprocess = execa('ipc-iterate.js', {ipc: true});

	await subprocess.sendMessage('.');
	await subprocess.sendMessage('.');
	await subprocess.sendMessage(foobarString);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, ['.', '.']);
});

test('Can iterate multiple times over IPC messages in subprocess', async t => {
	const subprocess = execa('ipc-iterate-twice.js', {ipc: true});

	await subprocess.sendMessage('.');
	t.is(await subprocess.getOneMessage(), '.');
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage('.');
	t.is(await subprocess.getOneMessage(), '.');
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, ['.', foobarString, '.', foobarString]);
});

test('subprocess.getEachMessage() can be called twice at the same time', async t => {
	const subprocess = execa('ipc-send-twice.js', {ipc: true});
	t.deepEqual(
		await Promise.all([iterateAllMessages(subprocess), iterateAllMessages(subprocess)]),
		[foobarArray, foobarArray],
	);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, foobarArray);
});

const HIGH_CONCURRENCY_COUNT = 100;

test('Can send many messages at once with exports.getEachMessage()', async t => {
	const subprocess = execa('ipc-iterate.js', {ipc: true});
	await Promise.all(Array.from({length: HIGH_CONCURRENCY_COUNT}, (_, index) => subprocess.sendMessage(index)));
	await subprocess.sendMessage(foobarString);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, Array.from({length: HIGH_CONCURRENCY_COUNT}, (_, index) => index));
});

test('Disconnecting in the current process stops exports.getEachMessage()', async t => {
	const subprocess = execa('ipc-iterate-print.js', {ipc: true});
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage('.');
	subprocess.disconnect();

	const {stdout} = await subprocess;
	t.is(stdout, '.');
});

test('Disconnecting in the subprocess stops subprocess.getEachMessage()', async t => {
	const subprocess = execa('ipc-send-disconnect.js', {ipc: true});
	for await (const message of subprocess.getEachMessage()) {
		t.is(message, foobarString);
	}

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Exiting the subprocess stops subprocess.getEachMessage()', async t => {
	const subprocess = execa('ipc-send.js', {ipc: true});
	for await (const message of subprocess.getEachMessage()) {
		t.is(message, foobarString);
	}

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
});

const loopAndBreak = async (t, subprocess) => {
	// eslint-disable-next-line no-unreachable-loop
	for await (const message of subprocess.getEachMessage()) {
		t.is(message, foobarString);
		break;
	}
};

test('Breaking from subprocess.getEachMessage() awaits the subprocess', async t => {
	const subprocess = execa('ipc-send-fail.js', {ipc: true});
	const {exitCode, ipcOutput} = await t.throwsAsync(loopAndBreak(t, subprocess));
	t.is(exitCode, 1);
	t.deepEqual(ipcOutput, [foobarString]);
});

const testCleanupListeners = async (t, buffer) => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});
	const bufferCount = buffer ? 1 : 0;

	t.is(subprocess.listenerCount('message'), bufferCount);
	t.is(subprocess.listenerCount('disconnect'), bufferCount);

	const promise = iterateAllMessages(subprocess);
	t.is(subprocess.listenerCount('message'), bufferCount + 1);
	t.is(subprocess.listenerCount('disconnect'), bufferCount + 1);
	t.deepEqual(await promise, [foobarString]);

	t.is(subprocess.listenerCount('message'), 0);
	t.is(subprocess.listenerCount('disconnect'), 0);
};

test('Cleans up subprocess.getEachMessage() listeners, buffer false', testCleanupListeners, false);
test('Cleans up subprocess.getEachMessage() listeners, buffer true', testCleanupListeners, true);
