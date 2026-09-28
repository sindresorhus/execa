import assert from 'node:assert/strict';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

test('subprocess properties are enumerable', () => {
	const descriptors = Object.getOwnPropertyDescriptors(execa('noop.js'));
	assert.equal(descriptors.nodeChildProcess.enumerable, true);
});

test('finally function is executed on success', async () => {
	let isCalled = false;
	const {stdout} = await execa('noop.js', ['foo']).finally(() => {
		isCalled = true;
	});
	assert.equal(isCalled, true);
	assert.equal(stdout, 'foo');
});

test('finally function is executed on failure', async () => {
	let isError = false;
	const {stdout, stderr} = await assertRejects(execa('exit.js', ['2']).finally(() => {
		isError = true;
	}));
	assert.equal(isError, true);
	assert.equal(typeof stdout, 'string');
	assert.equal(typeof stderr, 'string');
});

test('throw in finally function bubbles up on success', async () => {
	const {message} = await assertRejects(execa('noop.js', ['foo']).finally(() => {
		throw new Error('called');
	}));
	assert.equal(message, 'called');
});

test('throw in finally bubbles up on error', async () => {
	const {message} = await assertRejects(execa('exit.js', ['2']).finally(() => {
		throw new Error('called');
	}));
	assert.equal(message, 'called');
});

const testNoAwait = async (fixtureName, options, message) => {
	const {stdout} = await execa('no-await.js', [JSON.stringify(options), fixtureName]);
	assert.ok(stdout.includes(message));
};

test('Throws if promise is not awaited and subprocess fails', () => testNoAwait('fail.js', {}, 'exit code 2'));
test('Throws if promise is not awaited and subprocess times out', () => testNoAwait('forever.js', {timeout: 1}, 'timed out'));
