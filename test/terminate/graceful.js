import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {mockSendIoError} from '../helpers/ipc.js';

setFixtureDirectory();

test('cancelSignal cannot be undefined with gracefulCancel', t => {
	t.throws(() => {
		execa('empty.js', {gracefulCancel: true});
	}, {message: /The `cancelSignal` option must be defined/});
});

test('ipc cannot be false with gracefulCancel', t => {
	t.throws(() => {
		execa('empty.js', {gracefulCancel: true, cancelSignal: AbortSignal.abort(), ipc: false});
	}, {message: /The `ipc` option cannot be false/});
});

test('serialization cannot be "json" with gracefulCancel', t => {
	t.throws(() => {
		execa('empty.js', {gracefulCancel: true, cancelSignal: AbortSignal.abort(), serialization: 'json'});
	}, {message: /The `serialization` option cannot be 'json'/});
});

test('Current process can send a message right away', async t => {
	const controller = new AbortController();
	const subprocess = execa('ipc-echo.js', {cancelSignal: controller.signal, gracefulCancel: true});
	await subprocess.sendMessage(foobarString);
	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Current process can receive a message right away', async t => {
	const controller = new AbortController();
	const subprocess = execa('ipc-send.js', {cancelSignal: controller.signal, gracefulCancel: true});
	t.is(await subprocess.getOneMessage(), foobarString);
	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Does not disconnect during I/O errors when sending the abort reason', async t => {
	const controller = new AbortController();
	const subprocess = execa('ipc-echo.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	const error = mockSendIoError(subprocess);
	controller.abort(foobarString);
	await setTimeout(0);
	t.true(subprocess.connected);
	subprocess.kill();
	const {isCanceled, isGracefullyCanceled, signal, ipcOutput, cause} = await t.throwsAsync(subprocess);
	t.false(isCanceled);
	t.false(isGracefullyCanceled);
	t.is(signal, 'SIGTERM');
	t.deepEqual(ipcOutput, []);
	t.is(cause, error);
});

class AbortError extends Error {
	name = 'AbortError';
}

test('Abort reason is sent to the subprocess', async t => {
	const controller = new AbortController();
	const subprocess = execa('graceful-send.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	const error = new AbortError(foobarString);
	controller.abort(error);
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, cause, ipcOutput} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 0);
	t.is(cause, error);
	t.is(ipcOutput[0].message, error.message);
	t.is(ipcOutput[0].stack, error.stack);
	t.is(ipcOutput[0].name, 'Error');
});

test('Abort default reason is sent to the subprocess', async t => {
	const controller = new AbortController();
	const subprocess = execa('graceful-send.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	controller.abort();
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, cause, ipcOutput} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 0);
	const {reason} = controller.signal;
	t.is(cause.stack, reason.stack);
	t.is(ipcOutput[0].message, reason.message);
	t.is(ipcOutput[0].stack, reason.stack);
});

test('Fail when sending non-serializable abort reason', async t => {
	const controller = new AbortController();
	const subprocess = execa('ipc-echo.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	controller.abort(() => {});
	await setTimeout(0);
	t.true(subprocess.connected);
	await subprocess.sendMessage(foobarString);
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, cause, ipcOutput} = await t.throwsAsync(subprocess);
	t.false(isCanceled);
	t.false(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 0);
	t.deepEqual(ipcOutput, [foobarString]);
	t.is(cause.message, '`cancelSignal`\'s `controller.abort()`\'s argument type is invalid: the message cannot be serialized: () => {}.');
	t.is(cause.cause.message, '() => {} could not be cloned.');
});

test('timeout does not use graceful cancelSignal', async t => {
	const controller = new AbortController();
	const {timedOut, isCanceled, isGracefullyCanceled, isTerminated, signal, exitCode, shortMessage, ipcOutput} = await t.throwsAsync(execa('graceful-send.js', {cancelSignal: controller.signal, gracefulCancel: true, timeout: 1}));
	t.true(timedOut);
	t.false(isCanceled);
	t.false(isGracefullyCanceled);
	t.true(isTerminated);
	t.is(signal, 'SIGTERM');
	t.is(exitCode, undefined);
	t.is(shortMessage, 'Command timed out after 1 milliseconds: graceful-send.js');
	t.deepEqual(ipcOutput, []);
});

test('error on graceful cancelSignal on non-0 exit code', async t => {
	const {isCanceled, isGracefullyCanceled, isTerminated, isForcefullyTerminated, exitCode, shortMessage} = await t.throwsAsync(execa('wait-fail.js', {cancelSignal: AbortSignal.abort(''), gracefulCancel: true, forceKillAfterDelay: false}));
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.false(isTerminated);
	t.false(isForcefullyTerminated);
	t.is(exitCode, 2);
	t.is(shortMessage, 'Command was gracefully canceled with exit code 2: wait-fail.js');
});

test('error on graceful cancelSignal on forceful termination', async t => {
	const {isCanceled, isGracefullyCanceled, isTerminated, signal, isForcefullyTerminated, exitCode, shortMessage} = await t.throwsAsync(execa('forever.js', {cancelSignal: AbortSignal.abort(''), gracefulCancel: true, forceKillAfterDelay: 1}));
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.true(isTerminated);
	t.is(signal, 'SIGKILL');
	t.true(isForcefullyTerminated);
	t.is(exitCode, undefined);
	t.is(shortMessage, 'Command was gracefully canceled and was forcefully terminated after 1 milliseconds: forever.js');
});

test('error on graceful cancelSignal on non-forceful termination', async t => {
	const subprocess = execa('ipc-send-get.js', {cancelSignal: AbortSignal.abort(''), gracefulCancel: true, forceKillAfterDelay: 1e6});
	t.is(await subprocess.getOneMessage(), foobarString);
	subprocess.kill();
	const {isCanceled, isGracefullyCanceled, isTerminated, signal, isForcefullyTerminated, exitCode, shortMessage} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.true(isTerminated);
	t.is(signal, 'SIGTERM');
	t.false(isForcefullyTerminated);
	t.is(exitCode, undefined);
	t.is(shortMessage, 'Command was gracefully canceled with SIGTERM (Termination): ipc-send-get.js');
});

test('`forceKillAfterDelay: false` with the "cancelSignal" option when graceful', async t => {
	const subprocess = execa('forever.js', {cancelSignal: AbortSignal.abort(''), gracefulCancel: true, forceKillAfterDelay: false});
	await setTimeout(6e3);
	subprocess.kill('SIGKILL');
	const {isCanceled, isGracefullyCanceled, isTerminated, signal, isForcefullyTerminated, exitCode, shortMessage} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.true(isTerminated);
	t.is(signal, 'SIGKILL');
	t.false(isForcefullyTerminated);
	t.is(exitCode, undefined);
	t.is(shortMessage, 'Command was gracefully canceled with SIGKILL (Forced termination): forever.js');
});

test('subprocess.getCancelSignal() is not defined', async t => {
	const subprocess = execa('empty.js', {cancelSignal: AbortSignal.abort(''), gracefulCancel: true});
	t.is(subprocess.getCancelSignal, undefined);
	await t.throwsAsync(subprocess);
});
