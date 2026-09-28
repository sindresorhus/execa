import assert from 'node:assert/strict';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';
import {mockSendIoError} from '../helpers/ipc.js';

setFixtureDirectory();

test('Can exchange IPC messages', async () => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	await subprocess.sendMessage(foobarString);
	assert.equal(await subprocess.getOneMessage(), foobarString);
	await subprocess;
});

test('Can exchange IPC messages under heavy load', async () => {
	await Promise.all(Array.from({length: PARALLEL_COUNT}, async (_, index) => {
		const subprocess = execa('ipc-echo.js', {ipc: true});
		await subprocess.sendMessage(index);
		assert.equal(await subprocess.getOneMessage(), index);
		await subprocess;
	}));
});

test('The "serialization" option defaults to "advanced"', async () => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	await subprocess.sendMessage([0n]);
	const message = await subprocess.getOneMessage();
	assert.equal(message[0], 0n);
	await subprocess;
});

test('Can use "serialization: json" option', async () => {
	const subprocess = execa('ipc-echo.js', {ipc: true, serialization: 'json'});
	const date = new Date();
	await subprocess.sendMessage(date);
	assert.equal(await subprocess.getOneMessage(), date.toJSON());
	await subprocess;
});

test('Validates JSON payload with serialization: "json"', async () => {
	const subprocess = execa('ipc-echo.js', {ipc: true, serialization: 'json'});
	await assertRejects(subprocess.sendMessage([0n]), {message: /serialize a BigInt/});
	await assertRejects(subprocess);
});

const BIG_PAYLOAD_SIZE = '.'.repeat(1e6);

test('Handles backpressure', async () => {
	const subprocess = execa('ipc-iterate.js', {ipc: true});
	await subprocess.sendMessage(BIG_PAYLOAD_SIZE);
	assert.ok(subprocess.nodeChildProcess.send(foobarString));
	assert.equal(await subprocess.getOneMessage(), BIG_PAYLOAD_SIZE);
	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, [BIG_PAYLOAD_SIZE]);
});

test('Disconnects IPC on exports.sendMessage() error', async () => {
	const subprocess = execa('ipc-get-send-get.js', ['false'], {ipc: true});
	await subprocess.sendMessage(foobarString);
	assert.equal(await subprocess.getOneMessage(), foobarString);

	const {message, cause} = await assertRejects(subprocess.sendMessage(0n));
	assert.equal(message, 'subprocess.sendMessage()\'s argument type is invalid: the message cannot be serialized: 0.');
	assert.ok(cause.message.includes('The "message" argument must be one of type string'));

	const {exitCode, isTerminated, stderr} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(stderr.includes('Error: getOneMessage() could not complete'));
});

test('Disconnects IPC on subprocess.sendMessage() error', async () => {
	const subprocess = execa('ipc-send-error.js', {ipc: true});
	const ipcError = await assertRejects(subprocess.getOneMessage());
	assert.ok(ipcError.message.includes('subprocess.getOneMessage() could not complete'));

	const {exitCode, isTerminated, stderr} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(stderr.includes('Error: sendMessage()\'s argument type is invalid: the message cannot be serialized: 0.'));
	assert.ok(stderr.includes('The "message" argument must be one of type string'));
});

// EPIPE happens based on timing conditions, so we must repeat it until it happens
const findEpipeError = async () => {
	while (true) {
		// eslint-disable-next-line no-await-in-loop
		const error = await assertRejects(getEpipeError());
		if (error.cause?.code === 'EPIPE') {
			return error;
		}
	}
};

const getEpipeError = async () => {
	const subprocess = execa('delay.js', ['0'], {ipc: true});

	while (true) {
		// eslint-disable-next-line no-await-in-loop
		await subprocess.sendMessage('.');
	}
};

test('Can send messages while the subprocess is closing', async () => {
	const {message} = await findEpipeError();
	assert.equal(message, 'subprocess.sendMessage() cannot be used: the subprocess is disconnecting.');
});

test('subprocess.sendMessage() handles I/O errors', async () => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	const error = mockSendIoError(subprocess);
	assert.equal(await assertRejects(subprocess.sendMessage('.')), error);

	const {exitCode, isTerminated, message, ipcOutput} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(message.includes('Error: getOneMessage()'));
	assert.deepEqual(ipcOutput, []);
});

test('Does not hold message events on I/O errors', async () => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	const error = mockSendIoError(subprocess);
	const promise = subprocess.sendMessage('.');
	subprocess.nodeChildProcess.emit('message', '.');
	assert.equal(await assertRejects(promise), error);

	const {exitCode, isTerminated, message, ipcOutput} = await assertRejects(subprocess);
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(message.includes('Error: getOneMessage()'));
	assert.deepEqual(ipcOutput, ['.']);
});

test('exports.sendMessage() handles I/O errors', async () => {
	const {exitCode, isTerminated, message, ipcOutput} = await assertRejects(execa('ipc-send-io-error.js', {ipc: true}));
	assert.equal(exitCode, 1);
	assert.equal(isTerminated, false);
	assert.ok(message.includes(`Error: ${foobarString}`));
	assert.deepEqual(ipcOutput, []);
});
