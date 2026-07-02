import test from 'ava';
import {
	execa,
	execaSync,
	$,
	execaNode,
	parseCommandString,
} from '../../index.js';
import {
	setFixtureDirectory,
	FIXTURES_DIRECTORY_URL,
} from '../helpers/fixtures-directory.js';

setFixtureDirectory();
const ECHO_FIXTURE_URL = new URL('echo.js', FIXTURES_DIRECTORY_URL);

const parseAndRunCommand = command => execa`${parseCommandString(command)}`;

test('parseCommandString() + execa()', async t => {
	const {stdout} = await execa('echo.js', parseCommandString('foo bar'));
	t.is(stdout, 'foo\nbar');
});

test('parseCommandString() + execaSync()', t => {
	const {stdout} = execaSync('echo.js', parseCommandString('foo bar'));
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

const testInvalidArgumentsParse = (t, command) => {
	t.throws(() => parseCommandString(command), {
		message: /The command must be a string/,
	});
};

test('parseCommandString() must not pass a number', testInvalidArgumentsParse, 0);
test('parseCommandString() must not pass undefined', testInvalidArgumentsParse, undefined);
test('parseCommandString() must not pass null', testInvalidArgumentsParse, null);
test('parseCommandString() must not pass a symbol', testInvalidArgumentsParse, Symbol('test'));
test('parseCommandString() must not pass an object', testInvalidArgumentsParse, {});
test('parseCommandString() must not pass an array', testInvalidArgumentsParse, []);

const testParseCommandOutput = async (t, command, expectedOutput, execaMethod) => {
	const {stdout} = await execaMethod(command);
	t.is(stdout, expectedOutput);
};

test('parseCommandString() allows escaping spaces in commands', testParseCommandOutput, 'command\\ with\\ space.js foo bar', 'foo\nbar', parseAndRunCommand);
test('parseCommandString() trims', testParseCommandOutput, '  echo.js foo bar  ', 'foo\nbar', parseAndRunCommand);
test('parseCommandString() ignores consecutive spaces', testParseCommandOutput, 'echo.js foo    bar', 'foo\nbar', parseAndRunCommand);
test('parseCommandString() escapes other whitespaces', testParseCommandOutput, 'echo.js foo\tbar', 'foo\tbar', parseAndRunCommand);
test('parseCommandString() allows escaping spaces', testParseCommandOutput, 'echo.js foo\\ bar', 'foo bar', parseAndRunCommand);
test('parseCommandString() allows escaping backslashes before spaces', testParseCommandOutput, 'echo.js foo\\\\ bar', 'foo\\ bar', parseAndRunCommand);
test('parseCommandString() allows escaping multiple backslashes before spaces', testParseCommandOutput, 'echo.js foo\\\\\\\\ bar', 'foo\\\\\\ bar', parseAndRunCommand);
test('parseCommandString() allows escaping backslashes not before spaces', testParseCommandOutput, 'echo.js foo\\bar baz', 'foo\\bar\nbaz', parseAndRunCommand);

test('parseCommandString() can get empty strings', t => {
	t.deepEqual(parseCommandString(''), []);
});

test('parseCommandString() can get only whitespaces', t => {
	// eslint-disable-next-line unicorn/prefer-string-repeat
	t.deepEqual(parseCommandString('   '), []);
});
