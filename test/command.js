import {join} from 'node:path';
import test from 'ava';
import {execaCommand, execaCommandSync} from '../index.js';
import {setFixtureDir, FIXTURES_DIR} from './helpers/fixtures-dir.js';
import {QUOTE} from './helpers/verbose.js';

setFixtureDir();
const STDIN_FIXTURE = join(FIXTURES_DIR, 'stdin.js');

test('execaCommand()', async t => {
	const {stdout} = await execaCommand('echo.js foo bar');
	t.is(stdout, 'foo\nbar');
});

test('execaCommandSync()', t => {
	const {stdout} = execaCommandSync('echo.js foo bar');
	t.is(stdout, 'foo\nbar');
});

test('execaCommand`...`', async t => {
	const {stdout} = await execaCommand`${'echo.js foo bar'}`;
	t.is(stdout, 'foo\nbar');
});

test('execaCommandSync`...`', t => {
	const {stdout} = execaCommandSync`${'echo.js foo bar'}`;
	t.is(stdout, 'foo\nbar');
});

test('execaCommand(options)`...`', async t => {
	const {stdout} = await execaCommand({stripFinalNewline: false})`${'echo.js foo bar'}`;
	t.is(stdout, 'foo\nbar\n');
});

test('execaCommandSync(options)`...`', t => {
	const {stdout} = execaCommandSync({stripFinalNewline: false})`${'echo.js foo bar'}`;
	t.is(stdout, 'foo\nbar\n');
});

test('execaCommand(options)()', async t => {
	const {stdout} = await execaCommand({stripFinalNewline: false})('echo.js foo bar');
	t.is(stdout, 'foo\nbar\n');
});

test('execaCommandSync(options)()', t => {
	const {stdout} = execaCommandSync({stripFinalNewline: false})('echo.js foo bar');
	t.is(stdout, 'foo\nbar\n');
});

test('execaCommand().pipe(execaCommand())', async t => {
	const {stdout} = await execaCommand('echo.js foo bar').pipe(execaCommand(`node ${STDIN_FIXTURE}`));
	t.is(stdout, 'foo\nbar');
});

test('execaCommand().pipe(...) does not use execaCommand', async t => {
	const {escapedCommand} = await execaCommand('echo.js foo bar').pipe(`node ${STDIN_FIXTURE}`, {reject: false});
	t.true(escapedCommand.startsWith(`${QUOTE}node `));
});

test('execaCommand() bound options have lower priority', async t => {
	const {stdout} = await execaCommand({stripFinalNewline: false})('echo.js foo bar', {stripFinalNewline: true});
	t.is(stdout, 'foo\nbar');
});

test('execaCommandSync() bound options have lower priority', t => {
	const {stdout} = execaCommandSync({stripFinalNewline: false})('echo.js foo bar', {stripFinalNewline: true});
	t.is(stdout, 'foo\nbar');
});

test('execaCommand() ignores consecutive spaces', async t => {
	const {stdout} = await execaCommand('echo.js foo    bar');
	t.is(stdout, 'foo\nbar');
});

test('execaCommand() allows escaping spaces in commands', async t => {
	const {stdout} = await execaCommand('command\\ with\\ space.js foo bar');
	t.is(stdout, 'foo\nbar');
});

test('execaCommand() allows escaping spaces in arguments', async t => {
	const {stdout} = await execaCommand('echo.js foo\\ bar');
	t.is(stdout, 'foo bar');
});

test('execaCommand() escapes other whitespaces', async t => {
	const {stdout} = await execaCommand('echo.js foo\tbar');
	t.is(stdout, 'foo\tbar');
});

test('execaCommand() trims', async t => {
	const {stdout} = await execaCommand('  echo.js foo bar  ');
	t.is(stdout, 'foo\nbar');
});

const testInvalidArgsArray = (t, execaMethod) => {
	t.throws(() => {
		execaMethod('echo', ['foo']);
	}, {message: /The command and its arguments must be passed as a single string/});
};

test('execaCommand() must not pass an array of arguments', testInvalidArgsArray, execaCommand);
test('execaCommandSync() must not pass an array of arguments', testInvalidArgsArray, execaCommandSync);

const testInvalidArgsTemplate = (t, execaMethod) => {
	t.throws(() => {
		// eslint-disable-next-line no-unused-expressions
		execaMethod`echo foo`;
	}, {message: /The command and its arguments must be passed as a single string/});
};

test('execaCommand() must not pass an array of arguments with a template string', testInvalidArgsTemplate, execaCommand);
test('execaCommandSync() must not pass an array of arguments with a template string', testInvalidArgsTemplate, execaCommandSync);
