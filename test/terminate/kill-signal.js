import {once} from 'node:events';
import {platform, version} from 'node:process';
import {constants} from 'node:os';
import {setImmediate} from 'node:timers/promises';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const isWindows = platform === 'win32';
const majorNodeVersion = Number(version.split('.')[0].slice(1));

const testKillSignal = async (t, killSignal) => {
	const {isTerminated, signal} = await t.throwsAsync(execa('forever.js', {killSignal, timeout: 1}));
	t.true(isTerminated);
	t.is(signal, 'SIGINT');
};

test('Can use killSignal: "SIGINT"', testKillSignal, 'SIGINT');
test('Can use killSignal: 2', testKillSignal, constants.signals.SIGINT);

const testKillSignalSync = (t, killSignal) => {
	const {isTerminated, signal} = t.throws(() => {
		execaSync('forever.js', {killSignal, timeout: 1});
	});
	t.true(isTerminated);
	t.is(signal, 'SIGINT');
};

test('Can use killSignal: "SIGINT", sync', testKillSignalSync, 'SIGINT');
test('Can use killSignal: 2, sync', testKillSignalSync, constants.signals.SIGINT);

test('Can call .kill("SIGTERM")', async t => {
	const subprocess = execa('forever.js');
	subprocess.kill('SIGTERM');
	const {isTerminated, signal} = await t.throwsAsync(subprocess);
	t.true(isTerminated);
	t.is(signal, 'SIGTERM');
});

test('Can call .kill(15)', async t => {
	const subprocess = execa('forever.js');
	subprocess.kill(constants.signals.SIGTERM);
	const {isTerminated, signal} = await t.throwsAsync(subprocess);
	t.true(isTerminated);
	t.is(signal, 'SIGTERM');
});

test('Can call .kill(0)', async t => {
	const subprocess = execa('forever.js');
	t.true(subprocess.kill(0));
	subprocess.kill();
	await t.throwsAsync(subprocess);
	t.false(subprocess.kill(0));
});

test('Can call `.kill()` multiple times', async t => {
	const subprocess = execa('forever.js');
	subprocess.kill();
	subprocess.kill();

	const {exitCode, isTerminated, signal, code} = await t.throwsAsync(subprocess);

	// On Windows, calling `subprocess.kill()` twice emits an `error` event on the subprocess.
	// This does not happen when passing an `error` argument, nor when passing a non-terminating signal.
	// There is no easy way to make this cross-platform, so we document the difference here.
	if (isWindows && majorNodeVersion >= 22) {
		t.is(exitCode, undefined);
		t.false(isTerminated);
		t.is(signal, undefined);
		t.is(code, 'EPERM');
	} else {
		t.is(exitCode, undefined);
		t.true(isTerminated);
		t.is(signal, 'SIGTERM');
		t.is(code, undefined);
	}
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
