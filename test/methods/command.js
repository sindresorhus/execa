import path from 'node:path';
import test from 'ava';
import {
	execa,
	execaSync,
	$,
	execaNode,
	execaCommand,
	execaCommandSync,
	parseCommandString,
} from '../../index.js';
import {
	setFixtureDirectory,
	FIXTURES_DIRECTORY,
	FIXTURES_DIRECTORY_URL,
} from '../helpers/fixtures-directory.js';
import {QUOTE} from '../helpers/verbose.js';

setFixtureDirectory();
const STDIN_FIXTURE = path.join(FIXTURES_DIRECTORY, 'stdin.js');
const ECHO_FIXTURE_URL = new URL('echo.js', FIXTURES_DIRECTORY_URL);

const parseAndRunCommand = command => execa`${parseCommandString(command)}`;

test('execaCommand()', async t => {
	const {stdout} = await execaCommand('echo.js foo bar');
	t.is(stdout, 'foo\nbar');
});

test('parseCommandString() + execa()', async t => {
	const {stdout} = await execa('echo.js', parseCommandString('foo bar'));
	t.is(stdout, 'foo\nbar');
});

test('execaCommandSync()', t => {
	const {stdout} = execaCommandSync('echo.js foo bar');
	t.is(stdout, 'foo\nbar');
});

test('parseCommandString() + execaSync()', t => {
	const {stdout} = execaSync('echo.js', parseCommandString('foo bar'));
	t.is(stdout, 'foo\nbar');
});

test('execaCommand`...`', async t => {
	const {stdout} = await execaCommand`${'echo.js foo bar'}`;
	t.is(stdout, 'foo\nbar');
});

test('parseCommandString() + execa`...`', async t => {
	const {stdout} = await execa`${parseCommandString('echo.js foo bar')}`;
	t.is(stdout, 'foo\nbar');
});

test('parseCommandString() + execa`...`, only arguments', async t => {
	const {stdout} = await execa`echo.js ${parseCommandString('foo bar')}`;
	t.is(stdout, 'foo\nbar');
});

test('parseCommandString() + execa`...`, only some arguments', async t => {
	const {stdout} = await execa`echo.js ${'foo bar'} ${parseCommandString('foo bar')}`;
	t.is(stdout, 'foo bar\nfoo\nbar');
});

test('execaCommandSync`...`', t => {
	const {stdout} = execaCommandSync`${'echo.js foo bar'}`;
	t.is(stdout, 'foo\nbar');
});

test('parseCommandString() + execaSync`...`', t => {
	const {stdout} = execaSync`${parseCommandString('echo.js foo bar')}`;
	t.is(stdout, 'foo\nbar');
});

test('parseCommandString() + execaSync`...`, only arguments', t => {
	const {stdout} = execaSync`echo.js ${parseCommandString('foo bar')}`;
	t.is(stdout, 'foo\nbar');
});

test('parseCommandString() + execaSync`...`, only some arguments', t => {
	const {stdout} = execaSync`echo.js ${'foo bar'} ${parseCommandString('foo bar')}`;
	t.is(stdout, 'foo bar\nfoo\nbar');
});

test('parseCommandString() + $', async t => {
	const {stdout} = await $`${parseCommandString('echo.js foo bar')}`;
	t.is(stdout, 'foo\nbar');
});

test('parseCommandString() + $.sync', t => {
	const {stdout} = $.sync`${parseCommandString('echo.js foo bar')}`;
	t.is(stdout, 'foo\nbar');
});

