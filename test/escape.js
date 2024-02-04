import test from 'ava';
import {execa, execaSync} from '../index.js';
import {setFixtureDir} from './helpers/fixtures-dir.js';

setFixtureDir();

const testResultCommand = async (t, expected, ...args) => {
	const {command: failCommand} = await t.throwsAsync(execa('fail.js', args));
	t.is(failCommand, `fail.js${expected}`);

	const {command} = await execa('noop.js', args);
	t.is(command, `noop.js${expected}`);
};

testResultCommand.title = (message, expected) => `result.command is: ${JSON.stringify(expected)}`;

test(testResultCommand, ' foo bar', 'foo', 'bar');
test(testResultCommand, ' baz quz', 'baz', 'quz');
test(testResultCommand, '');

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

testEscapedCommand.title = (message, expected) => `result.escapedCommand is: ${JSON.stringify(expected)}`;

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
