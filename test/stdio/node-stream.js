import {once} from 'node:events';
import {createReadStream, createWriteStream} from 'node:fs';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {Readable, Writable, PassThrough} from 'node:stream';
import {setImmediate} from 'node:timers/promises';
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

test('Waits for custom streams destroy on process errors', async t => {
	let waitedForDestroy = false;
	const stream = new Writable({
		destroy: callbackify(async error => {
			await setImmediate();
			waitedForDestroy = true;
			return error;
		}),
	});
	const childProcess = execa('forever.js', {stdout: [stream, 'pipe'], timeout: 1});
	const {timedOut} = await t.throwsAsync(childProcess);
	t.true(timedOut);
	t.true(waitedForDestroy);
});

const noopReadable = () => new Readable({read() {}});
const noopWritable = () => new Writable({write() {}});

const testStreamEarlyExit = async (t, stream, streamName) => {
	await t.throwsAsync(execa('noop.js', {[streamName]: [stream, 'pipe'], uid: -1}));
	t.true(stream.destroyed);
};

test('Input streams are canceled on early process exit', testStreamEarlyExit, noopReadable(), 'stdin');
test('Output streams are canceled on early process exit', testStreamEarlyExit, noopWritable(), 'stdout');

test('Handles output streams ends', async t => {
	const stream = noopWritable();
	stream.end();
	await t.throwsAsync(
		execa('forever.js', {stdout: [stream, 'pipe']}),
		{code: 'ERR_STREAM_PREMATURE_CLOSE'},
	);
});

const testStreamAbort = async (t, stream, streamName) => {
	stream.destroy();
	await t.throwsAsync(
		execa('forever.js', {[streamName]: [stream, 'pipe']}),
		{code: 'ERR_STREAM_PREMATURE_CLOSE'},
	);
};

test('Handles input streams aborts', testStreamAbort, noopReadable(), 'stdin');
test('Handles output streams aborts', testStreamAbort, noopWritable(), 'stdout');

const testStreamError = async (t, stream, streamName) => {
	const error = new Error('test');
	stream.destroy(error);
	t.is(
		await t.throwsAsync(execa('forever.js', {[streamName]: [stream, 'pipe']})),
		error,
	);
};

test('Handles input streams errors', testStreamError, noopReadable(), 'stdin');
test('Handles output streams errors', testStreamError, noopWritable(), 'stdout');

test('Handles childProcess.stdin end', async t => {
	const stream = noopReadable();
	const childProcess = execa('forever.js', {stdin: [stream, 'pipe']});
	childProcess.stdin.end();
	await t.throwsAsync(childProcess, {code: 'ERR_STREAM_PREMATURE_CLOSE'});
	t.true(stream.destroyed);
});

const testChildStreamAbort = async (t, stream, streamName) => {
	const childProcess = execa('forever.js', {[streamName]: [stream, 'pipe']});
	childProcess[streamName].destroy();
	await t.throwsAsync(childProcess, {code: 'ERR_STREAM_PREMATURE_CLOSE'});
	t.true(stream.destroyed);
};

test('Handles childProcess.stdin aborts', testChildStreamAbort, noopReadable(), 'stdin');
test('Handles childProcess.stdout aborts', testChildStreamAbort, noopWritable(), 'stdout');

const testChildStreamError = async (t, stream, streamName) => {
	const childProcess = execa('forever.js', {[streamName]: [stream, 'pipe']});
	const error = new Error('test');
	childProcess[streamName].destroy(error);
	t.is(await t.throwsAsync(childProcess), error);
	t.true(stream.destroyed);
};

test('Handles childProcess.stdin errors', testChildStreamError, noopReadable(), 'stdin');
test('Handles childProcess.stdout errors', testChildStreamError, noopWritable(), 'stdout');
