import assert from 'node:assert/strict';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {fullStdio, getStdio} from '../helpers/stdio.js';
import {foobarString, foobarObject, foobarObjectInspect} from '../helpers/input.js';
import {QUOTE} from '../helpers/verbose.js';
import {noopGenerator, outputObjectGenerator} from '../helpers/generator.js';

setFixtureDirectory();

test('error.message contains the command', async () => {
	await assertRejects(execa('exit.js', ['2', 'foo', 'bar']), {message: /exit.js 2 foo bar/});
});

const testStdioMessage = async (encoding, all, objectMode, execaMethod) => {
	const {exitCode, message} = await execaMethod('echo-fail.js', {
		...getStdio(1, noopGenerator(objectMode, false, true), 4),
		encoding,
		all,
		reject: false,
	});
	assert.equal(exitCode, 1);
	const output = all ? 'stdout\nstderr' : 'stderr\n\nstdout';
	assert.ok(message.endsWith(`echo-fail.js\n\n${output}\n\nfd3`));
};

test('error.message contains stdout/stderr/stdio if available', () => testStdioMessage('utf8', false, false, execa));
test('error.message contains stdout/stderr/stdio even with encoding "buffer"', () => testStdioMessage('buffer', false, false, execa));
test('error.message contains all if available', () => testStdioMessage('utf8', true, false, execa));
test('error.message contains all even with encoding "buffer"', () => testStdioMessage('buffer', true, false, execa));
test('error.message contains stdout/stderr/stdio if available, objectMode', () => testStdioMessage('utf8', false, true, execa));
test('error.message contains stdout/stderr/stdio even with encoding "buffer", objectMode', () => testStdioMessage('buffer', false, true, execa));
test('error.message contains all if available, objectMode', () => testStdioMessage('utf8', true, true, execa));
test('error.message contains all even with encoding "buffer", objectMode', () => testStdioMessage('buffer', true, true, execa));
test('error.message contains stdout/stderr/stdio if available, sync', () => testStdioMessage('utf8', false, false, execaSync));
test('error.message contains stdout/stderr/stdio even with encoding "buffer", sync', () => testStdioMessage('buffer', false, false, execaSync));
test('error.message contains all if available, sync', () => testStdioMessage('utf8', true, false, execaSync));
test('error.message contains all even with encoding "buffer", sync', () => testStdioMessage('buffer', true, false, execaSync));
test('error.message contains stdout/stderr/stdio if available, objectMode, sync', () => testStdioMessage('utf8', false, true, execaSync));
test('error.message contains stdout/stderr/stdio even with encoding "buffer", objectMode, sync', () => testStdioMessage('buffer', false, true, execaSync));
test('error.message contains all if available, objectMode, sync', () => testStdioMessage('utf8', true, true, execaSync));
test('error.message contains all even with encoding "buffer", objectMode, sync', () => testStdioMessage('buffer', true, true, execaSync));

const testLinesMessage = async (encoding, stripFinalNewline, execaMethod) => {
	const {failed, message} = await execaMethod('noop-fail.js', ['1', `${foobarString}\n${foobarString}\n`], {
		lines: true,
		encoding,
		stripFinalNewline,
		reject: false,
	});
	assert.equal(failed, true);
	assert.ok(message.endsWith(`noop-fail.js 1 ${QUOTE}${foobarString}\\n${foobarString}\\n${QUOTE}\n\n${foobarString}\n${foobarString}`));
};

test('error.message handles "lines: true"', () => testLinesMessage('utf8', false, execa));
test('error.message handles "lines: true", stripFinalNewline', () => testLinesMessage('utf8', true, execa));
test('error.message handles "lines: true", buffer', () => testLinesMessage('buffer', false, execa));
test('error.message handles "lines: true", buffer, stripFinalNewline', () => testLinesMessage('buffer', true, execa));
test('error.message handles "lines: true", sync', () => testLinesMessage('utf8', false, execaSync));
test('error.message handles "lines: true", stripFinalNewline, sync', () => testLinesMessage('utf8', true, execaSync));
test('error.message handles "lines: true", buffer, sync', () => testLinesMessage('buffer', false, execaSync));
test('error.message handles "lines: true", buffer, stripFinalNewline, sync', () => testLinesMessage('buffer', true, execaSync));

