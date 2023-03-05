import test from 'ava';
import {execa, execaSync, execaCommand, execaCommandSync, $} from '../index.js';
import {setFixtureDir} from './helpers/fixtures-dir.js';

setFixtureDir();

const command = async (t, expected, ...args) => {
	const {command: failCommand} = await t.throwsAsync(execa('fail.js', args));
	t.is(failCommand, `fail.js${expected}`);

	const {command} = await execa('noop.js', args);
	t.is(command, `noop.js${expected}`);
};

command.title = (message, expected) => `command is: ${JSON.stringify(expected)}`;

test(command, ' foo bar', 'foo', 'bar');
test(command, ' baz quz', 'baz', 'quz');
test(command, '');

const testEscapedCommand = async (t, expected, args) => {
	const {escapedCommand: failEscapedCommand} = await t.throwsAsync(execa('fail.js', args));
	t.is(failEscapedCommand, `fail.js ${expected}`);

	const {escapedCommand: failEscapedCommandSync} = t.throws(() => {
		execaSync('fail.js', args);
	});
	t.is(failEscapedCommandSync, `fail.js ${expected}`);

	const {escapedCommand} = await execa('noop.js', args);
	t.is(escapedCommand, `noop.js ${expected}`);

	const {escapedCommand: escapedCommandSync} = execaSync('noop.js', args);
	t.is(escapedCommandSync, `noop.js ${expected}`);
};

testEscapedCommand.title = (message, expected) => `escapedCommand is: ${JSON.stringify(expected)}`;

test(testEscapedCommand, 'foo bar', ['foo', 'bar']);
test(testEscapedCommand, '"foo bar"', ['foo bar']);
test(testEscapedCommand, '"\\"foo\\""', ['"foo"']);
test(testEscapedCommand, '"*"', ['*']);

test('allow commands with spaces and no array arguments', async t => {
	const {stdout} = await execa('command with space.js');
	t.is(stdout, '');
});

test('allow commands with spaces and array arguments', async t => {
	const {stdout} = await execa('command with space.js', ['foo', 'bar']);
	t.is(stdout, 'foo\nbar');
});

test('execaCommand()', async t => {
	const {stdout} = await execaCommand('node test/fixtures/echo.js foo bar');
	t.is(stdout, 'foo\nbar');
});

test('execaCommand() ignores consecutive spaces', async t => {
	const {stdout} = await execaCommand('node test/fixtures/echo.js foo    bar');
	t.is(stdout, 'foo\nbar');
});

test('execaCommand() allows escaping spaces in commands', async t => {
	const {stdout} = await execaCommand('command\\ with\\ space.js foo bar');
	t.is(stdout, 'foo\nbar');
});

test('execaCommand() allows escaping spaces in arguments', async t => {
	const {stdout} = await execaCommand('node test/fixtures/echo.js foo\\ bar');
	t.is(stdout, 'foo bar');
});

test('execaCommand() escapes other whitespaces', async t => {
	const {stdout} = await execaCommand('node test/fixtures/echo.js foo\tbar');
	t.is(stdout, 'foo\tbar');
});

test('execaCommand() trims', async t => {
	const {stdout} = await execaCommand('  node test/fixtures/echo.js foo bar  ');
	t.is(stdout, 'foo\nbar');
});

test('execaCommandSync()', t => {
	const {stdout} = execaCommandSync('node test/fixtures/echo.js foo bar');
	t.is(stdout, 'foo\nbar');
});

test('$', async t => {
	const {stdout} = await $`node test/fixtures/echo.js foo bar`;
	t.is(stdout, 'foo\nbar');
});

test('$ accepts options', async t => {
	const {stdout} = await $({stripFinalNewline: true})`noop.js foo`;
	t.is(stdout, 'foo');
});

test('$ allows string interpolation', async t => {
	const {stdout} = await $`node test/fixtures/echo.js foo ${'bar'}`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows array interpolation', async t => {
	const {stdout} = await $`node test/fixtures/echo.js ${['foo', 'bar']}`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows execa return value interpolation', async t => {
	const foo = await $`node test/fixtures/echo.js foo`;
	const {stdout} = await $`node test/fixtures/echo.js ${foo} bar`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows execa return value array interpolation', async t => {
	const foo = await $`node test/fixtures/echo.js foo`;
	const {stdout} = await $`node test/fixtures/echo.js ${[foo, 'bar']}`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows execa return value buffer interpolation', async t => {
	const foo = await $({encoding: null})`node test/fixtures/echo.js foo`;
	const {stdout} = await $`node test/fixtures/echo.js ${foo} bar`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows execa return value buffer array interpolation', async t => {
	const foo = await $({encoding: null})`node test/fixtures/echo.js foo`;
	const {stdout} = await $`node test/fixtures/echo.js ${[foo, 'bar']}`;
	t.is(stdout, 'foo\nbar');
});

test('$ ignores consecutive spaces', async t => {
	const {stdout} = await $`node test/fixtures/echo.js foo    bar`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows escaping spaces with interpolation', async t => {
	const {stdout} = await $`node test/fixtures/echo.js ${'foo bar'}`;
	t.is(stdout, 'foo bar');
});

test('$ disallows escaping spaces with backslashes', async t => {
	const {stdout} = await $`node test/fixtures/echo.js foo\\ bar`;
	t.is(stdout, 'foo\\\nbar');
});

test('$ allows space escaped values in array interpolation', async t => {
	const {stdout} = await $`node test/fixtures/echo.js ${['foo', 'bar baz']}`;
	t.is(stdout, 'foo\nbar baz');
});

