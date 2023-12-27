import {once} from 'node:events';
import {createReadStream, createWriteStream} from 'node:fs';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {Readable, Writable, PassThrough} from 'node:stream';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdinOption, getStdoutOption, getStderrOption, getStdioOption, getInputOption} from '../helpers/stdio.js';

setFixtureDir();

const createNoFileReadable = value => {
	const stream = new PassThrough();
	stream.write(value);
	stream.end();
	return stream;
};

const testNodeStreamSync = (t, StreamClass, getOptions, optionName) => {
	t.throws(() => {
		execaSync('noop.js', getOptions(new StreamClass()));
	}, {message: `The \`${optionName}\` option cannot be a Node.js stream in sync mode.`});
};

test('input cannot be a Node.js Readable - sync', testNodeStreamSync, Readable, getInputOption, 'input');
test('stdin cannot be a Node.js Readable - sync', testNodeStreamSync, Readable, getStdinOption, 'stdin');
test('stdio[*] cannot be a Node.js Readable - sync', testNodeStreamSync, Readable, getStdioOption, 'stdio[3]');
test('stdout cannot be a Node.js Writable - sync', testNodeStreamSync, Writable, getStdoutOption, 'stdout');
test('stderr cannot be a Node.js Writable - sync', testNodeStreamSync, Writable, getStderrOption, 'stderr');
test('stdio[*] cannot be a Node.js Writable - sync', testNodeStreamSync, Writable, getStdioOption, 'stdio[3]');

test('input can be a Node.js Readable without a file descriptor', async t => {
	const {stdout} = await execa('stdin.js', {input: createNoFileReadable('foobar')});
	t.is(stdout, 'foobar');
});

const testNoFileStream = async (t, getOptions, StreamClass) => {
	await t.throwsAsync(execa('noop.js', getOptions(new StreamClass())), {code: 'ERR_INVALID_ARG_VALUE'});
};

test('stdin cannot be a Node.js Readable without a file descriptor', testNoFileStream, getStdinOption, Readable);
test('stdout cannot be a Node.js Writable without a file descriptor', testNoFileStream, getStdoutOption, Writable);
test('stderr cannot be a Node.js Writable without a file descriptor', testNoFileStream, getStderrOption, Writable);
test('stdio[*] cannot be a Node.js Readable without a file descriptor', testNoFileStream, getStdioOption, Readable);
test('stdio[*] cannot be a Node.js Writable without a file descriptor', testNoFileStream, getStdioOption, Writable);

const testFileReadable = async (t, fixtureName, getOptions) => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const stream = createReadStream(filePath);
	await once(stream, 'open');

	const {stdout} = await execa(fixtureName, getOptions(stream));
	t.is(stdout, 'foobar');

	await rm(filePath);
};

test('input can be a Node.js Readable with a file descriptor', testFileReadable, 'stdin.js', getInputOption);
test('stdin can be a Node.js Readable with a file descriptor', testFileReadable, 'stdin.js', getStdinOption);
test('stdio[*] can be a Node.js Readable with a file descriptor', testFileReadable, 'stdin-fd3.js', getStdioOption);

const testFileWritable = async (t, getOptions, fixtureName) => {
	const filePath = tempfile();
	const stream = createWriteStream(filePath);
	await once(stream, 'open');

	await execa(fixtureName, ['foobar'], getOptions(stream));
	t.is(await readFile(filePath, 'utf8'), 'foobar\n');

	await rm(filePath);
};

test('stdout can be a Node.js Writable with a file descriptor', testFileWritable, getStdoutOption, 'noop.js');
test('stderr can be a Node.js Writable with a file descriptor', testFileWritable, getStderrOption, 'noop-err.js');
test('stdio[*] can be a Node.js Writable with a file descriptor', testFileWritable, getStdioOption, 'noop-fd3.js');

const testLazyFileReadable = async (t, fixtureName, getOptions) => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const stream = createReadStream(filePath);

	const {stdout} = await execa(fixtureName, getOptions([stream, 'pipe']));
	t.is(stdout, 'foobar');

	await rm(filePath);
};

test('stdin can be [Readable, "pipe"] without a file descriptor', testLazyFileReadable, 'stdin.js', getStdinOption);
test('stdio[*] can be [Readable, "pipe"] without a file descriptor', testLazyFileReadable, 'stdin-fd3.js', getStdioOption);

const testLazyFileWritable = async (t, getOptions, fixtureName) => {
	const filePath = tempfile();
	const stream = createWriteStream(filePath);

	await execa(fixtureName, ['foobar'], getOptions([stream, 'pipe']));
	t.is(await readFile(filePath, 'utf8'), 'foobar\n');

	await rm(filePath);
};

test('stdout can be [Writable, "pipe"] without a file descriptor', testLazyFileWritable, getStdoutOption, 'noop.js');
test('stderr can be [Writable, "pipe"] without a file descriptor', testLazyFileWritable, getStderrOption, 'noop-err.js');
test('stdio[*] can be [Writable, "pipe"] without a file descriptor', testLazyFileWritable, getStdioOption, 'noop-fd3.js');
