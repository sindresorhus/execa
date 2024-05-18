import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarArray} from '../helpers/input.js';

setFixtureDirectory();

const testResultIpc = async (t, options) => {
	const {ipc} = await execa('ipc-send-twice.js', {...options, ipc: true});
	t.deepEqual(ipc, foobarArray);
};

test('Sets result.ipc', testResultIpc, {});
test('Sets result.ipc, fd-specific buffer', testResultIpc, {buffer: {stdout: false}});

const testResultNoBuffer = async (t, options) => {
	const {ipc} = await execa('ipc-send.js', {...options, ipc: true});
	t.deepEqual(ipc, []);
};

test('Sets empty result.ipc if buffer is false', testResultNoBuffer, {buffer: false});
test('Sets empty result.ipc if buffer is false, fd-specific buffer', testResultNoBuffer, {buffer: {ipc: false}});

test('Sets empty result.ipc if ipc is false', async t => {
	const {ipc} = await execa('empty.js');
	t.deepEqual(ipc, []);
});

test('Sets empty result.ipc, sync', t => {
	const {ipc} = execaSync('empty.js');
	t.deepEqual(ipc, []);
});

const testErrorIpc = async (t, options) => {
	const {ipc} = await t.throwsAsync(execa('ipc-send-fail.js', {...options, ipc: true}));
	t.deepEqual(ipc, [foobarString]);
};

test('Sets error.ipc', testErrorIpc, {});
test('Sets error.ipc, fd-specific buffer', testErrorIpc, {buffer: {stdout: false}});

const testErrorNoBuffer = async (t, options) => {
	const {ipc} = await t.throwsAsync(execa('ipc-send-fail.js', {...options, ipc: true}));
	t.deepEqual(ipc, []);
};

test('Sets empty error.ipc if buffer is false', testErrorNoBuffer, {buffer: false});
test('Sets empty error.ipc if buffer is false, fd-specific buffer', testErrorNoBuffer, {buffer: {ipc: false}});

test('Sets empty error.ipc if ipc is false', async t => {
	const {ipc} = await t.throwsAsync(execa('fail.js'));
	t.deepEqual(ipc, []);
});

test('Sets empty error.ipc, sync', t => {
	const {ipc} = t.throws(() => execaSync('fail.js'));
	t.deepEqual(ipc, []);
});
