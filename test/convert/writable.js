import {once} from 'node:events';
import {compose, Readable, Writable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {text} from 'node:stream/consumers';
import {setTimeout, scheduler} from 'node:timers/promises';
import {promisify} from 'node:util';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {
	finishedStream,
	assertWritableAborted,
	assertProcessNormalExit,
	assertStreamOutput,
	assertStreamError,
	assertSubprocessOutput,
	assertSubprocessError,
	assertPromiseError,
	getWritableSubprocess,
	getReadableSubprocess,
	getReadWriteSubprocess,
} from '../helpers/convert.js';
import {foobarString, foobarBuffer, foobarObject, foobarObjectString} from '../helpers/input.js';
import {prematureClose, fullReadableStdio} from '../helpers/stdio.js';
import {
	throwingGenerator,
	GENERATOR_ERROR_REGEXP,
	serializeGenerator,
	noopAsyncGenerator,
} from '../helpers/generator.js';
import {defaultHighWaterMark, defaultObjectHighWaterMark} from '../helpers/stream.js';

setFixtureDir();

test('.writable() success', async t => {
	const subprocess = getWritableSubprocess();
	const stream = subprocess.writable();

	t.true(stream instanceof Writable);
	t.true(stream.writable);
	t.false(stream instanceof Readable);
	t.is(stream.readable, undefined);

	stream.end(foobarString);

	await finishedStream(stream);
	await assertSubprocessOutput(t, subprocess, foobarString, 2);
});

const testWritableDefault = async (t, fdNumber, to, options) => {
	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], options);
	const stream = subprocess.writable({to});

	stream.end(foobarString);

	await finishedStream(stream);
	await assertSubprocessOutput(t, subprocess);
};

test('.writable() can use stdin', testWritableDefault, 0, 'stdin', {});
test('.writable() can use stdio[*]', testWritableDefault, 3, 'fd3', fullReadableStdio());
test('.writable() uses stdin by default', testWritableDefault, 0, undefined, {});

test('.writable() hangs until ended', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.writable();

	stream.write(foobarString);
	await setTimeout(1e2);
	stream.end();

	await finishedStream(stream);
	await assertSubprocessOutput(t, subprocess);
});

test('.duplex() hangs until ended', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();

	stream.write(foobarString);
	await setTimeout(1e2);
	stream.end();

	await assertStreamOutput(t, stream);
	await assertSubprocessOutput(t, subprocess);
});

const testEarlySuccess = async (t, methodName, hasWrites) => {
	const subprocess = hasWrites ? getReadableSubprocess() : execa('empty.js');
	const stream = subprocess[methodName]();

	const error = await t.throwsAsync(finishedStream(stream));
	t.like(error, prematureClose);
	assertWritableAborted(t, subprocess.stdin);
	t.true(subprocess.stdout.readableEnded);
	t.true(subprocess.stderr.readableEnded);
	await assertSubprocessOutput(t, subprocess, hasWrites ? foobarString : '');
};

test('subprocess early success with no writes -> .writable() abort', testEarlySuccess, 'writable', false);
test('subprocess early success with no writes -> .duplex() abort', testEarlySuccess, 'duplex', false);
test('subprocess early success with writes -> .writable() abort', testEarlySuccess, 'writable', true);
test('subprocess early success with writes -> .duplex() abort', testEarlySuccess, 'duplex', true);

test('.writable() abort -> subprocess fail', async t => {
	const subprocess = getWritableSubprocess();
	const stream = subprocess.writable();

	stream.destroy();

	const error = await t.throwsAsync(finishedStream(stream));
	t.like(error, prematureClose);
	assertProcessNormalExit(t, error);
	assertWritableAborted(t, subprocess.stdin);
	t.true(subprocess.stdout.readableEnded);
	t.true(subprocess.stderr.readableEnded);
	await assertSubprocessError(t, subprocess, error);
});

test('.writable() error -> subprocess fail', async t => {
	const subprocess = getWritableSubprocess();
	const stream = subprocess.writable();

	const cause = new Error(foobarString);
	stream.destroy(cause);

	const error = await assertStreamError(t, stream, {cause});
	assertProcessNormalExit(t, error);
	t.is(subprocess.stdin.errored, cause);
	t.true(subprocess.stdout.readableEnded);
	t.true(subprocess.stderr.readableEnded);
	await assertSubprocessError(t, subprocess, error);
});

