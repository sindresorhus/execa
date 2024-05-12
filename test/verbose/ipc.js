import {on} from 'node:events';
import {inspect} from 'node:util';
import test from 'ava';
import {red} from 'yoctocolors';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarObject} from '../helpers/input.js';
import {nestedExecaAsync, parentExecaAsync} from '../helpers/nested.js';
import {
	getIpcLine,
	getIpcLines,
	testTimestamp,
	ipcNoneOption,
	ipcShortOption,
	ipcFullOption,
} from '../helpers/verbose.js';

setFixtureDirectory();

const testPrintIpc = async (t, verbose) => {
	const {stderr} = await parentExecaAsync('ipc-send.js', {ipc: true, verbose});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * ${foobarString}`);
};

test('Prints IPC, verbose "full"', testPrintIpc, 'full');
test('Prints IPC, verbose "full", fd-specific', testPrintIpc, ipcFullOption);

const testNoPrintIpc = async (t, verbose) => {
	const {stderr} = await parentExecaAsync('ipc-send.js', {ipc: true, verbose});
	t.is(getIpcLine(stderr), undefined);
};

test('Does not print IPC, verbose default', testNoPrintIpc, undefined);
test('Does not print IPC, verbose "none"', testNoPrintIpc, 'none');
test('Does not print IPC, verbose "short"', testNoPrintIpc, 'short');
test('Does not print IPC, verbose default, fd-specific', testNoPrintIpc, {});
test('Does not print IPC, verbose "none", fd-specific', testNoPrintIpc, ipcNoneOption);
test('Does not print IPC, verbose "short", fd-specific', testNoPrintIpc, ipcShortOption);

const testNoIpc = async (t, ipc) => {
	const subprocess = nestedExecaAsync('ipc-send.js', {ipc, verbose: 'full'});
	await t.throwsAsync(subprocess, {message: /sendMessage\(\) can only be used/});
	const {stderr} = await subprocess.parent;
	t.is(getIpcLine(stderr), undefined);
};

test('Does not print IPC, ipc: false', testNoIpc, false);
test('Does not print IPC, ipc: default', testNoIpc, undefined);

test('Prints objects from IPC', async t => {
	const {stderr} = await parentExecaAsync('ipc-send-json.js', [JSON.stringify(foobarObject)], {ipc: true, verbose: 'full'});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * ${inspect(foobarObject)}`);
});

test('Prints multiline arrays from IPC', async t => {
	const bigArray = Array.from({length: 100}, (_, index) => index);
	const {stderr} = await parentExecaAsync('ipc-send-json.js', [JSON.stringify(bigArray)], {ipc: true, verbose: 'full'});
	const ipcLines = getIpcLines(stderr);
	t.is(ipcLines[0], `${testTimestamp} [0] * [`);
	t.is(ipcLines.at(-2), `${testTimestamp} [0] *   96, 97, 98, 99`);
	t.is(ipcLines.at(-1), `${testTimestamp} [0] * ]`);
});

test('Does not quote spaces from IPC', async t => {
	const {stderr} = await parentExecaAsync('ipc-send.js', ['foo bar'], {ipc: true, verbose: 'full'});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * foo bar`);
});

test('Does not quote newlines from IPC', async t => {
	const {stderr} = await parentExecaAsync('ipc-send.js', ['foo\nbar'], {ipc: true, verbose: 'full'});
	t.deepEqual(getIpcLines(stderr), [
		`${testTimestamp} [0] * foo`,
		`${testTimestamp} [0] * bar`,
	]);
});

test('Does not quote special punctuation from IPC', async t => {
	const {stderr} = await parentExecaAsync('ipc-send.js', ['%'], {ipc: true, verbose: 'full'});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * %`);
});

test('Does not escape internal characters from IPC', async t => {
	const {stderr} = await parentExecaAsync('ipc-send.js', ['ã'], {ipc: true, verbose: 'full'});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * ã`);
});

test('Strips color sequences from IPC', async t => {
	const {stderr} = await parentExecaAsync('ipc-send.js', [red(foobarString)], {ipc: true, verbose: 'full'}, {env: {FORCE_COLOR: '1'}});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * ${foobarString}`);
});

test('Escapes control characters from IPC', async t => {
	const {stderr} = await parentExecaAsync('ipc-send.js', ['\u0001'], {ipc: true, verbose: 'full'});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * \\u0001`);
});

test('Prints IPC progressively', async t => {
	const subprocess = parentExecaAsync('ipc-send-forever.js', {ipc: true, verbose: 'full'});
	for await (const chunk of on(subprocess.stderr, 'data')) {
		const ipcLine = getIpcLine(chunk.toString());
		if (ipcLine !== undefined) {
			t.is(ipcLine, `${testTimestamp} [0] * ${foobarString}`);
			break;
		}
	}

	subprocess.kill();
	await t.throwsAsync(subprocess);
});
