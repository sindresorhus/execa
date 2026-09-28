import assert from 'node:assert/strict';
import {once} from 'node:events';
import {constants} from 'node:os';
import {setImmediate} from 'node:timers/promises';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const testKillSignal = async killSignal => {
	const {isTerminated, signal} = await assertRejects(execa('forever.js', {killSignal, timeout: 1}));
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGINT');
};

test('Can use killSignal: "SIGINT"', () => testKillSignal('SIGINT'));
test('Can use killSignal: 2', () => testKillSignal(constants.signals.SIGINT));

const testKillSignalSync = killSignal => {
	const {isTerminated, signal} = assertThrows(() => {
		execaSync('forever.js', {killSignal, timeout: 1});
	});
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGINT');
};

test('Can use killSignal: "SIGINT", sync', () => testKillSignalSync('SIGINT'));
test('Can use killSignal: 2, sync', () => testKillSignalSync(constants.signals.SIGINT));

test('Can call .kill("SIGTERM")', async () => {
	const subprocess = execa('forever.js');
	subprocess.kill('SIGTERM');
	const {isTerminated, signal} = await assertRejects(subprocess);
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGTERM');
});

test('Can call .kill(15)', async () => {
	const subprocess = execa('forever.js');
	subprocess.kill(constants.signals.SIGTERM);
	const {isTerminated, signal} = await assertRejects(subprocess);
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGTERM');
});

test('Can call .kill(0)', async () => {
	const subprocess = execa('forever.js');
	assert.ok(subprocess.kill(0));
	subprocess.kill();
	await assertRejects(subprocess);
	assert.ok(!subprocess.kill(0));
});

test('Can call `.kill()` multiple times', async () => {
	const subprocess = execa('forever.js');
	subprocess.kill();
	subprocess.kill();

	const {exitCode, isTerminated, signal, code} = await assertRejects(subprocess);
	assert.equal(exitCode, undefined);
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGTERM');
	assert.equal(code, undefined);
});

test('execa() returns a promise with kill()', async () => {
	const subprocess = execa('noop.js', ['foo']);
	assert.equal(typeof subprocess.kill, 'function');
	await subprocess;
});

const testInvalidKillArgument = async (killArgument, secondKillArgument) => {
	const subprocess = execa('empty.js');
	const message = secondKillArgument === undefined || secondKillArgument instanceof Error
		? /error instance or a signal name/
		: /second argument is optional/;
	assertThrows(() => {
		subprocess.kill(killArgument, secondKillArgument);
	}, {message});
	await subprocess;
};

test('Cannot call .kill(errorObject)', () => testInvalidKillArgument({name: '', message: '', stack: ''}));
test('Cannot call .kill(errorArray)', () => testInvalidKillArgument([new Error('test')]));
test('Cannot call .kill(undefined, true)', () => testInvalidKillArgument(undefined, true));
test('Cannot call .kill("SIGTERM", true)', () => testInvalidKillArgument('SIGTERM', true));
test('Cannot call .kill(true, error)', () => testInvalidKillArgument(true, new Error('test')));

test('subprocess errors are handled before spawn', async () => {
	const subprocess = execa('forever.js');
	const cause = new Error('test');
	subprocess.nodeChildProcess.emit('error', cause);
	subprocess.kill();
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.equal(error.exitCode, undefined);
	assert.equal(error.signal, undefined);
	assert.equal(error.isTerminated, false);
});

test('subprocess errors are handled after spawn', async () => {
	const subprocess = execa('forever.js');
	await once(subprocess.nodeChildProcess, 'spawn');
	const cause = new Error('test');
	subprocess.nodeChildProcess.emit('error', cause);
	subprocess.kill();
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.equal(error.exitCode, undefined);
	assert.equal(error.signal, 'SIGTERM');
	assert.equal(error.isTerminated, true);
});

test('subprocess double errors are handled after spawn', async () => {
	const abortController = new AbortController();
	const subprocess = execa('forever.js', {cancelSignal: abortController.signal});
	await once(subprocess.nodeChildProcess, 'spawn');
	const cause = new Error('test');
	subprocess.nodeChildProcess.emit('error', cause);
	await setImmediate();
	abortController.abort();
	subprocess.nodeChildProcess.emit('error', cause);
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.equal(error.exitCode, undefined);
	assert.equal(error.signal, 'SIGTERM');
	assert.equal(error.isTerminated, true);
});

test('subprocess errors use killSignal', async () => {
	const subprocess = execa('forever.js', {killSignal: 'SIGINT'});
	await once(subprocess.nodeChildProcess, 'spawn');
	const cause = new Error('test');
	subprocess.nodeChildProcess.emit('error', cause);
	subprocess.kill();
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.equal(error.isTerminated, true);
	assert.equal(error.signal, 'SIGINT');
});
