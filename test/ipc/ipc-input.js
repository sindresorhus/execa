import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const testSuccess = async (t, options) => {
	const {ipcOutput} = await execa('ipc-echo.js', {ipcInput: foobarString, ...options});
	t.deepEqual(ipcOutput, [foobarString]);
};

test('Sends a message with the "ipcInput" option, ipc undefined', testSuccess, {});
test('Sends a message with the "ipcInput" option, ipc true', testSuccess, {ipc: true});

test('Cannot use the "ipcInput" option with "ipc" false', t => {
	t.throws(() => {
		execa('empty.js', {ipcInput: foobarString, ipc: false});
	}, {message: /unless the `ipc` option is `true`/});
});

test('Cannot use the "ipcInput" option with execaSync()', t => {
	t.throws(() => {
		execaSync('empty.js', {ipcInput: foobarString});
	}, {message: /The "ipcInput" option cannot be used with synchronous/});
});

test('Invalid "ipcInput" option v8 format', t => {
	const {message, cause} = t.throws(() => {
		execa('empty.js', {ipcInput() {}});
	});
	t.is(message, 'The `ipcInput` option is not serializable with a structured clone.');
	t.is(cause.message, 'ipcInput() {} could not be cloned.');
});

test('Invalid "ipcInput" option JSON format', t => {
	const {message, cause} = t.throws(() => {
		execa('empty.js', {ipcInput: 0n, serialization: 'json'});
	});
	t.is(message, 'The `ipcInput` option is not serializable with JSON.');
	t.is(cause.message, 'Do not know how to serialize a BigInt');
});

test('Handles "ipcInput" option during sending', async t => {
	const {message, cause} = await t.throwsAsync(execa('empty.js', {ipcInput: 0n}));
	t.true(message.includes('subprocess.sendMessage()\'s argument type is invalid: the message cannot be serialized: 0.'));
	t.true(cause.cause.message.includes('The "message" argument must be one of type string'));
});
