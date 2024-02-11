import {once} from 'node:events';
import {createReadStream, createWriteStream} from 'node:fs';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {Readable, Writable, Duplex, PassThrough} from 'node:stream';
import {text} from 'node:stream/consumers';
import {setImmediate} from 'node:timers/promises';
import {callbackify} from 'node:util';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';

setFixtureDir();

const noopReadable = () => new Readable({read() {}});
const noopWritable = () => new Writable({write() {}});
const noopDuplex = () => new Duplex({read() {}, write() {}});
const simpleReadable = () => Readable.from([foobarString]);

const testNoFileStreamSync = async (t, index, stream) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(index, stream));
	}, {code: 'ERR_INVALID_ARG_VALUE'});
};

test('stdin cannot be a Node.js Readable without a file descriptor - sync', testNoFileStreamSync, 0, noopReadable());
test('stdin cannot be a Node.js Duplex without a file descriptor - sync', testNoFileStreamSync, 0, noopDuplex());
test('stdout cannot be a Node.js Writable without a file descriptor - sync', testNoFileStreamSync, 1, noopWritable());
test('stdout cannot be a Node.js Duplex without a file descriptor - sync', testNoFileStreamSync, 1, noopDuplex());
test('stderr cannot be a Node.js Writable without a file descriptor - sync', testNoFileStreamSync, 2, noopWritable());
test('stderr cannot be a Node.js Duplex without a file descriptor - sync', testNoFileStreamSync, 2, noopDuplex());
test('stdio[*] cannot be a Node.js Readable without a file descriptor - sync', testNoFileStreamSync, 3, noopReadable());
test('stdio[*] cannot be a Node.js Writable without a file descriptor - sync', testNoFileStreamSync, 3, noopWritable());
test('stdio[*] cannot be a Node.js Duplex without a file descriptor - sync', testNoFileStreamSync, 3, noopDuplex());

test('input can be a Node.js Readable without a file descriptor', async t => {
	const {stdout} = await execa('stdin.js', {input: simpleReadable()});
	t.is(stdout, foobarString);
});

test('input cannot be a Node.js Readable without a file descriptor - sync', t => {
	t.throws(() => {
		execaSync('empty.js', {input: simpleReadable()});
	}, {message: 'The `input` option cannot be a Node.js stream in sync mode.'});
});

const testNoFileStream = async (t, index, stream) => {
	await t.throwsAsync(execa('empty.js', getStdio(index, stream)), {code: 'ERR_INVALID_ARG_VALUE'});
};

test('stdin cannot be a Node.js Readable without a file descriptor', testNoFileStream, 0, noopReadable());
test('stdin cannot be a Node.js Duplex without a file descriptor', testNoFileStream, 0, noopDuplex());
test('stdout cannot be a Node.js Writable without a file descriptor', testNoFileStream, 1, noopWritable());
test('stdout cannot be a Node.js Duplex without a file descriptor', testNoFileStream, 1, noopDuplex());
test('stderr cannot be a Node.js Writable without a file descriptor', testNoFileStream, 2, noopWritable());
test('stderr cannot be a Node.js Duplex without a file descriptor', testNoFileStream, 2, noopDuplex());
test('stdio[*] cannot be a Node.js Readable without a file descriptor', testNoFileStream, 3, noopReadable());
test('stdio[*] cannot be a Node.js Writable without a file descriptor', testNoFileStream, 3, noopWritable());
test('stdio[*] cannot be a Node.js Duplex without a file descriptor', testNoFileStream, 3, noopDuplex());

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
	const {timedOut} = await t.throwsAsync(execa('forever.js', {stdout: [stream, 'pipe'], timeout: 1}));
	t.true(timedOut);
	t.true(waitedForDestroy);
});

test('Handles custom streams destroy errors on process success', async t => {
	const error = new Error('test');
	const stream = new Writable({
		destroy(destroyError, done) {
			done(destroyError ?? error);
		},
	});
	const thrownError = await t.throwsAsync(execa('empty.js', {stdout: [stream, 'pipe']}));
	t.is(thrownError, error);
});

const testStreamEarlyExit = async (t, stream, streamName) => {
	await t.throwsAsync(execa('noop.js', {[streamName]: [stream, 'pipe'], uid: -1}));
	t.true(stream.destroyed);
};

test('Input streams are canceled on early process exit', testStreamEarlyExit, noopReadable(), 'stdin');
test('Output streams are canceled on early process exit', testStreamEarlyExit, noopWritable(), 'stdout');

const testInputDuplexStream = async (t, index) => {
	const stream = new PassThrough();
	stream.end(foobarString);
	const {stdout} = await execa('stdin-fd.js', [`${index}`], getStdio(index, [stream, 'pipe']));
	t.is(stdout, foobarString);
};

