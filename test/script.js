import {spawn} from 'node:child_process';
import {inspect} from 'node:util';
import test from 'ava';
import {isStream} from 'is-stream';
import {$} from '../index.js';
import {setFixtureDir} from './helpers/fixtures-dir.js';
import {foobarString} from './helpers/input.js';

setFixtureDir();

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
	const foo = await $({encoding: 'buffer'})`echo.js foo`;
	const {stdout} = await $`echo.js ${foo} bar`;
	t.is(stdout, 'foo\nbar');
});

test('$ allows execa return value buffer array interpolation', async t => {
	const foo = await $({encoding: 'buffer'})`echo.js foo`;
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

test('$ must only use options or templates', t => {
	t.throws(() => $(true)`noop.js`, {message: /Please use either/});
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
	const foo = $({encoding: 'buffer'}).sync`echo.js foo`;
	const {stdout} = $.sync`echo.js ${foo} bar`;
	t.is(stdout, 'foo\nbar');
});

test('$.sync allows execa return value buffer array interpolation', t => {
	const foo = $({encoding: 'buffer'}).sync`echo.js foo`;
	const {stdout} = $.sync`echo.js ${[foo, 'bar']}`;
	t.is(stdout, 'foo\nbar');
});

test('$.sync must only templates', t => {
	t.throws(() => $.sync(true)`noop.js`, {message: /A template string must be used/});
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

test('$({stdio: \'ignore\'}).sync`noop.js`', invalidExpression, $({stdio: 'ignore'}).sync`noop.js`, 'Unexpected "undefined" stdout in template expression');
test('[ $({stdio: \'ignore\'}).sync`noop.js` ]', invalidExpression, [$({stdio: 'ignore'}).sync`noop.js`], 'Unexpected "undefined" stdout in template expression');

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

test('$.pipe(childProcess)', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe($({stdin: 'pipe'})`stdin.js`);
	t.is(stdout, foobarString);
});

test('$.pipe.pipe(childProcess)', async t => {
	const {stdout} = await $`noop.js ${foobarString}`
		.pipe($({stdin: 'pipe'})`stdin.js`)
		.pipe($({stdin: 'pipe'})`stdin.js`);
	t.is(stdout, foobarString);
});

test('$.pipe`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe.pipe`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`
		.pipe`stdin.js`
		.pipe`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe(childProcess, pipeOptions)', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}`.pipe($({stdin: 'pipe'})`stdin.js`, {from: 'stderr'});
	t.is(stdout, foobarString);
});

test('$.pipe.pipe(childProcess, pipeOptions)', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}`
		.pipe($({stdin: 'pipe'})`noop-stdin-fd.js 2`, {from: 'stderr'})
		.pipe($({stdin: 'pipe'})`stdin.js`, {from: 'stderr'});
	t.is(stdout, foobarString);
});

test('$.pipe(pipeOptions)`command`', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}`.pipe({from: 'stderr'})`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe.pipe(pipeOptions)`command`', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}`
		.pipe({from: 'stderr'})`noop-stdin-fd.js 2`
		.pipe({from: 'stderr'})`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe(options)`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe({stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe.pipe(options)`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`
		.pipe({})`stdin.js`
		.pipe({stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe(pipeAndProcessOptions)`command`', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}\n`.pipe({from: 'stderr', stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe.pipe(pipeAndProcessOptions)`command`', async t => {
	const {stdout} = await $`noop-fd.js 2 ${foobarString}\n`
		.pipe({from: 'stderr'})`noop-stdin-fd.js 2`
		.pipe({from: 'stderr', stripFinalNewline: false})`stdin.js`;
	t.is(stdout, `${foobarString}\n`);
});

test('$.pipe(options)(secondOptions)`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`.pipe({stripFinalNewline: false})({stripFinalNewline: true})`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe.pipe(options)(secondOptions)`command`', async t => {
	const {stdout} = await $`noop.js ${foobarString}`
		.pipe({})({})`stdin.js`
		.pipe({stripFinalNewline: false})({stripFinalNewline: true})`stdin.js`;
	t.is(stdout, foobarString);
});

test('$.pipe(options)(childProcess) fails', t => {
	t.throws(() => {
		$`empty.js`.pipe({stdout: 'pipe'})($`empty.js`);
	}, {message: /Please use \.pipe/});
});

const testInvalidPipe = (t, ...args) => {
	t.throws(() => {
		$`empty.js`.pipe(...args);
	}, {message: /must be a template string/});
};

test('$.pipe(nonExecaChildProcess) fails', testInvalidPipe, spawn('node', ['--version']));
test('$.pipe(false) fails', testInvalidPipe, false);
