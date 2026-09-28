import assert from 'node:assert/strict';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';
import {iterateAllMessages, isAlwaysTrue} from '../helpers/ipc.js';

setFixtureDirectory();

const testParentErrorOne = async (filter, buffer) => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});

	const promise = subprocess.getOneMessage({filter});
	const cause = new Error(foobarString);
	subprocess.nodeChildProcess.emit('error', cause);
	assert.equal(await promise, foobarString);

	const error = await assertRejects(subprocess);
	assert.equal(error.exitCode, undefined);
	assert.equal(error.isTerminated, false);
	assert.equal(error.cause, cause);
	if (buffer) {
		assert.deepEqual(error.ipcOutput, [foobarString]);
	}
};

test('"error" event does not interrupt subprocess.getOneMessage(), buffer false', () => testParentErrorOne(undefined, false));
test('"error" event does not interrupt subprocess.getOneMessage(), buffer true', () => testParentErrorOne(undefined, true));
test('"error" event does not interrupt subprocess.getOneMessage(), buffer false, filter', () => testParentErrorOne(isAlwaysTrue, false));
test('"error" event does not interrupt subprocess.getOneMessage(), buffer true, filter', () => testParentErrorOne(isAlwaysTrue, true));

const testSubprocessErrorOne = async (filter, buffer) => {
	const subprocess = execa('ipc-process-error.js', [`${filter}`], {ipc: true, buffer});
	await subprocess.sendMessage(foobarString);
	assert.equal(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	if (buffer) {
		assert.deepEqual(ipcOutput, [foobarString]);
	}
};

test('"error" event does not interrupt exports.getOneMessage(), buffer false', () => testSubprocessErrorOne(false, false));
test('"error" event does not interrupt exports.getOneMessage(), buffer true', () => testSubprocessErrorOne(false, true));
test('"error" event does not interrupt exports.getOneMessage(), buffer false, filter', () => testSubprocessErrorOne(true, false));
test('"error" event does not interrupt exports.getOneMessage(), buffer true, filter', () => testSubprocessErrorOne(true, true));

const testParentErrorEach = async buffer => {
	const subprocess = execa('ipc-send-twice.js', {ipc: true, buffer});

	const promise = iterateAllMessages(subprocess);
	const cause = new Error(foobarString);
	subprocess.nodeChildProcess.emit('error', cause);

	const error = await assertRejects(subprocess);
	assert.equal(error, await assertRejects(promise));
	assert.equal(error.exitCode, undefined);
	assert.equal(error.isTerminated, false);
	assert.equal(error.cause, cause);
	if (buffer) {
		assert.deepEqual(error.ipcOutput, foobarArray);
	}
};

test('"error" event does not interrupt subprocess.getEachMessage(), buffer false', () => testParentErrorEach(false));
test('"error" event does not interrupt subprocess.getEachMessage(), buffer true', () => testParentErrorEach(true));

const testSubprocessErrorEach = async (filter, buffer) => {
	const subprocess = execa('ipc-iterate-error.js', [`${filter}`], {ipc: true, buffer});
	await subprocess.sendMessage('.');
	assert.equal(await subprocess.getOneMessage(), '.');
	await subprocess.sendMessage(foobarString);

	const {ipcOutput} = await subprocess;
	if (buffer) {
		assert.deepEqual(ipcOutput, ['.']);
	}
};

test('"error" event does not interrupt exports.getEachMessage(), buffer false', () => testSubprocessErrorEach('ipc-iterate-error.js', false));
test('"error" event does not interrupt exports.getEachMessage(), buffer true', () => testSubprocessErrorEach('ipc-iterate-error.js', true));

test('"error" event does not interrupt result.ipcOutput', async () => {
	const subprocess = execa('ipc-echo-twice.js', {ipcInput: foobarString});

	const cause = new Error(foobarString);
	subprocess.nodeChildProcess.emit('error', cause);
	assert.equal(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage(foobarString);
	assert.equal(await subprocess.getOneMessage(), foobarString);

	const error = await assertRejects(subprocess);
	assert.equal(error.exitCode, undefined);
	assert.equal(error.isTerminated, false);
	assert.equal(error.cause, cause);
	assert.deepEqual(error.ipcOutput, [foobarString, foobarString]);
});
