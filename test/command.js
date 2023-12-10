import {inspect} from 'node:util';
import test from 'ava';
import {isStream} from 'is-stream';
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

test('$', async t => {
	const {stdout} = await $`echo.js foo bar`;
	t.is(stdout, 'foo\nbar');
});

test('$ accepts options', async t => {
	const {stdout} = await $({stripFinalNewline: true})`noop.js foo`;
	t.is(stdout, 'foo');
});

test('$ allows string interpolation', async t => {
	const {stdout} = await $`echo.js foo ${'bar'}`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows number interpolation', async t => {
	const {stdout} = await $`echo.js 1 ${2}`;
	t.is(stdout, '1\n2');
});

test('$ allows array interpolation', async t => {
	const {stdout} = await $`echo.js ${['foo', 'bar']}`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows empty array interpolation', async t => {
	const {stdout} = await $`echo.js foo ${[]} bar`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows execa return value interpolation', async t => {
	const foo = await $`echo.js foo`;
	const {stdout} = await $`echo.js ${foo} bar`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows execa return value array interpolation', async t => {
	const foo = await $`echo.js foo`;
	const {stdout} = await $`echo.js ${[foo, 'bar']}`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows execa return value buffer interpolation', async t => {
	const foo = await $({encoding: null})`echo.js foo`;
	const {stdout} = await $`echo.js ${foo} bar`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows execa return value buffer array interpolation', async t => {
	const foo = await $({encoding: null})`echo.js foo`;
	const {stdout} = await $`echo.js ${[foo, 'bar']}`;
	t.is(stdout, 'foo\nbar');
});

test('$ ignores consecutive spaces', async t => {
	const {stdout} = await $`echo.js foo    bar`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows escaping spaces with interpolation', async t => {
	const {stdout} = await $`echo.js ${'foo bar'}`;
	t.is(stdout, 'foo bar');
});

test('$ disallows escaping spaces with backslashes', async t => {
	const {stdout} = await $`echo.js foo\\ bar`;
	t.is(stdout, 'foo\\\nbar');
});

test('$ allows space escaped values in array interpolation', async t => {
	const {stdout} = await $`echo.js ${['foo', 'bar baz']}`;
	t.is(stdout, 'foo\nbar baz');
});

test('$ passes newline escape sequence as one argument', async t => {
	const {stdout} = await $`echo.js \n`;
	t.is(stdout, '\n');
});

test('$ passes newline escape sequence in interpolation as one argument', async t => {
	const {stdout} = await $`echo.js ${'\n'}`;
	t.is(stdout, '\n');
});

test('$ handles invalid escape sequence', async t => {
	const {stdout} = await $`echo.js \u`;
	t.is(stdout, '\\u');
});

test('$ can concatenate at the end of tokens', async t => {
	const {stdout} = await $`echo.js foo${'bar'}`;
	t.is(stdout, 'foobar');
});

test('$ does not concatenate at the end of tokens with a space', async t => {
	const {stdout} = await $`echo.js foo ${'bar'}`;
	t.is(stdout, 'foo\nbar');
});

test('$ can concatenate at the end of tokens followed by an array', async t => {
	const {stdout} = await $`echo.js foo${['bar', 'foo']}`;
	t.is(stdout, 'foobar\nfoo');
});

test('$ can concatenate at the start of tokens', async t => {
	const {stdout} = await $`echo.js ${'foo'}bar`;
	t.is(stdout, 'foobar');
});

test('$ does not concatenate at the start of tokens with a space', async t => {
	const {stdout} = await $`echo.js ${'foo'} bar`;
	t.is(stdout, 'foo\nbar');
});

test('$ can concatenate at the start of tokens followed by an array', async t => {
	const {stdout} = await $`echo.js ${['foo', 'bar']}foo`;
	t.is(stdout, 'foo\nbarfoo');
});

test('$ can concatenate at the start and end of tokens followed by an array', async t => {
	const {stdout} = await $`echo.js foo${['bar', 'foo']}bar`;
	t.is(stdout, 'foobar\nfoobar');
});

test('$ can concatenate multiple tokens', async t => {
	const {stdout} = await $`echo.js ${'foo'}bar${'foo'}`;
	t.is(stdout, 'foobarfoo');
});

test('$ allows escaping spaces in commands with interpolation', async t => {
	const {stdout} = await $`${'command with space.js'} foo bar`;
	t.is(stdout, 'foo\nbar');
});

test('$ escapes other whitespaces', async t => {
	const {stdout} = await $`echo.js foo\tbar`;
	t.is(stdout, 'foo\tbar');
});

test('$ trims', async t => {
	const {stdout} = await $`  echo.js foo bar  `;
	t.is(stdout, 'foo\nbar');
});

