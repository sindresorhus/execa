import {once} from 'node:events';
import {createReadStream, createWriteStream} from 'node:fs';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {Readable, Writable, PassThrough} from 'node:stream';
import {setTimeout} from 'node:timers/promises';
import {callbackify} from 'node:util';
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

const testNoFileStreamSync = async (t, index, StreamClass) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(index, new StreamClass()));
	}, {code: 'ERR_INVALID_ARG_VALUE'});
};

test('stdin cannot be a Node.js Readable without a file descriptor - sync', testNoFileStreamSync, 0, Readable);
test('stdout cannot be a Node.js Writable without a file descriptor - sync', testNoFileStreamSync, 1, Writable);
test('stderr cannot be a Node.js Writable without a file descriptor - sync', testNoFileStreamSync, 2, Writable);
test('stdio[*] cannot be a Node.js Readable without a file descriptor - sync', testNoFileStreamSync, 3, Readable);
test('stdio[*] cannot be a Node.js Writable without a file descriptor - sync', testNoFileStreamSync, 3, Writable);

test('input can be a Node.js Readable without a file descriptor', async t => {
	const {stdout} = await execa('stdin.js', {input: createNoFileReadable('foobar')});
	t.is(stdout, 'foobar');
});

test('input cannot be a Node.js Readable without a file descriptor - sync', t => {
	t.throws(() => {
		execaSync('empty.js', {input: createNoFileReadable('foobar')});
	}, {message: 'The `input` option cannot be a Node.js stream in sync mode.'});
});

const testNoFileStream = async (t, index, StreamClass) => {
	await t.throwsAsync(execa('empty.js', getStdio(index, new StreamClass())), {code: 'ERR_INVALID_ARG_VALUE'});
};

test('stdin cannot be a Node.js Readable without a file descriptor', testNoFileStream, 0, Readable);
test('stdout cannot be a Node.js Writable without a file descriptor', testNoFileStream, 1, Writable);
test('stderr cannot be a Node.js Writable without a file descriptor', testNoFileStream, 2, Writable);
test('stdio[*] cannot be a Node.js Readable without a file descriptor', testNoFileStream, 3, Readable);
test('stdio[*] cannot be a Node.js Writable without a file descriptor', testNoFileStream, 3, Writable);

const testFileReadable = async (t, index, execaMethod) => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const stream = createReadStream(filePath);
	await once(stream, 'open');

	const indexString = index === 'input' ? '0' : `${index}`;
	const {stdout} = await execaMethod('stdin-fd.js', [indexString], getStdio(index, stream));
	t.is(stdout, 'foobar');

	await rm(filePath);
};

test('input can be a Node.js Readable with a file descriptor', testFileReadable, 'input', execa);
test('stdin can be a Node.js Readable with a file descriptor', testFileReadable, 0, execa);
test('stdio[*] can be a Node.js Readable with a file descriptor', testFileReadable, 3, execa);
test('stdin can be a Node.js Readable with a file descriptor - sync', testFileReadable, 0, execaSync);
test('stdio[*] can be a Node.js Readable with a file descriptor - sync', testFileReadable, 3, execaSync);

const testFileWritable = async (t, index, execaMethod) => {
	const filePath = tempfile();
	const stream = createWriteStream(filePath);
	await once(stream, 'open');

	await execaMethod('noop-fd.js', [`${index}`, 'foobar'], getStdio(index, stream));
	t.is(await readFile(filePath, 'utf8'), 'foobar');

	await rm(filePath);
};

test('stdout can be a Node.js Writable with a file descriptor', testFileWritable, 1, execa);
test('stderr can be a Node.js Writable with a file descriptor', testFileWritable, 2, execa);
test('stdio[*] can be a Node.js Writable with a file descriptor', testFileWritable, 3, execa);
test('stdout can be a Node.js Writable with a file descriptor - sync', testFileWritable, 1, execaSync);
test('stderr can be a Node.js Writable with a file descriptor - sync', testFileWritable, 2, execaSync);
test('stdio[*] can be a Node.js Writable with a file descriptor - sync', testFileWritable, 3, execaSync);

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

test('Wait for custom streams destroy on process errors', async t => {
	let waitedForDestroy = false;
	const stream = new Writable({
		destroy: callbackify(async error => {
			await setTimeout(0);
			waitedForDestroy = true;
			return error;
		}),
	});
	const childProcess = execa('forever.js', {stdout: [stream, 'pipe'], timeout: 1});
	const {timedOut} = await t.throwsAsync(childProcess);
	t.true(timedOut);
	t.true(waitedForDestroy);
});
