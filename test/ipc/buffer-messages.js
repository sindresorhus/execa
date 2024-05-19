import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

const testResultIpc = async (t, options) => {
	const {ipcOutput} = await execa('ipc-send-twice.js', {...options, ipc: true});
	t.deepEqual(ipcOutput, foobarArray);
};

test('Sets result.ipcOutput', testResultIpc, {});
test('Sets result.ipcOutput, fd-specific buffer', testResultIpc, {buffer: {stdout: false}});

const testResultNoBuffer = async (t, options) => {
	const {ipcOutput} = await execa('ipc-send.js', {...options, ipc: true});
	t.deepEqual(ipcOutput, []);
};

test('Sets empty result.ipcOutput if buffer is false', testResultNoBuffer, {buffer: false});
test('Sets empty result.ipcOutput if buffer is false, fd-specific buffer', testResultNoBuffer, {buffer: {ipc: false}});

test('Can use IPC methods when buffer is false', async t => {
	const subprocess = execa('ipc-send.js', {ipc: true, buffer: false});
	t.is(await subprocess.getOneMessage(), foobarString);
	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, []);
});

test('Sets empty result.ipcOutput if ipc is false', async t => {
	const {ipcOutput} = await execa('empty.js');
	t.deepEqual(ipcOutput, []);
});

test('Sets empty result.ipcOutput, sync', t => {
	const {ipcOutput} = execaSync('empty.js');
	t.deepEqual(ipcOutput, []);
});

const testErrorIpc = async (t, options) => {
	const {ipcOutput} = await t.throwsAsync(execa('ipc-send-fail.js', {...options, ipc: true}));
	t.deepEqual(ipcOutput, [foobarString]);
};

test('Sets error.ipcOutput', testErrorIpc, {});
test('Sets error.ipcOutput, fd-specific buffer', testErrorIpc, {buffer: {stdout: false}});

const testErrorNoBuffer = async (t, options) => {
	const {ipcOutput} = await t.throwsAsync(execa('ipc-send-fail.js', {...options, ipc: true}));
	t.deepEqual(ipcOutput, []);
};

test('Sets empty error.ipcOutput if buffer is false', testErrorNoBuffer, {buffer: false});
test('Sets empty error.ipcOutput if buffer is false, fd-specific buffer', testErrorNoBuffer, {buffer: {ipc: false}});

test('Sets empty error.ipcOutput if ipc is false', async t => {
	const {ipcOutput} = await t.throwsAsync(execa('fail.js'));
	t.deepEqual(ipcOutput, []);
});

test('Sets empty error.ipcOutput, sync', t => {
	const {ipcOutput} = t.throws(() => execaSync('fail.js'));
	t.deepEqual(ipcOutput, []);
});

test.serial('Can retrieve initial IPC messages under heavy load', async t => {
	await Promise.all(
		Array.from({length: PARALLEL_COUNT}, async (_, index) => {
			const {ipcOutput} = await execa('ipc-send-argv.js', [`${index}`], {ipc: true});
			t.deepEqual(ipcOutput, [`${index}`]);
		}),
	);
});
