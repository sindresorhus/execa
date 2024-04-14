import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory, FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

test('timeout kills the subprocess if it times out', async t => {
	const {isTerminated, signal, timedOut, originalMessage, shortMessage, message} = await t.throwsAsync(execa('forever.js', {timeout: 1}));
	t.true(isTerminated);
	t.is(signal, 'SIGTERM');
	t.true(timedOut);
	t.is(originalMessage, '');
	t.is(shortMessage, 'Command timed out after 1 milliseconds: forever.js');
	t.is(message, shortMessage);
});

test('timeout kills the subprocess if it times out, in sync mode', async t => {
	const {isTerminated, signal, timedOut, originalMessage, shortMessage, message} = await t.throws(() => {
		execaSync('node', ['forever.js'], {timeout: 1, cwd: FIXTURES_DIRECTORY});
	});
	t.true(isTerminated);
	t.is(signal, 'SIGTERM');
	t.true(timedOut);
	t.is(originalMessage, 'spawnSync node ETIMEDOUT');
	t.is(shortMessage, `Command timed out after 1 milliseconds: node forever.js\n${originalMessage}`);
	t.is(message, shortMessage);
});

test('timeout does not kill the subprocess if it does not time out', async t => {
	const {timedOut} = await execa('delay.js', ['500'], {timeout: 1e8});
	t.false(timedOut);
});

test('timeout uses killSignal', async t => {
	const {isTerminated, signal, timedOut} = await t.throwsAsync(execa('forever.js', {timeout: 1, killSignal: 'SIGINT'}));
	t.true(isTerminated);
	t.is(signal, 'SIGINT');
	t.true(timedOut);
});

const INVALID_TIMEOUT_REGEXP = /`timeout` option to be a non-negative integer/;

const testTimeoutValidation = (t, timeout, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', {timeout});
	}, {message: INVALID_TIMEOUT_REGEXP});
};

test('timeout must not be negative', testTimeoutValidation, -1, execa);
test('timeout must be an integer', testTimeoutValidation, false, execa);
test('timeout must not be negative - sync', testTimeoutValidation, -1, execaSync);
test('timeout must be an integer - sync', testTimeoutValidation, false, execaSync);

test('timedOut is false if timeout is undefined', async t => {
	const {timedOut} = await execa('noop.js');
	t.false(timedOut);
});

test('timedOut is false if timeout is 0', async t => {
	const {timedOut} = await execa('noop.js', {timeout: 0});
	t.false(timedOut);
});

test('timedOut is false if timeout is undefined and exit code is 0 in sync mode', t => {
	const {timedOut} = execaSync('noop.js');
	t.false(timedOut);
});

test('timedOut is true if the timeout happened after a different error occurred', async t => {
	const subprocess = execa('forever.js', {timeout: 1e3});
	const cause = new Error('test');
	subprocess.emit('error', cause);
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.true(error.timedOut);
});
