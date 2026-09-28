import assert from 'node:assert/strict';
import {once} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {assertMaxListeners} from '../helpers/listeners.js';
import {subprocessGetOne, subprocessGetFirst, mockSendIoError} from '../helpers/ipc.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

const testStrictSuccessParentOne = async buffer => {
	const subprocess = execa('ipc-echo.js', {ipc: true, buffer});
	await subprocess.sendMessage(foobarString, {strict: true});
	assert.equal(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, buffer ? [foobarString] : []);
};

test('subprocess.sendMessage() "strict" succeeds if the subprocess uses exports.getOneMessage(), buffer false', () => testStrictSuccessParentOne(false));
test('subprocess.sendMessage() "strict" succeeds if the subprocess uses exports.getOneMessage(), buffer true', () => testStrictSuccessParentOne(true));

const testStrictSuccessParentEach = async buffer => {
	const subprocess = execa('ipc-iterate.js', {ipc: true, buffer});
	await subprocess.sendMessage('.', {strict: true});
	assert.equal(await subprocess.getOneMessage(), '.');
	await subprocess.sendMessage(foobarString);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, buffer ? ['.'] : []);
};

test('subprocess.sendMessage() "strict" succeeds if the subprocess uses exports.getEachMessage(), buffer false', () => testStrictSuccessParentEach(false));
test('subprocess.sendMessage() "strict" succeeds if the subprocess uses exports.getEachMessage(), buffer true', () => testStrictSuccessParentEach(true));

const testStrictMissingParent = async buffer => {
	const subprocess = execa('ipc-echo-twice.js', {ipcInput: foobarString, buffer});
	const promise = subprocess.getOneMessage();
	const secondPromise = subprocess.sendMessage(foobarString, {strict: true});
	const {message} = await assertRejects(subprocess.sendMessage(foobarString, {strict: true}));
	assert.equal(message, 'subprocess.sendMessage() failed: the subprocess is not listening to incoming messages.');
	assert.equal(await promise, foobarString);
	await secondPromise;

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, buffer ? [foobarString, foobarString] : []);
};

test('subprocess.sendMessage() "strict" fails if the subprocess is not listening, buffer false', () => testStrictMissingParent(false));
test('subprocess.sendMessage() "strict" fails if the subprocess is not listening, buffer true', () => testStrictMissingParent(true));

const testStrictExit = async buffer => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer});
	const {message} = await assertRejects(subprocess.sendMessage(foobarString, {strict: true}));
	assert.equal(message, 'subprocess.sendMessage() failed: the subprocess exited without listening to incoming messages.');

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, buffer ? [foobarString] : []);
};

test('subprocess.sendMessage() "strict" fails if the subprocess exits, buffer false', () => testStrictExit(false));
test('subprocess.sendMessage() "strict" fails if the subprocess exits, buffer true', () => testStrictExit(true));

const testStrictSuccessSubprocess = async (getMessage, buffer) => {
	const subprocess = execa('ipc-send-strict.js', {ipc: true, buffer});
	assert.equal(await getMessage(subprocess), foobarString);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, buffer ? [foobarString] : []);
};

test('exports.sendMessage() "strict" succeeds if the current process uses subprocess.getOneMessage(), buffer false', () => testStrictSuccessSubprocess(subprocessGetOne, false));
test('exports.sendMessage() "strict" succeeds if the current process uses subprocess.getOneMessage(), buffer true', () => testStrictSuccessSubprocess(subprocessGetOne, true));
test('exports.sendMessage() "strict" succeeds if the current process uses subprocess.getEachMessage(), buffer false', () => testStrictSuccessSubprocess(subprocessGetFirst, false));
test('exports.sendMessage() "strict" succeeds if the current process uses subprocess.getEachMessage(), buffer true', () => testStrictSuccessSubprocess(subprocessGetFirst, true));