test('.writable() EPIPE error -> subprocess success', async t => {
	const subprocess = getWritableSubprocess();
	const stream = subprocess.writable();

	const error = new Error(foobarString);
	error.code = 'EPIPE';
	stream.destroy(error);

	await assertStreamError(t, stream, error);
	t.is(subprocess.stdin.errored, error);
	t.true(subprocess.stdout.readableEnded);
	t.true(subprocess.stderr.readableEnded);
	await subprocess;
});

test('subprocess.stdin end -> .writable() end + subprocess success', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.writable();

	subprocess.stdin.end(foobarString);

	await finishedStream(stream);
	await assertSubprocessOutput(t, subprocess);
});

test('subprocess.stdin end -> .duplex() end + subprocess success', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();

	subprocess.stdin.end(foobarString);

	await assertStreamOutput(t, stream);
	await assertSubprocessOutput(t, subprocess);
});

const testStdinAbort = async (t, methodName) => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();

	subprocess.stdin.destroy();

	const error = await t.throwsAsync(finishedStream(stream));
	t.like(error, prematureClose);
	assertProcessNormalExit(t, error);
	assertWritableAborted(t, subprocess.stdin);
	t.true(subprocess.stdout.readableEnded);
	t.true(subprocess.stderr.readableEnded);
	await assertSubprocessError(t, subprocess, error);
};

test('subprocess.stdin abort -> .writable() error + subprocess fail', testStdinAbort, 'writable');
test('subprocess.stdin abort -> .duplex() error + subprocess fail', testStdinAbort, 'duplex');

const testStdinError = async (t, methodName) => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();

	const cause = new Error(foobarString);
	subprocess.stdin.destroy(cause);

	const error = await assertStreamError(t, stream, {cause});
	assertProcessNormalExit(t, error);
	t.is(subprocess.stdin.errored, cause);
	t.true(subprocess.stderr.readableEnded);
	t.true(subprocess.stdout.readableEnded);
	await assertSubprocessError(t, subprocess, error);
};

test('subprocess.stdin error -> .writable() error + subprocess fail', testStdinError, 'writable');
test('subprocess.stdin error -> .duplex() error + subprocess fail', testStdinError, 'duplex');

test('.writable() can be used with Stream.pipeline()', async t => {
	const subprocess = getWritableSubprocess();
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.writable();

	await pipeline(inputStream, stream);

	await finishedStream(inputStream);
	await finishedStream(stream);
	await assertSubprocessOutput(t, subprocess, foobarString, 2);
});

test('.writable() can error with Stream.pipeline()', async t => {
	const subprocess = execa('noop-stdin-fail.js', ['2']);
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.writable();

	const error = await t.throwsAsync(pipeline(inputStream, stream));
	assertProcessNormalExit(t, error, 2);
	t.is(error.stderr, foobarString);

	await finishedStream(inputStream);
	await assertStreamError(t, stream, error);
	await assertSubprocessError(t, subprocess, error);
});

test('.writable() can pipe to errored stream with Stream.pipeline()', async t => {
	const subprocess = getWritableSubprocess();
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.writable();

	const cause = new Error('test');
	inputStream.destroy(cause);

	await assertPromiseError(t, pipeline(inputStream, stream), cause);

	await assertStreamError(t, inputStream, cause);
	const error = await assertStreamError(t, stream, {cause});
	await assertSubprocessError(t, subprocess, error);
});

test('.writable() can be used with Stream.compose()', async t => {
	const subprocess = getWritableSubprocess();
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.writable();

	await finishedStream(compose(inputStream, stream));
	await assertSubprocessOutput(t, subprocess, foobarString, 2);
});

test('.writable() works with objectMode', async t => {
	const subprocess = getReadWriteSubprocess({stdin: serializeGenerator});
	const stream = subprocess.writable();
	t.true(stream.writableObjectMode);
	t.is(stream.writableHighWaterMark, defaultObjectHighWaterMark);
	stream.end(foobarObject);

	await finishedStream(stream);
	await assertSubprocessOutput(t, subprocess, foobarObjectString);
});

