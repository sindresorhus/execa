import {once} from 'node:events';
import {setImmediate} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

test('Can call `.kill()` multiple times', async t => {
	const subprocess = execa('forever.js');
	subprocess.kill();
	subprocess.kill();

	const {isTerminated, signal} = await t.throwsAsync(subprocess);
	t.true(isTerminated);
	t.is(signal, 'SIGTERM');
});

test('execa() returns a promise with kill()', async t => {
	const subprocess = execa('noop.js', ['foo']);
	t.is(typeof subprocess.kill, 'function');
	await subprocess;
});

const testInvalidKillArgument = async (t, killArgument, secondKillArgument) => {
	const subprocess = execa('empty.js');
	const message = secondKillArgument instanceof Error || secondKillArgument === undefined
		? /error instance or a signal name/
		: /second argument is optional/;
	t.throws(() => {
		subprocess.kill(killArgument, secondKillArgument);
	}, {message});
	await subprocess;
};

test('Cannot call .kill(null)', testInvalidKillArgument, null);
test('Cannot call .kill(0n)', testInvalidKillArgument, 0n);
test('Cannot call .kill(true)', testInvalidKillArgument, true);
test('Cannot call .kill(errorObject)', testInvalidKillArgument, {name: '', message: '', stack: ''});
test('Cannot call .kill(errorArray)', testInvalidKillArgument, [new Error('test')]);
test('Cannot call .kill(undefined, true)', testInvalidKillArgument, undefined, true);
test('Cannot call .kill("SIGTERM", true)', testInvalidKillArgument, 'SIGTERM', true);
test('Cannot call .kill(true, error)', testInvalidKillArgument, true, new Error('test'));

test('subprocess errors are handled before spawn', async t => {
	const subprocess = execa('forever.js');
	const cause = new Error('test');
	subprocess.emit('error', cause);
	subprocess.kill();
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.exitCode, undefined);
	t.is(error.signal, undefined);
	t.false(error.isTerminated);
});

test('subprocess errors are handled after spawn', async t => {
	const subprocess = execa('forever.js');
	await once(subprocess, 'spawn');
	const cause = new Error('test');
	subprocess.emit('error', cause);
	subprocess.kill();
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.exitCode, undefined);
	t.is(error.signal, 'SIGTERM');
	t.true(error.isTerminated);
});

test('subprocess double errors are handled after spawn', async t => {
	const abortController = new AbortController();
	const subprocess = execa('forever.js', {cancelSignal: abortController.signal});
	await once(subprocess, 'spawn');
	const cause = new Error('test');
	subprocess.emit('error', cause);
	await setImmediate();
	abortController.abort();
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.exitCode, undefined);
	t.is(error.signal, 'SIGTERM');
	t.true(error.isTerminated);
});

test('subprocess errors use killSignal', async t => {
	const subprocess = execa('forever.js', {killSignal: 'SIGINT'});
	await once(subprocess, 'spawn');
	const cause = new Error('test');
	subprocess.emit('error', cause);
	subprocess.kill();
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.true(error.isTerminated);
	t.is(error.signal, 'SIGINT');
});