test('exports.sendMessage() "strict" succeeds if the current process uses result.ipcOutput', async () => {
	const {ipcOutput} = await execa('ipc-send-strict.js', {ipc: true});
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('exports.sendMessage() "strict" fails if the current process is not listening, buffer false', async () => {
	const {exitCode, isTerminated, stderr, ipcOutput} = await assertRejects(execa('ipc-send-strict.js', {ipc: true, buffer: {ipc: false}}));
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(stderr.includes('Error: sendMessage() failed: the parent process is not listening to incoming messages.'));
	assert.deepEqual(ipcOutput, []);
});

test('Multiple subprocess.sendMessage() "strict" at once', async () => {
	const checkMaxListeners = assertMaxListeners();

	const subprocess = execa('ipc-iterate.js', {ipc: true});
	const messages = Array.from({length: PARALLEL_COUNT}, (_, index) => index);
	await Promise.all(messages.map(message => subprocess.sendMessage(message, {strict: true})));
	await subprocess.sendMessage(foobarString);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, messages);

	checkMaxListeners();
});

test('subprocess.sendMessage() "strict" fails if the subprocess uses once()', async () => {
	const subprocess = execa('ipc-once-message.js', {ipc: true});
	const {message} = await assertRejects(subprocess.sendMessage(foobarString, {strict: true}));
	assert.equal(message, 'subprocess.sendMessage() failed: the subprocess exited without listening to incoming messages.');

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, ['.']);
});

test('exports.sendMessage() "strict" fails if the current process uses once() and buffer false', async () => {
	const subprocess = execa('ipc-send-strict.js', {ipc: true, buffer: {ipc: false}});
	const [message] = await once(subprocess.nodeChildProcess, 'message');
	assert.deepEqual(message, {
		id: 0,
		type: 'execa:ipc:request',
		message: foobarString,
		hasListeners: false,
	});

	const {exitCode, isTerminated, stderr, ipcOutput} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(stderr.includes('Error: sendMessage() failed: the parent process is not listening to incoming messages.'));
	assert.deepEqual(ipcOutput, []);
});

test('subprocess.sendMessage() "strict" failure disconnects', async () => {
	const subprocess = execa('ipc-echo-twice-wait.js', {ipcInput: foobarString});
	const promise = subprocess.getOneMessage();
	const secondPromise = subprocess.sendMessage(foobarString, {strict: true});
	const {message} = await assertRejects(subprocess.sendMessage(foobarString, {strict: true}));
	assert.equal(message, 'subprocess.sendMessage() failed: the subprocess is not listening to incoming messages.');
	assert.equal(await promise, foobarString);
	await secondPromise;

	const {exitCode, isTerminated, stderr, ipcOutput} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(stderr.includes('Error: sendMessage() cannot be used: the parent process has already exited or disconnected.'));
	assert.deepEqual(ipcOutput, [foobarString, foobarString]);
});

test('exports.sendMessage() "strict" failure disconnects', async () => {
	const {exitCode, isTerminated, stderr, ipcOutput} = await assertRejects(execa('ipc-send-strict-catch.js', {ipc: true, buffer: {ipc: false}}));
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(stderr.includes('Error: sendMessage() cannot be used: the parent process has already exited or disconnected.'));
	assert.deepEqual(ipcOutput, []);
});

const testIoErrorParent = async getMessage => {
	const subprocess = execa('ipc-send-strict.js', {ipc: true});
	const cause = mockSendIoError(subprocess);
	const error = await assertRejects(getMessage(subprocess));
	assert.ok(error.message.includes('subprocess.sendMessage() failed when sending an acknowledgment response to the subprocess.'));
	assert.equal(getMessage === subprocessGetOne ? error.cause : error.cause.cause, cause);

	const {exitCode, isTerminated, stderr, ipcOutput} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(stderr.includes('Error: sendMessage() failed: the parent process exited without listening to incoming messages.'));
	assert.deepEqual(ipcOutput, []);
};

test('subprocess.getOneMessage() acknowledgment I/O error', () => testIoErrorParent(subprocessGetOne));
test('subprocess.getEachMessage() acknowledgment I/O error', () => testIoErrorParent(subprocessGetFirst));

const testIoErrorSubprocess = async fixtureName => {
	const subprocess = execa(fixtureName, {ipc: true});
	const {message} = await assertRejects(subprocess.sendMessage(foobarString, {strict: true}));
	assert.equal(message, 'subprocess.sendMessage() failed: the subprocess exited without listening to incoming messages.');

	const {exitCode, isTerminated, stdout, stderr, ipcOutput} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.equal(stdout, '');
	assert.ok(stderr.includes('Error: sendMessage() failed when sending an acknowledgment response to the parent process.'));
	assert.ok(stderr.includes(`Error: ${foobarString}`));
	assert.deepEqual(ipcOutput, []);
};

test('exports.getOneMessage() acknowledgment I/O error', () => testIoErrorSubprocess('ipc-get-io-error.js'));
test('exports.getEachMessage() acknowledgment I/O error', () => testIoErrorSubprocess('ipc-iterate-io-error.js'));

test('Opposite sendMessage() "strict", buffer true', async () => {
	const subprocess = execa('ipc-send-strict-get.js', {ipc: true});
	await subprocess.sendMessage(foobarString, {strict: true});

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, [foobarString, foobarString]);
});