test('.duplex() works with objectMode and writes', async t => {
	const subprocess = getReadWriteSubprocess({stdin: serializeGenerator});
	const stream = subprocess.duplex();
	t.false(stream.readableObjectMode);
	t.is(stream.readableHighWaterMark, defaultHighWaterMark);
	t.true(stream.writableObjectMode);
	t.is(stream.writableHighWaterMark, defaultObjectHighWaterMark);
	stream.end(foobarObject);

	await assertStreamOutput(t, stream, foobarObjectString);
	await assertSubprocessOutput(t, subprocess, foobarObjectString);
});

test('.writable() has the right highWaterMark', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.writable();
	t.is(stream.writableHighWaterMark, defaultHighWaterMark);
	stream.end();
	await finishedStream(stream);
});

const writeUntilFull = async (t, stream, subprocess) => {
	const size = stream.writableHighWaterMark / 2;
	const chunk = '.'.repeat(size);

	t.is(subprocess.stdin.writableLength, 0);
	t.is(stream.writableLength, 0);
	t.false(subprocess.stdin.writableNeedDrain);
	t.false(stream.writableNeedDrain);

	t.true(stream.write(chunk));
	t.is(subprocess.stdin.writableLength, size);
	t.is(stream.writableLength, 0);
	t.false(subprocess.stdin.writableNeedDrain);
	t.false(stream.writableNeedDrain);

	t.true(stream.write(chunk));
	t.is(subprocess.stdin.writableLength, size * 2);
	t.is(stream.writableLength, size);
	t.true(subprocess.stdin.writableNeedDrain);
	t.false(stream.writableNeedDrain);

	t.false(stream.write(chunk));
	t.is(subprocess.stdin.writableLength, size * 2);
	t.is(stream.writableLength, size * 2);
	t.true(subprocess.stdin.writableNeedDrain);
	t.true(stream.writableNeedDrain);

	await once(stream, 'drain');
	stream.end();

	return '.'.repeat(size * 3);
};

test('.writable() waits when its buffer is full', async t => {
	const subprocess = getReadWriteSubprocess({stdin: noopAsyncGenerator()});
	const stream = subprocess.writable();

	const expectedOutput = await writeUntilFull(t, stream, subprocess);

	await assertSubprocessOutput(t, subprocess, expectedOutput);
});

test('.duplex() waits when its buffer is full', async t => {
	const subprocess = getReadWriteSubprocess({stdin: noopAsyncGenerator()});
	const stream = subprocess.duplex();

	const expectedOutput = await writeUntilFull(t, stream, subprocess);

	await assertStreamOutput(t, stream, expectedOutput);
	await assertSubprocessOutput(t, subprocess, expectedOutput);
});

const testPropagateError = async (t, methodName) => {
	const subprocess = getReadWriteSubprocess({stdin: throwingGenerator});
	const stream = subprocess[methodName]();
	stream.end('.');
	await t.throwsAsync(finishedStream(stream), {message: GENERATOR_ERROR_REGEXP});
};

test('.writable() propagates write errors', testPropagateError, 'writable');
test('.duplex() propagates write errors', testPropagateError, 'duplex');

const testWritev = async (t, methodName, waitForStream) => {
	const subprocess = getReadWriteSubprocess({stdin: noopAsyncGenerator()});
	const stream = subprocess[methodName]();

	const chunk = '.'.repeat(stream.writableHighWaterMark);
	stream.write(chunk);
	t.true(stream.writableNeedDrain);

	const [writeInOneTick] = await Promise.race([
		Promise.all([true, promisify(stream.write.bind(stream))(chunk)]),
		Promise.all([false, scheduler.yield()]),
	]);
	t.true(writeInOneTick);

	stream.end();
	await waitForStream(stream);
};

test('.writable() can use .writev()', testWritev, 'writable', finishedStream);
test('.duplex() can use .writev()', testWritev, 'duplex', text);

test('.writable() can set encoding', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.writable();

	stream.end(foobarBuffer.toString('hex'), 'hex');

	await finishedStream(stream);
	await assertSubprocessOutput(t, subprocess);
});

test('.duplex() can set encoding', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();

	stream.end(foobarBuffer.toString('hex'), 'hex');

	await assertStreamOutput(t, stream);
	await assertSubprocessOutput(t, subprocess);
});
