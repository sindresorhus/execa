import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

test('Can exchange IPC messages', async t => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess;
});

test.serial('Can exchange IPC messages under heavy load', async t => {
	await Promise.all(
		Array.from({length: PARALLEL_COUNT}, async (_, index) => {
			const subprocess = execa('ipc-echo.js', {ipc: true});
			await subprocess.sendMessage(index);
			t.is(await subprocess.getOneMessage(), index);
			await subprocess;
		}),
	);
});

test('The "serialization" option defaults to "advanced"', async t => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	await subprocess.sendMessage([0n]);
	const message = await subprocess.getOneMessage();
	t.is(message[0], 0n);
	await subprocess;
});

test('Can use "serialization: json" option', async t => {
	const subprocess = execa('ipc-echo.js', {ipc: true, serialization: 'json'});
	const date = new Date();
	await subprocess.sendMessage(date);
	t.is(await subprocess.getOneMessage(), date.toJSON());
	await subprocess;
});

test('Validates JSON payload with serialization: "json"', async t => {
	const subprocess = execa('ipc-echo.js', {ipc: true, serialization: 'json'});
	await t.throwsAsync(subprocess.sendMessage([0n]), {message: /serialize a BigInt/});
	await t.throwsAsync(subprocess);
});

const BIG_PAYLOAD_SIZE = '.'.repeat(1e6);

test('Handles backpressure', async t => {
	const subprocess = execa('ipc-iterate.js', {ipc: true});
	await subprocess.sendMessage(BIG_PAYLOAD_SIZE);
	t.true(subprocess.send(foobarString));
	t.is(await subprocess.getOneMessage(), BIG_PAYLOAD_SIZE);
	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [BIG_PAYLOAD_SIZE]);
});

test('Disconnects IPC on exports.sendMessage() error', async t => {
	const subprocess = execa('ipc-get-send-get.js', ['false'], {ipc: true});
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);

	const {message} = await t.throwsAsync(subprocess.sendMessage(0n));
	t.true(message.includes('subprocess.sendMessage()\'s argument type is invalid'));

	const {exitCode, isTerminated, stderr} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(stderr.includes('Error: getOneMessage() could not complete'));
});

test('Disconnects IPC on subprocess.sendMessage() error', async t => {
	const subprocess = execa('ipc-send-error.js', {ipc: true});
	const ipcError = await t.throwsAsync(subprocess.getOneMessage());
	t.true(ipcError.message.includes('subprocess.getOneMessage() could not complete'));

	const {exitCode, isTerminated, stderr} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(stderr.includes('sendMessage()\'s argument type is invalid'));
});

// EPIPE happens based on timing conditions, so we must repeat it until it happens
const findEpipeError = async t => {
	// eslint-disable-next-line no-constant-condition
	while (true) {
		// eslint-disable-next-line no-await-in-loop
		const error = await t.throwsAsync(getEpipeError());
		if (error.cause?.code === 'EPIPE') {
			return error;
		}
	}
};

const getEpipeError = async () => {
	const subprocess = execa('empty.js', {ipc: true});
	// eslint-disable-next-line no-constant-condition
	while (true) {
		// eslint-disable-next-line no-await-in-loop
		await subprocess.sendMessage('.');
	}
};

test.serial('Can send messages while the subprocess is closing', async t => {
	const {message} = await findEpipeError(t);
	t.is(message, 'subprocess.sendMessage() cannot be used: the subprocess is disconnecting.');
});
