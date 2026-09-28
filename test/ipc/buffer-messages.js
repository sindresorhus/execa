import assert from 'node:assert/strict';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';
import {fullStdio} from '../helpers/stdio.js';

setFixtureDirectory();

const testResultIpc = async options => {
	const {ipcOutput} = await execa('ipc-send-twice.js', {...options, ipc: true});
	assert.deepEqual(ipcOutput, foobarArray);
};

test('Sets result.ipcOutput', () => testResultIpc({}));
test('Sets result.ipcOutput, fd-specific buffer', () => testResultIpc({buffer: {stdout: false}}));

const testResultNoBuffer = async options => {
	const {ipcOutput} = await execa('ipc-send.js', {...options, ipc: true});
	assert.deepEqual(ipcOutput, []);
};

test('Sets empty result.ipcOutput if buffer is false', () => testResultNoBuffer({buffer: false}));
test('Sets empty result.ipcOutput if buffer is false, fd-specific buffer', () => testResultNoBuffer({buffer: {ipc: false}}));

test('buffer.fd3 is invalid without stdio[3], even with ipc', () => {
	const {message} = assertThrows(() => {
		execa('ipc-send-twice.js', {ipc: true, buffer: {fd3: false}});
	});
	assert.ok(message.includes('"buffer.fd3" is invalid: that file descriptor does not exist.'));
});

test('buffer.fd3 does not affect result.ipcOutput', async () => {
	const {ipcOutput} = await execa('ipc-send-twice.js', {ipc: true, buffer: {fd3: false}, ...fullStdio});
	assert.deepEqual(ipcOutput, foobarArray);
});

test('Can use IPC methods when buffer is false', async () => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer: false});
	assert.equal(await subprocess.getOneMessage(), foobarString);
	const {ipcOutput} = await subprocess;
	assert.deepEqual(ipcOutput, []);
});

test('Sets empty result.ipcOutput if ipc is false', async () => {
	const {ipcOutput} = await execa('empty.js');
	assert.deepEqual(ipcOutput, []);
});

test('Sets empty result.ipcOutput, sync', () => {
	const {ipcOutput} = execaSync('empty.js');
	assert.deepEqual(ipcOutput, []);
});

const testErrorIpc = async options => {
	const {ipcOutput} = await assertRejects(execa('ipc-send-fail.js', {...options, ipc: true}));
	assert.deepEqual(ipcOutput, [foobarString]);
};

test('Sets error.ipcOutput', () => testErrorIpc({}));
test('Sets error.ipcOutput, fd-specific buffer', () => testErrorIpc({buffer: {stdout: false}}));

const testErrorNoBuffer = async options => {
	const {ipcOutput} = await assertRejects(execa('ipc-send-fail.js', {...options, ipc: true}));
	assert.deepEqual(ipcOutput, []);
};

test('Sets empty error.ipcOutput if buffer is false', () => testErrorNoBuffer({buffer: false}));
test('Sets empty error.ipcOutput if buffer is false, fd-specific buffer', () => testErrorNoBuffer({buffer: {ipc: false}}));

test('Sets empty error.ipcOutput if ipc is false', async () => {
	const {ipcOutput} = await assertRejects(execa('fail.js'));
	assert.deepEqual(ipcOutput, []);
});

test('Sets empty error.ipcOutput, sync', () => {
	const {ipcOutput} = assertThrows(() => execaSync('fail.js'));
	assert.deepEqual(ipcOutput, []);
});

test('Can retrieve initial IPC messages under heavy load', async () => {
	await Promise.all(Array.from({length: PARALLEL_COUNT}, async (_, index) => {
		const {ipcOutput} = await execa('ipc-send-argv.js', [`${index}`], {ipc: true});
		assert.deepEqual(ipcOutput, [`${index}`]);
	}));
});
