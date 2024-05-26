import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

const testKeepAliveSubprocess = async (t, fixtureName) => {
	const {timedOut} = await t.throwsAsync(execa(fixtureName, {ipc: true, timeout: 1e3}));
	t.true(timedOut);
};

test('exports.getOneMessage() keeps the subprocess alive', testKeepAliveSubprocess, 'ipc-echo.js');
test('exports.getEachMessage() keeps the subprocess alive', testKeepAliveSubprocess, 'ipc-iterate.js');

test('exports.sendMessage() keeps the subprocess alive', async t => {
	const {ipcOutput} = await execa('ipc-send-repeat.js', [`${PARALLEL_COUNT}`], {ipc: true});
	const expectedOutput = Array.from({length: PARALLEL_COUNT}, (_, index) => index);
	t.deepEqual(ipcOutput, expectedOutput);
});

test('process.send() keeps the subprocess alive', async t => {
	const {ipcOutput, stdout} = await execa('ipc-process-send.js', {ipc: true});
	t.deepEqual(ipcOutput, [foobarString]);
	t.is(stdout, '.');
});

test('process.send() keeps the subprocess alive, after getOneMessage()', async t => {
	const {ipcOutput, stdout} = await execa('ipc-process-send-get.js', {ipcInput: 0});
	t.deepEqual(ipcOutput, [foobarString]);
	t.is(stdout, '.');
});

test('process.send() keeps the subprocess alive, after sendMessage()', async t => {
	const {ipcOutput, stdout} = await execa('ipc-process-send-send.js', {ipc: true});
	t.deepEqual(ipcOutput, ['.', foobarString]);
	t.is(stdout, '.');
});

test('process.once("message") keeps the subprocess alive', async t => {
	const subprocess = execa('ipc-once-message.js', {ipc: true});
	t.is(await subprocess.getOneMessage(), '.');
	await subprocess.sendMessage(foobarString);

	const {ipcOutput, stdout} = await subprocess;
	t.deepEqual(ipcOutput, ['.']);
	t.is(stdout, foobarString);
});

test('process.once("message") keeps the subprocess alive, after sendMessage()', async t => {
	const subprocess = execa('ipc-once-message-send.js', {ipc: true});
	t.is(await subprocess.getOneMessage(), '.');
	await subprocess.sendMessage(foobarString);

	const {ipcOutput, stdout} = await subprocess;
	t.deepEqual(ipcOutput, ['.']);
	t.is(stdout, foobarString);
});

test('process.once("message") keeps the subprocess alive, after getOneMessage()', async t => {
	const subprocess = execa('ipc-once-message-get.js', {ipc: true});
	await subprocess.sendMessage('.');
	t.is(await subprocess.getOneMessage(), '.');
	await subprocess.sendMessage(foobarString);

	const {ipcOutput, stdout} = await subprocess;
	t.deepEqual(ipcOutput, ['.']);
	t.is(stdout, foobarString);
});

test('process.once("disconnect") keeps the subprocess alive', async t => {
	const subprocess = execa('ipc-once-disconnect.js', {ipc: true});
	t.is(await subprocess.getOneMessage(), '.');
	subprocess.disconnect();

	const {ipcOutput, stdout} = await subprocess;
	t.deepEqual(ipcOutput, ['.']);
	t.is(stdout, '.');
});

test('process.once("disconnect") keeps the subprocess alive, after sendMessage()', async t => {
	const subprocess = execa('ipc-once-disconnect-send.js', {ipc: true});
	t.is(await subprocess.getOneMessage(), '.');
	t.is(await subprocess.getOneMessage(), '.');
	subprocess.disconnect();

	const {ipcOutput, stdout} = await subprocess;
	t.deepEqual(ipcOutput, ['.', '.']);
	t.is(stdout, '.');
});

test('process.once("disconnect") does not keep the subprocess alive, after getOneMessage()', async t => {
	const subprocess = execa('ipc-once-disconnect-get.js', {ipc: true});
	await subprocess.sendMessage('.');
	t.is(await subprocess.getOneMessage(), '.');
	subprocess.disconnect();

	const {ipcOutput, stdout} = await subprocess;
	t.deepEqual(ipcOutput, ['.']);
	t.is(stdout, '.');
});

test('Can call subprocess.disconnect() right away', async t => {
	const subprocess = execa('ipc-send.js', {ipc: true});
	subprocess.disconnect();
	t.is(subprocess.channel, null);

	await t.throwsAsync(subprocess.getOneMessage(), {
		message: /subprocess.getOneMessage\(\) could not complete/,
	});
	await t.throwsAsync(subprocess, {
		message: /Error: sendMessage\(\) cannot be used/,
	});
});

test('Can call process.disconnect() right away', async t => {
	const {stdout, stderr} = await t.throwsAsync(execa('ipc-disconnect-get.js', {ipc: true}));
	t.is(stdout, 'null');
	t.true(stderr.includes('Error: getOneMessage() cannot be used'));
});
