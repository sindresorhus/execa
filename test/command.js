import path from 'path';
import test from 'ava';
import execa from '..';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

const command = async (t, expected, ...args) => {
	const {command: failCommand} = await t.throwsAsync(execa('fail', args));
	t.is(failCommand, `fail${expected}`);

	const {command} = await execa('noop', args);
	t.is(command, `noop${expected}`);
};

command.title = (message, expected) => `command is: ${JSON.stringify(expected)}`;

test(command, ' foo bar', 'foo', 'bar');
test(command, ' baz quz', 'baz', 'quz');
test(command, '');

const testEscapedCommand = async (t, expected, args) => {
	const {escapedCommand: failEscapedCommand} = await t.throwsAsync(execa('fail', args));
	t.is(failEscapedCommand, `fail ${expected}`);

	const {escapedCommand: failEscapedCommandSync} = t.throws(() => {
		execa.sync('fail', args);
	});
	t.is(failEscapedCommandSync, `fail ${expected}`);

	const {escapedCommand} = await execa('noop', args);
	t.is(escapedCommand, `noop ${expected}`);

	const {escapedCommand: escapedCommandSync} = execa.sync('noop', args);
	t.is(escapedCommandSync, `noop ${expected}`);
};

testEscapedCommand.title = (message, expected) => `escapedCommand is: ${JSON.stringify(expected)}`;

test(testEscapedCommand, 'foo bar', ['foo', 'bar']);
test(testEscapedCommand, '"foo bar"', ['foo bar']);
test(testEscapedCommand, '"\\"foo\\""', ['"foo"']);
test(testEscapedCommand, '"*"', ['*']);

test('allow commands with spaces and no array arguments', async t => {
	const {stdout} = await execa('command with space');
	t.is(stdout, '');
});

test('allow commands with spaces and array arguments', async t => {
	const {stdout} = await execa('command with space', ['foo', 'bar']);
	t.is(stdout, 'foo\nbar');
});

test('execa.command()', async t => {
	const {stdout} = await execa.command('node test/fixtures/echo foo bar');
	t.is(stdout, 'foo\nbar');
});

test('execa.command() ignores consecutive spaces', async t => {
	const {stdout} = await execa.command('node test/fixtures/echo foo    bar');
	t.is(stdout, 'foo\nbar');
});

test('execa.command() allows escaping spaces in commands', async t => {
	const {stdout} = await execa.command('command\\ with\\ space foo bar');
	t.is(stdout, 'foo\nbar');
});

test('execa.command() allows escaping spaces in arguments', async t => {
	const {stdout} = await execa.command('node test/fixtures/echo foo\\ bar');
	t.is(stdout, 'foo bar');
});

test('execa.command() escapes other whitespaces', async t => {
	const {stdout} = await execa.command('node test/fixtures/echo foo\tbar');
	t.is(stdout, 'foo\tbar');
});

test('execa.command() trims', async t => {
	const {stdout} = await execa.command('  node test/fixtures/echo foo bar  ');
	t.is(stdout, 'foo\nbar');
});

test('execa.command.sync()', t => {
	const {stdout} = execa.commandSync('node test/fixtures/echo foo bar');
	t.is(stdout, 'foo\nbar');
});
