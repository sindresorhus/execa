import assert from 'node:assert/strict';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {
	execa,
	execaSync,
	ExecaError,
	ExecaSyncError,
} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {getEarlyErrorSubprocess, getEarlyErrorSubprocessSync} from '../helpers/early-error.js';

setFixtureDirectory();

const testUnusualError = async (error, expectedOriginalMessage = String(error)) => {
	const subprocess = execa('empty.js');
	subprocess.nodeChildProcess.emit('error', error);
	const {originalMessage, shortMessage, message} = await assertRejects(subprocess);
	assert.equal(originalMessage, expectedOriginalMessage === '' ? undefined : expectedOriginalMessage);
	assert.ok(shortMessage.includes(expectedOriginalMessage));
	assert.equal(message, shortMessage);
};

test('error instance can be null', () => testUnusualError(null));
test('error instance can be false', () => testUnusualError(false));
test('error instance can be a string', () => testUnusualError('test'));
test('error instance can be a number', () => testUnusualError(0));
test('error instance can be a BigInt', () => testUnusualError(0n));
test('error instance can be a symbol', () => testUnusualError(Symbol('test')));
test('error instance can be a function', () => testUnusualError(() => {}));
test('error instance can be an array', () => testUnusualError(['test', 'test']));
// eslint-disable-next-line unicorn/error-message
test('error instance can be an error with an empty message', () => testUnusualError(new Error(''), ''));
test('error instance can be undefined', () => testUnusualError(undefined, 'undefined'));

test('error instance can be a plain object', async () => {
	const subprocess = execa('empty.js');
	subprocess.nodeChildProcess.emit('error', {message: foobarString});
	await assertRejects(subprocess, {message: new RegExp(foobarString)});
});

const runAndFail = (fixtureName, argument, error) => {
	const subprocess = execa(fixtureName, [argument]);
	subprocess.nodeChildProcess.emit('error', error);
	return assertRejects(subprocess);
};

const testErrorCopy = async (getPreviousArgument, argument = 'two') => {
	const fixtureName = 'empty.js';
	const firstArgument = 'foo';

	const previousArgument = await getPreviousArgument(fixtureName);
	const previousError = await runAndFail(fixtureName, firstArgument, previousArgument);
	const error = await runAndFail(fixtureName, argument, previousError);
	const message = `Command failed: ${fixtureName} ${argument}\n${foobarString}`;

	assert.notEqual(error, previousError);
	assert.equal(error.cause, previousError);
	assert.equal(error.command, `${fixtureName} ${argument}`);
	assert.equal(error.message, message);
	assert.ok(error.stack.includes(message));
	assert.equal(error.shortMessage, message);
	assert.equal(error.originalMessage, foobarString);
};

test('error instance can be shared', () => testErrorCopy(() => new Error(foobarString)));
test('error TypeError can be shared', () => testErrorCopy(() => new TypeError(foobarString)));
test('error string can be shared', () => testErrorCopy(() => foobarString));
test('error copy can be shared', () => testErrorCopy(fixtureName => runAndFail(fixtureName, 'bar', new Error(foobarString))));
test('error with same message can be shared', () => testErrorCopy(() => new Error(foobarString), 'foo'));

test('error.cause is not set if error.exitCode is not 0', async () => {
	const {exitCode, cause} = await assertRejects(execa('fail.js'));
	assert.equal(exitCode, 2);
	assert.equal(cause, undefined);
});

test('error.cause is not set if error.isTerminated', async () => {
	const subprocess = execa('forever.js');
	subprocess.kill();
	const {isTerminated, cause} = await assertRejects(subprocess);
	assert.equal(isTerminated, true);
	assert.equal(cause, undefined);
});

test('error.cause is not set if error.timedOut', async () => {
	const {timedOut, cause} = await assertRejects(execa('forever.js', {timeout: 1}));
	assert.equal(timedOut, true);
	assert.equal(cause, undefined);
});

test('error.cause is set on error event', async () => {
	const subprocess = execa('empty.js');
	const error = new Error(foobarString);
	subprocess.nodeChildProcess.emit('error', error);
	const {cause} = await assertRejects(subprocess);
	assert.equal(cause, error);
});

test('error.cause is set if error.isCanceled', async () => {
	const controller = new AbortController();
	const subprocess = execa('forever.js', {cancelSignal: controller.signal});
	const cause = new Error('test');
	controller.abort(cause);
	const error = await assertRejects(subprocess);
	assert.equal(error.isCanceled, true);
	assert.equal(error.isTerminated, true);
	assert.equal(error.signal, 'SIGTERM');
	assert.equal(error.cause, cause);
});

test('error.cause is not set if error.isTerminated with .kill(error)', async () => {
	const subprocess = execa('forever.js');
	const error = new Error('test');
	subprocess.kill(error);
	const {isTerminated, cause} = await assertRejects(subprocess);
	assert.equal(isTerminated, true);
	assert.equal(cause, error);
});

test('Error is instanceof ExecaError', async () => {
	await assertRejects(execa('fail.js'), {instanceOf: ExecaError});
});

test('Early error is instanceof ExecaError', async () => {
	await assertRejects(getEarlyErrorSubprocess(), {instanceOf: ExecaError});
});

test('Error is instanceof ExecaSyncError', () => {
	assertThrows(() => {
		execaSync('fail.js');
	}, {instanceOf: ExecaSyncError});
});

test('Early error is instanceof ExecaSyncError', () => {
	assertThrows(() => {
		getEarlyErrorSubprocessSync();
	}, {instanceOf: ExecaSyncError});
});

test('Pipe error is instanceof ExecaError', async () => {
	await assertRejects(execa('empty.js').pipe(false), {instanceOf: ExecaError});
});

const assertNameShape = error => {
	assert.ok(!Object.hasOwn(error, 'name'));
	assert.ok(Object.hasOwn(Object.getPrototypeOf(error), 'name'));
	assert.ok(!propertyIsEnumerable.call(Object.getPrototypeOf(error), 'name'));
};

const {propertyIsEnumerable} = Object.prototype;

test('error.name is properly set', async () => {
	const error = await assertRejects(execa('fail.js'));
	assert.equal(error.name, 'ExecaError');
	assertNameShape(error);
});

test('error.name is properly set - sync', async () => {
	const error = await assertThrows(() => {
		execaSync('fail.js');
	});
	assert.equal(error.name, 'ExecaSyncError');
	assertNameShape(error);
});
