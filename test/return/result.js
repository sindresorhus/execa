import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {fullStdio} from '../helpers/stdio.js';
/* eslint-disable node-test/no-conditional-assertion -- shared helper functions are called from conditional paths on purpose */

const isWindows = process.platform === 'win32';

setFixtureDirectory();

const testSuccessShape = async execaMethod => {
	const result = await execaMethod('empty.js', {...fullStdio, all: true});
	assert.deepEqual(Reflect.ownKeys(result), [
		'command',
		'escapedCommand',
		'cwd',
		'durationMs',
		'failed',
		'timedOut',
		'isCanceled',
		'isGracefullyCanceled',
		'isTerminated',
		'isMaxBuffer',
		'isForcefullyTerminated',
		'exitCode',
		'stdout',
		'stderr',
		'all',
		'stdio',
		'ipcOutput',
		'pipedFrom',
	]);
};

test('Return value properties are not missing and are ordered', () => testSuccessShape(execa));
test('Return value properties are not missing and are ordered, sync', () => testSuccessShape(execaSync));

const testErrorShape = async execaMethod => {
	const error = await execaMethod('fail.js', {...fullStdio, all: true, reject: false});
	assert.equal(error.exitCode, 2);
	assert.deepEqual(Reflect.ownKeys(error), [
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
		'isGracefullyCanceled',
		'isTerminated',
		'isMaxBuffer',
		'isForcefullyTerminated',
		'exitCode',
		'stdout',
		'stderr',
		'all',
		'stdio',
		'ipcOutput',
		'pipedFrom',
	]);
};

test('Error properties are not missing and are ordered', () => testErrorShape(execa));
test('Error properties are not missing and are ordered, sync', () => testErrorShape(execaSync));

test('failed is false on success', async () => {
	const {failed} = await execa('noop.js', ['foo']);
	assert.equal(failed, false);
});

test('failed is true on failure', async () => {
	const {failed} = await assertRejects(execa('fail.js'));
	assert.equal(failed, true);
});

test('error.isTerminated is true if subprocess was killed directly', async () => {
	const subprocess = execa('forever.js', {killSignal: 'SIGINT'});

	subprocess.kill();

	const {isTerminated, signal, originalMessage, message, shortMessage} = await assertRejects(subprocess, {message: /was killed with SIGINT/});
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGINT');
	assert.equal(originalMessage, undefined);
	assert.equal(shortMessage, 'Command was killed with SIGINT (User interruption with CTRL-C): forever.js');
	assert.equal(message, shortMessage);
});

test('error.isTerminated is true if subprocess was killed indirectly', async () => {
	const subprocess = execa('forever.js', {killSignal: 'SIGHUP'});

	process.kill(subprocess.pid, 'SIGINT');

	// `subprocess.kill()` is emulated by Node.js on Windows
	if (isWindows) {
		const {isTerminated, signal} = await assertRejects(subprocess, {message: /failed with exit code 1/});
		assert.equal(isTerminated, false);
		assert.equal(signal, undefined);
	} else {
		const {isTerminated, signal} = await assertRejects(subprocess, {message: /was killed with SIGINT/});
		assert.equal(isTerminated, true);
		assert.equal(signal, 'SIGINT');
	}
});

test('result.isTerminated is false if not killed', async () => {
	const {isTerminated} = await execa('noop.js');
	assert.equal(isTerminated, false);
});

test('result.isTerminated is false if not killed and subprocess.kill() was called', async () => {
	const subprocess = execa('noop.js');
	subprocess.kill(0);
	assert.equal(subprocess.nodeChildProcess.killed, true);
	const {isTerminated} = await subprocess;
	assert.equal(isTerminated, false);
});

test('result.isTerminated is false if not killed, in sync mode', () => {
	const {isTerminated} = execaSync('noop.js');
	assert.equal(isTerminated, false);
});

test('result.isTerminated is false on subprocess error', async () => {
	const {isTerminated} = await assertRejects(execa('wrong command'));
	assert.equal(isTerminated, false);
});

test('result.isTerminated is false on subprocess error, in sync mode', () => {
	const {isTerminated} = assertThrows(() => {
		execaSync('wrong command');
	});
	assert.equal(isTerminated, false);
});

test('error.code is undefined on success', async () => {
	const {code} = await execa('noop.js');
	assert.equal(code, undefined);
});

test('error.code is defined on failure if applicable', async () => {
	const {code} = await assertRejects(execa('noop.js', {uid: true}));
	assert.equal(code, 'ERR_INVALID_ARG_TYPE');
});

/* eslint-enable node-test/no-conditional-assertion */
