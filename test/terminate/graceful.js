import assert from 'node:assert/strict';
import {setTimeout} from 'node:timers/promises';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {mockSendIoError} from '../helpers/ipc.js';

setFixtureDirectory();

test('cancelSignal cannot be undefined with gracefulCancel', () => {
	assertThrows(() => {
		execa('empty.js', {gracefulCancel: true});
	}, {message: /The `cancelSignal` option must be defined/});
});

test('ipc cannot be false with gracefulCancel', () => {
	assertThrows(() => {
		execa('empty.js', {gracefulCancel: true, cancelSignal: AbortSignal.abort(), ipc: false});
	}, {message: /The `ipc` option cannot be false/});
});

test('serialization cannot be "json" with gracefulCancel', () => {
	assertThrows(() => {
		execa('empty.js', {gracefulCancel: true, cancelSignal: AbortSignal.abort(), serialization: 'json'});
	}, {message: /The `serialization` option cannot be 'json'/});
});

test('Current process can send a message right away', async () => {
	const controller = new AbortController();
	const subprocess = execa('ipc-echo.js', {cancelSignal: controller.signal, gracefulCancel: true});
	await subprocess.sendMessage(foobarString);
	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('Current process can receive a message right away', async () => {
	const controller = new AbortController();
	const subprocess = execa('ipc-send.js', {cancelSignal: controller.signal, gracefulCancel: true});
	assert.equal(await subprocess.getOneMessage(), foobarString);
	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('Does not disconnect during I/O errors when sending the abort reason', async () => {
	const controller = new AbortController();
	const subprocess = execa('ipc-echo.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	const error = mockSendIoError(subprocess);
	controller.abort(foobarString);
	await setTimeout(0);
	assert.equal(subprocess.nodeChildProcess.connected, true);
	subprocess.kill();
	const {isCanceled, isGracefullyCanceled, signal, ipcOutput, cause} = await assertRejects(subprocess);
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
	assert.equal(signal, 'SIGTERM');
	assert.deepEqual(ipcOutput, []);
	assert.equal(cause, error);
});

class AbortError extends Error {
	name = 'AbortError';
}

test('Abort reason is sent to the subprocess', async () => {
	const controller = new AbortController();
	const subprocess = execa('graceful-send.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	const error = new AbortError(foobarString);
	controller.abort(error);
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, cause, ipcOutput} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 0);
	assert.equal(cause, error);
	assert.equal(ipcOutput[0].message, error.message);
	assert.equal(ipcOutput[0].stack, error.stack);
	assert.equal(ipcOutput[0].name, 'Error');
});

test('Abort default reason is sent to the subprocess', async () => {
	const controller = new AbortController();
	const subprocess = execa('graceful-send.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	controller.abort();
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, cause, ipcOutput} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 0);
	const {reason} = controller.signal;
	assert.equal(cause.stack, reason.stack);
	assert.equal(ipcOutput[0].message, reason.message);
	assert.equal(ipcOutput[0].stack, reason.stack);
});

test('Fail when sending non-serializable abort reason', async () => {
	const controller = new AbortController();
	const subprocess = execa('ipc-echo.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	controller.abort(() => {});
	await setTimeout(0);
	assert.equal(subprocess.nodeChildProcess.connected, true);
	await subprocess.sendMessage(foobarString);
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, cause, ipcOutput} = await assertRejects(subprocess);
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 0);
	assert.deepEqual(ipcOutput, [foobarString]);
	assert.equal(cause.message, '`cancelSignal`\'s `controller.abort()`\'s argument type is invalid: the message cannot be serialized: () => {}.');
	assert.equal(cause.cause.message, '() => {} could not be cloned.');
});

test('timeout does not use graceful cancelSignal', async () => {
	const controller = new AbortController();
	const {timedOut, isCanceled, isGracefullyCanceled, isTerminated, signal, exitCode, shortMessage, ipcOutput} = await assertRejects(execa('graceful-send.js', {cancelSignal: controller.signal, gracefulCancel: true, timeout: 1}));
	assert.equal(timedOut, true);
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGTERM');
	assert.equal(exitCode, undefined);
	assert.equal(shortMessage, 'Command timed out after 1 milliseconds: graceful-send.js');
	assert.deepEqual(ipcOutput, []);
});

test('error on graceful cancelSignal on non-0 exit code', async () => {
	const {isCanceled, isGracefullyCanceled, isTerminated, isForcefullyTerminated, exitCode, shortMessage} = await assertRejects(execa('wait-fail.js', {cancelSignal: AbortSignal.abort(''), gracefulCancel: true, forceKillAfterDelay: false}));
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, false);
	assert.equal(isForcefullyTerminated, false);
	assert.equal(exitCode, 2);
	assert.equal(shortMessage, 'Command was gracefully canceled with exit code 2: wait-fail.js');
});

test('error on graceful cancelSignal on forceful termination', async () => {
	const {isCanceled, isGracefullyCanceled, isTerminated, signal, isForcefullyTerminated, exitCode, shortMessage} = await assertRejects(execa('forever.js', {cancelSignal: AbortSignal.abort(''), gracefulCancel: true, forceKillAfterDelay: 1}));
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGKILL');
	assert.equal(isForcefullyTerminated, true);
	assert.equal(exitCode, undefined);
	assert.equal(shortMessage, 'Command was gracefully canceled and was forcefully terminated after 1 milliseconds: forever.js');
});

test('error on graceful cancelSignal on non-forceful termination', async () => {
	const subprocess = execa('ipc-send-get.js', {cancelSignal: AbortSignal.abort(''), gracefulCancel: true, forceKillAfterDelay: 1e6});
	assert.equal(await subprocess.getOneMessage(), foobarString);
	subprocess.kill();
	const {isCanceled, isGracefullyCanceled, isTerminated, signal, isForcefullyTerminated, exitCode, shortMessage} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGTERM');
	assert.equal(isForcefullyTerminated, false);
	assert.equal(exitCode, undefined);
	assert.equal(shortMessage, 'Command was gracefully canceled with SIGTERM (Termination): ipc-send-get.js');
});

test('`forceKillAfterDelay: false` with the "cancelSignal" option when graceful', async () => {
	const subprocess = execa('forever.js', {cancelSignal: AbortSignal.abort(''), gracefulCancel: true, forceKillAfterDelay: false});
	await setTimeout(6e3);
	subprocess.kill('SIGKILL');
	const {isCanceled, isGracefullyCanceled, isTerminated, signal, isForcefullyTerminated, exitCode, shortMessage} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGKILL');
	assert.equal(isForcefullyTerminated, false);
	assert.equal(exitCode, undefined);
	assert.equal(shortMessage, 'Command was gracefully canceled with SIGKILL (Forced termination): forever.js');
});

test('subprocess.getCancelSignal() is not defined', async () => {
	const subprocess = execa('empty.js', {cancelSignal: AbortSignal.abort(''), gracefulCancel: true});
	assert.equal(subprocess.getCancelSignal, undefined);
	await assertRejects(subprocess);
});
