import test from 'ava';
import {execa, execaSync, ExecaError, ExecaSyncError} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';
import {getEarlyErrorSubprocess, getEarlyErrorSubprocessSync} from '../helpers/early-error.js';

setFixtureDir();

const testUnusualError = async (t, error, expectedOriginalMessage = String(error)) => {
	const subprocess = execa('empty.js');
	subprocess.emit('error', error);
	const {originalMessage, shortMessage, message} = await t.throwsAsync(subprocess);
	t.is(originalMessage, expectedOriginalMessage);
	t.true(shortMessage.includes(expectedOriginalMessage));
	t.is(message, shortMessage);
};

test('error instance can be null', testUnusualError, null);
test('error instance can be false', testUnusualError, false);
test('error instance can be a string', testUnusualError, 'test');
test('error instance can be a number', testUnusualError, 0);
test('error instance can be a BigInt', testUnusualError, 0n);
test('error instance can be a symbol', testUnusualError, Symbol('test'));
test('error instance can be a function', testUnusualError, () => {});
test('error instance can be an array', testUnusualError, ['test', 'test']);
// eslint-disable-next-line unicorn/error-message
test('error instance can be an error with an empty message', testUnusualError, new Error(''), '');
test('error instance can be undefined', testUnusualError, undefined, 'undefined');

test('error instance can be a plain object', async t => {
	const subprocess = execa('empty.js');
	subprocess.emit('error', {message: foobarString});
	await t.throwsAsync(subprocess, {message: new RegExp(foobarString)});
});

const runAndFail = (t, fixtureName, argument, error) => {
	const subprocess = execa(fixtureName, [argument]);
	subprocess.emit('error', error);
	return t.throwsAsync(subprocess);
};

const testErrorCopy = async (t, getPreviousArgument, argument = 'two') => {
	const fixtureName = 'empty.js';
	const firstArgument = 'foo';

	const previousArgument = await getPreviousArgument(t, fixtureName);
	const previousError = await runAndFail(t, fixtureName, firstArgument, previousArgument);
	const error = await runAndFail(t, fixtureName, argument, previousError);
	const message = `Command failed: ${fixtureName} ${argument}\n${foobarString}`;

	t.not(error, previousError);
	t.is(error.cause, previousError);
	t.is(error.command, `${fixtureName} ${argument}`);
	t.is(error.message, message);
	t.true(error.stack.includes(message));
	t.is(error.shortMessage, message);
	t.is(error.originalMessage, foobarString);
};

test('error instance can be shared', testErrorCopy, () => new Error(foobarString));
test('error TypeError can be shared', testErrorCopy, () => new TypeError(foobarString));
test('error string can be shared', testErrorCopy, () => foobarString);
test('error copy can be shared', testErrorCopy, (t, fixtureName) => runAndFail(t, fixtureName, 'bar', new Error(foobarString)));
test('error with same message can be shared', testErrorCopy, () => new Error(foobarString), 'foo');

test('error.cause is not set if error.exitCode is not 0', async t => {
	const {exitCode, cause} = await t.throwsAsync(execa('fail.js'));
	t.is(exitCode, 2);
	t.is(cause, undefined);
});

test('error.cause is not set if error.isTerminated', async t => {
	const subprocess = execa('forever.js');
	subprocess.kill();
	const {isTerminated, cause} = await t.throwsAsync(subprocess);
	t.true(isTerminated);
	t.is(cause, undefined);
});

test('error.cause is not set if error.timedOut', async t => {
	const {timedOut, cause} = await t.throwsAsync(execa('forever.js', {timeout: 1}));
	t.true(timedOut);
	t.is(cause, undefined);
});

test('error.cause is set on error event', async t => {
	const subprocess = execa('empty.js');
	const error = new Error(foobarString);
	subprocess.emit('error', error);
	const {cause} = await t.throwsAsync(subprocess);
	t.is(cause, error);
});

test('error.cause is set if error.isCanceled', async t => {
	const controller = new AbortController();
	const subprocess = execa('forever.js', {cancelSignal: controller.signal});
	const error = new Error('test');
	controller.abort(error);
	const {isCanceled, isTerminated, cause} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.false(isTerminated);
	t.is(cause.cause, error);
});

test('error.cause is not set if error.isTerminated with .kill(error)', async t => {
	const subprocess = execa('forever.js');
	const error = new Error('test');
	subprocess.kill(error);
	const {isTerminated, cause} = await t.throwsAsync(subprocess);
	t.true(isTerminated);
	t.is(cause, error);
});

test('Error is instanceof ExecaError', async t => {
	await t.throwsAsync(execa('fail.js'), {instanceOf: ExecaError});
});

test('Early error is instanceof ExecaError', async t => {
	await t.throwsAsync(getEarlyErrorSubprocess(), {instanceOf: ExecaError});
});

test('Error is instanceof ExecaSyncError', t => {
	t.throws(() => {
		execaSync('fail.js');
	}, {instanceOf: ExecaSyncError});
});

test('Early error is instanceof ExecaSyncError', t => {
	t.throws(() => {
		getEarlyErrorSubprocessSync();
	}, {instanceOf: ExecaSyncError});
});

test('Pipe error is instanceof ExecaError', async t => {
	await t.throwsAsync(execa('empty.js').pipe(false), {instanceOf: ExecaError});
});

const assertNameShape = (t, error) => {
	t.false(Object.hasOwn(error, 'name'));
	t.true(Object.hasOwn(Object.getPrototypeOf(error), 'name'));
	t.false(propertyIsEnumerable.call(Object.getPrototypeOf(error), 'name'));
};

const {propertyIsEnumerable} = Object.prototype;

test('error.name is properly set', async t => {
	const error = await t.throwsAsync(execa('fail.js'));
	t.is(error.name, 'ExecaError');
	assertNameShape(t, error);
});

test('error.name is properly set - sync', async t => {
	const error = await t.throws(() => {
		execaSync('fail.js');
	});
	t.is(error.name, 'ExecaSyncError');
	assertNameShape(t, error);
});
