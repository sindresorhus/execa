import assert from 'node:assert/strict';
import {scheduler} from 'node:timers/promises';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';
import {iterateAllMessages} from '../helpers/ipc.js';
/* eslint-disable node-test/no-conditional-assertion -- shared helper functions are called from conditional paths on purpose */

setFixtureDirectory();

test('Can iterate over IPC messages', async () => {
	let count = 0;
	const subprocess = execa('ipc-send-twice.js', {ipc: true});
	for await (const message of subprocess.getEachMessage()) {
		assert.equal(message, foobarArray[count++]);
	}

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, foobarArray);
});

test('Can iterate over IPC messages in subprocess', async () => {
	const subprocess = execa('ipc-iterate.js', {ipc: true});

	await subprocess.sendMessage('.');
	await subprocess.sendMessage('.');
	await subprocess.sendMessage(foobarString);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, ['.', '.']);
});

test('subprocess.getEachMessage() can be called twice at the same time', async () => {
	const subprocess = execa('ipc-send-twice.js', {ipc: true});
	assert.deepEqual(
		await Promise.all([iterateAllMessages(subprocess), iterateAllMessages(subprocess)]),
		[foobarArray, foobarArray],
	);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, foobarArray);
});

const iterateAndBreak = async subprocess => {
	// eslint-disable-next-line no-unreachable-loop
	for await (const message of subprocess.getEachMessage()) {
		assert.equal(message, foobarString);
		break;
	}
};

test('Breaking in subprocess.getEachMessage() disconnects', async () => {
	const subprocess = execa('ipc-iterate-send.js', {ipc: true});
	await iterateAndBreak(subprocess);
	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('Breaking from subprocess.getEachMessage() awaits the subprocess', async () => {
	const subprocess = execa('ipc-send-wait-print.js', {ipc: true});
	await iterateAndBreak(subprocess);

	const {ipcOutput, stdout} = await subprocess;
	assert.deepEqual(ipcOutput, [foobarString]);
	assert.equal(stdout, '.');
});

test('Breaking from exports.getEachMessage() disconnects', async () => {
	const subprocess = execa('ipc-iterate-break.js', {ipc: true});

	assert.equal(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage(foobarString);
	const ipcError = await assertRejects(subprocess.getOneMessage());
	assert.ok(ipcError.message.includes('subprocess.getOneMessage() could not complete'));

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, [foobarString]);
});

const iterateAndThrow = async (subprocess, cause) => {
	// eslint-disable-next-line no-unreachable-loop
	for await (const message of subprocess.getEachMessage()) {
		assert.equal(message, foobarString);
		throw cause;
	}
};

test('Throwing from subprocess.getEachMessage() disconnects', async () => {
	const subprocess = execa('ipc-iterate-send.js', {ipc: true});

	const cause = new Error(foobarString);
	assert.equal(await assertRejects(iterateAndThrow(subprocess, cause)), cause);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('Throwing from subprocess.getEachMessage() awaits the subprocess', async () => {
	const subprocess = execa('ipc-send-wait-print.js', {ipc: true});
	const cause = new Error(foobarString);
	assert.equal(await assertRejects(iterateAndThrow(subprocess, cause)), cause);

	const {ipcOutput, stdout} = await subprocess;
	assert.deepEqual(ipcOutput, [foobarString]);
	assert.equal(stdout, '.');
});

test('Throwing from exports.getEachMessage() disconnects', async () => {
	const subprocess = execa('ipc-iterate-throw.js', {ipc: true});

	assert.equal(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage(foobarString);
	const ipcError = await assertRejects(subprocess.getOneMessage());
	assert.ok(ipcError.message.includes('subprocess.getOneMessage() could not complete'));

	const {exitCode, isTerminated, message, ipcOutput} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(message.includes(`Error: ${foobarString}`));
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('Can send many messages at once with exports.getEachMessage()', async () => {
	const subprocess = execa('ipc-iterate.js', {ipc: true});
	await Promise.all(Array.from({length: PARALLEL_COUNT}, (_, index) => subprocess.sendMessage(index)));
	await subprocess.sendMessage(foobarString);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, Array.from({length: PARALLEL_COUNT}, (_, index) => index));
});

test('subprocess.getOneMessage() can be called multiple times in a row, buffer true', async () => {
	const subprocess = execa('ipc-print-many-each.js', [`${PARALLEL_COUNT}`], {ipc: true});
	const indexes = Array.from({length: PARALLEL_COUNT}, (_, index) => `${index}`);
	await Promise.all(indexes.map(index => subprocess.sendMessage(index)));

	const {stdout} = await subprocess;
	const expectedOutput = indexes.join('\n');
	assert.equal(stdout, expectedOutput);
});

test('Disconnecting in the current process stops exports.getEachMessage()', async () => {
	const subprocess = execa('ipc-iterate-print.js', {ipc: true});
	assert.equal(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage('.');
	subprocess.nodeChildProcess.disconnect();

	const {stdout} = await subprocess;
	assert.equal(stdout, '.');
});

test('Disconnecting in the subprocess stops subprocess.getEachMessage()', async () => {
	const subprocess = execa('ipc-send-disconnect.js', {ipc: true});
	for await (const message of subprocess.getEachMessage()) {
		assert.equal(message, foobarString);
	}

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('Exiting the subprocess stops subprocess.getEachMessage()', async () => {
	const subprocess = execa('ipc-send.js', {ipc: true});
	for await (const message of subprocess.getEachMessage()) {
		assert.equal(message, foobarString);
	}

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, [foobarString]);
});

const testCleanupListeners = async buffer => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});

	assert.equal(subprocess.nodeChildProcess.listenerCount('message'), 1);
	assert.equal(subprocess.nodeChildProcess.listenerCount('disconnect'), 1);

	const promise = iterateAllMessages(subprocess);
	assert.equal(subprocess.nodeChildProcess.listenerCount('message'), 1);
	assert.equal(subprocess.nodeChildProcess.listenerCount('disconnect'), 1);
	assert.deepEqual(await promise, [foobarString]);

	assert.equal(subprocess.nodeChildProcess.listenerCount('message'), 0);
	assert.equal(subprocess.nodeChildProcess.listenerCount('disconnect'), 0);
};

test('Cleans up subprocess.getEachMessage() listeners, buffer false', () => testCleanupListeners(false));
test('Cleans up subprocess.getEachMessage() listeners, buffer true', () => testCleanupListeners(true));

const sendContinuousMessages = async subprocess => {
	while (subprocess.nodeChildProcess.connected) {
		for (let index = 0; index < 10; index += 1) {
			subprocess.nodeChildProcess.emit('message', foobarString);
		}

		// eslint-disable-next-line no-await-in-loop
		await scheduler.yield();
	}
};

test('Handles buffered messages when disconnecting', async () => {
	const subprocess = execa('ipc-send-fail.js', {ipc: true, buffer: false});

	const promise = subprocess.getOneMessage();
	subprocess.nodeChildProcess.emit('message', foobarString);
	assert.equal(await promise, foobarString);
	sendContinuousMessages(subprocess);

	const {exitCode, isTerminated, ipcOutput} = await assertRejects(iterateAllMessages(subprocess));
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.deepEqual(ipcOutput, []);
});

/* eslint-enable node-test/no-conditional-assertion */
