import {once} from 'node:events';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {assertMaxListeners} from '../helpers/listeners.js';
import {subprocessGetOne, subprocessGetFirst, mockSendIoError} from '../helpers/ipc.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

const testStrictSuccessParentOne = async (t, buffer) => {
	const subprocess = execa('ipc-echo.js', {ipc: true, buffer});
	await subprocess.sendMessage(foobarString, {strict: true});
	t.is(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, buffer ? [foobarString] : []);
};

test('subprocess.sendMessage() "strict" succeeds if the subprocess uses exports.getOneMessage(), buffer false', testStrictSuccessParentOne, false);
test('subprocess.sendMessage() "strict" succeeds if the subprocess uses exports.getOneMessage(), buffer true', testStrictSuccessParentOne, true);

const testStrictSuccessParentEach = async (t, buffer) => {
	const subprocess = execa('ipc-iterate.js', {ipc: true, buffer});
	await subprocess.sendMessage('.', {strict: true});
	t.is(await subprocess.getOneMessage(), '.');
	await subprocess.sendMessage(foobarString);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, buffer ? ['.'] : []);
};

test('subprocess.sendMessage() "strict" succeeds if the subprocess uses exports.getEachMessage(), buffer false', testStrictSuccessParentEach, false);
test('subprocess.sendMessage() "strict" succeeds if the subprocess uses exports.getEachMessage(), buffer true', testStrictSuccessParentEach, true);

const testStrictMissingParent = async (t, buffer) => {
	const subprocess = execa('ipc-echo-twice.js', {ipcInput: foobarString, buffer});
	const promise = subprocess.getOneMessage();
	const secondPromise = subprocess.sendMessage(foobarString, {strict: true});
	const {message} = await t.throwsAsync(subprocess.sendMessage(foobarString, {strict: true}));
	t.is(message, 'subprocess.sendMessage() failed: the subprocess is not listening to incoming messages.');
	t.is(await promise, foobarString);
	await secondPromise;

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, buffer ? [foobarString, foobarString] : []);
};

test('subprocess.sendMessage() "strict" fails if the subprocess is not listening, buffer false', testStrictMissingParent, false);
test('subprocess.sendMessage() "strict" fails if the subprocess is not listening, buffer true', testStrictMissingParent, true);

const testStrictExit = async (t, buffer) => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});
	const {message} = await t.throwsAsync(subprocess.sendMessage(foobarString, {strict: true}));
	t.is(message, 'subprocess.sendMessage() failed: the subprocess exited without listening to incoming messages.');

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, buffer ? [foobarString] : []);
};

test('subprocess.sendMessage() "strict" fails if the subprocess exits, buffer false', testStrictExit, false);
test('subprocess.sendMessage() "strict" fails if the subprocess exits, buffer true', testStrictExit, true);

const testStrictSuccessSubprocess = async (t, getMessage, buffer) => {
	const subprocess = execa('ipc-send-strict.js', {ipc: true, buffer});
	t.is(await getMessage(subprocess), foobarString);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, buffer ? [foobarString] : []);
};

test('exports.sendMessage() "strict" succeeds if the current process uses subprocess.getOneMessage(), buffer false', testStrictSuccessSubprocess, subprocessGetOne, false);
test('exports.sendMessage() "strict" succeeds if the current process uses subprocess.getOneMessage(), buffer true', testStrictSuccessSubprocess, subprocessGetOne, true);
test('exports.sendMessage() "strict" succeeds if the current process uses subprocess.getEachMessage(), buffer false', testStrictSuccessSubprocess, subprocessGetFirst, false);
test('exports.sendMessage() "strict" succeeds if the current process uses subprocess.getEachMessage(), buffer true', testStrictSuccessSubprocess, subprocessGetFirst, true);

test('exports.sendMessage() "strict" succeeds if the current process uses result.ipcOutput', async t => {
	const {ipcOutput} = await execa('ipc-send-strict.js', {ipc: true});
	t.deepEqual(ipcOutput, [foobarString]);
});

test('exports.sendMessage() "strict" fails if the current process is not listening, buffer false', async t => {
	const {exitCode, isTerminated, stderr, ipcOutput} = await t.throwsAsync(execa('ipc-send-strict.js', {ipc: true, buffer: {ipc: false}}));
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(stderr.includes('Error: sendMessage() failed: the parent process is not listening to incoming messages.'));
	t.deepEqual(ipcOutput, []);
});

test.serial('Multiple subprocess.sendMessage() "strict" at once', async t => {
	const checkMaxListeners = assertMaxListeners(t);

	const subprocess = execa('ipc-iterate.js', {ipc: true});
	const messages = Array.from({length: PARALLEL_COUNT}, (_, index) => index);
	await Promise.all(messages.map(message => subprocess.sendMessage(message, {strict: true})));
	await subprocess.sendMessage(foobarString);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, messages);

	checkMaxListeners();
});

test('subprocess.sendMessage() "strict" fails if the subprocess uses once()', async t => {
	const subprocess = execa('ipc-once-message.js', {ipc: true});
	const {message} = await t.throwsAsync(subprocess.sendMessage(foobarString, {strict: true}));
	t.is(message, 'subprocess.sendMessage() failed: the subprocess exited without listening to incoming messages.');

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, ['.']);
});

