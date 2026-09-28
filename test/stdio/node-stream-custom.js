import assert from 'node:assert/strict';
import {createReadStream, createWriteStream} from 'node:fs';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {Writable, PassThrough} from 'node:stream';
import {text} from 'node:stream/consumers';
import {setImmediate} from 'node:timers/promises';
import {callbackify} from 'node:util';
import test from 'node:test';
import tempfile from 'tempfile';
import {assertThrows, assertRejects, assertLike} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';
import {noopReadable, noopWritable} from '../helpers/stream.js';
import {getEarlyErrorSubprocess, expectedEarlyError} from '../helpers/early-error.js';

setFixtureDirectory();

const testLazyFileReadable = async fdNumber => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const stream = createReadStream(filePath);

	const {stdout} = await execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [stream, 'pipe']));
	assert.equal(stdout, 'foobar');

	await rm(filePath);
};

test('stdin can be [Readable, "pipe"] without a file descriptor', () => testLazyFileReadable(0));
test('stdio[*] can be [Readable, "pipe"] without a file descriptor', () => testLazyFileReadable(3));

const testLazyFileReadableSync = fdNumber => {
	assertThrows(() => {
		execaSync('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [noopReadable(), 'pipe']));
	}, {message: /cannot both be an array and include a stream/});
};

test('stdin cannot be [Readable, "pipe"] without a file descriptor, sync', () => testLazyFileReadableSync(0));
test('stdio[*] cannot be [Readable, "pipe"] without a file descriptor, sync', () => testLazyFileReadableSync(3));

const testLazyFileWritable = async fdNumber => {
	const filePath = tempfile();
	const stream = createWriteStream(filePath);

	await execa('noop-fd.js', [`${fdNumber}`, 'foobar'], getStdio(fdNumber, [stream, 'pipe']));
	assert.equal(await readFile(filePath, 'utf8'), 'foobar');

	await rm(filePath);
};

test('stdout can be [Writable, "pipe"] without a file descriptor', () => testLazyFileWritable(1));
test('stderr can be [Writable, "pipe"] without a file descriptor', () => testLazyFileWritable(2));
test('stdio[*] can be [Writable, "pipe"] without a file descriptor', () => testLazyFileWritable(3));

const testLazyFileWritableSync = fdNumber => {
	assertThrows(() => {
		execaSync('noop-fd.js', [`${fdNumber}`], getStdio(fdNumber, [noopWritable(), 'pipe']));
	}, {message: /cannot both be an array and include a stream/});
};

test('stdout cannot be [Writable, "pipe"] without a file descriptor, sync', () => testLazyFileWritableSync(1));
test('stderr cannot be [Writable, "pipe"] without a file descriptor, sync', () => testLazyFileWritableSync(2));
test('stdio[*] cannot be [Writable, "pipe"] without a file descriptor, sync', () => testLazyFileWritableSync(3));

/*
An output stream is written to, then handed back to the user.
We must only wait for our writes to be flushed, not for the user to consume its readable side,
otherwise the subprocess promise hangs until they do.
*/
const testUnconsumedOutputStream = async fdNumber => {
	const stream = new PassThrough();
	const {exitCode} = await execa('empty.js', {...getStdio(fdNumber, [stream, 'pipe']), timeout: 1e3});
	assert.equal(exitCode, 0);
};

test('stdout does not wait for the user to consume the output stream', () => testUnconsumedOutputStream(1));
test('stderr does not wait for the user to consume the output stream', () => testUnconsumedOutputStream(2));
test('stdio[*] does not wait for the user to consume the output stream', () => testUnconsumedOutputStream(3));

test('stdout does not wait for the user to consume the output stream on subprocess errors', async () => {
	const stream = new PassThrough();
	const error = await assertRejects(execa('fail.js', {...getStdio(1, [stream, 'pipe']), timeout: 1e3}));
	assert.equal(error.timedOut, false);
	assert.equal(error.exitCode, 2);
});

// The stream is handed back to the user with its data still readable
test('output stream data is readable once the subprocess is done', async () => {
	const stream = new PassThrough();
	await execa('noop.js', [foobarString], {...getStdio(1, [stream, 'pipe'])});
	assert.equal(await text(stream), `${foobarString}\n`);
});

test('Waits for custom streams destroy on subprocess errors', async () => {
	let isWaitedForDestroy = false;
	const stream = new Writable({
		destroy: callbackify(async error => {
			await setImmediate();
			isWaitedForDestroy = true;
			return error;
		}),
	});
	const {timedOut} = await assertRejects(execa('forever.js', {stdout: [stream, 'pipe'], timeout: 1}));
	assert.equal(timedOut, true);
	assert.equal(isWaitedForDestroy, true);
});

test('Handles custom streams destroy errors on subprocess success', async () => {
	const cause = new Error('test');
	const stream = new Writable({
		destroy(destroyError, done) {
			done(destroyError ?? cause);
		},
	});
	const error = await assertRejects(execa('empty.js', {stdout: [stream, 'pipe']}));
	assert.equal(error.cause, cause);
});

const testStreamEarlyExit = async (stream, streamName) => {
	const error = await assertRejects(getEarlyErrorSubprocess({[streamName]: [stream, 'pipe']}));
	assertLike(error, expectedEarlyError);
	assert.equal(stream.destroyed, true);
};

test('Input streams are canceled on early subprocess exit', () => testStreamEarlyExit(noopReadable(), 'stdin'));
test('Output streams are canceled on early subprocess exit', () => testStreamEarlyExit(noopWritable(), 'stdout'));

const testInputDuplexStream = async fdNumber => {
	const stream = new PassThrough();
	stream.end(foobarString);
	const {stdout} = await execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [stream, new Uint8Array()]));
	assert.equal(stdout, foobarString);
};

