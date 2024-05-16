import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

test('Can exchange IPC messages', async t => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess;
});

const HIGH_CONCURRENCY_COUNT = 100;

test.serial('Can exchange IPC messages under heavy load', async t => {
	await Promise.all(
		Array.from({length: HIGH_CONCURRENCY_COUNT}, async (_, index) => {
			const subprocess = execa('ipc-echo.js', {ipc: true});
			await subprocess.sendMessage(index);
			t.is(await subprocess.getOneMessage(), index);
			await subprocess;
		}),
	);
});

test('Can use "serialization: json" option', async t => {
	const subprocess = execa('ipc-echo.js', {ipc: true, serialization: 'json'});
	const date = new Date();
	await subprocess.sendMessage(date);
	t.is(await subprocess.getOneMessage(), date.toJSON());
	await subprocess;
});

const BIG_PAYLOAD_SIZE = '.'.repeat(1e6);

test('Handles backpressure', async t => {
	const subprocess = execa('ipc-iterate.js', {ipc: true});
	await subprocess.sendMessage(BIG_PAYLOAD_SIZE);
	t.true(subprocess.send(foobarString));
	const {stdout} = await subprocess;
	t.is(stdout, BIG_PAYLOAD_SIZE);
});