test('Can pass Duplex streams to stdin', testInputDuplexStream, 0);
test('Can pass Duplex streams to input stdio[*]', testInputDuplexStream, 3);

const testOutputDuplexStream = async (t, index) => {
	const stream = new PassThrough();
	const [output] = await Promise.all([
		text(stream),
		execa('noop-fd.js', [`${index}`], getStdio(index, [stream, 'pipe'])),
	]);
	t.is(output, foobarString);
};

test('Can pass Duplex streams to stdout', testOutputDuplexStream, 1);
test('Can pass Duplex streams to stderr', testOutputDuplexStream, 2);
test('Can pass Duplex streams to output stdio[*]', testOutputDuplexStream, 3);

const assertStreamError = (t, {exitCode, signal, isTerminated, failed}) => {
	t.is(exitCode, 0);
	t.is(signal, undefined);
	t.false(isTerminated);
	t.true(failed);
};

const getStreamFixtureName = index => index === 0 ? 'stdin.js' : 'noop.js';

test('Handles output streams ends', async t => {
	const stream = noopWritable();
	const childProcess = execa('stdin.js', {stdout: [stream, 'pipe']});
	stream.end();
	childProcess.stdin.end();
	const error = await t.throwsAsync(childProcess, {code: 'ERR_STREAM_PREMATURE_CLOSE'});
	assertStreamError(t, error);
});

const testStreamAbort = async (t, stream, index) => {
	const childProcess = execa(getStreamFixtureName(index), getStdio(index, [stream, 'pipe']));
	stream.destroy();
	const error = await t.throwsAsync(childProcess, {code: 'ERR_STREAM_PREMATURE_CLOSE'});
	assertStreamError(t, error);
};

test('Handles input streams aborts', testStreamAbort, noopReadable(), 0);
test('Handles input Duplex streams aborts', testStreamAbort, noopDuplex(), 0);
test('Handles output streams aborts', testStreamAbort, noopWritable(), 1);
test('Handles output Duplex streams aborts', testStreamAbort, noopDuplex(), 1);

const testStreamError = async (t, stream, index) => {
	const childProcess = execa(getStreamFixtureName(index), getStdio(index, [stream, 'pipe']));
	const error = new Error('test');
	stream.destroy(error);
	t.is(await t.throwsAsync(childProcess), error);
	assertStreamError(t, error);
};

test('Handles input streams errors', testStreamError, noopReadable(), 0);
test('Handles input Duplex streams errors', testStreamError, noopDuplex(), 0);
test('Handles output streams errors', testStreamError, noopWritable(), 1);
test('Handles output Duplex streams errors', testStreamError, noopDuplex(), 1);

const testChildStreamEnd = async (t, stream) => {
	const childProcess = execa('stdin.js', {stdin: [stream, 'pipe']});
	childProcess.stdin.end();
	const error = await t.throwsAsync(childProcess, {code: 'ERR_STREAM_PREMATURE_CLOSE'});
	assertStreamError(t, error);
	t.true(stream.destroyed);
};

test('Handles childProcess.stdin end', testChildStreamEnd, noopReadable());
test('Handles childProcess.stdin Duplex end', testChildStreamEnd, noopDuplex());

const testChildStreamAbort = async (t, stream, index) => {
	const childProcess = execa(getStreamFixtureName(index), getStdio(index, [stream, 'pipe']));
	childProcess.stdio[index].destroy();
	const error = await t.throwsAsync(childProcess, {code: 'ERR_STREAM_PREMATURE_CLOSE'});
	assertStreamError(t, error);
	t.true(stream.destroyed);
};

test('Handles childProcess.stdin aborts', testChildStreamAbort, noopReadable(), 0);
test('Handles childProcess.stdin Duplex aborts', testChildStreamAbort, noopDuplex(), 0);
test('Handles childProcess.stdout aborts', testChildStreamAbort, noopWritable(), 1);
test('Handles childProcess.stdout Duplex aborts', testChildStreamAbort, noopDuplex(), 1);

const testChildStreamError = async (t, stream, index) => {
	const childProcess = execa(getStreamFixtureName(index), getStdio(index, [stream, 'pipe']));
	const error = new Error('test');
	childProcess.stdio[index].destroy(error);
	t.is(await t.throwsAsync(childProcess), error);
	assertStreamError(t, error);
	t.true(stream.destroyed);
};

test('Handles childProcess.stdin errors', testChildStreamError, noopReadable(), 0);
test('Handles childProcess.stdin Duplex errors', testChildStreamError, noopDuplex(), 0);
test('Handles childProcess.stdout errors', testChildStreamError, noopWritable(), 1);
test('Handles childProcess.stdout Duplex errors', testChildStreamError, noopDuplex(), 1);
