import {on} from 'node:events';
import {inspect} from 'node:util';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarRed, foobarObject} from '../helpers/input.js';
import {nestedSubprocess, nestedInstance} from '../helpers/nested.js';
import {fullStdio} from '../helpers/stdio.js';
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
	const {stderr} = await nestedSubprocess('ipc-send.js', {ipc: true, verbose});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * ${foobarString}`);
};

test('Prints IPC, verbose "full"', testPrintIpc, 'full');
test('Prints IPC, verbose "full", fd-specific', testPrintIpc, ipcFullOption);

test('verbose.fd3 is invalid without stdio[3], even with ipc', t => {
	const {message} = t.throws(() => {
		execa('ipc-send.js', {ipc: true, verbose: {fd3: 'full'}});
	});
	t.true(message.includes('"verbose.fd3" is invalid: that file descriptor does not exist.'));
});

test('verbose.fd3 does not affect IPC', async t => {
	const {nestedResult, stderr} = await nestedSubprocess('ipc-send.js', {ipc: true, verbose: {fd3: 'full'}, ...fullStdio});
	t.deepEqual(nestedResult.ipcOutput, [foobarString]);
	t.is(getIpcLine(stderr), undefined);
});

const testNoPrintIpc = async (t, verbose) => {
	const {stderr} = await nestedSubprocess('ipc-send.js', {ipc: true, verbose});
	t.is(getIpcLine(stderr), undefined);
};

test('Does not print IPC, verbose default', testNoPrintIpc, undefined);
test('Does not print IPC, verbose "none"', testNoPrintIpc, 'none');
test('Does not print IPC, verbose "short"', testNoPrintIpc, 'short');
test('Does not print IPC, verbose default, fd-specific', testNoPrintIpc, {});
test('Does not print IPC, verbose "none", fd-specific', testNoPrintIpc, ipcNoneOption);
test('Does not print IPC, verbose "short", fd-specific', testNoPrintIpc, ipcShortOption);

const testNoIpc = async (t, ipc) => {
	const {nestedResult, stderr} = await nestedSubprocess('ipc-send.js', {ipc, verbose: 'full'});
	t.true(nestedResult instanceof Error);
	t.true(nestedResult.message.includes('sendMessage() can only be used'));
	t.is(getIpcLine(stderr), undefined);
};

test('Does not print IPC, ipc: false', testNoIpc, false);
test('Does not print IPC, ipc: default', testNoIpc, undefined);

test('Prints objects from IPC', async t => {
	const {stderr} = await nestedSubprocess('ipc-send-json.js', [JSON.stringify(foobarObject)], {ipc: true, verbose: 'full'});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * ${inspect(foobarObject)}`);
});

test('Prints multiline arrays from IPC', async t => {
	const bigArray = Array.from({length: 100}, (_, index) => index);
	const {stderr} = await nestedSubprocess('ipc-send-json.js', [JSON.stringify(bigArray)], {ipc: true, verbose: 'full'});
	const ipcLines = getIpcLines(stderr);
	t.is(ipcLines[0], `${testTimestamp} [0] * [`);
	t.is(ipcLines.at(-2), `${testTimestamp} [0] *   96, 97, 98, 99`);
	t.is(ipcLines.at(-1), `${testTimestamp} [0] * ]`);
});

test('Does not quote spaces from IPC', async t => {
	const {stderr} = await nestedSubprocess('ipc-send.js', ['foo bar'], {ipc: true, verbose: 'full'});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * foo bar`);
});

test('Does not quote newlines from IPC', async t => {
	const {stderr} = await nestedSubprocess('ipc-send.js', ['foo\nbar'], {ipc: true, verbose: 'full'});
	t.deepEqual(getIpcLines(stderr), [
		`${testTimestamp} [0] * foo`,
		`${testTimestamp} [0] * bar`,
	]);
});

test('Does not quote special punctuation from IPC', async t => {
	const {stderr} = await nestedSubprocess('ipc-send.js', ['%'], {ipc: true, verbose: 'full'});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * %`);
});

test('Does not escape internal characters from IPC', async t => {
	const {stderr} = await nestedSubprocess('ipc-send.js', ['ã'], {ipc: true, verbose: 'full'});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * ã`);
});

test('Strips color sequences from IPC', async t => {
	const {stderr} = await nestedSubprocess('ipc-send.js', [foobarRed], {ipc: true, verbose: 'full'});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * ${foobarString}`);
});

test('Escapes control characters from IPC', async t => {
	const {stderr} = await nestedSubprocess('ipc-send.js', ['\u{1}'], {ipc: true, verbose: 'full'});
	t.is(getIpcLine(stderr), `${testTimestamp} [0] * \\u0001`);
});

test('Prints IPC progressively', async t => {
	t.plan(2);

	const subprocess = nestedInstance('ipc-send-forever.js', {ipc: true, verbose: 'full'});
	for await (const chunk of on(subprocess.stderr, 'data')) {
		const ipcLine = getIpcLine(chunk.toString());
		if (ipcLine !== undefined) {
			// eslint-disable-next-line ava/no-conditional-assertion -- `t.plan()` ensures this always executes
			t.is(ipcLine, `${testTimestamp} [0] * ${foobarString}`);
			break;
		}
	}

	subprocess.kill();
	await t.throwsAsync(subprocess);
});
