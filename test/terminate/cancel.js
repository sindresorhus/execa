import assert from 'node:assert/strict';
import {once, getEventListeners} from 'node:events';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const testValidCancelSignal = cancelSignal => {
	assertThrows(() => {
		execa('empty.js', {cancelSignal});
	}, {message: /must be an AbortSignal/});
};

test('cancelSignal option cannot be AbortController', () => testValidCancelSignal(new AbortController()));
test('cancelSignal option cannot be {}', () => testValidCancelSignal({}));
test('cancelSignal option cannot be null', () => testValidCancelSignal(null));
test('cancelSignal option cannot be a symbol', () => testValidCancelSignal(Symbol('test')));

test('result.isCanceled is false when abort isn\'t called (success)', async () => {
	const {isCanceled, isGracefullyCanceled} = await execa('noop.js');
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
});

test('result.isCanceled is false when abort isn\'t called (failure)', async () => {
	const {isCanceled, isGracefullyCanceled} = await assertRejects(execa('fail.js'));
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
});

test('result.isCanceled is false when abort isn\'t called in sync mode (success)', () => {
	const {isCanceled, isGracefullyCanceled} = execaSync('noop.js');
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
});

test('result.isCanceled is false when abort isn\'t called in sync mode (failure)', () => {
	const {isCanceled, isGracefullyCanceled} = assertThrows(() => {
		execaSync('fail.js');
	});
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
});

const testCancelSuccess = async options => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {cancelSignal: abortController.signal, ...options});
	abortController.abort();
	const {isCanceled, isGracefullyCanceled} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, false);
};

test('error.isCanceled is true when abort is used', () => testCancelSuccess({}));
test('gracefulCancel can be false with cancelSignal', () => testCancelSuccess({gracefulCancel: false}));
test('ipc can be false with cancelSignal', () => testCancelSuccess({ipc: false}));
test('serialization can be "json" with cancelSignal', () => testCancelSuccess({ipc: true, serialization: 'json'}));

test('error.isCanceled is false when kill method is used', async () => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {cancelSignal: abortController.signal});
	subprocess.kill();
	const {isCanceled, isGracefullyCanceled} = await assertRejects(subprocess);
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
});

test('calling abort is considered a signal termination', async () => {
	const abortController = new AbortController();
	const subprocess = execa('forever.js', {cancelSignal: abortController.signal});
	await once(subprocess.nodeChildProcess, 'spawn');
	abortController.abort();
	const {isCanceled, isGracefullyCanceled, isTerminated, signal} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, false);
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGTERM');
});

test('cancelSignal can already be aborted', async () => {
	const cancelSignal = AbortSignal.abort();
	const {isCanceled, isGracefullyCanceled, isTerminated, signal} = await assertRejects(execa('forever.js', {cancelSignal}));
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, false);
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGTERM');
	assert.deepEqual(getEventListeners(cancelSignal, 'abort'), []);
});

test('calling abort does not emit the "error" event', async () => {
	const abortController = new AbortController();
	const subprocess = execa('forever.js', {cancelSignal: abortController.signal});
	let error;
	subprocess.nodeChildProcess.once('error', errorArgument => {
		error = errorArgument;
	});
	abortController.abort();
	const {isCanceled, isGracefullyCanceled} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, false);
	assert.equal(error, undefined);
});

test('calling abort cleans up listeners on cancelSignal, called', async () => {
	const abortController = new AbortController();
	const subprocess = execa('forever.js', {cancelSignal: abortController.signal});
	assert.equal(getEventListeners(abortController.signal, 'abort').length, 1);
	abortController.abort();
	const {isCanceled, isGracefullyCanceled} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, false);
	assert.equal(getEventListeners(abortController.signal, 'abort').length, 0);
});

test('calling abort cleans up listeners on cancelSignal, not called', async () => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {cancelSignal: abortController.signal});
	assert.equal(getEventListeners(abortController.signal, 'abort').length, 1);
	await subprocess;
	assert.equal(getEventListeners(abortController.signal, 'abort').length, 0);
});