test('exports.sendMessage() "strict" fails if the current process uses once() and buffer false', async t => {
	const subprocess = execa('ipc-send-strict.js', {ipc: true, buffer: {ipc: false}});
	const [message] = await once(subprocess, 'message');
	t.deepEqual(message, {id: 0n, type: 'execa:ipc:request', message: foobarString});

	const {exitCode, isTerminated, stderr, ipcOutput} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(stderr.includes('Error: sendMessage() failed: the parent process is not listening to incoming messages.'));
	t.deepEqual(ipcOutput, []);
});

test('subprocess.sendMessage() "strict" failure disconnects', async t => {
	const subprocess = execa('ipc-echo-twice-wait.js', {ipcInput: foobarString});
	const promise = subprocess.getOneMessage();
	const secondPromise = subprocess.sendMessage(foobarString, {strict: true});
	const {message} = await t.throwsAsync(subprocess.sendMessage(foobarString, {strict: true}));
	t.is(message, 'subprocess.sendMessage() failed: the subprocess is not listening to incoming messages.');
	t.is(await promise, foobarString);
	await secondPromise;

	const {exitCode, isTerminated, stderr, ipcOutput} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(stderr.includes('Error: sendMessage() cannot be used: the parent process has already exited or disconnected.'));
	t.deepEqual(ipcOutput, [foobarString, foobarString]);
});

test('exports.sendMessage() "strict" failure disconnects', async t => {
	const {exitCode, isTerminated, stderr, ipcOutput} = await t.throwsAsync(execa('ipc-send-strict-catch.js', {ipc: true, buffer: {ipc: false}}));
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(stderr.includes('Error: sendMessage() cannot be used: the parent process has already exited or disconnected.'));
	t.deepEqual(ipcOutput, []);
});

const testIoErrorParent = async (t, getMessage) => {
	const subprocess = execa('ipc-send-strict.js', {ipc: true});
	const cause = mockSendIoError(subprocess);
	const error = await t.throwsAsync(getMessage(subprocess));
	t.true(error.message.includes('subprocess.sendMessage() failed when sending an acknowledgment response to the subprocess.'));
	t.is(getMessage === subprocessGetOne ? error.cause : error.cause.cause, cause);

	const {exitCode, isTerminated, stderr, ipcOutput} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(stderr.includes('Error: sendMessage() failed: the parent process exited without listening to incoming messages.'));
	t.deepEqual(ipcOutput, []);
};

test('subprocess.getOneMessage() acknowledgment I/O error', testIoErrorParent, subprocessGetOne);
test('subprocess.getEachMessage() acknowledgment I/O error', testIoErrorParent, subprocessGetFirst);

const testIoErrorSubprocess = async (t, fixtureName) => {
	const subprocess = execa(fixtureName, {ipc: true});
	const {message} = await t.throwsAsync(subprocess.sendMessage(foobarString, {strict: true}));
	t.is(message, 'subprocess.sendMessage() failed: the subprocess exited without listening to incoming messages.');

	const {exitCode, isTerminated, stdout, stderr, ipcOutput} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.is(stdout, '');
	t.true(stderr.includes('Error: sendMessage() failed when sending an acknowledgment response to the parent process.'));
	t.true(stderr.includes(`Error: ${foobarString}`));
	t.deepEqual(ipcOutput, []);
};

test('exports.getOneMessage() acknowledgment I/O error', testIoErrorSubprocess, 'ipc-get-io-error.js');
test('exports.getEachMessage() acknowledgment I/O error', testIoErrorSubprocess, 'ipc-iterate-io-error.js');

test('Opposite sendMessage() "strict", buffer true', async t => {
	const subprocess = execa('ipc-send-strict-get.js', {ipc: true});
	await subprocess.sendMessage(foobarString, {strict: true});

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString, foobarString]);
});

test('Opposite sendMessage() "strict", current process listening, buffer false', async t => {
	const subprocess = execa('ipc-send-strict-get.js', {ipc: true, buffer: false});
	const [message] = await Promise.all([
		subprocess.getOneMessage(),
		subprocess.sendMessage(foobarString, {strict: true}),
	]);
	t.is(message, foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, []);
});

test('Opposite sendMessage() "strict", subprocess listening, buffer false', async t => {
	const subprocess = execa('ipc-send-strict-listen.js', {ipc: true, buffer: false});
	await subprocess.sendMessage(foobarString, {strict: true});
	t.is(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, []);
});

test('Opposite sendMessage() "strict", not listening, buffer false', async t => {
	const subprocess = execa('ipc-send-strict-get.js', {ipc: true, timeout: 1e3, buffer: false});
	const {message} = await t.throwsAsync(subprocess.sendMessage(foobarString, {strict: true}));
	t.is(message, 'subprocess.sendMessage() failed: the subprocess exited without listening to incoming messages.');

	const {timedOut, ipcOutput} = await t.throwsAsync(subprocess);
	t.true(timedOut);
	t.deepEqual(ipcOutput, []);
});
