import process from 'node:process';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {fullStdio} from '../helpers/stdio.js';

const isWindows = process.platform === 'win32';

setFixtureDirectory();

const testSuccessShape = async (t, execaMethod) => {
	const result = await execaMethod('empty.js', {...fullStdio, all: true});
	t.deepEqual(Reflect.ownKeys(result), [
		'command',
		'escapedCommand',
		'cwd',
		'durationMs',
		'failed',
		'timedOut',
		'isCanceled',
		'isTerminated',
		'isMaxBuffer',
		'exitCode',
		'stdout',
		'stderr',
		'all',
		'stdio',
		'ipc',
		'pipedFrom',
	]);
};

test('Return value properties are not missing and are ordered', testSuccessShape, execa);
test('Return value properties are not missing and are ordered, sync', testSuccessShape, execaSync);

const testErrorShape = async (t, execaMethod) => {
	const error = await execaMethod('fail.js', {...fullStdio, all: true, reject: false});
	t.is(error.exitCode, 2);
	t.deepEqual(Reflect.ownKeys(error), [
		'stack',
		'message',
		'shortMessage',
		'command',
		'escapedCommand',
		'cwd',
		'durationMs',
		'failed',
		'timedOut',
		'isCanceled',
		'isTerminated',
		'isMaxBuffer',
		'exitCode',
		'stdout',
		'stderr',
		'all',
		'stdio',
		'ipc',
		'pipedFrom',
	]);
};

test('Error properties are not missing and are ordered', testErrorShape, execa);
test('Error properties are not missing and are ordered, sync', testErrorShape, execaSync);

test('failed is false on success', async t => {
	const {failed} = await execa('noop.js', ['foo']);
	t.false(failed);
});

test('failed is true on failure', async t => {
	const {failed} = await t.throwsAsync(execa('fail.js'));
	t.true(failed);
});

test('error.isTerminated is true if subprocess was killed directly', async t => {
	const subprocess = execa('forever.js', {killSignal: 'SIGINT'});

	subprocess.kill();

	const {isTerminated, signal, originalMessage, message, shortMessage} = await t.throwsAsync(subprocess, {message: /was killed with SIGINT/});
	t.true(isTerminated);
	t.is(signal, 'SIGINT');
	t.is(originalMessage, undefined);
	t.is(shortMessage, 'Command was killed with SIGINT (User interruption with CTRL-C): forever.js');
	t.is(message, shortMessage);
});

test('error.isTerminated is true if subprocess was killed indirectly', async t => {
	const subprocess = execa('forever.js', {killSignal: 'SIGHUP'});

	process.kill(subprocess.pid, 'SIGINT');

	// `subprocess.kill()` is emulated by Node.js on Windows
	if (isWindows) {
		const {isTerminated, signal} = await t.throwsAsync(subprocess, {message: /failed with exit code 1/});
		t.is(isTerminated, false);
		t.is(signal, undefined);
	} else {
		const {isTerminated, signal} = await t.throwsAsync(subprocess, {message: /was killed with SIGINT/});
		t.is(isTerminated, true);
		t.is(signal, 'SIGINT');
	}
});

test('result.isTerminated is false if not killed', async t => {
	const {isTerminated} = await execa('noop.js');
	t.false(isTerminated);
});

test('result.isTerminated is false if not killed and subprocess.kill() was called', async t => {
	const subprocess = execa('noop.js');
	subprocess.kill(0);
	t.true(subprocess.killed);
	const {isTerminated} = await subprocess;
	t.false(isTerminated);
});

test('result.isTerminated is false if not killed, in sync mode', t => {
	const {isTerminated} = execaSync('noop.js');
	t.false(isTerminated);
});

test('result.isTerminated is false on subprocess error', async t => {
	const {isTerminated} = await t.throwsAsync(execa('wrong command'));
	t.false(isTerminated);
});

test('result.isTerminated is false on subprocess error, in sync mode', t => {
	const {isTerminated} = t.throws(() => {
		execaSync('wrong command');
	});
	t.false(isTerminated);
});

test('error.code is undefined on success', async t => {
	const {code} = await execa('noop.js');
	t.is(code, undefined);
});

test('error.code is defined on failure if applicable', async t => {
	const {code} = await t.throwsAsync(execa('noop.js', {uid: true}));
	t.is(code, 'ERR_INVALID_ARG_TYPE');
});
