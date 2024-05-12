import {once} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';
import {iterateAllMessages, alwaysPass} from '../helpers/ipc.js';

setFixtureDirectory();

const getOneSubprocessMessage = subprocess => subprocess.getOneMessage();
const getOneFilteredMessage = subprocess => subprocess.getOneMessage({filter: alwaysPass});

const testKeepAlive = async (t, buffer) => {
	const subprocess = execa('ipc-echo-twice.js', {ipc: true, buffer});
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess;
};

test('subprocess.getOneMessage() keeps the subprocess alive, buffer false', testKeepAlive, false);
test('subprocess.getOneMessage() keeps the subprocess alive, buffer true', testKeepAlive, true);

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

const HIGH_CONCURRENCY_COUNT = 100;

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

test.serial('Can retrieve initial IPC messages under heavy load, buffer false', async t => {
	await Promise.all(
		Array.from({length: HIGH_CONCURRENCY_COUNT}, async (_, index) => {
			const subprocess = execa('ipc-send-argv.js', [`${index}`], {ipc: true, buffer: false});
			t.is(await subprocess.getOneMessage(), `${index}`);
			await subprocess;
		}),
	);
});

test.serial('Can retrieve initial IPC messages under heavy load, buffer true', async t => {
	await Promise.all(
		Array.from({length: HIGH_CONCURRENCY_COUNT}, async (_, index) => {
			const {ipcOutput} = await execa('ipc-send-argv.js', [`${index}`], {ipc: true});
			t.deepEqual(ipcOutput, [`${index}`]);
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
	const bufferCount = buffer ? 1 : 0;

	t.is(subprocess.listenerCount('message'), bufferCount);
	t.is(subprocess.listenerCount('disconnect'), bufferCount);

	const promise = subprocess.getOneMessage({filter});
	t.is(subprocess.listenerCount('message'), bufferCount + 1);
	t.is(subprocess.listenerCount('disconnect'), bufferCount + 1);
	t.is(await promise, foobarString);

	t.is(subprocess.listenerCount('message'), bufferCount);
	t.is(subprocess.listenerCount('disconnect'), bufferCount);

	await subprocess;

	t.is(subprocess.listenerCount('message'), 0);
	t.is(subprocess.listenerCount('disconnect'), 0);
};

test('Cleans up subprocess.getOneMessage() listeners, buffer false', testCleanupListeners, false, undefined);
test('Cleans up subprocess.getOneMessage() listeners, buffer true', testCleanupListeners, true, undefined);
test('Cleans up subprocess.getOneMessage() listeners, buffer false, filter', testCleanupListeners, false, alwaysPass);
test('Cleans up subprocess.getOneMessage() listeners, buffer true, filter', testCleanupListeners, true, alwaysPass);

const testParentDisconnect = async (t, buffer, filter) => {
	const fixtureName = filter ? 'ipc-echo-twice-filter.js' : 'ipc-echo-twice.js';
	const subprocess = execa(fixtureName, {ipc: true, buffer});
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
test('subprocess.disconnect() interrupts exports.getOneMessage(), buffer true, filter', testParentDisconnect, true, true);

const testSubprocessDisconnect = async (t, buffer, filter) => {
	const subprocess = execa('empty.js', {ipc: true, buffer});
	await t.throwsAsync(subprocess.getOneMessage({filter}), {
		message: /subprocess\.getOneMessage\(\) could not complete/,
	});
	await subprocess;
};

test('Subprocess exit interrupts disconnect.getOneMessage(), buffer false', testSubprocessDisconnect, false, undefined);
test('Subprocess exit interrupts disconnect.getOneMessage(), buffer true', testSubprocessDisconnect, true, undefined);
test('Subprocess exit interrupts disconnect.getOneMessage(), buffer false, filter', testSubprocessDisconnect, false, alwaysPass);
test('Subprocess exit interrupts disconnect.getOneMessage(), buffer true, filter', testSubprocessDisconnect, true, alwaysPass);

const testParentError = async (t, getMessages, useCause, buffer) => {
	const subprocess = execa('ipc-echo.js', {ipc: true, buffer});
	await subprocess.sendMessage(foobarString);
	const promise = getMessages(subprocess);

	const cause = new Error(foobarString);
	subprocess.emit('error', cause);

	const ipcError = await t.throwsAsync(promise);
	t.is(useCause ? ipcError.cause : ipcError, cause);

	const error = await t.throwsAsync(subprocess);
	t.is(error.exitCode, 1);
	t.false(error.isTerminated);
	t.is(error.cause, cause);
	if (buffer) {
		t.true(error.message.includes('Error: getOneMessage() cannot be used'));
	}
};

test('"error" event interrupts subprocess.getOneMessage(), buffer false', testParentError, getOneSubprocessMessage, false, false);
test('"error" event interrupts subprocess.getOneMessage(), buffer true', testParentError, getOneSubprocessMessage, false, true);
test('"error" event interrupts subprocess.getOneMessage(), buffer false, filter', testParentError, getOneFilteredMessage, false, false);
test('"error" event interrupts subprocess.getOneMessage(), buffer true, filter', testParentError, getOneFilteredMessage, false, true);
test('"error" event interrupts subprocess.getEachMessage(), buffer false', testParentError, iterateAllMessages, true, false);
test('"error" event interrupts subprocess.getEachMessage(), buffer true', testParentError, iterateAllMessages, true, true);

const testSubprocessError = async (t, fixtureName, buffer) => {
	const subprocess = execa(fixtureName, {ipc: true, buffer});

	const ipcError = await t.throwsAsync(subprocess.getOneMessage());
	t.true(ipcError.message.includes('subprocess.getOneMessage() could not complete'));

	const {exitCode, isTerminated, message} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	if (buffer) {
		t.true(message.includes(`Error: ${foobarString}`));
	}
};

test('"error" event interrupts exports.getOneMessage(), buffer false', testSubprocessError, 'ipc-process-error.js', false);
test('"error" event interrupts exports.getOneMessage(), buffer true', testSubprocessError, 'ipc-process-error.js', true);
test('"error" event interrupts exports.getOneMessage(), buffer false, filter', testSubprocessError, 'ipc-process-error-filter.js', false);
test('"error" event interrupts exports.getOneMessage(), buffer true, filter', testSubprocessError, 'ipc-process-error-filter.js', true);
test('"error" event interrupts exports.getEachMessage(), buffer false', testSubprocessError, 'ipc-iterate-error.js', false);
test('"error" event interrupts exports.getEachMessage(), buffer true', testSubprocessError, 'ipc-iterate-error.js', true);
