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
	const {message} = t.throws(() => {
		execa('empty.js', {ipcInput() {}});
	});
	t.is(message, 'The `ipcInput` option is not serializable with a structured clone.\nipcInput() {} could not be cloned.');
});

test('Invalid "ipcInput" option JSON format', t => {
	const {message} = t.throws(() => {
		execa('empty.js', {ipcInput: 0n, serialization: 'json'});
	});
	t.is(message, 'The `ipcInput` option is not serializable with JSON.\nDo not know how to serialize a BigInt');
});

test('Handles "ipcInput" option during sending', async t => {
	await t.throwsAsync(execa('empty.js', {ipcInput: 0n}), {
		message: /The "message" argument must be one of type string/,
	});
});
