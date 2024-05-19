import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';
import {iterateAllMessages} from '../helpers/ipc.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

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

	t.is(await subprocess.exchangeMessage('.'), '.');
	t.is(await subprocess.exchangeMessage(foobarString), foobarString);
	t.is(await subprocess.exchangeMessage('.'), '.');
	t.is(await subprocess.exchangeMessage(foobarString), foobarString);

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

const loopAndBreak = async (t, subprocess) => {
	// eslint-disable-next-line no-unreachable-loop
	for await (const message of subprocess.getEachMessage()) {
		t.is(message, foobarString);
		break;
	}
};

test('Breaking in subprocess.getEachMessage() disconnects', async t => {
	const subprocess = execa('ipc-iterate-send.js', {ipc: true});
	await loopAndBreak(t, subprocess);
	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Breaking from subprocess.getEachMessage() awaits the subprocess', async t => {
	const subprocess = execa('ipc-send-get.js', {ipc: true});

	const {exitCode, isTerminated, message, ipcOutput} = await t.throwsAsync(loopAndBreak(t, subprocess));
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(message.includes('Error: exchangeMessage() could not complete'));
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Breaking from exports.getEachMessage() disconnects', async t => {
	const subprocess = execa('ipc-iterate-break.js', {ipc: true});

	t.is(await subprocess.getOneMessage(), foobarString);
	const ipcError = await t.throwsAsync(subprocess.exchangeMessage(foobarString));
	t.true(ipcError.message.includes('subprocess.exchangeMessage() could not complete'));

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
});

const iterateAndError = async (t, subprocess, cause) => {
	// eslint-disable-next-line no-unreachable-loop
	for await (const message of subprocess.getEachMessage()) {
		t.is(message, foobarString);
		throw cause;
	}
};

test('Throwing from subprocess.getEachMessage() disconnects', async t => {
	const subprocess = execa('ipc-iterate-send.js', {ipc: true});

	const cause = new Error(foobarString);
	t.is(await t.throwsAsync(iterateAndError(t, subprocess, cause)), cause);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Throwing from subprocess.getEachMessage() awaits the subprocess', async t => {
	const subprocess = execa('ipc-send-get.js', {ipc: true});

	const cause = new Error(foobarString);
	t.is(await t.throwsAsync(iterateAndError(t, subprocess, cause)), cause);

	const {exitCode, isTerminated, message, ipcOutput} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(message.includes('Error: exchangeMessage() could not complete'));
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Throwing from exports.getEachMessage() disconnects', async t => {
	const subprocess = execa('ipc-iterate-throw.js', {ipc: true});

	t.is(await subprocess.getOneMessage(), foobarString);
	const ipcError = await t.throwsAsync(subprocess.exchangeMessage(foobarString));
	t.true(ipcError.message.includes('subprocess.exchangeMessage() could not complete'));

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

const testParentError = async (t, buffer) => {
	const subprocess = execa('ipc-send-twice.js', {ipc: true, buffer});
	const promise = iterateAllMessages(subprocess);

	const cause = new Error(foobarString);
	subprocess.emit('error', cause);

	const ipcError = await t.throwsAsync(promise);
	t.is(ipcError.cause, cause);

	const error = await t.throwsAsync(subprocess);
	t.is(error.exitCode, undefined);
	t.false(error.isTerminated);
	t.is(error.cause, cause);
	if (buffer) {
		t.true(error.message.includes('Error: sendMessage() cannot be used'));
	}
};

test('"error" event interrupts subprocess.getEachMessage(), buffer false', testParentError, false);
test('error" event interrupts subprocess.getEachMessage(), buffer true', testParentError, true);

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
