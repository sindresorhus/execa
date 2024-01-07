import {once} from 'node:events';
import {createReadStream, createWriteStream} from 'node:fs';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {Readable, Writable, PassThrough} from 'node:stream';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';

setFixtureDir();

const createNoFileReadable = value => {
	const stream = new PassThrough();
	stream.write(value);
	stream.end();
	return stream;
};

const testNodeStreamSync = (t, StreamClass, index, optionName) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(index, new StreamClass()));
	}, {message: `The \`${optionName}\` option cannot be a Node.js stream in sync mode.`});
};

test('input cannot be a Node.js Readable - sync', testNodeStreamSync, Readable, 'input', 'input');
test('stdin cannot be a Node.js Readable - sync', testNodeStreamSync, Readable, 0, 'stdin');
test('stdio[*] cannot be a Node.js Readable - sync', testNodeStreamSync, Readable, 3, 'stdio[3]');
test('stdout cannot be a Node.js Writable - sync', testNodeStreamSync, Writable, 1, 'stdout');
test('stderr cannot be a Node.js Writable - sync', testNodeStreamSync, Writable, 2, 'stderr');
test('stdio[*] cannot be a Node.js Writable - sync', testNodeStreamSync, Writable, 3, 'stdio[3]');

test('input can be a Node.js Readable without a file descriptor', async t => {
	const {stdout} = await execa('stdin.js', {input: createNoFileReadable('foobar')});
	t.is(stdout, 'foobar');
});

const testNoFileStream = async (t, index, StreamClass) => {
	await t.throwsAsync(execa('empty.js', getStdio(index, new StreamClass())), {code: 'ERR_INVALID_ARG_VALUE'});
};

test('stdin cannot be a Node.js Readable without a file descriptor', testNoFileStream, 0, Readable);
test('stdout cannot be a Node.js Writable without a file descriptor', testNoFileStream, 1, Writable);
test('stderr cannot be a Node.js Writable without a file descriptor', testNoFileStream, 2, Writable);
test('stdio[*] cannot be a Node.js Readable without a file descriptor', testNoFileStream, 3, Readable);
test('stdio[*] cannot be a Node.js Writable without a file descriptor', testNoFileStream, 3, Writable);

const testFileReadable = async (t, index) => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const stream = createReadStream(filePath);
	await once(stream, 'open');

	const indexString = index === 'input' ? '0' : `${index}`;
	const {stdout} = await execa('stdin-fd.js', [indexString], getStdio(index, stream));
	t.is(stdout, 'foobar');

	await rm(filePath);
};

test('input can be a Node.js Readable with a file descriptor', testFileReadable, 'input');
test('stdin can be a Node.js Readable with a file descriptor', testFileReadable, 0);
test('stdio[*] can be a Node.js Readable with a file descriptor', testFileReadable, 3);

const testFileWritable = async (t, index) => {
	const filePath = tempfile();
	const stream = createWriteStream(filePath);
	await once(stream, 'open');

	await execa('noop-fd.js', [`${index}`, 'foobar'], getStdio(index, stream));
	t.is(await readFile(filePath, 'utf8'), 'foobar');

	await rm(filePath);
};

test('stdout can be a Node.js Writable with a file descriptor', testFileWritable, 1);
test('stderr can be a Node.js Writable with a file descriptor', testFileWritable, 2);
test('stdio[*] can be a Node.js Writable with a file descriptor', testFileWritable, 3);

const testLazyFileReadable = async (t, index) => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const stream = createReadStream(filePath);

	const {stdout} = await execa('stdin-fd.js', [`${index}`], getStdio(index, [stream, 'pipe']));
	t.is(stdout, 'foobar');

	await rm(filePath);
};

test('stdin can be [Readable, "pipe"] without a file descriptor', testLazyFileReadable, 0);
test('stdio[*] can be [Readable, "pipe"] without a file descriptor', testLazyFileReadable, 3);

const testLazyFileWritable = async (t, index) => {
	const filePath = tempfile();
	const stream = createWriteStream(filePath);

	await execa('noop-fd.js', [`${index}`, 'foobar'], getStdio(index, [stream, 'pipe']));
	t.is(await readFile(filePath, 'utf8'), 'foobar');

	await rm(filePath);
};

test('stdout can be [Writable, "pipe"] without a file descriptor', testLazyFileWritable, 1);
test('stderr can be [Writable, "pipe"] without a file descriptor', testLazyFileWritable, 2);
test('stdio[*] can be [Writable, "pipe"] without a file descriptor', testLazyFileWritable, 3);
