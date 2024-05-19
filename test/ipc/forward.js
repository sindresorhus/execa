import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';
import {iterateAllMessages, alwaysPass} from '../helpers/ipc.js';

setFixtureDirectory();

const testParentErrorOne = async (t, filter, buffer) => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});

	const promise = subprocess.getOneMessage({filter});
	const cause = new Error(foobarString);
	subprocess.emit('error', cause);
	t.is(await promise, foobarString);

	const error = await t.throwsAsync(subprocess);
	t.is(error.exitCode, undefined);
	t.false(error.isTerminated);
	t.is(error.cause, cause);
	if (buffer) {
		t.deepEqual(error.ipcOutput, [foobarString]);
	}
};

test('"error" event does not interrupt subprocess.getOneMessage(), buffer false', testParentErrorOne, undefined, false);
test('"error" event does not interrupt subprocess.getOneMessage(), buffer true', testParentErrorOne, undefined, true);
test('"error" event does not interrupt subprocess.getOneMessage(), buffer false, filter', testParentErrorOne, alwaysPass, false);
test('"error" event does not interrupt subprocess.getOneMessage(), buffer true, filter', testParentErrorOne, alwaysPass, true);

const testSubprocessErrorOne = async (t, filter, buffer) => {
	const subprocess = execa('ipc-process-error.js', [`${filter}`], {ipc: true, buffer});
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	if (buffer) {
		t.deepEqual(ipcOutput, [foobarString]);
	}
};

test('"error" event does not interrupt exports.getOneMessage(), buffer false', testSubprocessErrorOne, false, false);
test('"error" event does not interrupt exports.getOneMessage(), buffer true', testSubprocessErrorOne, false, true);
test('"error" event does not interrupt exports.getOneMessage(), buffer false, filter', testSubprocessErrorOne, true, false);
test('"error" event does not interrupt exports.getOneMessage(), buffer true, filter', testSubprocessErrorOne, true, true);

const testParentErrorEach = async (t, buffer) => {
	const subprocess = execa('ipc-send-twice.js', {ipc: true, buffer});

	const promise = iterateAllMessages(subprocess);
	const cause = new Error(foobarString);
	subprocess.emit('error', cause);

	const error = await t.throwsAsync(subprocess);
	t.is(error, await t.throwsAsync(promise));
	t.is(error.exitCode, undefined);
	t.false(error.isTerminated);
	t.is(error.cause, cause);
	if (buffer) {
		t.deepEqual(error.ipcOutput, foobarArray);
	}
};

test('"error" event does not interrupt subprocess.getEachMessage(), buffer false', testParentErrorEach, false);
test('"error" event does not interrupt subprocess.getEachMessage(), buffer true', testParentErrorEach, true);

const testSubprocessErrorEach = async (t, filter, buffer) => {
	const subprocess = execa('ipc-iterate-error.js', [`${filter}`], {ipc: true, buffer});
	await subprocess.sendMessage('.');
	t.is(await subprocess.getOneMessage(), '.');
	await subprocess.sendMessage(foobarString);

	const {ipcOutput} = await subprocess;
	if (buffer) {
		t.deepEqual(ipcOutput, ['.']);
	}
};

test('"error" event does not interrupt exports.getEachMessage(), buffer false', testSubprocessErrorEach, 'ipc-iterate-error.js', false);
test('"error" event does not interrupt exports.getEachMessage(), buffer true', testSubprocessErrorEach, 'ipc-iterate-error.js', true);

test('"error" event does not interrupt result.ipcOutput', async t => {
	const subprocess = execa('ipc-echo-twice.js', {ipcInput: foobarString});

	const cause = new Error(foobarString);
	subprocess.emit('error', cause);
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);

	const error = await t.throwsAsync(subprocess);
	t.is(error.exitCode, undefined);
	t.false(error.isTerminated);
	t.is(error.cause, cause);
	t.deepEqual(error.ipcOutput, [foobarString, foobarString]);
});
