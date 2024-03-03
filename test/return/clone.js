import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';

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
test('error instance can be undefined', testUnusualError, undefined, '');

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

const runAndClone = async (t, initialError) => {
	const previousError = await runAndFail(t, 'empty.js', 'foo', initialError);
	t.is(previousError, initialError);

	return runAndFail(t, 'empty.js', 'bar', previousError);
};

const testErrorCopy = async (t, getPreviousArgument, argument = 'two') => {
	const fixtureName = 'empty.js';
	const firstArgument = 'foo';

	const previousArgument = await getPreviousArgument(t, fixtureName);
	const previousError = await runAndFail(t, fixtureName, firstArgument, previousArgument);
	const error = await runAndFail(t, fixtureName, argument, previousError);
	const message = `Command failed: ${fixtureName} ${argument}\n${foobarString}`;

	t.not(error, previousError);
	t.is(error.command, `${fixtureName} ${argument}`);
	t.is(error.message, message);
	t.true(error.stack.includes(message));
	t.is(error.stack, previousError.stack.replace(firstArgument, argument));
	t.is(error.shortMessage, message);
	t.is(error.originalMessage, foobarString);
};

test('error instance can be shared', testErrorCopy, () => new Error(foobarString));
test('error TypeError can be shared', testErrorCopy, () => new TypeError(foobarString));
test('error string can be shared', testErrorCopy, () => foobarString);
test('error copy can be shared', testErrorCopy, (t, fixtureName) => runAndFail(t, fixtureName, 'bar', new Error(foobarString)));
test('error with same message can be shared', testErrorCopy, () => new Error(foobarString), 'foo');

const testErrorCopyProperty = async (t, propertyName, isCopied) => {
	const propertyValue = 'test';
	const initialError = new Error(foobarString);
	initialError[propertyName] = propertyValue;

	const error = await runAndClone(t, initialError);
	t.is(error[propertyName] === propertyValue, isCopied);
};

test('error.code can be copied', testErrorCopyProperty, 'code', true);
test('error.errno can be copied', testErrorCopyProperty, 'errno', true);
test('error.syscall can be copied', testErrorCopyProperty, 'syscall', true);
test('error.path can be copied', testErrorCopyProperty, 'path', true);
test('error.dest can be copied', testErrorCopyProperty, 'dest', true);
test('error.address can be copied', testErrorCopyProperty, 'address', true);
test('error.port can be copied', testErrorCopyProperty, 'port', true);
test('error.info can be copied', testErrorCopyProperty, 'info', true);
test('error.other cannot be copied', testErrorCopyProperty, 'other', false);

test('error.name can be copied', async t => {
	const initialError = new TypeError('test');
	const error = await runAndClone(t, initialError);
	t.deepEqual(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(initialError), 'name'), Object.getOwnPropertyDescriptor(error, 'name'));
});

test('error.cause can be copied', async t => {
	const initialError = new Error('test', {cause: new Error('innerTest')});
	const error = await runAndClone(t, initialError);
	t.deepEqual(Object.getOwnPropertyDescriptor(initialError, 'cause'), Object.getOwnPropertyDescriptor(error, 'cause'));
});

test('error.errors can be copied', async t => {
	const initialError = new AggregateError([], 'test');
	const error = await runAndClone(t, initialError);
	t.deepEqual(Object.getOwnPropertyDescriptor(initialError, 'errors'), Object.getOwnPropertyDescriptor(error, 'errors'));
});

test('error.stack is set even if memoized', async t => {
	const message = 'test';
	const error = new Error(message);
	t.is(typeof error.stack, 'string');

	const newMessage = 'newTest';
	error.message = newMessage;
	t.false(error.stack.includes(newMessage));
	error.message = message;

	const subprocess = execa('empty.js');
	subprocess.emit('error', error);
	t.is(await t.throwsAsync(subprocess), error);
	t.is(error.message, `Command failed: empty.js\n${message}`);
	t.true(error.stack.startsWith(`Error: ${error.message}`));
});

test('error.stack is set even if memoized with an unusual error.name', async t => {
	const subprocess = execa('empty.js');
	subprocess.stdin.destroy();
	const error = await t.throwsAsync(subprocess);
	t.is(error.message, 'Command failed with ERR_STREAM_PREMATURE_CLOSE: empty.js\nPremature close');
	t.true(error.stack.startsWith(`Error [ERR_STREAM_PREMATURE_CLOSE]: ${error.message}`));
});

test('Cloned errors keep the stack trace', async t => {
	const message = 'test';
	const error = new Error(message);
	const stack = error.stack.split('\n').filter(line => line.trim().startsWith('at ')).join('\n');

	const subprocess = execa('empty.js');
	subprocess.emit('error', error);
	t.is(await t.throwsAsync(subprocess), error);

	const secondSubprocess = execa('empty.js');
	secondSubprocess.emit('error', error);
	const secondError = await t.throwsAsync(secondSubprocess);
	t.not(secondError, error);
	t.is(secondError.message, `Command failed: empty.js\n${message}`);
	t.is(secondError.stack, `Error: Command failed: empty.js\n${message}\n${stack}`);
});

