import assert from 'node:assert/strict';
import {getEventListeners} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

test('Graceful cancelSignal can be already aborted', async () => {
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await assertRejects(execa('graceful-send.js', {cancelSignal: AbortSignal.abort(foobarString), gracefulCancel: true, forceKillAfterDelay: false}));
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 0);
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('Graceful cancelSignal can be aborted', async () => {
	const controller = new AbortController();
	const subprocess = execa('graceful-send-twice.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	assert.equal(await subprocess.getOneMessage(), false);
	controller.abort(foobarString);
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 0);
	assert.deepEqual(ipcOutput, [false, foobarString]);
});

test('Graceful cancelSignal can be never aborted', async () => {
	const controller = new AbortController();
	const subprocess = execa('graceful-send-fast.js', {cancelSignal: controller.signal, gracefulCancel: true});
	assert.equal(await subprocess.getOneMessage(), false);
	await subprocess;
});

test('Graceful cancelSignal can be already aborted but not used', async () => {
	const subprocess = execa('ipc-send-get.js', {cancelSignal: AbortSignal.abort(foobarString), gracefulCancel: true, forceKillAfterDelay: false});
	assert.equal(await subprocess.getOneMessage(), foobarString);
	await setTimeout(1e3);
	await subprocess.sendMessage('.');
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 0);
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('Graceful cancelSignal can be aborted but not used', async () => {
	const controller = new AbortController();
	const subprocess = execa('ipc-send-get.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	assert.equal(await subprocess.getOneMessage(), foobarString);
	controller.abort(foobarString);
	await setTimeout(1e3);
	await subprocess.sendMessage(foobarString);
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 0);
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('Graceful cancelSignal can be never aborted nor used', async () => {
	const controller = new AbortController();
	const subprocess = execa('empty.js', {cancelSignal: controller.signal, gracefulCancel: true});
	assert.equal(getEventListeners(controller.signal, 'abort').length, 1);
	await subprocess;
	assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});

test('Graceful cancelSignal can be aborted twice', async () => {
	const controller = new AbortController();
	const subprocess = execa('graceful-send-twice.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	assert.equal(await subprocess.getOneMessage(), false);
	controller.abort(foobarString);
	controller.abort('.');
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 0);
	assert.deepEqual(ipcOutput, [false, foobarString]);
});

test('Graceful cancelSignal cannot be manually aborted after disconnection', async () => {
	const controller = new AbortController();
	const subprocess = execa('empty.js', {cancelSignal: controller.signal, gracefulCancel: true});
	subprocess.nodeChildProcess.disconnect();
	controller.abort(foobarString);
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput, originalMessage} = await assertRejects(subprocess);
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 0);
	assert.deepEqual(ipcOutput, []);
	assert.equal(originalMessage, '`cancelSignal`\'s `controller.abort()` cannot be used: the subprocess has already exited or disconnected.');
});

test('Graceful cancelSignal can disconnect after being manually aborted', async () => {
	const controller = new AbortController();
	const subprocess = execa('graceful-disconnect.js', {cancelSignal: controller.signal, gracefulCancel: true});
	controller.abort(foobarString);
	assert.equal(await subprocess.getOneMessage(), foobarString);
	subprocess.nodeChildProcess.disconnect();
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 0);
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('Graceful cancelSignal is automatically aborted on disconnection', async () => {
	const controller = new AbortController();
	const subprocess = execa('graceful-send-print.js', {cancelSignal: controller.signal, gracefulCancel: true});
	assert.equal(await subprocess.getOneMessage(), false);
	subprocess.nodeChildProcess.disconnect();
	const {isCanceled, isGracefullyCanceled, ipcOutput, stdout} = await subprocess;
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
	assert.deepEqual(ipcOutput, [false]);
	assert.ok(stdout.includes('Error: `cancelSignal` aborted: the parent process disconnected.'));
});

test('getCancelSignal() aborts if already disconnected', async () => {
	const controller = new AbortController();
	const subprocess = execa('graceful-print.js', {cancelSignal: controller.signal, gracefulCancel: true});
	subprocess.nodeChildProcess.disconnect();
	const {isCanceled, isGracefullyCanceled, ipcOutput, stdout} = await subprocess;
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
	assert.deepEqual(ipcOutput, []);
	assert.ok(stdout.includes('Error: `cancelSignal` aborted: the parent process disconnected.'));
});

test('getCancelSignal() fails if no IPC', async () => {
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput, stderr} = await assertRejects(execa('graceful-none.js'));
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 1);
	assert.deepEqual(ipcOutput, []);
	assert.ok(stderr.includes('Error: `getCancelSignal()` cannot be used without setting the `gracefulCancel` option to `true`.'));
});

test('getCancelSignal() fails on every call if no IPC', async () => {
	const {exitCode, stdout} = await execa('graceful-none-twice.js', {stripFinalNewline: false});
	assert.equal(exitCode, 0);
	assert.equal(stdout, 'threw\nthrew\n');
});

test('getCancelSignal() hangs if cancelSignal without gracefulCancel', async () => {
	const controller = new AbortController();
	const {timedOut, isCanceled, isGracefullyCanceled, signal, ipcOutput} = await assertRejects(execa('graceful-wait.js', {ipc: true, cancelSignal: controller.signal, timeout: 1e3}));
	assert.equal(timedOut, true);
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
	assert.equal(signal, 'SIGTERM');
	assert.deepEqual(ipcOutput, []);
});

test('Subprocess cancelSignal does not keep subprocess alive', async () => {
	const controller = new AbortController();
	const {ipcOutput} = await execa('graceful-ref.js', {cancelSignal: controller.signal, gracefulCancel: true});
	assert.deepEqual(ipcOutput, []);
});

test('Subprocess can send a message right away', async () => {
	const controller = new AbortController();
	const {ipcOutput} = await execa('graceful-send-string.js', {cancelSignal: controller.signal, gracefulCancel: true});
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('Subprocess can receive a message right away', async () => {
	const controller = new AbortController();
	const {ipcOutput} = await execa('graceful-echo.js', {cancelSignal: controller.signal, gracefulCancel: true, ipcInput: foobarString});
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('getCancelSignal() can be called twice', async () => {
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await assertRejects(execa('graceful-twice.js', {cancelSignal: AbortSignal.abort(foobarString), gracefulCancel: true, forceKillAfterDelay: false}));
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 0);
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('Graceful cancelSignal can use cancelSignal.onabort', async () => {
	const controller = new AbortController();
	const subprocess = execa('graceful-listener.js', {cancelSignal: controller.signal, gracefulCancel: true, forceKillAfterDelay: false});
	assert.equal(await subprocess.getOneMessage(), '.');
	controller.abort(foobarString);
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 0);
	assert.deepEqual(ipcOutput, ['.', foobarString]);
});

test('Graceful cancelSignal abort reason cannot be directly received', async () => {
	const subprocess = execa('graceful-send-echo.js', {cancelSignal: AbortSignal.abort(foobarString), gracefulCancel: true, forceKillAfterDelay: false});
	await setTimeout(0);
	await subprocess.sendMessage('.');
	const {isCanceled, isGracefullyCanceled, isTerminated, exitCode, ipcOutput} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, true);
	assert.equal(isTerminated, false);
	assert.equal(exitCode, 0);
	assert.deepEqual(ipcOutput, ['.', foobarString]);
});

test('error.isGracefullyCanceled is always false with execaSync()', () => {
	const {isCanceled, isGracefullyCanceled} = execaSync('empty.js');
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
});

// Execa wraps `gracefulCancel` messages with an internal type, which is only ever sent by the current process to its subprocess.
// A subprocess must not be able to send it in the other direction, since this would abort the parent process' own `cancelSignal`, or silently drop the message.
test('Subprocess messages with the internal graceful cancellation shape are kept', async () => {
	const {ipcOutput} = await execa('ipc-send-cancel-shape.js', {ipc: true});
	assert.deepEqual(ipcOutput, [{type: 'execa:ipc:cancel', message: foobarString}]);
});

test('Graceful cancelSignal is not aborted by the subprocess\' own subprocess', async () => {
	const controller = new AbortController();
	const {ipcOutput} = await execa('graceful-nested.js', {cancelSignal: controller.signal, gracefulCancel: true});
	assert.deepEqual(ipcOutput, [false]);
});