const testPartialIgnoreMessage = async (fdNumber, stdioOption, output) => {
	const {message} = await assertRejects(execa('echo-fail.js', getStdio(fdNumber, stdioOption, 4)));
	assert.ok(message.endsWith(`echo-fail.js\n\n${output}\n\nfd3`));
};

test('error.message does not contain stdout if not available', () => testPartialIgnoreMessage(1, 'ignore', 'stderr'));
test('error.message does not contain stderr if not available', () => testPartialIgnoreMessage(2, 'ignore', 'stdout'));
test('error.message does not contain stdout if it is an object', () => testPartialIgnoreMessage(1, outputObjectGenerator(), 'stderr'));
test('error.message does not contain stderr if it is an object', () => testPartialIgnoreMessage(2, outputObjectGenerator(), 'stdout'));

const testFullIgnoreMessage = async (options, resultProperty) => {
	const result = await assertRejects(execa('echo-fail.js', options));
	const message = result[resultProperty];
	assert.ok(!message.includes('stderr'));
	assert.ok(!message.includes('stdout'));
	assert.ok(!message.includes('fd3'));
};

test('error.message does not contain stdout/stderr/stdio if not available', () => testFullIgnoreMessage({stdio: 'ignore'}, 'message'));
test('error.shortMessage does not contain stdout/stderr/stdio', () => testFullIgnoreMessage(fullStdio, 'shortMessage'));

const testErrorMessageConsistent = async stdout => {
	const {message} = await assertRejects(execa('noop-both-fail-strict.js', [stdout, 'stderr']));
	assert.ok(message.endsWith(' stderr\n\nstderr\n\nstdout'));
};

test('error.message newlines are consistent - no newline', () => testErrorMessageConsistent('stdout'));
test('error.message newlines are consistent - newline', () => testErrorMessageConsistent('stdout\n'));

test('Original error.message is kept', async () => {
	const {originalMessage} = await assertRejects(execa('noop.js', {windowsHide: 'true'}));
	assert.equal(originalMessage, 'The "options.windowsHide" property must be of type boolean. Received type string (\'true\')');
});

const testIpcOutput = async (doubles, ipcInput, returnedMessage) => {
	const fixtureName = doubles ? 'ipc-echo-twice-fail.js' : 'ipc-echo-fail.js';
	const {exitCode, message, ipcOutput} = await assertRejects(execa(fixtureName, {ipcInput}));
	assert.equal(exitCode, 1);
	assert.ok(message.endsWith(`\n\n${doubles ? `${returnedMessage}\n${returnedMessage}` : returnedMessage}`));
	assert.deepEqual(ipcOutput, doubles ? [ipcInput, ipcInput] : [ipcInput]);
};

test('error.message contains IPC messages, single string', () => testIpcOutput(false, foobarString, foobarString));
test('error.message contains IPC messages, two strings', () => testIpcOutput(true, foobarString, foobarString));
test('error.message contains IPC messages, single object', () => testIpcOutput(false, foobarObject, foobarObjectInspect));
test('error.message contains IPC messages, two objects', () => testIpcOutput(true, foobarObject, foobarObjectInspect));
test('error.message contains IPC messages, multiline string', () => testIpcOutput(false, `${foobarString}\n${foobarString}`, `${foobarString}\n${foobarString}`));
test('error.message contains IPC messages, control characters', () => testIpcOutput(false, '\0', '\\u0000'));

test('error.message does not contain IPC messages, buffer false', async () => {
	const {exitCode, message, ipcOutput} = await assertRejects(execa('ipc-echo-fail.js', {ipcInput: foobarString, buffer: false}));
	assert.equal(exitCode, 1);
	assert.ok(message.endsWith('ipc-echo-fail.js'));
	assert.deepEqual(ipcOutput, []);
});
