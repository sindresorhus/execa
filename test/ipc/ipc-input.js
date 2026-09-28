import assert from 'node:assert/strict';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const testSuccess = async options => {
	const {ipcOutput} = await execa('ipc-echo.js', {ipcInput: foobarString, ...options});
	assert.deepEqual(ipcOutput, [foobarString]);
};

test('Sends a message with the "ipcInput" option, ipc undefined', () => testSuccess({}));
test('Sends a message with the "ipcInput" option, ipc true', () => testSuccess({ipc: true}));

test('Cannot use the "ipcInput" option with "ipc" false', () => {
	assertThrows(() => {
		execa('empty.js', {ipcInput: foobarString, ipc: false});
	}, {message: /unless the `ipc` option is `true`/});
});

// Any value can be sent over IPC, including falsy ones, so those must be reported as `ipcInput`, not as `ipc`
const testInvalidSyncIpcInput = ipcInput => {
	assertThrows(() => {
		execaSync('empty.js', {ipcInput});
	}, {message: /The "ipcInput" option cannot be used with synchronous/});
};

test('Cannot use the "ipcInput" option with execaSync()', () => testInvalidSyncIpcInput(foobarString));
test('Cannot use the "ipcInput" option with execaSync(), 0', () => testInvalidSyncIpcInput(0));
test('Cannot use the "ipcInput" option with execaSync(), empty string', () => testInvalidSyncIpcInput(''));
test('Cannot use the "ipcInput" option with execaSync(), false', () => testInvalidSyncIpcInput(false));
test('Cannot use the "ipcInput" option with execaSync(), null', () => testInvalidSyncIpcInput(null));

test('Invalid "ipcInput" option v8 format', () => {
	const {message, cause} = assertThrows(() => {
		execa('empty.js', {ipcInput() {}});
	});
	assert.equal(message, 'The `ipcInput` option is not serializable with a structured clone.');
	assert.equal(cause.message, 'ipcInput() {} could not be cloned.');
});

test('Invalid "ipcInput" option JSON format', () => {
	const {message, cause} = assertThrows(() => {
		execa('empty.js', {ipcInput: 0n, serialization: 'json'});
	});
	assert.equal(message, 'The `ipcInput` option is not serializable with JSON.');
	assert.equal(cause.message, 'Do not know how to serialize a BigInt');
});

// `JSON.stringify()` returns `undefined`, instead of throwing, for values it cannot represent
const testUnrepresentableJson = ipcInput => {
	const {message} = assertThrows(() => {
		execa('empty.js', {ipcInput, serialization: 'json', ipc: true});
	});
	assert.equal(message, 'The `ipcInput` option is not serializable with JSON.');
};

test('Invalid "ipcInput" option JSON format, function', () => testUnrepresentableJson(() => {}));
test('Invalid "ipcInput" option JSON format, symbol', () => testUnrepresentableJson(Symbol('test')));

// An invalid `serialization` option must not crash the `ipcInput` validation, which is keyed by it.
// `Object.prototype` properties are the trickiest values, since those are found on any object.
const testInvalidSerialization = async serialization => {
	const {code} = await assertRejects(execa('empty.js', {ipcInput: foobarString, serialization}));
	assert.equal(code, 'ERR_INVALID_ARG_VALUE');
};

test('Invalid "serialization" option with the "ipcInput" option', () => testInvalidSerialization('invalid'));
test('Invalid "serialization" option with the "ipcInput" option, __proto__', () => testInvalidSerialization('__proto__'));
test('Invalid "serialization" option with the "ipcInput" option, toString', () => testInvalidSerialization('toString'));
test('Invalid "serialization" option with the "ipcInput" option, constructor', () => testInvalidSerialization('constructor'));

test('Handles "ipcInput" option during sending', async () => {
	const {message, cause} = await assertRejects(execa('empty.js', {ipcInput: 0n}));
	assert.ok(message.includes('subprocess.sendMessage()\'s argument type is invalid: the message cannot be serialized: 0.'));
	assert.ok(cause.cause.message.includes('The "message" argument must be one of type string'));
});

test('Can use "ipcInput" option even if the subprocess is not listening to messages', async () => {
	const {ipcOutput} = await execa('empty.js', {ipcInput: foobarString});
	assert.deepEqual(ipcOutput, []);
});
