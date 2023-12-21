import {readFile, open, rm} from 'node:fs/promises';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdinOption, getStdoutOption, getStderrOption, getStdioOption} from '../helpers/stdio.js';

setFixtureDir();

const getStdinProp = ({stdin}) => stdin;
const getStdioProp = ({stdio}) => stdio[3];

const testFileDescriptorOption = async (t, fixtureName, getOptions, execaMethod) => {
	const filePath = tempfile();
	const fileDescriptor = await open(filePath, 'w');
	await execaMethod(fixtureName, ['foobar'], getOptions(fileDescriptor));
	t.is(await readFile(filePath, 'utf8'), 'foobar\n');
	await rm(filePath);
};

test('pass `stdout` to a file descriptor', testFileDescriptorOption, 'noop.js', getStdoutOption, execa);
test('pass `stderr` to a file descriptor', testFileDescriptorOption, 'noop-err.js', getStderrOption, execa);
test('pass `stdio[*]` to a file descriptor', testFileDescriptorOption, 'noop-fd3.js', getStdioOption, execa);
test('pass `stdout` to a file descriptor - sync', testFileDescriptorOption, 'noop.js', getStdoutOption, execaSync);
test('pass `stderr` to a file descriptor - sync', testFileDescriptorOption, 'noop-err.js', getStderrOption, execaSync);
test('pass `stdio[*]` to a file descriptor - sync', testFileDescriptorOption, 'noop-fd3.js', getStdioOption, execaSync);

const testStdinWrite = async (t, getStreamProp, fixtureName, getOptions) => {
	const subprocess = execa(fixtureName, getOptions('pipe'));
	getStreamProp(subprocess).end('unicorns');
	const {stdout} = await subprocess;
	t.is(stdout, 'unicorns');
};

test('you can write to child.stdin', testStdinWrite, getStdinProp, 'stdin.js', getStdinOption);
test('you can write to child.stdio[*]', testStdinWrite, getStdioProp, 'stdin-fd3.js', getStdioOption);