test('Opposite sendMessage() "strict", current process listening, buffer false', async () => {
	const subprocess = execa('ipc-send-strict-get.js', {ipc: true, buffer: {ipc: false}});
	const [message] = await Promise.all([
		subprocess.getOneMessage(),
		subprocess.sendMessage(foobarString, {strict: true}),
	]);
	assert.equal(message, foobarString);
	assert.equal(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, []);
});

test('Opposite sendMessage() "strict", subprocess listening, buffer false', async () => {
	const subprocess = execa('ipc-send-strict-listen.js', {ipc: true, buffer: {ipc: false}});
	await subprocess.sendMessage(foobarString, {strict: true});
	assert.equal(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, []);
});

test('Opposite sendMessage() "strict", not listening, buffer false', async () => {
	const subprocess = execa('ipc-send-strict.js', {ipc: true, buffer: {ipc: false}});
	const {message} = await assertRejects(subprocess.sendMessage(foobarString, {strict: true}));
	assert.ok(message.startsWith('subprocess.sendMessage() failed: the subprocess is sending a message too, instead of listening to incoming messages.'));

	const {exitCode, isTerminated, stderr, ipcOutput} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(stderr.includes('Error: sendMessage() failed: the parent process is sending a message too, instead of listening to incoming messages.'));
	assert.deepEqual(ipcOutput, []);
});

test('Ignores "strict" responses with an Object.prototype property as id', async () => {
	const {ipcOutput} = await execa('ipc-send-strict-proto.js', {ipc: true});
	assert.deepEqual(ipcOutput, []);
});

// `forever.js` does not use Execa, so it never acknowledges the message
test('Ignores "strict" responses sent by another subprocess', async () => {
	const subprocess = execa('forever.js', {ipc: true});
	const sendPromise = subprocess.sendMessage(foobarString, {strict: true});

	try {
		const {ipcOutput} = await execa('ipc-send-strict-forged.js', {ipc: true});
		assert.deepEqual(ipcOutput, []);
		assert.equal(await Promise.race([sendPromise.then(() => 'resolved'), setTimeout(500, 'pending')]), 'pending');
	} finally {
		subprocess.kill();
	}

	await Promise.all([assertRejects(sendPromise), assertRejects(subprocess)]);
});

const testStrictJson = async buffer => {
	const subprocess = execa('ipc-echo.js', {ipc: true, serialization: 'json', buffer});
	await subprocess.sendMessage(foobarString, {strict: true});
	assert.equal(await subprocess.getOneMessage(), foobarString);

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, buffer ? [foobarString] : []);
};

test('subprocess.sendMessage() "strict" works with serialization "json", buffer false', () => testStrictJson(false));
test('subprocess.sendMessage() "strict" works with serialization "json", buffer true', () => testStrictJson(true));

test('exports.sendMessage() "strict" works with serialization "json"', async () => {
	const subprocess = execa('ipc-send-strict-get.js', {ipc: true, serialization: 'json'});
	await subprocess.sendMessage(foobarString, {strict: true});

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, [foobarString, foobarString]);
});

test('subprocess.sendMessage() "strict" fails with serialization "json" if the subprocess is not listening', async () => {
	const subprocess = execa('ipc-send.js', {ipc: true, serialization: 'json'});
	const {message} = await assertRejects(subprocess.sendMessage(foobarString, {strict: true}));
	assert.equal(message, 'subprocess.sendMessage() failed: the subprocess exited without listening to incoming messages.');

	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, [foobarString]);
});

const noop = () => {};

// Messages received in the same batch are processed one after the other.
// The deadlock must be detected on the message being processed, not on the first one received.
// Without the detection, the subprocess would deadlock, so the `timeout` turns that hang into a failed assertion.
test('Detects a "strict" deadlock on a later message of the same batch', async () => {
	const subprocess = execa('ipc-echo-strict-deadlock.js', {ipc: true, buffer: {ipc: false}, timeout: 1e4});
	await subprocess.sendMessage(foobarString);
	subprocess.sendMessage(foobarString, {strict: true}).catch(noop);

	const {exitCode, timedOut, stderr, ipcOutput} = await assertRejects(subprocess);
	assert.equal(timedOut, false);
	assert.equal(exitCode, 1);
	assert.ok(stderr.includes('Error: sendMessage() failed: the parent process is sending a message too, instead of listening to incoming messages.'));
	assert.deepEqual(ipcOutput, []);
});
