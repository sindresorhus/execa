import assert from 'node:assert/strict';
import {on} from 'node:events';
import {inspect} from 'node:util';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
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

const testPrintIpc = async verbose => {
	const {stderr} = await nestedSubprocess('ipc-send.js', {ipc: true, verbose});
	assert.equal(getIpcLine(stderr), `${testTimestamp} [0] * ${foobarString}`);
};

test('Prints IPC, verbose "full"', () => testPrintIpc('full'));
test('Prints IPC, verbose "full", fd-specific', () => testPrintIpc(ipcFullOption));

test('verbose.fd3 is invalid without stdio[3], even with ipc', () => {
	const {message} = assertThrows(() => {
		execa('ipc-send.js', {ipc: true, verbose: {fd3: 'full'}});
	});
	assert.ok(message.includes('"verbose.fd3" is invalid: that file descriptor does not exist.'));
});

test('verbose.fd3 does not affect IPC', async () => {
	const {nestedResult, stderr} = await nestedSubprocess('ipc-send.js', {ipc: true, verbose: {fd3: 'full'}, ...fullStdio});
	assert.deepEqual(nestedResult.ipcOutput, [foobarString]);
	assert.equal(getIpcLine(stderr), undefined);
});

const testNoPrintIpc = async verbose => {
	const {stderr} = await nestedSubprocess('ipc-send.js', {ipc: true, verbose});
	assert.equal(getIpcLine(stderr), undefined);
};

test('Does not print IPC, verbose default', () => testNoPrintIpc(undefined));
test('Does not print IPC, verbose "none"', () => testNoPrintIpc('none'));
test('Does not print IPC, verbose "short"', () => testNoPrintIpc('short'));
test('Does not print IPC, verbose default, fd-specific', () => testNoPrintIpc({}));
test('Does not print IPC, verbose "none", fd-specific', () => testNoPrintIpc(ipcNoneOption));
test('Does not print IPC, verbose "short", fd-specific', () => testNoPrintIpc(ipcShortOption));

const testNoIpc = async ipc => {
	const {nestedResult, stderr} = await nestedSubprocess('ipc-send.js', {ipc, verbose: 'full'});
	assert.ok(nestedResult instanceof Error);
	assert.ok(nestedResult.message.includes('sendMessage() can only be used'));
	assert.equal(getIpcLine(stderr), undefined);
};

test('Does not print IPC, ipc: false', () => testNoIpc(false));
test('Does not print IPC, ipc: default', () => testNoIpc(undefined));

test('Prints objects from IPC', async () => {
	const {stderr} = await nestedSubprocess('ipc-send-json.js', [JSON.stringify(foobarObject)], {ipc: true, verbose: 'full'});
	assert.equal(getIpcLine(stderr), `${testTimestamp} [0] * ${inspect(foobarObject)}`);
});

test('Prints multiline arrays from IPC', async () => {
	const bigArray = Array.from({length: 100}, (_, index) => index);
	const {stderr} = await nestedSubprocess('ipc-send-json.js', [JSON.stringify(bigArray)], {ipc: true, verbose: 'full'});
	const ipcLines = getIpcLines(stderr);
	assert.equal(ipcLines[0], `${testTimestamp} [0] * [`);
	assert.equal(ipcLines.at(-2), `${testTimestamp} [0] *   96, 97, 98, 99`);
	assert.equal(ipcLines.at(-1), `${testTimestamp} [0] * ]`);
});

test('Does not quote spaces from IPC', async () => {
	const {stderr} = await nestedSubprocess('ipc-send.js', ['foo bar'], {ipc: true, verbose: 'full'});
	assert.equal(getIpcLine(stderr), `${testTimestamp} [0] * foo bar`);
});

test('Does not quote newlines from IPC', async () => {
	const {stderr} = await nestedSubprocess('ipc-send.js', ['foo\nbar'], {ipc: true, verbose: 'full'});
	assert.deepEqual(getIpcLines(stderr), [
		`${testTimestamp} [0] * foo`,
		`${testTimestamp} [0] * bar`,
	]);
});

test('Does not quote special punctuation from IPC', async () => {
	const {stderr} = await nestedSubprocess('ipc-send.js', ['%'], {ipc: true, verbose: 'full'});
	assert.equal(getIpcLine(stderr), `${testTimestamp} [0] * %`);
});

test('Does not escape internal characters from IPC', async () => {
	const {stderr} = await nestedSubprocess('ipc-send.js', ['ã'], {ipc: true, verbose: 'full'});
	assert.equal(getIpcLine(stderr), `${testTimestamp} [0] * ã`);
});

test('Strips color sequences from IPC', async () => {
	const {stderr} = await nestedSubprocess('ipc-send.js', [foobarRed], {ipc: true, verbose: 'full'});
	assert.equal(getIpcLine(stderr), `${testTimestamp} [0] * ${foobarString}`);
});

test('Escapes control characters from IPC', async () => {
	const {stderr} = await nestedSubprocess('ipc-send.js', ['\u{1}'], {ipc: true, verbose: 'full'});
	assert.equal(getIpcLine(stderr), `${testTimestamp} [0] * \\u0001`);
});

test('Prints IPC progressively', async () => {
	const subprocess = nestedInstance('ipc-send-forever.js', {ipc: true, verbose: 'full'});

	let ipcLine;
	for await (const chunk of on(subprocess.stderr, 'data')) {
		ipcLine = getIpcLine(chunk.toString());
		if (ipcLine !== undefined) {
			break;
		}
	}

	assert.equal(ipcLine, `${testTimestamp} [0] * ${foobarString}`);
	subprocess.kill();
	await assertRejects(subprocess);
});