test('Can pass Duplex streams to stdin', () => testInputDuplexStream(0));
test('Can pass Duplex streams to input stdio[*]', () => testInputDuplexStream(3));

const testOutputDuplexStream = async fdNumber => {
	const stream = new PassThrough();
	const [output] = await Promise.all([
		text(stream),
		execa('noop-fd.js', [`${fdNumber}`], getStdio(fdNumber, [stream, 'pipe'])),
	]);
	assert.equal(output, foobarString);
};

test('Can pass Duplex streams to stdout', () => testOutputDuplexStream(1));
test('Can pass Duplex streams to stderr', () => testOutputDuplexStream(2));
test('Can pass Duplex streams to output stdio[*]', () => testOutputDuplexStream(3));

const testInputStreamAbort = async fdNumber => {
	const stream = new PassThrough();
	stream.destroy();

	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [stream, new Uint8Array()]));
	await subprocess;
	assert.ok(subprocess.stdio[fdNumber].writableEnded);
};

test('subprocess.stdin is ended when an input stream aborts', () => testInputStreamAbort(0));
test('subprocess.stdio[*] is ended when an input stream aborts', () => testInputStreamAbort(3));

const testInputStreamError = async fdNumber => {
	const stream = new PassThrough();
	const cause = new Error(foobarString);
	stream.destroy(cause);

	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [stream, new Uint8Array()]));
	assertLike(await assertRejects(subprocess), {cause});
	assert.ok(subprocess.stdio[fdNumber].writableEnded);
};

test('subprocess.stdin is ended when an input stream errors', () => testInputStreamError(0));
test('subprocess.stdio[*] is ended when an input stream errors', () => testInputStreamError(3));

const testOutputStreamError = async fdNumber => {
	const stream = new PassThrough();
	const cause = new Error(foobarString);
	stream.destroy(cause);

	const subprocess = execa('noop-fd.js', [`${fdNumber}`], getStdio(fdNumber, [stream, 'pipe']));
	assertLike(await assertRejects(subprocess), {cause});
	assert.ok(subprocess.stdio[fdNumber].readableAborted);
	assert.equal(subprocess.stdio[fdNumber].errored, null);
};

test('subprocess.stdout is aborted when an output stream errors', () => testOutputStreamError(1));
test('subprocess.stderr is aborted when an output stream errors', () => testOutputStreamError(2));
test('subprocess.stdio[*] is aborted when an output stream errors', () => testOutputStreamError(3));