test('$.sync', t => {
	const {stdout} = $.sync`echo.js foo bar`;
	t.is(stdout, 'foo\nbar');
});

test('$.sync can be called $.s', t => {
	const {stdout} = $.s`echo.js foo bar`;
	t.is(stdout, 'foo\nbar');
});

test('$.sync accepts options', t => {
	const {stdout} = $({stripFinalNewline: true}).sync`noop.js foo`;
	t.is(stdout, 'foo');
});

test('$.sync must be used after options binding, not before', t => {
	t.throws(() => $.sync({})`noop.js`, {message: /Please use/});
});

test('$.sync allows execa return value interpolation', t => {
	const foo = $.sync`echo.js foo`;
	const {stdout} = $.sync`echo.js ${foo} bar`;
	t.is(stdout, 'foo\nbar');
});

test('$.sync allows execa return value array interpolation', t => {
	const foo = $.sync`echo.js foo`;
	const {stdout} = $.sync`echo.js ${[foo, 'bar']}`;
	t.is(stdout, 'foo\nbar');
});

test('$.sync allows execa return value buffer interpolation', t => {
	const foo = $({encoding: null}).sync`echo.js foo`;
	const {stdout} = $.sync`echo.js ${foo} bar`;
	t.is(stdout, 'foo\nbar');
});

test('$.sync allows execa return value buffer array interpolation', t => {
	const foo = $({encoding: null}).sync`echo.js foo`;
	const {stdout} = $.sync`echo.js ${[foo, 'bar']}`;
	t.is(stdout, 'foo\nbar');
});

const invalidExpression = test.macro({
	async exec(t, input, expected) {
		await t.throwsAsync(
			async () => $`echo.js ${input}`,
			{instanceOf: TypeError, message: expected},
		);

		t.throws(
			() => $.sync`echo.js ${input}`,
			{instanceOf: TypeError, message: expected},
		);
	},
	title(prettyInput, input, expected) {
		return `$ APIs throw on invalid '${prettyInput ?? inspect(input)}' expression with '${expected}'`;
	},
});

test(invalidExpression, undefined, 'Unexpected "undefined" in template expression');
test(invalidExpression, [undefined], 'Unexpected "undefined" in template expression');

test(invalidExpression, null, 'Unexpected "object" in template expression');
test(invalidExpression, [null], 'Unexpected "object" in template expression');

test(invalidExpression, true, 'Unexpected "boolean" in template expression');
test(invalidExpression, [true], 'Unexpected "boolean" in template expression');

test(invalidExpression, {}, 'Unexpected "object" in template expression');
test(invalidExpression, [{}], 'Unexpected "object" in template expression');

test(invalidExpression, {foo: 'bar'}, 'Unexpected "object" in template expression');
test(invalidExpression, [{foo: 'bar'}], 'Unexpected "object" in template expression');

test(invalidExpression, {stdout: undefined}, 'Unexpected "undefined" stdout in template expression');
test(invalidExpression, [{stdout: undefined}], 'Unexpected "undefined" stdout in template expression');

test(invalidExpression, {stdout: 1}, 'Unexpected "number" stdout in template expression');
test(invalidExpression, [{stdout: 1}], 'Unexpected "number" stdout in template expression');

test(invalidExpression, Promise.resolve(), 'Unexpected "object" in template expression');
test(invalidExpression, [Promise.resolve()], 'Unexpected "object" in template expression');

test(invalidExpression, Promise.resolve({stdout: 'foo'}), 'Unexpected "object" in template expression');
test(invalidExpression, [Promise.resolve({stdout: 'foo'})], 'Unexpected "object" in template expression');

test('$`noop.js`', invalidExpression, $`noop.js`, 'Unexpected "object" in template expression');
test('[ $`noop.js` ]', invalidExpression, [$`noop.js`], 'Unexpected "object" in template expression');

test('$({stdio: \'inherit\'}).sync`noop.js`', invalidExpression, $({stdio: 'inherit'}).sync`noop.js`, 'Unexpected "undefined" stdout in template expression');
test('[ $({stdio: \'inherit\'}).sync`noop.js` ]', invalidExpression, [$({stdio: 'inherit'}).sync`noop.js`], 'Unexpected "undefined" stdout in template expression');

test('$ stdin defaults to "inherit"', async t => {
	const {stdout} = await $({input: 'foo'})`stdin-script.js`;
	t.is(stdout, 'foo');
});

test('$.sync stdin defaults to "inherit"', t => {
	const {stdout} = $({input: 'foo'}).sync`stdin-script.js`;
	t.is(stdout, 'foo');
});

test('$ stdin has no default value when stdio is set', t => {
	t.true(isStream($({stdio: 'pipe'})`noop.js`.stdin));
});
