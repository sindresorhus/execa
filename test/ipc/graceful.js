import {getEventListeners} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

test('Graceful cancelSignal can be already aborted', async t => {
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await t.throwsAsync(execa('graceful-send.js', {cancelSignal: AbortSignal.abort(foobarString), gracefulCancel: true, forceKillAfterDelay: false}));
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 0);
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Graceful cancelSignal can be aborted', async t => {
	const controller = new AbortController();
	const subprocess = execa('graceful-send-twice.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	t.false(await subprocess.getOneMessage());
	controller.abort(foobarString);
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 0);
	t.deepEqual(ipcOutput, [false, foobarString]);
});

test('Graceful cancelSignal can be never aborted', async t => {
	const controller = new AbortController();
	const subprocess = execa('graceful-send-fast.js', {cancelSignal: controller.signal, gracefulCancel: true});
	t.false(await subprocess.getOneMessage());
	await subprocess;
});

test('Graceful cancelSignal can be already aborted but not used', async t => {
	const subprocess = execa('ipc-send-get.js', {cancelSignal: AbortSignal.abort(foobarString), gracefulCancel: true, forceKillAfterDelay: false});
	t.is(await subprocess.getOneMessage(), foobarString);
	await setTimeout(1e3);
	await subprocess.sendMessage('.');
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 0);
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Graceful cancelSignal can be aborted but not used', async t => {
	const controller = new AbortController();
	const subprocess = execa('ipc-send-get.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	t.is(await subprocess.getOneMessage(), foobarString);
	controller.abort(foobarString);
	await setTimeout(1e3);
	await subprocess.sendMessage(foobarString);
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 0);
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Graceful cancelSignal can be never aborted nor used', async t => {
	const controller = new AbortController();
	const subprocess = execa('empty.js', {cancelSignal: controller.signal, gracefulCancel: true});
	t.is(getEventListeners(controller.signal, 'abort').length, 1);
	await subprocess;
	t.is(getEventListeners(controller.signal, 'abort').length, 0);
});

test('Graceful cancelSignal can be aborted twice', async t => {
	const controller = new AbortController();
	const subprocess = execa('graceful-send-twice.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	t.false(await subprocess.getOneMessage());
	controller.abort(foobarString);
	controller.abort('.');
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 0);
	t.deepEqual(ipcOutput, [false, foobarString]);
});

test('Graceful cancelSignal cannot be manually aborted after disconnection', async t => {
	const controller = new AbortController();
	const subprocess = execa('empty.js', {cancelSignal: controller.signal, gracefulCancel: true});
	subprocess.disconnect();
	controller.abort(foobarString);
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput, originalMessage} = await t.throwsAsync(subprocess);
	t.false(isCanceled);
	t.false(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 0);
	t.deepEqual(ipcOutput, []);
	t.is(originalMessage, '`cancelSignal`\'s `controller.abort()` cannot be used: the subprocess has already exited or disconnected.');
});

test('Graceful cancelSignal can disconnect after being manually aborted', async t => {
	const controller = new AbortController();
	const subprocess = execa('graceful-disconnect.js', {cancelSignal: controller.signal, gracefulCancel: true});
	controller.abort(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);
	subprocess.disconnect();
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 0);
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Graceful cancelSignal is automatically aborted on disconnection', async t => {
	const controller = new AbortController();
	const subprocess = execa('graceful-send-print.js', {cancelSignal: controller.signal, gracefulCancel: true});
	t.false(await subprocess.getOneMessage());
	subprocess.disconnect();
	const {isCanceled, isGracefullyCanceled, ipcOutput, stdout} = await subprocess;
	t.false(isCanceled);
	t.false(isGracefullyCanceled);
	t.deepEqual(ipcOutput, [false]);
	t.true(stdout.includes('Error: `cancelSignal` aborted: the parent process disconnected.'));
});

test('getCancelSignal() aborts if already disconnected', async t => {
	const controller = new AbortController();
	const subprocess = execa('graceful-print.js', {cancelSignal: controller.signal, gracefulCancel: true});
	subprocess.disconnect();
	const {isCanceled, isGracefullyCanceled, ipcOutput, stdout} = await subprocess;
	t.false(isCanceled);
	t.false(isGracefullyCanceled);
	t.deepEqual(ipcOutput, []);
	t.true(stdout.includes('Error: `cancelSignal` aborted: the parent process disconnected.'));
});

test('getCancelSignal() fails if no IPC', async t => {
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput, stderr} = await t.throwsAsync(execa('graceful-none.js'));
	t.false(isCanceled);
	t.false(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 1);
	t.deepEqual(ipcOutput, []);
	t.true(stderr.includes('Error: `getCancelSignal()` cannot be used without setting the `cancelSignal` subprocess option.'));
});

test.serial('getCancelSignal() hangs if cancelSignal without gracefulCancel', async t => {
	const controller = new AbortController();
	const {timedOut, isCanceled, isGracefullyCanceled, signal, ipcOutput} = await t.throwsAsync(execa('graceful-wait.js', {ipc: true, cancelSignal: controller.signal, timeout: 1e3}));
	t.true(timedOut);
	t.false(isCanceled);
	t.false(isGracefullyCanceled);
	t.is(signal, 'SIGTERM');
	t.deepEqual(ipcOutput, []);
});

test('Subprocess cancelSignal does not keep subprocess alive', async t => {
	const controller = new AbortController();
	const {ipcOutput} = await execa('graceful-ref.js', {cancelSignal: controller.signal, gracefulCancel: true});
	t.deepEqual(ipcOutput, []);
});

test('Subprocess can send a message right away', async t => {
	const controller = new AbortController();
	const {ipcOutput} = await execa('graceful-send-string.js', {cancelSignal: controller.signal, gracefulCancel: true});
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Subprocess can receive a message right away', async t => {
	const controller = new AbortController();
	const {ipcOutput} = await execa('graceful-echo.js', {cancelSignal: controller.signal, gracefulCancel: true, ipcInput: foobarString});
	t.deepEqual(ipcOutput, [foobarString]);
});

test('getCancelSignal() can be called twice', async t => {
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await t.throwsAsync(execa('graceful-twice.js', {cancelSignal: AbortSignal.abort(foobarString), gracefulCancel: true, forceKillAfterDelay: false}));
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 0);
	t.deepEqual(ipcOutput, [foobarString]);
});

test('Graceful cancelSignal can use cancelSignal.onabort', async t => {
	const controller = new AbortController();
	const subprocess = execa('graceful-listener.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	t.is(await subprocess.getOneMessage(), '.');
	controller.abort(foobarString);
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 0);
	t.deepEqual(ipcOutput, ['.', foobarString]);
});

test('Graceful cancelSignal abort reason cannot be directly received', async t => {
	const subprocess = execa('graceful-send-echo.js', {cancelSignal: AbortSignal.abort(foobarString), gracefulCancel: true, forceKillAfterDelay: false});
	await setTimeout(0);
	await subprocess.sendMessage('.');
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.true(isGracefullyCanceled);
	t.false(isTerminated);
	t.is(exitCode, 0);
	t.deepEqual(ipcOutput, ['.', foobarString]);
});

test('error.isGracefullyCanceled is always false with execaSync()', t => {
	const {isCanceled, isGracefullyCanceled} = execaSync('empty.js');
	t.false(isCanceled);
	t.false(isGracefullyCanceled);
});
