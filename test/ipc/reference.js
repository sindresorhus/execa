import assert from 'node:assert/strict';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

const testReference = async fixtureName => {
	const {timedOut} = await assertRejects(execa(fixtureName, {ipc: true, timeout: 1e3}));
	assert.equal(timedOut, true);
};

test('exports.getOneMessage() keeps the subprocess alive', () => testReference('ipc-get-ref.js'));
test('exports.getEachMessage() keeps the subprocess alive', () => testReference('ipc-iterate-ref.js'));

const testUnreference = async fixtureName => {
	const {ipcOutput} = await execa(fixtureName, {ipc: true});
	assert.deepEqual(ipcOutput, []);
};

test('exports.getOneMessage() does not keep the subprocess alive, reference false', () => testUnreference('ipc-get-unref.js'));
test('exports.getEachMessage() does not keep the subprocess alive, reference false', () => testUnreference('ipc-iterate-unref.js'));

test('exports.sendMessage() keeps the subprocess alive', async () => {
	const {ipcOutput} = await execa('ipc-send-repeat.js', [`${PARALLEL_COUNT}`], {ipc: true});
	const expectedOutput = Array.from({length: PARALLEL_COUNT}, (_, index) => index);
	assert.deepEqual(ipcOutput, expectedOutput);
});

test('process.send() keeps the subprocess alive', async () => {
	const {ipcOutput, stdout} = await execa('ipc-process-send.js', {ipc: true});
	assert.deepEqual(ipcOutput, [foobarString]);
	assert.equal(stdout, '.');
});

test('process.send() keeps the subprocess alive, after getOneMessage()', async () => {
	const {ipcOutput, stdout} = await execa('ipc-process-send-get.js', {ipcInput: 0});
	assert.deepEqual(ipcOutput, [foobarString]);
	assert.equal(stdout, '.');
});

test('process.send() keeps the subprocess alive, after sendMessage()', async () => {
	const {ipcOutput, stdout} = await execa('ipc-process-send-send.js', {ipc: true});
	assert.deepEqual(ipcOutput, ['.', foobarString]);
	assert.equal(stdout, '.');
});

test('process.once("message") keeps the subprocess alive', async () => {
	const subprocess = execa('ipc-once-message.js', {ipc: true});
	assert.equal(await subprocess.getOneMessage(), '.');
	await subprocess.sendMessage(foobarString);

	const {ipcOutput, stdout} = await subprocess;
	assert.deepEqual(ipcOutput, ['.']);
	assert.equal(stdout, foobarString);
});

test('process.once("message") keeps the subprocess alive, after sendMessage()', async () => {
	const subprocess = execa('ipc-once-message-send.js', {ipc: true});
	assert.equal(await subprocess.getOneMessage(), '.');
	await subprocess.sendMessage(foobarString);

	const {ipcOutput, stdout} = await subprocess;
	assert.deepEqual(ipcOutput, ['.']);
	assert.equal(stdout, foobarString);
});

test('process.once("message") keeps the subprocess alive, after getOneMessage()', async () => {
	const subprocess = execa('ipc-once-message-get.js', {ipc: true});
	await subprocess.sendMessage('.');
	assert.equal(await subprocess.getOneMessage(), '.');
	await subprocess.sendMessage(foobarString);

	const {ipcOutput, stdout} = await subprocess;
	assert.deepEqual(ipcOutput, ['.']);
	assert.equal(stdout, foobarString);
});

test('process.once("disconnect") keeps the subprocess alive', async () => {
	const subprocess = execa('ipc-once-disconnect.js', {ipc: true});
	assert.equal(await subprocess.getOneMessage(), '.');
	subprocess.nodeChildProcess.disconnect();

	const {ipcOutput, stdout} = await subprocess;
	assert.deepEqual(ipcOutput, ['.']);
	assert.equal(stdout, '.');
});

test('process.once("disconnect") keeps the subprocess alive, after sendMessage()', async () => {
	const subprocess = execa('ipc-once-disconnect-send.js', {ipc: true});
	assert.equal(await subprocess.getOneMessage(), '.');
	// eslint-disable-next-line node-test/no-duplicate-assertions -- the same message is read twice on purpose
	assert.equal(await subprocess.getOneMessage(), '.');
	subprocess.nodeChildProcess.disconnect();

	const {ipcOutput, stdout} = await subprocess;
	assert.deepEqual(ipcOutput, ['.', '.']);
	assert.equal(stdout, '.');
});

test('process.once("disconnect") does not keep the subprocess alive, after getOneMessage()', async () => {
	const subprocess = execa('ipc-once-disconnect-get.js', {ipc: true});
	await subprocess.sendMessage('.');
	assert.equal(await subprocess.getOneMessage(), '.');
	subprocess.nodeChildProcess.disconnect();

	const {ipcOutput, stdout} = await subprocess;
	assert.deepEqual(ipcOutput, ['.']);
	assert.equal(stdout, '.');
});

test('Can call subprocess.disconnect() right away', async () => {
	const subprocess = execa('ipc-send.js', {ipc: true});
	subprocess.nodeChildProcess.disconnect();
	assert.equal(subprocess.nodeChildProcess.channel, null);

	await assertRejects(subprocess.getOneMessage(), {
		message: /subprocess.getOneMessage\(\) could not complete/,
	});
	await assertRejects(subprocess, {
		message: /Error: sendMessage\(\) cannot be used/,
	});
});

test('Can call process.disconnect() right away', async () => {
	const {stdout, stderr} = await assertRejects(execa('ipc-disconnect-get.js', {ipc: true}));
	assert.equal(stdout, 'null');
	assert.ok(stderr.includes('Error: getOneMessage() cannot be used'));
});
