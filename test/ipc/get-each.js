import {scheduler} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';
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

test('subprocess.getEachMessage() can be called twice at the same time', async t => {
	const subprocess = execa('ipc-send-twice.js', {ipc: true});
	t.deepEqual(
		await Promise.all([iterateAllMessages(subprocess), iterateAllMessages(subprocess)]),
		[foobarArray, foobarArray],
	);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, foobarArray);
});

const iterateAndBreak = async (t, subprocess) => {
	// eslint-disable-next-line no-unreachable-loop
	for await (const message of subprocess.getEachMessage()) {
		t.is(message, foobarString);
		break;
	}
};

test('Breaking in subprocess.getEachMessage() disconnects', async t => {
	const subprocess = execa('ipc-iterate-send.js', {ipc: true});
	await iterateAndBreak(t, subprocess);
	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Breaking from subprocess.getEachMessage() awaits the subprocess', async t => {
	const subprocess = execa('ipc-send-wait-print.js', {ipc: true});
	await iterateAndBreak(t, subprocess);

	const {ipcOutput, stdout} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
	t.is(stdout, '.');
});

test('Breaking from exports.getEachMessage() disconnects', async t => {
	const subprocess = execa('ipc-iterate-break.js', {ipc: true});

	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage(foobarString);
	const ipcError = await t.throwsAsync(subprocess.getOneMessage());
	t.true(ipcError.message.includes('subprocess.getOneMessage() could not complete'));

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
});

const iterateAndThrow = async (t, subprocess, cause) => {
	// eslint-disable-next-line no-unreachable-loop
	for await (const message of subprocess.getEachMessage()) {
		t.is(message, foobarString);
		throw cause;
	}
};

test('Throwing from subprocess.getEachMessage() disconnects', async t => {
	const subprocess = execa('ipc-iterate-send.js', {ipc: true});

	const cause = new Error(foobarString);
	t.is(await t.throwsAsync(iterateAndThrow(t, subprocess, cause)), cause);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Throwing from subprocess.getEachMessage() awaits the subprocess', async t => {
	const subprocess = execa('ipc-send-wait-print.js', {ipc: true});
	const cause = new Error(foobarString);
	t.is(await t.throwsAsync(iterateAndThrow(t, subprocess, cause)), cause);

	const {ipcOutput, stdout} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
	t.is(stdout, '.');
});

test('Throwing from exports.getEachMessage() disconnects', async t => {
	const subprocess = execa('ipc-iterate-throw.js', {ipc: true});

	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage(foobarString);
	const ipcError = await t.throwsAsync(subprocess.getOneMessage());
	t.true(ipcError.message.includes('subprocess.getOneMessage() could not complete'));

	const {exitCode, isTerminated, message, ipcOutput} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(message.includes(`Error: ${foobarString}`));
	t.deepEqual(ipcOutput, [foobarString]);
});

test.serial('Can send many messages at once with exports.getEachMessage()', async t => {
	const subprocess = execa('ipc-iterate.js', {ipc: true});
	await Promise.all(Array.from({length: PARALLEL_COUNT}, (_, index) => subprocess.sendMessage(index)));
	await subprocess.sendMessage(foobarString);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, Array.from({length: PARALLEL_COUNT}, (_, index) => index));
});

test('subprocess.getOneMessage() can be called multiple times in a row, buffer true', async t => {
	const subprocess = execa('ipc-print-many-each.js', [`${PARALLEL_COUNT}`], {ipc: true});
	const indexes = Array.from({length: PARALLEL_COUNT}, (_, index) => `${index}`);
	await Promise.all(indexes.map(index => subprocess.sendMessage(index)));

	const {stdout} = await subprocess;
	const expectedOutput = indexes.join('\n');
	t.is(stdout, expectedOutput);
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

const testCleanupListeners = async (t, buffer) => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});

	t.is(subprocess.listenerCount('message'), 1);
	t.is(subprocess.listenerCount('disconnect'), 1);

	const promise = iterateAllMessages(subprocess);
	t.is(subprocess.listenerCount('message'), 1);
	t.is(subprocess.listenerCount('disconnect'), 1);
	t.deepEqual(await promise, [foobarString]);

	t.is(subprocess.listenerCount('message'), 0);
	t.is(subprocess.listenerCount('disconnect'), 0);
};

test('Cleans up subprocess.getEachMessage() listeners, buffer false', testCleanupListeners, false);
test('Cleans up subprocess.getEachMessage() listeners, buffer true', testCleanupListeners, true);

const sendContinuousMessages = async subprocess => {
	while (subprocess.connected) {
		for (let index = 0; index < 10; index += 1) {
			subprocess.emit('message', foobarString);
		}

		// eslint-disable-next-line no-await-in-loop
		await scheduler.yield();
	}
};

test.serial('Handles buffered messages when disconnecting', async t => {
	const subprocess = execa('ipc-send-fail.js', {ipc: true, buffer: false});

	const promise = subprocess.getOneMessage();
	subprocess.emit('message', foobarString);
	t.is(await promise, foobarString);
	sendContinuousMessages(subprocess);

	const {exitCode, isTerminated, ipcOutput} = await t.throwsAsync(iterateAllMessages(subprocess));
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.deepEqual(ipcOutput, []);
});
