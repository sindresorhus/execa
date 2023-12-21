import {readFile, open, rm} from 'node:fs/promises';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdinOption, getStdoutOption, getStderrOption} from '../helpers/stdio.js';

setFixtureDir();

const getStdinProp = ({stdin}) => stdin;

const testFileDescriptorOption = async (t, fixtureName, getOptions, execaMethod) => {
	const filePath = tempfile();
	const fileDescriptor = await open(filePath, 'w');
	await execaMethod(fixtureName, ['foobar'], getOptions(fileDescriptor));
	t.is(await readFile(filePath, 'utf8'), 'foobar\n');
	await rm(filePath);
};

test('pass `stdout` to a file descriptor', testFileDescriptorOption, 'noop.js', getStdoutOption, execa);
test('pass `stderr` to a file descriptor', testFileDescriptorOption, 'noop-err.js', getStderrOption, execa);
test('pass `stdout` to a file descriptor - sync', testFileDescriptorOption, 'noop.js', getStdoutOption, execaSync);
test('pass `stderr` to a file descriptor - sync', testFileDescriptorOption, 'noop-err.js', getStderrOption, execaSync);

const testStdinWrite = async (t, getStreamProp, fixtureName, getOptions) => {
	const subprocess = execa(fixtureName, getOptions('pipe'));
	getStreamProp(subprocess).end('unicorns');
	const {stdout} = await subprocess;
	t.is(stdout, 'unicorns');
};

test('you can write to child.stdin', testStdinWrite, getStdinProp, 'stdin.js', getStdinOption);
