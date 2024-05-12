import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';

setFixtureDirectory();

// @todo: replace with Array.fromAsync(subprocess.getEachMessage()) after dropping support for Node <22.0.0
const iterateAllMessages = async subprocess => {
	const messages = [];
	for await (const message of subprocess.getEachMessage()) {
		messages.push(message);
	}

	return messages;
};

test('Can iterate over IPC messages', async t => {
	let count = 0;
	const subprocess = execa('ipc-send-twice.js', {ipc: true});
	for await (const message of subprocess.getEachMessage()) {
		t.is(message, foobarArray[count++]);
	}
});

test('Can iterate over IPC messages in subprocess', async t => {
	const subprocess = execa('ipc-iterate.js', {ipc: true});

	await subprocess.sendMessage('.');
	await subprocess.sendMessage('.');
	await subprocess.sendMessage(foobarString);

	const {stdout} = await subprocess;
	t.is(stdout, '..');
});

test('Can iterate multiple times over IPC messages in subprocess', async t => {
	const subprocess = execa('ipc-iterate-twice.js', {ipc: true});

	await subprocess.sendMessage('.');
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), '.');
	await subprocess.sendMessage('.');
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), '.');

	const {stdout} = await subprocess;
	t.is(stdout, '..');
});

const HIGH_CONCURRENCY_COUNT = 100;

test('Can send many messages at once with exports.getEachMessage()', async t => {
	const subprocess = execa('ipc-iterate.js', {ipc: true});
	await Promise.all(Array.from({length: HIGH_CONCURRENCY_COUNT}, (_, index) => subprocess.sendMessage(index)));
	await subprocess.sendMessage(foobarString);
	const {stdout} = await subprocess;
	const expectedStdout = Array.from({length: HIGH_CONCURRENCY_COUNT}, (_, index) => `${index}`).join('');
	t.is(stdout, expectedStdout);
});

test('Disconnecting in the current process stops exports.getEachMessage()', async t => {
	const subprocess = execa('ipc-send-iterate.js', {ipc: true});
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
});

test('Exiting the subprocess stops subprocess.getEachMessage()', async t => {
	const subprocess = execa('ipc-send.js', {ipc: true});
	for await (const message of subprocess.getEachMessage()) {
		t.is(message, foobarString);
	}
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
	const {exitCode} = await t.throwsAsync(loopAndBreak(t, subprocess));
	t.is(exitCode, 1);
});

test('Cleans up subprocess.getEachMessage() listeners', async t => {
	const subprocess = execa('ipc-send.js', {ipc: true});

	t.is(subprocess.listenerCount('message'), 0);
	t.is(subprocess.listenerCount('disconnect'), 0);

	const promise = iterateAllMessages(subprocess);
	t.is(subprocess.listenerCount('message'), 1);
	t.is(subprocess.listenerCount('disconnect'), 1);
	t.deepEqual(await promise, [foobarString]);

	t.is(subprocess.listenerCount('message'), 0);
	t.is(subprocess.listenerCount('disconnect'), 0);
});

test('"error" event interrupts subprocess.getEachMessage()', async t => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	await subprocess.sendMessage(foobarString);
	const cause = new Error(foobarString);
	t.like(await t.throwsAsync(Promise.all([iterateAllMessages(subprocess), subprocess.emit('error', cause)])), {cause});
	t.like(await t.throwsAsync(subprocess), {cause});
});
