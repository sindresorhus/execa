import {createReadStream, createWriteStream} from 'node:fs';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {Writable, PassThrough} from 'node:stream';
import {text} from 'node:stream/consumers';
import {setImmediate} from 'node:timers/promises';
import {callbackify} from 'node:util';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';
import {noopReadable, noopWritable} from '../helpers/stream.js';

setFixtureDirectory();

const testLazyFileReadable = async (t, fdNumber) => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const stream = createReadStream(filePath);

	const {stdout} = await execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [stream, 'pipe']));
	t.is(stdout, 'foobar');

	await rm(filePath);
};

test('stdin can be [Readable, "pipe"] without a file descriptor', testLazyFileReadable, 0);
test('stdio[*] can be [Readable, "pipe"] without a file descriptor', testLazyFileReadable, 3);

const testLazyFileReadableSync = (t, fdNumber) => {
	t.throws(() => {
		execaSync('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [noopReadable(), 'pipe']));
	}, {message: /cannot both be an array and include a stream/});
};

test('stdin cannot be [Readable, "pipe"] without a file descriptor, sync', testLazyFileReadableSync, 0);
test('stdio[*] cannot be [Readable, "pipe"] without a file descriptor, sync', testLazyFileReadableSync, 3);

const testLazyFileWritable = async (t, fdNumber) => {
	const filePath = tempfile();
	const stream = createWriteStream(filePath);

	await execa('noop-fd.js', [`${fdNumber}`, 'foobar'], getStdio(fdNumber, [stream, 'pipe']));
	t.is(await readFile(filePath, 'utf8'), 'foobar');

	await rm(filePath);
};

test('stdout can be [Writable, "pipe"] without a file descriptor', testLazyFileWritable, 1);
test('stderr can be [Writable, "pipe"] without a file descriptor', testLazyFileWritable, 2);
test('stdio[*] can be [Writable, "pipe"] without a file descriptor', testLazyFileWritable, 3);

const testLazyFileWritableSync = (t, fdNumber) => {
	t.throws(() => {
		execaSync('noop-fd.js', [`${fdNumber}`], getStdio(fdNumber, [noopWritable(), 'pipe']));
	}, {message: /cannot both be an array and include a stream/});
};

test('stdout cannot be [Writable, "pipe"] without a file descriptor, sync', testLazyFileWritableSync, 1);
test('stderr cannot be [Writable, "pipe"] without a file descriptor, sync', testLazyFileWritableSync, 2);
test('stdio[*] cannot be [Writable, "pipe"] without a file descriptor, sync', testLazyFileWritableSync, 3);

test('Waits for custom streams destroy on subprocess errors', async t => {
	let waitedForDestroy = false;
	const stream = new Writable({
		destroy: callbackify(async error => {
			await setImmediate();
			waitedForDestroy = true;
			return error;
		}),
	});
	const {timedOut} = await t.throwsAsync(execa('forever.js', {stdout: [stream, 'pipe'], timeout: 1}));
	t.true(timedOut);
	t.true(waitedForDestroy);
});

test('Handles custom streams destroy errors on subprocess success', async t => {
	const cause = new Error('test');
	const stream = new Writable({
		destroy(destroyError, done) {
			done(destroyError ?? cause);
		},
	});
	const error = await t.throwsAsync(execa('empty.js', {stdout: [stream, 'pipe']}));
	t.is(error.cause, cause);
});

const testStreamEarlyExit = async (t, stream, streamName) => {
	await t.throwsAsync(execa('noop.js', {[streamName]: [stream, 'pipe'], uid: -1}));
	t.true(stream.destroyed);
};

test('Input streams are canceled on early subprocess exit', testStreamEarlyExit, noopReadable(), 'stdin');
test('Output streams are canceled on early subprocess exit', testStreamEarlyExit, noopWritable(), 'stdout');

const testInputDuplexStream = async (t, fdNumber) => {
	const stream = new PassThrough();
	stream.end(foobarString);
	const {stdout} = await execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [stream, new Uint8Array()]));
	t.is(stdout, foobarString);
};

test('Can pass Duplex streams to stdin', testInputDuplexStream, 0);
test('Can pass Duplex streams to input stdio[*]', testInputDuplexStream, 3);

const testOutputDuplexStream = async (t, fdNumber) => {
	const stream = new PassThrough();
	const [output] = await Promise.all([
		text(stream),
		execa('noop-fd.js', [`${fdNumber}`], getStdio(fdNumber, [stream, 'pipe'])),
	]);
	t.is(output, foobarString);
};

test('Can pass Duplex streams to stdout', testOutputDuplexStream, 1);
test('Can pass Duplex streams to stderr', testOutputDuplexStream, 2);
test('Can pass Duplex streams to output stdio[*]', testOutputDuplexStream, 3);

const testInputStreamAbort = async (t, fdNumber) => {
	const stream = new PassThrough();
	stream.destroy();

	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [stream, new Uint8Array()]));
	await subprocess;
	t.true(subprocess.stdio[fdNumber].writableEnded);
};

test('subprocess.stdin is ended when an input stream aborts', testInputStreamAbort, 0);
test('subprocess.stdio[*] is ended when an input stream aborts', testInputStreamAbort, 3);

const testInputStreamError = async (t, fdNumber) => {
	const stream = new PassThrough();
	const cause = new Error(foobarString);
	stream.destroy(cause);

	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [stream, new Uint8Array()]));
	t.like(await t.throwsAsync(subprocess), {cause});
	t.true(subprocess.stdio[fdNumber].writableEnded);
};

test('subprocess.stdin is ended when an input stream errors', testInputStreamError, 0);
test('subprocess.stdio[*] is ended when an input stream errors', testInputStreamError, 3);

const testOutputStreamError = async (t, fdNumber) => {
	const stream = new PassThrough();
	const cause = new Error(foobarString);
	stream.destroy(cause);

	const subprocess = execa('noop-fd.js', [`${fdNumber}`], getStdio(fdNumber, [stream, 'pipe']));
	t.like(await t.throwsAsync(subprocess), {cause});
	t.true(subprocess.stdio[fdNumber].readableAborted);
	t.is(subprocess.stdio[fdNumber].errored, null);
};

test('subprocess.stdout is aborted when an output stream errors', testOutputStreamError, 1);
test('subprocess.stderr is aborted when an output stream errors', testOutputStreamError, 2);
test('subprocess.stdio[*] is aborted when an output stream errors', testOutputStreamError, 3);
