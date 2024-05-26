import {once, getEventListeners} from 'node:events';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const testValidCancelSignal = (t, cancelSignal) => {
	t.throws(() => {
		execa('empty.js', {cancelSignal});
	}, {message: /must be an AbortSignal/});
};

test('cancelSignal option cannot be AbortController', testValidCancelSignal, new AbortController());
test('cancelSignal option cannot be {}', testValidCancelSignal, {});
test('cancelSignal option cannot be null', testValidCancelSignal, null);
test('cancelSignal option cannot be a symbol', testValidCancelSignal, Symbol('test'));

test('result.isCanceled is false when abort isn\'t called (success)', async t => {
	const {isCanceled} = await execa('noop.js');
	t.false(isCanceled);
});

test('result.isCanceled is false when abort isn\'t called (failure)', async t => {
	const {isCanceled} = await t.throwsAsync(execa('fail.js'));
	t.false(isCanceled);
});

test('result.isCanceled is false when abort isn\'t called in sync mode (success)', t => {
	const {isCanceled} = execaSync('noop.js');
	t.false(isCanceled);
});

test('result.isCanceled is false when abort isn\'t called in sync mode (failure)', t => {
	const {isCanceled} = t.throws(() => {
		execaSync('fail.js');
	});
	t.false(isCanceled);
});

test('error.isCanceled is true when abort is used', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {cancelSignal: abortController.signal});
	abortController.abort();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
});

test('error.isCanceled is false when kill method is used', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {cancelSignal: abortController.signal});
	subprocess.kill();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.false(isCanceled);
});

test('calling abort is considered a signal termination', async t => {
	const abortController = new AbortController();
	const subprocess = execa('forever.js', {cancelSignal: abortController.signal});
	await once(subprocess, 'spawn');
	abortController.abort();
	const {isCanceled, isTerminated, signal} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.true(isTerminated);
	t.is(signal, 'SIGTERM');
});

test('cancelSignal can already be aborted', async t => {
	const cancelSignal = AbortSignal.abort();
	const {isCanceled, isTerminated, signal} = await t.throwsAsync(execa('forever.js', {cancelSignal}));
	t.true(isCanceled);
	t.true(isTerminated);
	t.is(signal, 'SIGTERM');
	t.deepEqual(getEventListeners(cancelSignal, 'abort'), []);
});

test('calling abort does not emit the "error" event', async t => {
	const abortController = new AbortController();
	const subprocess = execa('forever.js', {cancelSignal: abortController.signal});
	let error;
	subprocess.once('error', errorArgument => {
		error = errorArgument;
	});
	abortController.abort();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.is(error, undefined);
});

test('calling abort cleans up listeners on cancelSignal, called', async t => {
	const abortController = new AbortController();
	const subprocess = execa('forever.js', {cancelSignal: abortController.signal});
	t.is(getEventListeners(abortController.signal, 'abort').length, 1);
	abortController.abort();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.is(getEventListeners(abortController.signal, 'abort').length, 0);
});

test('calling abort cleans up listeners on cancelSignal, not called', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {cancelSignal: abortController.signal});
	t.is(getEventListeners(abortController.signal, 'abort').length, 1);
	await subprocess;
	t.is(getEventListeners(abortController.signal, 'abort').length, 0);
});

test('calling abort cleans up listeners on cancelSignal, already aborted', async t => {
	const cancelSignal = AbortSignal.abort();
	const subprocess = execa('noop.js', {cancelSignal});
	t.is(getEventListeners(cancelSignal, 'abort').length, 0);
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.is(getEventListeners(cancelSignal, 'abort').length, 0);
});

test('calling abort throws an error with message "Command was canceled"', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {cancelSignal: abortController.signal});
	abortController.abort();
	await t.throwsAsync(subprocess, {message: /Command was canceled/});
});

test('calling abort with no argument keeps error properties', async t => {
	const abortController = new AbortController();
	const subprocess = execa('empty.js', {cancelSignal: abortController.signal});
	abortController.abort();
	const {cause, originalMessage, shortMessage, message} = await t.throwsAsync(subprocess);
	t.is(cause.message, 'This operation was aborted');
	t.is(cause.name, 'AbortError');
	t.is(originalMessage, 'This operation was aborted');
	t.is(shortMessage, 'Command was canceled: empty.js\nThis operation was aborted');
	t.is(message, 'Command was canceled: empty.js\nThis operation was aborted');
});

test('calling abort with an error instance keeps error properties', async t => {
	const abortController = new AbortController();
	const subprocess = execa('empty.js', {cancelSignal: abortController.signal});
	const error = new Error(foobarString);
	error.code = foobarString;
	abortController.abort(error);
	const {cause, originalMessage, shortMessage, message, code} = await t.throwsAsync(subprocess);
	t.is(cause, error);
	t.is(originalMessage, foobarString);
	t.is(shortMessage, `Command was canceled: empty.js\n${foobarString}`);
	t.is(message, `Command was canceled: empty.js\n${foobarString}`);
	t.is(code, foobarString);
});

test('calling abort with null keeps error properties', async t => {
	const abortController = new AbortController();
	const subprocess = execa('empty.js', {cancelSignal: abortController.signal});
	abortController.abort(null);
	const {cause, originalMessage, shortMessage, message} = await t.throwsAsync(subprocess);
	t.is(cause, null);
	t.is(originalMessage, 'null');
	t.is(shortMessage, 'Command was canceled: empty.js\nnull');
	t.is(message, 'Command was canceled: empty.js\nnull');
});

test('calling abort twice should show the same behaviour as calling it once', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {cancelSignal: abortController.signal});
	abortController.abort();
	abortController.abort();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
});

test('calling abort on a successfully completed subprocess does not make result.isCanceled true', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {cancelSignal: abortController.signal});
	const result = await subprocess;
	abortController.abort();
	t.false(result.isCanceled);
});

test('Throws when using the former "signal" option name', t => {
	const abortController = new AbortController();
	t.throws(() => {
		execa('empty.js', {signal: abortController.signal});
	}, {message: /renamed to "cancelSignal"/});
});

test('Cannot use cancelSignal, sync', t => {
	const abortController = new AbortController();
	t.throws(() => {
		execaSync('empty.js', {cancelSignal: abortController.signal});
	}, {message: /The "cancelSignal" option cannot be used/});
});
