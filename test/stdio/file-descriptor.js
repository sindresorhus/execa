import assert from 'node:assert/strict';
import {readFile, open, rm} from 'node:fs/promises';
import test from 'node:test';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getStdio} from '../helpers/stdio.js';

setFixtureDirectory();

const testFileDescriptorOption = async (fdNumber, execaMethod) => {
	const filePath = tempfile();
	const fileDescriptor = await open(filePath, 'w');
	await execaMethod('noop-fd.js', [`${fdNumber}`, 'foobar'], getStdio(fdNumber, fileDescriptor));
	assert.equal(await readFile(filePath, 'utf8'), 'foobar');
	await rm(filePath);
	await fileDescriptor.close();
};

test('pass `stdout` to a file descriptor', () => testFileDescriptorOption(1, execa));
test('pass `stderr` to a file descriptor', () => testFileDescriptorOption(2, execa));
test('pass `stdio[*]` to a file descriptor', () => testFileDescriptorOption(3, execa));
test('pass `stdout` to a file descriptor - sync', () => testFileDescriptorOption(1, execaSync));
test('pass `stderr` to a file descriptor - sync', () => testFileDescriptorOption(2, execaSync));
test('pass `stdio[*]` to a file descriptor - sync', () => testFileDescriptorOption(3, execaSync));

const testStdinWrite = async fdNumber => {
	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, 'pipe'));
	subprocess.stdio[fdNumber].end('unicorns');
	const {stdout} = await subprocess;
	assert.equal(stdout, 'unicorns');
};

test('you can write to subprocess.stdin', () => testStdinWrite(0));
test('you can write to subprocess.stdio[*]', () => testStdinWrite(3));
