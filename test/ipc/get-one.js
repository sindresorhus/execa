import {once} from 'node:events';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

test('subprocess.getOneMessage() keeps the subprocess alive', async t => {
	const subprocess = execa('ipc-echo-twice.js', {ipc: true});
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess;
});

test('Buffers initial message to subprocess', async t => {
	const subprocess = execa('ipc-echo-wait.js', {ipc: true});
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess;
});

test('Buffers initial message to current process', async t => {
	const subprocess = execa('ipc-send-print.js', {ipc: true});
	const [chunk] = await once(subprocess.stdout, 'data');
	t.is(chunk.toString(), '.');
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage('.');
	await subprocess;
});

const HIGH_CONCURRENCY_COUNT = 100;

test.serial('Can retrieve initial IPC messages under heavy load', async t => {
	await Promise.all(
		Array.from({length: HIGH_CONCURRENCY_COUNT}, async (_, index) => {
			const subprocess = execa('ipc-send-argv.js', [`${index}`], {ipc: true});
			t.is(await subprocess.getOneMessage(), `${index}`);
			await subprocess;
		}),
	);
});

test('subprocess.getOneMessage() can be called twice at the same time', async t => {
	const subprocess = execa('ipc-send.js', {ipc: true});
	t.deepEqual(
		await Promise.all([subprocess.getOneMessage(), subprocess.getOneMessage()]),
		[foobarString, foobarString],
	);
	await subprocess;
});

test('Cleans up subprocess.getOneMessage() listeners', async t => {
	const subprocess = execa('ipc-send.js', {ipc: true});

	t.is(subprocess.listenerCount('message'), 0);
	t.is(subprocess.listenerCount('disconnect'), 0);

	const promise = subprocess.getOneMessage();
	t.is(subprocess.listenerCount('message'), 1);
	t.is(subprocess.listenerCount('disconnect'), 0);
	t.is(await promise, foobarString);

	t.is(subprocess.listenerCount('message'), 0);
	t.is(subprocess.listenerCount('disconnect'), 0);

	await subprocess;
});

test('"error" event interrupts subprocess.getOneMessage()', async t => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	await subprocess.sendMessage(foobarString);
	const cause = new Error(foobarString);
	t.is(await t.throwsAsync(Promise.all([subprocess.getOneMessage(), subprocess.emit('error', cause)])), cause);
	t.like(await t.throwsAsync(subprocess), {cause});
});

const testSubprocessError = async (t, fixtureName) => {
	const subprocess = execa(fixtureName, {ipc: true});
	t.like(await subprocess.getOneMessage(), {message: 'foobar'});
	await subprocess;
};

test('"error" event interrupts exports.getOneMessage()', testSubprocessError, 'ipc-process-error.js');
test('"error" event interrupts exports.getEachMessage()', testSubprocessError, 'ipc-iterate-error.js');
