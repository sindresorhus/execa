import assert from 'node:assert/strict';
import test from 'node:test';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {isAlwaysTrue, subprocessGetOne, subprocessGetFirst} from '../helpers/ipc.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

const testSendHoldParent = async (getMessage, buffer, filter) => {
	const subprocess = execa('ipc-iterate.js', {ipc: true, buffer});

	await subprocess.sendMessage(0);
	assert.equal(await subprocess.getOneMessage({filter}), 0);

	const messages = Array.from({length: PARALLEL_COUNT}, (_, index) => index + 1);
	await Promise.all([
		...messages.map(message => subprocess.sendMessage(message)),
		subprocess.sendMessage(foobarString),
		subprocess.nodeChildProcess.emit('message', '.'),
	]);
	assert.equal(await getMessage(subprocess, {filter}), '.');

	const {ipcOutput} = await subprocess;
	if (!buffer) {
		return;
	}

	const expectedOutput = [0, '.', ...messages];
	assert.deepEqual(ipcOutput, expectedOutput);
};

test('Multiple parallel subprocess.sendMessage() + subprocess.getOneMessage(), buffer false', () => testSendHoldParent(subprocessGetOne, false, undefined));
test('Multiple parallel subprocess.sendMessage() + subprocess.getOneMessage(), buffer true', () => testSendHoldParent(subprocessGetOne, true, undefined));
test('Multiple parallel subprocess.sendMessage() + subprocess.getOneMessage(), buffer false, filter', () => testSendHoldParent(subprocessGetOne, false, isAlwaysTrue));
test('Multiple parallel subprocess.sendMessage() + subprocess.getOneMessage(), buffer true, filter', () => testSendHoldParent(subprocessGetOne, true, isAlwaysTrue));
test('Multiple parallel subprocess.sendMessage() + subprocess.getEachMessage(), buffer false', () => testSendHoldParent(subprocessGetFirst, false, undefined));
test('Multiple parallel subprocess.sendMessage() + subprocess.getEachMessage(), buffer true', () => testSendHoldParent(subprocessGetFirst, true, undefined));

const testSendHoldSubprocess = async (filter, isGetEach) => {
	const {ipcOutput} = await execa('ipc-iterate-back.js', [`${filter}`, `${isGetEach}`], {ipcInput: 0});
	const expectedOutput = [...Array.from({length: PARALLEL_COUNT + 1}, (_, index) => index), '.'];
	assert.deepEqual(ipcOutput, expectedOutput);
};

test('Multiple parallel exports.sendMessage() + exports.getOneMessage()', () => testSendHoldSubprocess(false, false));
test('Multiple parallel exports.sendMessage() + exports.getOneMessage(), filter', () => testSendHoldSubprocess(true, false));
test('Multiple parallel exports.sendMessage() + exports.getEachMessage()', () => testSendHoldSubprocess(false, true));

const testSendHoldParentSerial = async (getMessage, buffer, filter) => {
	const subprocess = execa('ipc-iterate.js', {ipc: true, buffer});

	await subprocess.sendMessage(0);
	assert.equal(await subprocess.getOneMessage({filter}), 0);

	const promise = subprocess.sendMessage(1);
	subprocess.nodeChildProcess.emit('message', '.');
	await promise;

	const messages = Array.from({length: PARALLEL_COUNT}, (_, index) => index + 2);
	for (const message of messages) {
		// eslint-disable-next-line no-await-in-loop
		await subprocess.sendMessage(message);
	}

	await subprocess.sendMessage(foobarString);

	const {ipcOutput} = await subprocess;
	if (!buffer) {
		return;
	}

	const expectedOutput = [0, '.', 1, ...messages];
	assert.deepEqual(ipcOutput, expectedOutput);
};

test('Multiple serial subprocess.sendMessage() + subprocess.getOneMessage(), buffer false', () => testSendHoldParentSerial(subprocessGetOne, false, undefined));
test('Multiple serial subprocess.sendMessage() + subprocess.getOneMessage(), buffer true', () => testSendHoldParentSerial(subprocessGetOne, true, undefined));
test('Multiple serial subprocess.sendMessage() + subprocess.getOneMessage(), buffer false, filter', () => testSendHoldParentSerial(subprocessGetOne, false, isAlwaysTrue));
test('Multiple serial subprocess.sendMessage() + subprocess.getOneMessage(), buffer true, filter', () => testSendHoldParentSerial(subprocessGetOne, true, isAlwaysTrue));
test('Multiple serial subprocess.sendMessage() + subprocess.getEachMessage(), buffer false', () => testSendHoldParentSerial(subprocessGetFirst, false, undefined));
test('Multiple serial subprocess.sendMessage() + subprocess.getEachMessage(), buffer true', () => testSendHoldParentSerial(subprocessGetFirst, true, undefined));

const testSendHoldSubprocessSerial = async (filter, isGetEach) => {
	const {ipcOutput} = await execa('ipc-iterate-back-serial.js', [`${filter}`, `${isGetEach}`], {ipcInput: 0});
	const expectedOutput = [...Array.from({length: PARALLEL_COUNT + 2}, (_, index) => index), '.'];
	assert.deepEqual(ipcOutput, expectedOutput);
};

test('Multiple serial exports.sendMessage() + exports.getOneMessage()', () => testSendHoldSubprocessSerial(false, false));
test('Multiple serial exports.sendMessage() + exports.getOneMessage(), filter', () => testSendHoldSubprocessSerial(true, false));
test('Multiple serial exports.sendMessage() + exports.getEachMessage()', () => testSendHoldSubprocessSerial(false, true));
