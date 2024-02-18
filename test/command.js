import test from 'ava';
import {execaCommand, execaCommandSync} from '../index.js';
import {setFixtureDir} from './helpers/fixtures-dir.js';

setFixtureDir();

test('execaCommand()', async t => {
	const {stdout} = await execaCommand('echo.js foo bar');
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

test('execaCommandSync()', t => {
	const {stdout} = execaCommandSync('echo.js foo bar');
	t.is(stdout, 'foo\nbar');
});

const testInvalidCommand = (t, execaCommand, invalidArgument) => {
	t.throws(() => {
		execaCommand(invalidArgument);
	}, {message: /First argument must be a string/});
};

test('execaCommand() must use a string', testInvalidCommand, execaCommand, true);
test('execaCommandSync() must use a string', testInvalidCommand, execaCommandSync, true);
test('execaCommand() must have an argument', testInvalidCommand, execaCommand, undefined);
test('execaCommandSync() must have an argument', testInvalidCommand, execaCommandSync, undefined);

const testInvalidArgs = (t, execaCommand) => {
	t.throws(() => {
		execaCommand('echo', ['']);
	}, {message: /Last argument must be an options object/});
};

test('execaCommand() must not pass an array of arguments', testInvalidArgs, execaCommand);
test('execaCommandSync() must not pass an array of arguments', testInvalidArgs, execaCommandSync);