test('parseCommandString() + execaNode', async t => {
	const {stdout} = await execaNode(ECHO_FIXTURE_URL, parseCommandString('foo bar'));
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

const testInvalidArgumentsArray = (t, execaMethod) => {
	t.throws(() => execaMethod('echo', ['foo']), {
		message: /The command and its arguments must be passed as a single string/,
	});
};

test('execaCommand() must not pass an array of arguments', testInvalidArgumentsArray, execaCommand);
test('execaCommandSync() must not pass an array of arguments', testInvalidArgumentsArray, execaCommandSync);

const testInvalidArgumentsTemplate = (t, execaMethod) => {
	t.throws(() => execaMethod`echo foo`, {
		message: /The command and its arguments must be passed as a single string/,
	});
};

test('execaCommand() must not pass an array of arguments with a template string', testInvalidArgumentsTemplate, execaCommand);
test('execaCommandSync() must not pass an array of arguments with a template string', testInvalidArgumentsTemplate, execaCommandSync);

const testInvalidArgumentsParse = (t, command) => {
	t.throws(() => parseCommandString(command), {
		message: /The command must be a string/,
	});
};

test('execaCommand() must not pass a number', testInvalidArgumentsParse, 0);
test('execaCommand() must not pass undefined', testInvalidArgumentsParse, undefined);
test('execaCommand() must not pass null', testInvalidArgumentsParse, null);
test('execaCommand() must not pass a symbol', testInvalidArgumentsParse, Symbol('test'));
test('execaCommand() must not pass an object', testInvalidArgumentsParse, {});
test('execaCommand() must not pass an array', testInvalidArgumentsParse, []);

const testExecaCommandOutput = async (t, command, expectedOutput, execaMethod) => {
	const {stdout} = await execaMethod(command);
	t.is(stdout, expectedOutput);
};

test('execaCommand() allows escaping spaces in commands', testExecaCommandOutput, 'command\\ with\\ space.js foo bar', 'foo\nbar', execaCommand);
test('execaCommand() trims', testExecaCommandOutput, '  echo.js foo bar  ', 'foo\nbar', execaCommand);
test('execaCommand() ignores consecutive spaces', testExecaCommandOutput, 'echo.js foo    bar', 'foo\nbar', execaCommand);
test('execaCommand() escapes other whitespaces', testExecaCommandOutput, 'echo.js foo\tbar', 'foo\tbar', execaCommand);
test('execaCommand() allows escaping spaces', testExecaCommandOutput, 'echo.js foo\\ bar', 'foo bar', execaCommand);
test('execaCommand() allows escaping backslashes before spaces', testExecaCommandOutput, 'echo.js foo\\\\ bar', 'foo\\ bar', execaCommand);
test('execaCommand() allows escaping multiple backslashes before spaces', testExecaCommandOutput, 'echo.js foo\\\\\\\\ bar', 'foo\\\\\\ bar', execaCommand);
test('execaCommand() allows escaping backslashes not before spaces', testExecaCommandOutput, 'echo.js foo\\bar baz', 'foo\\bar\nbaz', execaCommand);
test('parseCommandString() allows escaping spaces in commands', testExecaCommandOutput, 'command\\ with\\ space.js foo bar', 'foo\nbar', parseAndRunCommand);
test('parseCommandString() trims', testExecaCommandOutput, '  echo.js foo bar  ', 'foo\nbar', parseAndRunCommand);
test('parseCommandString() ignores consecutive spaces', testExecaCommandOutput, 'echo.js foo    bar', 'foo\nbar', parseAndRunCommand);
test('parseCommandString() escapes other whitespaces', testExecaCommandOutput, 'echo.js foo\tbar', 'foo\tbar', parseAndRunCommand);
test('parseCommandString() allows escaping spaces', testExecaCommandOutput, 'echo.js foo\\ bar', 'foo bar', parseAndRunCommand);
test('parseCommandString() allows escaping backslashes before spaces', testExecaCommandOutput, 'echo.js foo\\\\ bar', 'foo\\ bar', parseAndRunCommand);
test('parseCommandString() allows escaping multiple backslashes before spaces', testExecaCommandOutput, 'echo.js foo\\\\\\\\ bar', 'foo\\\\\\ bar', parseAndRunCommand);
test('parseCommandString() allows escaping backslashes not before spaces', testExecaCommandOutput, 'echo.js foo\\bar baz', 'foo\\bar\nbaz', parseAndRunCommand);

test('parseCommandString() can get empty strings', t => {
	t.deepEqual(parseCommandString(''), []);
});

test('parseCommandString() can get only whitespaces', t => {
	t.deepEqual(parseCommandString('   '), []);
});
