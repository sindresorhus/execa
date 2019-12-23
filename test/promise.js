import path from 'path';
import test from 'ava';
import execa from '..';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

test('promise methods are not enumerable', t => {
	const descriptors = Object.getOwnPropertyDescriptors(execa('noop'));
	// eslint-disable-next-line promise/prefer-await-to-then
	t.false(descriptors.then.enumerable);
	t.false(descriptors.catch.enumerable);
	t.false(descriptors.finally.enumerable);
});

test('finally function is executed on success', async t => {
	let isCalled = false;
	const {stdout} = await execa('noop', ['foo']).finally(() => {
		isCalled = true;
	});
	t.is(isCalled, true);
	t.is(stdout, 'foo');
});

test('finally function is executed on failure', async t => {
	let isError = false;
	const {stdout, stderr} = await t.throwsAsync(execa('exit', ['2']).finally(() => {
		isError = true;
	}));
	t.is(isError, true);
	t.is(typeof stdout, 'string');
	t.is(typeof stderr, 'string');
});

test('throw in finally function bubbles up on success', async t => {
	const {message} = await t.throwsAsync(execa('noop', ['foo']).finally(() => {
		throw new Error('called');
	}));
	t.is(message, 'called');
});

test('throw in finally bubbles up on error', async t => {
	const {message} = await t.throwsAsync(execa('exit', ['2']).finally(() => {
		throw new Error('called');
	}));
	t.is(message, 'called');
});
