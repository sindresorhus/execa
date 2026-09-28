import assert from 'node:assert/strict';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';
import {isAlwaysTrue} from '../helpers/ipc.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

test('subprocess.getOneMessage() can filter messages', async () => {
	const subprocess = execa('ipc-send-twice.js', {ipc: true});
	const message = await subprocess.getOneMessage({filter: message => message === foobarArray[1]});
	assert.equal(message, foobarArray[1]);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, foobarArray);
});

test('exports.getOneMessage() can filter messages', async () => {
	const subprocess = execa('ipc-echo-filter.js', {ipc: true});
	await subprocess.sendMessage(foobarArray[0]);
	await subprocess.sendMessage(foobarArray[1]);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, [foobarArray[1]]);
});

test('Throwing from subprocess.getOneMessage() filter disconnects', async () => {
	const subprocess = execa('ipc-send-get.js', {ipc: true});
	const error = new Error(foobarString);
	assert.equal(await assertRejects(subprocess.getOneMessage({
		filter() {
			throw error;
		},
	})), error);

	const {exitCode, isTerminated, message, ipcOutput} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(message.includes('Error: getOneMessage() could not complete'));
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('Throwing from exports.getOneMessage() filter disconnects', async () => {
	const subprocess = execa('ipc-get-filter-throw.js', {ipcInput: 0});
	await assertRejects(subprocess.getOneMessage(), {
		message: /subprocess.getOneMessage\(\) could not complete/,
	});

	const {exitCode, isTerminated, message, ipcOutput} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(message.includes(`Error: ${foobarString}`));
	assert.deepEqual(ipcOutput, []);
});

test('Can retrieve initial IPC messages under heavy load', async () => {
	await Promise.all(Array.from({length: PARALLEL_COUNT}, async (_, index) => {
		const subprocess = execa('ipc-send-argv.js', [`${index}`], {ipc: true, buffer: false});
		assert.equal(await subprocess.getOneMessage(), `${index}`);
		await subprocess;
	}));
});

const testTwice = async (buffer, filter) => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});
	assert.deepEqual(
		await Promise.all([subprocess.getOneMessage({filter}), subprocess.getOneMessage({filter})]),
		[foobarString, foobarString],
	);
	await subprocess;
};

test('subprocess.getOneMessage() can be called twice at the same time, buffer false', () => testTwice(false, undefined));
test('subprocess.getOneMessage() can be called twice at the same time, buffer true', () => testTwice(true, undefined));
test('subprocess.getOneMessage() can be called twice at the same time, buffer false, filter', () => testTwice(false, isAlwaysTrue));
test('subprocess.getOneMessage() can be called twice at the same time, buffer true, filter', () => testTwice(true, isAlwaysTrue));

const testCleanupListeners = async (buffer, filter) => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});

	assert.equal(subprocess.nodeChildProcess.listenerCount('message'), 1);
	assert.equal(subprocess.nodeChildProcess.listenerCount('disconnect'), 1);

	const promise = subprocess.getOneMessage({filter});
	assert.equal(subprocess.nodeChildProcess.listenerCount('message'), 1);
	assert.equal(subprocess.nodeChildProcess.listenerCount('disconnect'), 1);

	assert.equal(await promise, foobarString);
	await subprocess;

	assert.equal(subprocess.nodeChildProcess.listenerCount('message'), 0);
	assert.equal(subprocess.nodeChildProcess.listenerCount('disconnect'), 0);
};

test('Cleans up subprocess.getOneMessage() listeners, buffer false', () => testCleanupListeners(false, undefined));
test('Cleans up subprocess.getOneMessage() listeners, buffer true', () => testCleanupListeners(true, undefined));
test('Cleans up subprocess.getOneMessage() listeners, buffer false, filter', () => testCleanupListeners(false, isAlwaysTrue));
test('Cleans up subprocess.getOneMessage() listeners, buffer true, filter', () => testCleanupListeners(true, isAlwaysTrue));

const testParentDisconnect = async (buffer, filter) => {
	const subprocess = execa('ipc-get-send-get.js', [`${filter}`], {ipc: true, buffer});
	await subprocess.sendMessage(foobarString);
	assert.equal(await subprocess.getOneMessage(), foobarString);

	subprocess.nodeChildProcess.disconnect();

	const {exitCode, isTerminated, message} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	if (buffer) {
		assert.ok(message.includes('Error: getOneMessage() could not complete'));
	}
};

test('subprocess.disconnect() interrupts exports.getOneMessage(), buffer false', () => testParentDisconnect(false, false));
test('subprocess.disconnect() interrupts exports.getOneMessage(), buffer true', () => testParentDisconnect(true, false));
test('subprocess.disconnect() interrupts exports.getOneMessage(), buffer false, filter', () => testParentDisconnect(false, true));
test('subprocess.disconnect() interrupts exports.getOneMessage(), buffer true, filter', () => testParentDisconnect(true, false));

const testSubprocessDisconnect = async (buffer, filter) => {
	const subprocess = execa('empty.js', {ipc: true, buffer});
	const {message} = await assertRejects(subprocess.getOneMessage({filter}));
	assert.ok(message.includes('subprocess.getOneMessage() could not complete'));
	await subprocess;
};

test('Subprocess exit interrupts subprocess.getOneMessage(), buffer false', () => testSubprocessDisconnect(false, undefined));
test('Subprocess exit interrupts subprocess.getOneMessage(), buffer true', () => testSubprocessDisconnect(true, undefined));
test('Subprocess exit interrupts subprocess.getOneMessage(), buffer false, filter', () => testSubprocessDisconnect(false, isAlwaysTrue));
test('Subprocess exit interrupts subprocess.getOneMessage(), buffer true, filter', () => testSubprocessDisconnect(true, isAlwaysTrue));
