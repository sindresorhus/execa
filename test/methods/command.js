import assert from 'node:assert/strict';
import test from 'node:test';
import {assertThrows} from '../helpers/assert.js';
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

test('parseCommandString() + execa()', async () => {
	const {stdout} = await execa('echo.js', parseCommandString('foo bar'));
	assert.equal(stdout, 'foo\nbar');
});

test('parseCommandString() + execaSync()', () => {
	const {stdout} = execaSync('echo.js', parseCommandString('foo bar'));
	assert.equal(stdout, 'foo\nbar');
});

test('parseCommandString() + execa`...`', async () => {
	const {stdout} = await execa`${parseCommandString('echo.js foo bar')}`;
	assert.equal(stdout, 'foo\nbar');
});

test('parseCommandString() + execa`...`, only arguments', async () => {
	const {stdout} = await execa`echo.js ${parseCommandString('foo bar')}`;
	assert.equal(stdout, 'foo\nbar');
});

test('parseCommandString() + execa`...`, only some arguments', async () => {
	const {stdout} = await execa`echo.js ${'foo bar'} ${parseCommandString('foo bar')}`;
	assert.equal(stdout, 'foo bar\nfoo\nbar');
});

test('parseCommandString() + execaSync`...`', () => {
	const {stdout} = execaSync`${parseCommandString('echo.js foo bar')}`;
	assert.equal(stdout, 'foo\nbar');
});

test('parseCommandString() + execaSync`...`, only arguments', () => {
	const {stdout} = execaSync`echo.js ${parseCommandString('foo bar')}`;
	assert.equal(stdout, 'foo\nbar');
});

test('parseCommandString() + execaSync`...`, only some arguments', () => {
	const {stdout} = execaSync`echo.js ${'foo bar'} ${parseCommandString('foo bar')}`;
	assert.equal(stdout, 'foo bar\nfoo\nbar');
});

test('parseCommandString() + $', async () => {
	const {stdout} = await $`${parseCommandString('echo.js foo bar')}`;
	assert.equal(stdout, 'foo\nbar');
});

test('parseCommandString() + $.sync', () => {
	const {stdout} = $.sync`${parseCommandString('echo.js foo bar')}`;
	assert.equal(stdout, 'foo\nbar');
});

test('parseCommandString() + execaNode', async () => {
	const {stdout} = await execaNode(ECHO_FIXTURE_URL, parseCommandString('foo bar'));
	assert.equal(stdout, 'foo\nbar');
});

const testInvalidArgumentsParse = command => {
	assertThrows(() => parseCommandString(command), {
		message: /The command must be a string/,
	});
};

test('parseCommandString() must not pass a number', () => testInvalidArgumentsParse(0));
test('parseCommandString() must not pass undefined', () => testInvalidArgumentsParse(undefined));
test('parseCommandString() must not pass null', () => testInvalidArgumentsParse(null));
test('parseCommandString() must not pass a symbol', () => testInvalidArgumentsParse(Symbol('test')));
test('parseCommandString() must not pass an object', () => testInvalidArgumentsParse({}));
test('parseCommandString() must not pass an array', () => testInvalidArgumentsParse([]));

const testParseCommandOutput = async (command, expectedOutput, execaMethod) => {
	const {stdout} = await execaMethod(command);
	assert.equal(stdout, expectedOutput);
};

test('parseCommandString() allows escaping spaces in commands', () => testParseCommandOutput('command\\ with\\ space.js foo bar', 'foo\nbar', parseAndRunCommand));
test('parseCommandString() trims', () => testParseCommandOutput('  echo.js foo bar  ', 'foo\nbar', parseAndRunCommand));
test('parseCommandString() ignores consecutive spaces', () => testParseCommandOutput('echo.js foo    bar', 'foo\nbar', parseAndRunCommand));
test('parseCommandString() escapes other whitespaces', () => testParseCommandOutput('echo.js foo\tbar', 'foo\tbar', parseAndRunCommand));
test('parseCommandString() allows escaping spaces', () => testParseCommandOutput('echo.js foo\\ bar', 'foo bar', parseAndRunCommand));
test('parseCommandString() allows escaping backslashes before spaces', () => testParseCommandOutput('echo.js foo\\\\ bar', 'foo\\ bar', parseAndRunCommand));
test('parseCommandString() allows escaping multiple backslashes before spaces', () => testParseCommandOutput('echo.js foo\\\\\\\\ bar', 'foo\\\\\\ bar', parseAndRunCommand));
test('parseCommandString() allows escaping backslashes not before spaces', () => testParseCommandOutput('echo.js foo\\bar baz', 'foo\\bar\nbaz', parseAndRunCommand));

test('parseCommandString() can get empty strings', () => {
	assert.deepEqual(parseCommandString(''), []);
});

test('parseCommandString() can get only whitespaces', () => {
	// eslint-disable-next-line unicorn/prefer-string-repeat
	assert.deepEqual(parseCommandString('   '), []);
});
