import {once} from 'node:events';
import {setImmediate} from 'node:timers/promises';
import test from 'ava';
import isRunning from 'is-running';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

test('.kill(error) propagates error', async t => {
	const subprocess = execa('forever.js');
	const originalMessage = 'test';
	const cause = new Error(originalMessage);
	t.true(subprocess.kill(cause));
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.true(cause.stack.includes(import.meta.url));
	t.is(error.exitCode, undefined);
	t.is(error.signal, 'SIGTERM');
	t.true(error.isTerminated);
	t.is(error.originalMessage, originalMessage);
	t.true(error.message.includes(originalMessage));
	t.true(error.message.includes('was killed with SIGTERM'));
});

test('.kill(error) uses killSignal', async t => {
	const subprocess = execa('forever.js', {killSignal: 'SIGINT'});
	const cause = new Error('test');
	subprocess.kill(cause);
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.signal, 'SIGINT');
});

test('.kill(signal, error) uses signal', async t => {
	const subprocess = execa('forever.js');
	const cause = new Error('test');
	subprocess.kill('SIGINT', cause);
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.signal, 'SIGINT');
});

test('.kill(error) is a noop if subprocess already exited', async t => {
	const subprocess = execa('empty.js');
	await subprocess;
	t.false(isRunning(subprocess.pid));
	t.false(subprocess.kill(new Error('test')));
});

test('.kill(error) terminates but does not change the error if the subprocess already errored but did not exit yet', async t => {
	const subprocess = execa('forever.js');
	const cause = new Error('first');
	subprocess.stdout.destroy(cause);
	await setImmediate();
	const secondError = new Error('second');
	t.true(subprocess.kill(secondError));
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.exitCode, undefined);
	t.is(error.signal, 'SIGTERM');
	t.true(error.isTerminated);
	t.false(error.message.includes(secondError.message));
});

test('.kill(error) twice in a row', async t => {
	const subprocess = execa('forever.js');
	const cause = new Error('first');
	subprocess.kill(cause);
	const secondCause = new Error('second');
	subprocess.kill(secondCause);
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.false(error.message.includes(secondCause.message));
});

test('.kill(error) does not emit the "error" event', async t => {
	const subprocess = execa('forever.js');
	const cause = new Error('test');
	subprocess.kill(cause);
	const error = await Promise.race([t.throwsAsync(subprocess), once(subprocess, 'error')]);
	t.is(error.cause, cause);
});
