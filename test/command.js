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