test('calling abort cleans up listeners on cancelSignal, already aborted', async () => {
	const cancelSignal = AbortSignal.abort();
	const subprocess = execa('noop.js', {cancelSignal});
	assert.equal(getEventListeners(cancelSignal, 'abort').length, 0);
	const {isCanceled, isGracefullyCanceled} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, false);
	assert.equal(getEventListeners(cancelSignal, 'abort').length, 0);
});

test('calling abort throws an error with message "Command was canceled"', async () => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {cancelSignal: abortController.signal});
	abortController.abort();
	await assertRejects(subprocess, {message: /Command was canceled/});
});

test('calling abort with no argument keeps error properties', async () => {
	const abortController = new AbortController();
	const subprocess = execa('empty.js', {cancelSignal: abortController.signal});
	abortController.abort();
	const {cause, originalMessage, shortMessage, message} = await assertRejects(subprocess);
	assert.equal(cause.message, 'This operation was aborted');
	assert.equal(cause.name, 'AbortError');
	assert.equal(originalMessage, 'This operation was aborted');
	assert.equal(shortMessage, 'Command was canceled: empty.js\nThis operation was aborted');
	assert.equal(message, 'Command was canceled: empty.js\nThis operation was aborted');
});

test('calling abort with an error instance keeps error properties', async () => {
	const abortController = new AbortController();
	const subprocess = execa('empty.js', {cancelSignal: abortController.signal});
	const error = new Error(foobarString);
	error.code = foobarString;
	abortController.abort(error);
	const {cause, originalMessage, shortMessage, message, code} = await assertRejects(subprocess);
	assert.equal(cause, error);
	assert.equal(originalMessage, foobarString);
	assert.equal(shortMessage, `Command was canceled: empty.js\n${foobarString}`);
	assert.equal(message, `Command was canceled: empty.js\n${foobarString}`);
	assert.equal(code, foobarString);
});

test('calling abort with null keeps error properties', async () => {
	const abortController = new AbortController();
	const subprocess = execa('empty.js', {cancelSignal: abortController.signal});
	abortController.abort(null);
	const {cause, originalMessage, shortMessage, message} = await assertRejects(subprocess);
	assert.equal(cause, null);
	assert.equal(originalMessage, 'null');
	assert.equal(shortMessage, 'Command was canceled: empty.js\nnull');
	assert.equal(message, 'Command was canceled: empty.js\nnull');
});

test('calling abort twice should show the same behaviour as calling it once', async () => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {cancelSignal: abortController.signal});
	abortController.abort();
	abortController.abort();
	const {isCanceled, isGracefullyCanceled} = await assertRejects(subprocess);
	assert.equal(isCanceled, true);
	assert.equal(isGracefullyCanceled, false);
});

test('calling abort on a successfully completed subprocess does not make result.isCanceled true', async () => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {cancelSignal: abortController.signal});
	const {isCanceled, isGracefullyCanceled} = await subprocess;
	abortController.abort();
	assert.equal(isCanceled, false);
	assert.equal(isGracefullyCanceled, false);
});

test('Throws when using the former "signal" option name', () => {
	const abortController = new AbortController();
	assertThrows(() => {
		execa('empty.js', {signal: abortController.signal});
	}, {message: /renamed to "cancelSignal"/});
});

test('Throws when using the former "signal" option name, sync', () => {
	const abortController = new AbortController();
	assertThrows(() => {
		execaSync('empty.js', {signal: abortController.signal});
	}, {message: /renamed to "cancelSignal"/});
});

test('Cannot use cancelSignal, sync', () => {
	const abortController = new AbortController();
	assertThrows(() => {
		execaSync('empty.js', {cancelSignal: abortController.signal});
	}, {message: /The "cancelSignal" option cannot be used/});
});