test('$ passes newline escape sequence as one argument', async t => {
	const {stdout} = await $`node test/fixtures/echo.js \n`;
	t.is(stdout, '\n');
});

test('$ passes newline escape sequence in interpolation as one argument', async t => {
	const {stdout} = await $`node test/fixtures/echo.js ${'\n'}`;
	t.is(stdout, '\n');
});

test('$ handles invalid escape sequence', async t => {
	const {stdout} = await $`node test/fixtures/echo.js \u`;
	t.is(stdout, '\\u');
});

test('$ throws on invalid expression in interpolation', async t => {
	const undefinedError = await t.throwsAsync(async () => $`node test/fixtures/echo.js ${undefined}`);
	t.is(undefinedError?.message, 'Unexpected "undefined" in template expression');

	const nullError = await t.throwsAsync(async () => $`node test/fixtures/echo.js ${null}`);
	t.is(nullError?.message, 'Unexpected "object" in template expression');

	const objectError = await t.throwsAsync(async () => $`node test/fixtures/echo.js ${{foo: 'bar'}}`);
	t.is(objectError?.message, 'Unexpected "object" in template expression');

	const promiseError = await t.throwsAsync(async () => $`node test/fixtures/echo.js ${Promise.resolve()}`);
	t.is(promiseError?.message, 'Unexpected "object" in template expression');

	const nonAwaited$ = await t.throwsAsync(async () => $`node test/fixtures/echo.js ${$`node test/fixtures/echo.js foo`}`);
	t.is(nonAwaited$?.message, 'Unexpected "object" in template expression');

	const stdioInheritError = await t.throwsAsync(async () =>
		$`node test/fixtures/echo.js ${await $({stdio: 'inherit'})`node test/fixtures/echo.js foo`}`,
	);
	t.is(stdioInheritError?.message, 'Unexpected "undefined" stdout in template expression');

	const stdoutError = await t.throwsAsync(async () => $`node test/fixtures/echo.js ${{stdout: true}}`);
	t.is(stdoutError?.message, 'Unexpected "boolean" stdout in template expression');
});

test('$ allows escaping spaces in commands with interpolation', async t => {
	const {stdout} = await $`${'command with space.js'} foo bar`;
	t.is(stdout, 'foo\nbar');
});

test('$ escapes other whitespaces', async t => {
	const {stdout} = await $`node test/fixtures/echo.js foo\tbar`;
	t.is(stdout, 'foo\tbar');
});

test('$ trims', async t => {
	const {stdout} = await $`  node test/fixtures/echo.js foo bar  `;
	t.is(stdout, 'foo\nbar');
});

test('$.sync', t => {
	const {stdout} = $.sync`node test/fixtures/echo.js foo bar`;
	t.is(stdout, 'foo\nbar');
});

test('$.sync accepts options', t => {
	const {stdout} = $({stripFinalNewline: true}).sync`noop.js foo`;
	t.is(stdout, 'foo');
});

test('$.sync allows execa return value interpolation', t => {
	const foo = $.sync`node test/fixtures/echo.js foo`;
	const {stdout} = $.sync`node test/fixtures/echo.js ${foo} bar`;
	t.is(stdout, 'foo\nbar');
});

test('$.sync allows execa return value array interpolation', t => {
	const foo = $.sync`node test/fixtures/echo.js foo`;
	const {stdout} = $.sync`node test/fixtures/echo.js ${[foo, 'bar']}`;
	t.is(stdout, 'foo\nbar');
});

test('$.sync allows execa return value buffer interpolation', t => {
	const foo = $({encoding: null}).sync`node test/fixtures/echo.js foo`;
	const {stdout} = $.sync`node test/fixtures/echo.js ${foo} bar`;
	t.is(stdout, 'foo\nbar');
});

test('$.sync allows execa return value buffer array interpolation', t => {
	const foo = $({encoding: null}).sync`node test/fixtures/echo.js foo`;
	const {stdout} = $.sync`node test/fixtures/echo.js ${[foo, 'bar']}`;
	t.is(stdout, 'foo\nbar');
});

test('$.sync throws on invalid expression in interpolation', async t => {
	const undefinedError = await t.throws(() => $.sync`node test/fixtures/echo.js ${undefined}`);
	t.is(undefinedError?.message, 'Unexpected "undefined" in template expression');

	const nullError = await t.throws(() => $.sync`node test/fixtures/echo.js ${null}`);
	t.is(nullError?.message, 'Unexpected "object" in template expression');

	const objectError = await t.throws(() => $.sync`node test/fixtures/echo.js ${{foo: 'bar'}}`);
	t.is(objectError?.message, 'Unexpected "object" in template expression');

	const promiseError = await t.throws(() => $.sync`node test/fixtures/echo.js ${Promise.resolve()}`);
	t.is(promiseError?.message, 'Unexpected "object" in template expression');

	const nonAwaited$ = await t.throws(() => $.sync`node test/fixtures/echo.js ${$`node test/fixtures/echo.js foo`}`);
	t.is(nonAwaited$?.message, 'Unexpected "object" in template expression');

	const stdioInheritError = await t.throws(() =>
		$.sync`node test/fixtures/echo.js ${$({stdio: 'inherit'}).sync`node test/fixtures/echo.js foo`}`,
	);
	t.is(stdioInheritError?.message, 'Unexpected "undefined" stdout in template expression');

	const stdoutError = await t.throws(() => $.sync`node test/fixtures/echo.js ${{stdout: true}}`);
	t.is(stdoutError?.message, 'Unexpected "boolean" stdout in template expression');
});

