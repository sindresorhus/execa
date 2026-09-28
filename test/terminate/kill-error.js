import assert from 'node:assert/strict';
import {once} from 'node:events';
import {setImmediate} from 'node:timers/promises';
import test from 'node:test';
import isRunning from 'is-running';
import {assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

test('.kill(error) propagates error', async () => {
	const subprocess = execa('forever.js');
	const originalMessage = 'test';
	const cause = new Error(originalMessage);
	assert.ok(subprocess.kill(cause));
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.ok(cause.stack.includes(import.meta.url));
	assert.equal(error.exitCode, undefined);
	assert.equal(error.signal, 'SIGTERM');
	assert.equal(error.isTerminated, true);
	assert.equal(error.originalMessage, originalMessage);
	assert.ok(error.message.includes(originalMessage));
	assert.ok(error.message.includes('was killed with SIGTERM'));
});

test('.kill(error) uses killSignal', async () => {
	const subprocess = execa('forever.js', {killSignal: 'SIGINT'});
	const cause = new Error('test');
	subprocess.kill(cause);
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.equal(error.signal, 'SIGINT');
});

test('.kill(signal, error) uses signal', async () => {
	const subprocess = execa('forever.js');
	const cause = new Error('test');
	subprocess.kill('SIGINT', cause);
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.equal(error.signal, 'SIGINT');
});

test('.kill(error) is a noop if subprocess already exited', async () => {
	const subprocess = execa('empty.js');
	await subprocess;
	assert.ok(!isRunning(subprocess.pid));
	assert.ok(!subprocess.kill(new Error('test')));
});

test('.kill(error) terminates but does not change the error if the subprocess already errored but did not exit yet', async () => {
	const subprocess = execa('forever.js');
	const cause = new Error('first');
	subprocess.stdout.destroy(cause);
	await setImmediate();
	const secondError = new Error('second');
	assert.ok(subprocess.kill(secondError));
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.equal(error.exitCode, undefined);
	assert.equal(error.signal, 'SIGTERM');
	assert.equal(error.isTerminated, true);
	assert.ok(!error.message.includes(secondError.message));
});

test('.kill(error) twice in a row', async () => {
	const subprocess = execa('forever.js');
	const cause = new Error('first');
	subprocess.kill(cause);
	const secondCause = new Error('second');
	subprocess.kill(secondCause);
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.ok(!error.message.includes(secondCause.message));
});

test('.kill(error) does not emit the "error" event', async () => {
	const subprocess = execa('forever.js');
	const cause = new Error('test');
	subprocess.kill(cause);
	const error = await Promise.race([assertRejects(subprocess), once(subprocess.nodeChildProcess, 'error')]);
	assert.equal(error.cause, cause);
});
