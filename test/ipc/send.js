import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {subprocessSendGetOne, subprocessExchange} from '../helpers/ipc.js';

setFixtureDirectory();

const testExchange = async (t, exchangeMethod) => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	t.is(await exchangeMethod(subprocess, foobarString), foobarString);
	await subprocess;
};

test('Can exchange IPC messages', testExchange, subprocessSendGetOne);
test('Can exchange IPC messages, exchangeMessage()', testExchange, subprocessExchange);

const HIGH_CONCURRENCY_COUNT = 10;

const testHeavyLoad = async (t, exchangeMethod) => {
	await Promise.all(
		Array.from({length: HIGH_CONCURRENCY_COUNT}, async (_, index) => {
			const subprocess = execa('ipc-echo.js', {ipc: true});
			t.is(await exchangeMethod(subprocess, index), index);
			await subprocess;
		}),
	);
};

test.serial('Can exchange IPC messages under heavy load', testHeavyLoad, subprocessSendGetOne);
test.serial('Can exchange IPC messages under heavy load, exchangeMessage()', testHeavyLoad, subprocessExchange);

const testDefaultSerialization = async (t, exchangeMethod) => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	const message = await exchangeMethod(subprocess, [0n]);
	t.is(message[0], 0n);
	await subprocess;
};

test('The "serialization" option defaults to "advanced"', testDefaultSerialization, subprocessSendGetOne);
test('The "serialization" option defaults to "advanced", exchangeMessage()', testDefaultSerialization, subprocessExchange);

const testJsonSerialization = async (t, exchangeMethod) => {
	const subprocess = execa('ipc-echo.js', {ipc: true, serialization: 'json'});
	const date = new Date();
	t.is(await exchangeMethod(subprocess, date), date.toJSON());
	await subprocess;
};

test('Can use "serialization: json" option', testJsonSerialization, subprocessSendGetOne);
test('Can use "serialization: json" option, exchangeMessage()', testJsonSerialization, subprocessExchange);

const testJsonError = async (t, exchangeMethod) => {
	const subprocess = execa('ipc-echo.js', {ipc: true, serialization: 'json'});
	await t.throwsAsync(exchangeMethod(subprocess, [0n]), {message: /serialize a BigInt/});
	await t.throwsAsync(subprocess);
};

test('Validates JSON payload with serialization: "json"', testJsonError, subprocessSendGetOne);
test('Validates JSON payload with serialization: "json", exchangeMessage()', testJsonError, subprocessExchange);

const BIG_PAYLOAD_SIZE = '.'.repeat(1e6);

const testBackpressure = async (t, exchangeMethod) => {
	const subprocess = execa('ipc-iterate.js', {ipc: true});
	await exchangeMethod(subprocess, BIG_PAYLOAD_SIZE);
	t.true(subprocess.send(foobarString));
	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [BIG_PAYLOAD_SIZE]);
};

test('Handles backpressure', testBackpressure, subprocessSendGetOne);
test('Handles backpressure, exchangeMessage()', testBackpressure, subprocessExchange);

const testParentDisconnect = async (t, methodName) => {
	const subprocess = execa('ipc-echo-twice.js', {ipc: true});
	t.is(await subprocess.exchangeMessage(foobarString), foobarString);

	const {message} = await t.throwsAsync(subprocess[methodName](0n));
	t.true(message.includes(`subprocess.${methodName}()'s argument type is invalid`));

	const {exitCode, isTerminated, stderr} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(stderr.includes('Error: exchangeMessage() could not complete'));
};

test('Disconnects IPC on exports.sendMessage() error', testParentDisconnect, 'sendMessage');
test('Disconnects IPC on exports.exchangeMessage() error', testParentDisconnect, 'exchangeMessage');

const testSubprocessDisconnect = async (t, methodName, fixtureName) => {
	const subprocess = execa(fixtureName, {ipc: true});
	const ipcError = await t.throwsAsync(subprocess.getOneMessage());
	t.true(ipcError.message.includes('subprocess.getOneMessage() could not complete'));

	const {exitCode, isTerminated, stderr} = await t.throwsAsync(subprocess);
	t.is(exitCode, 1);
	t.false(isTerminated);
	t.true(stderr.includes(`${methodName}()'s argument type is invalid`));
};

test('Disconnects IPC on subprocess.sendMessage() error', testSubprocessDisconnect, 'sendMessage', 'ipc-send-error.js');
test('Disconnects IPC on subprocess.exchangeMessage() error', testSubprocessDisconnect, 'exchangeMessage', 'ipc-exchange-error.js');
