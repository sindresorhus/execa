import assert from 'node:assert/strict';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory, FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

test('timeout kills the subprocess if it times out', async () => {
	const {isTerminated, signal, timedOut, originalMessage, shortMessage, message} = await assertRejects(execa('forever.js', {timeout: 1}));
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGTERM');
	assert.equal(timedOut, true);
	assert.equal(originalMessage, undefined);
	assert.equal(shortMessage, 'Command timed out after 1 milliseconds: forever.js');
	assert.equal(message, shortMessage);
});

test('timeout kills the subprocess if it times out, in sync mode', async () => {
	const {isTerminated, signal, timedOut, originalMessage, shortMessage, message} = await assertThrows(() => {
		execaSync('node', ['forever.js'], {timeout: 1, cwd: FIXTURES_DIRECTORY});
	});
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGTERM');
	assert.equal(timedOut, true);
	// On Windows, the command is spawned using the absolute path resolved via `PATHEXT`, so it appears in Node.js' own error message
	assert.match(originalMessage, /^spawnSync .*node(?:\.[A-Za-z]+)? ETIMEDOUT$/);
	assert.equal(shortMessage, `Command timed out after 1 milliseconds: node forever.js\n${originalMessage}`);
	assert.equal(message, shortMessage);
});

test('timeout does not kill the subprocess if it does not time out', async () => {
	const {timedOut} = await execa('delay.js', ['500'], {timeout: 1e8});
	assert.equal(timedOut, false);
});

test('timeout uses killSignal', async () => {
	const {isTerminated, signal, timedOut} = await assertRejects(execa('forever.js', {timeout: 1, killSignal: 'SIGINT'}));
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGINT');
	assert.equal(timedOut, true);
});

const INVALID_TIMEOUT_REGEXP = /`timeout` option to be a non-negative integer/;

const testTimeoutValidation = (timeout, execaMethod) => {
	assertThrows(() => {
		execaMethod('empty.js', {timeout});
	}, {message: INVALID_TIMEOUT_REGEXP});
};

test('timeout must be an integer', () => testTimeoutValidation(100.5, execa));
test('timeout must be an integer - sync', () => testTimeoutValidation(100.5, execaSync));
test('timeout must not be negative', () => testTimeoutValidation(-1, execa));
test('timeout must be a number', () => testTimeoutValidation(false, execa));
test('timeout must not be negative - sync', () => testTimeoutValidation(-1, execaSync));
test('timeout must be a number - sync', () => testTimeoutValidation(false, execaSync));
// Larger delays make timers fire right away
test('timeout must not be larger than the maximum timer delay', () => testTimeoutValidation(2 ** 31, execa));
test('timeout must not be larger than the maximum timer delay - sync', () => testTimeoutValidation(2 ** 31, execaSync));
test('timeout must not be null', () => {
	assertThrows(() => {
		execa('empty.js', {timeout: null});
	}, {message: /got `null` \(null\)/});
});

const testMaxTimeout = async execaMethod => {
	const {timedOut} = await execaMethod('noop.js', {timeout: (2 ** 31) - 1});
	assert.equal(timedOut, false);
};

test('timeout can be the maximum timer delay', () => testMaxTimeout(execa));
test('timeout can be the maximum timer delay - sync', () => testMaxTimeout(execaSync));

test('timedOut is false if timeout is undefined', async () => {
	const {timedOut} = await execa('noop.js');
	assert.equal(timedOut, false);
});

test('timedOut is false if timeout is 0', async () => {
	const {timedOut} = await execa('noop.js', {timeout: 0});
	assert.equal(timedOut, false);
});

test('timedOut is false if timeout is undefined and exit code is 0 in sync mode', () => {
	const {timedOut} = execaSync('noop.js');
	assert.equal(timedOut, false);
});

test('timedOut is false if the timeout happened after a different error occurred', async () => {
	const subprocess = execa('forever.js', {timeout: 1e3});
	const cause = new Error('test');
	subprocess.nodeChildProcess.emit('error', cause);
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.equal(error.timedOut, false);
});
