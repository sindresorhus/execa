import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import test from 'ava';
import * as execa from '../index.js';

process.env.PATH = fileURLToPath(new URL('./fixtures', import.meta.url)) + path.delimiter + process.env.PATH;

const command = async (t, expected, ...args) => {
	const {command: failCommand} = await t.throwsAsync(execa.execa('fail.js', args));
	t.is(failCommand, `fail.js${expected}`);

	const {command} = await execa.execa('noop.js', args);
	t.is(command, `noop.js${expected}`);
};

command.title = (message, expected) => `command is: ${JSON.stringify(expected)}`;

test(command, ' foo bar', 'foo', 'bar');
test(command, ' baz quz', 'baz', 'quz');
test(command, '');

const testEscapedCommand = async (t, expected, args) => {
	const {escapedCommand: failEscapedCommand} = await t.throwsAsync(execa.execa('fail.js', args));
	t.is(failEscapedCommand, `fail.js ${expected}`);

	const {escapedCommand: failEscapedCommandSync} = t.throws(() => {
		execa.execaSync('fail.js', args);
	});
	t.is(failEscapedCommandSync, `fail.js ${expected}`);

	const {escapedCommand} = await execa.execa('noop.js', args);
	t.is(escapedCommand, `noop.js ${expected}`);

	const {escapedCommand: escapedCommandSync} = execa.execaSync('noop.js', args);
	t.is(escapedCommandSync, `noop.js ${expected}`);
};

testEscapedCommand.title = (message, expected) => `escapedCommand is: ${JSON.stringify(expected)}`;

test(testEscapedCommand, 'foo bar', ['foo', 'bar']);
test(testEscapedCommand, '"foo bar"', ['foo bar']);
test(testEscapedCommand, '"\\"foo\\""', ['"foo"']);
test(testEscapedCommand, '"*"', ['*']);

test('allow commands with spaces and no array arguments', async t => {
	const {stdout} = await execa.execa('command with space.js');
	t.is(stdout, '');
});

test('allow commands with spaces and array arguments', async t => {
	const {stdout} = await execa.execa('command with space.js', ['foo', 'bar']);
	t.is(stdout, 'foo\nbar');
});

test('execa.command()', async t => {
	const {stdout} = await execa.command('node test/fixtures/echo.js foo bar');
	t.is(stdout, 'foo\nbar');
});

test('execa.command() ignores consecutive spaces', async t => {
	const {stdout} = await execa.command('node test/fixtures/echo.js foo    bar');
	t.is(stdout, 'foo\nbar');
});

test('execa.command() allows escaping spaces in commands', async t => {
	const {stdout} = await execa.command('command\\ with\\ space.js foo bar');
	t.is(stdout, 'foo\nbar');
});

test('execa.command() allows escaping spaces in arguments', async t => {
	const {stdout} = await execa.command('node test/fixtures/echo.js foo\\ bar');
	t.is(stdout, 'foo bar');
});

test('execa.command() escapes other whitespaces', async t => {
	const {stdout} = await execa.command('node test/fixtures/echo.js foo\tbar');
	t.is(stdout, 'foo\tbar');
});

test('execa.command() trims', async t => {
	const {stdout} = await execa.command('  node test/fixtures/echo.js foo bar  ');
	t.is(stdout, 'foo\nbar');
});

test('execa.commandSync()', t => {
	const {stdout} = execa.commandSync('node test/fixtures/echo.js foo bar');
	t.is(stdout, 'foo\nbar');
});
