import assert from 'node:assert/strict';
import {once} from 'node:events';
import {compose, Readable, Writable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {text} from 'node:stream/consumers';
import {setTimeout, scheduler} from 'node:timers/promises';
import {promisify} from 'node:util';
import test from 'node:test';
import {assertRejects, assertLike} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
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
import {
	foobarString,
	foobarBuffer,
	foobarObject,
	foobarObjectString,
} from '../helpers/input.js';
import {getStdio, prematureClose, fullReadableStdio} from '../helpers/stdio.js';
import {
	throwingGenerator,
	serializeGenerator,
	noopAsyncGenerator,
} from '../helpers/generator.js';
import {defaultHighWaterMark, defaultObjectHighWaterMark} from '../helpers/stream.js';

setFixtureDirectory();

test('.writable() success', async () => {
	const subprocess = getWritableSubprocess();
	const stream = subprocess.writable();

	assert.ok(stream instanceof Writable);
	assert.equal(stream.writable, true);
	assert.ok(!(stream instanceof Readable));
	assert.equal(stream.readable, undefined);

	stream.end(foobarString);

	await finishedStream(stream);
	await assertSubprocessOutput(subprocess, foobarString, 2);
});

const testWritableDefault = async (fdNumber, to, options) => {
	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], options);
	const stream = subprocess.writable({to});

	stream.end(foobarString);

	await finishedStream(stream);
	await assertSubprocessOutput(subprocess);
};

test('.writable() can use stdin', () => testWritableDefault(0, 'stdin', {}));
test('.writable() can use stdio[*]', () => testWritableDefault(3, 'fd3', fullReadableStdio()));
test('.writable() can use stdio[*] with { value: "pipe", input: true }', () => testWritableDefault(3, 'fd3', getStdio(3, {value: 'pipe', input: true})));
test('.writable() can use stdio[*] with [{ value: "pipe", input: true }, "pipe"]', () => testWritableDefault(3, 'fd3', getStdio(3, [{value: 'pipe', input: true}, 'pipe'])));
test('.writable() uses stdin by default', () => testWritableDefault(0, undefined, {}));

test('.writable() hangs until ended', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.writable();

	stream.write(foobarString);
	await setTimeout(1e2);
	stream.end();

	await finishedStream(stream);
	await assertSubprocessOutput(subprocess);
});

test('.duplex() hangs until ended', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();

	stream.write(foobarString);
	await setTimeout(1e2);
	stream.end();

	await assertStreamOutput(stream);
	await assertSubprocessOutput(subprocess);
});

const testEarlySuccess = async (methodName, hasWrites) => {
	const subprocess = hasWrites ? getReadableSubprocess() : execa('empty.js');
	const stream = subprocess[methodName]();

	const error = await assertRejects(finishedStream(stream));
	assertLike(error, prematureClose);
	assertWritableAborted(subprocess.stdin);
	assert.equal(subprocess.stdout.readableEnded, true);
	assert.equal(subprocess.stderr.readableEnded, true);
	await assertSubprocessOutput(subprocess, hasWrites ? foobarString : '');
};

test('subprocess early success with no writes -> .writable() abort', () => testEarlySuccess('writable', false));
test('subprocess early success with no writes -> .duplex() abort', () => testEarlySuccess('duplex', false));
test('subprocess early success with writes -> .writable() abort', () => testEarlySuccess('writable', true));
test('subprocess early success with writes -> .duplex() abort', () => testEarlySuccess('duplex', true));

test('.writable() abort -> subprocess fail', async () => {
	const subprocess = getWritableSubprocess();
	const stream = subprocess.writable();

	stream.destroy();

	const error = await assertRejects(finishedStream(stream));
	assertLike(error, prematureClose);
	assertProcessNormalExit(error);
	assertWritableAborted(subprocess.stdin);
	assert.equal(subprocess.stdout.readableEnded, true);
	assert.equal(subprocess.stderr.readableEnded, true);
	await assertSubprocessError(subprocess, error);
});

test('.writable() error -> subprocess fail', async () => {
	const subprocess = getWritableSubprocess();
	const stream = subprocess.writable();

	const cause = new Error(foobarString);
	stream.destroy(cause);

	const error = await assertStreamError(stream, {cause});
	assertProcessNormalExit(error);
	assert.equal(subprocess.stdin.errored, cause);
	assert.equal(subprocess.stdout.readableEnded, true);
	assert.equal(subprocess.stderr.readableEnded, true);
	await assertSubprocessError(subprocess, error);
});

test('.writable() EPIPE error -> subprocess success', async () => {
	const subprocess = getWritableSubprocess();
	const stream = subprocess.writable();

	const error = new Error(foobarString);
	error.code = 'EPIPE';
	stream.destroy(error);

	await assertStreamError(stream, error);
	assert.equal(subprocess.stdin.errored, error);
	assert.equal(subprocess.stdout.readableEnded, true);
	assert.equal(subprocess.stderr.readableEnded, true);
	await subprocess;
});

test('subprocess.stdin end -> .writable() end + subprocess success', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.writable();

	subprocess.stdin.end(foobarString);

	await finishedStream(stream);
	await assertSubprocessOutput(subprocess);
});

test('subprocess.stdin end -> .duplex() end + subprocess success', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();

	subprocess.stdin.end(foobarString);

	await assertStreamOutput(stream);
	await assertSubprocessOutput(subprocess);
});

const testStdinAbort = async methodName => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();

	subprocess.stdin.destroy();

	const error = await assertRejects(finishedStream(stream));
	assertLike(error, prematureClose);
	assertWritableAborted(subprocess.stdin);
	assert.equal(subprocess.stdout.readableEnded, true);
	assert.equal(subprocess.stderr.readableEnded, true);
	const subprocessError = await assertRejects(subprocess);
	assertLike(subprocessError, prematureClose);
	assertLike(subprocessError.cause, prematureClose);
	assertProcessNormalExit(subprocessError);
};

test('subprocess.stdin abort -> .writable() error + subprocess fail', () => testStdinAbort('writable'));
test('subprocess.stdin abort -> .duplex() error + subprocess fail', () => testStdinAbort('duplex'));

const testStdinError = async methodName => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();

	const cause = new Error(foobarString);
	subprocess.stdin.destroy(cause);

	const error = await assertStreamError(stream, {cause});
	assertProcessNormalExit(error);
	assert.equal(subprocess.stdin.errored, cause);
	assert.equal(subprocess.stderr.readableEnded, true);
	assert.equal(subprocess.stdout.readableEnded, true);
	await assertSubprocessError(subprocess, error);
};

test('subprocess.stdin error -> .writable() error + subprocess fail', () => testStdinError('writable'));
test('subprocess.stdin error -> .duplex() error + subprocess fail', () => testStdinError('duplex'));

test('.writable() can be used with Stream.pipeline()', async () => {
	const subprocess = getWritableSubprocess();
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.writable();

	await pipeline(inputStream, stream);

	await finishedStream(inputStream);
	await finishedStream(stream);
	await assertSubprocessOutput(subprocess, foobarString, 2);
});

test('.writable() can error with Stream.pipeline()', async () => {
	const subprocess = execa('noop-stdin-fail.js', ['2']);
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.writable();

	const error = await assertRejects(pipeline(inputStream, stream));
	assertProcessNormalExit(error, 2);
	assert.equal(error.stderr, foobarString);

	await finishedStream(inputStream);
	await assertStreamError(stream, error);
	await assertSubprocessError(subprocess, error);
});

test('.writable() can pipe to errored stream with Stream.pipeline()', async () => {
	const subprocess = getWritableSubprocess();
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.writable();

	const cause = new Error('test');
	inputStream.destroy(cause);

	await assertPromiseError(pipeline(inputStream, stream), cause);
	await assertRejects(finishedStream(stream));

	await assertStreamError(inputStream, cause);
	const error = await assertStreamError(stream, cause);
	await assertSubprocessError(subprocess, {cause: error});
});

test('.writable() can be used with Stream.compose()', async () => {
	const subprocess = getWritableSubprocess();
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.writable();

	await finishedStream(compose(inputStream, stream));
	await assertSubprocessOutput(subprocess, foobarString, 2);
});

test('.writable() works with objectMode', async () => {
	const subprocess = getReadWriteSubprocess({stdin: serializeGenerator(true, true)});
	const stream = subprocess.writable();
	assert.equal(stream.writableObjectMode, true);
	assert.equal(stream.writableHighWaterMark, defaultObjectHighWaterMark);
	stream.end(foobarObject);

	await finishedStream(stream);
	await assertSubprocessOutput(subprocess, foobarObjectString);
});

test('.duplex() works with objectMode and writes', async () => {
	const subprocess = getReadWriteSubprocess({stdin: serializeGenerator(true, true)});
	const stream = subprocess.duplex();
	assert.equal(stream.readableObjectMode, false);
	assert.equal(stream.readableHighWaterMark, defaultHighWaterMark);
	assert.equal(stream.writableObjectMode, true);
	assert.equal(stream.writableHighWaterMark, defaultObjectHighWaterMark);
	stream.end(foobarObject);

	await assertStreamOutput(stream, foobarObjectString);
	await assertSubprocessOutput(subprocess, foobarObjectString);
});

test('.writable() has the right highWaterMark', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.writable();
	assert.equal(stream.writableHighWaterMark, defaultHighWaterMark);
	stream.end();
	await finishedStream(stream);
});

const writeUntilFull = async (stream, subprocess) => {
	const size = stream.writableHighWaterMark / 2;
	const chunk = '.'.repeat(size);

	assert.equal(subprocess.stdin.writableLength, 0);
	assert.equal(stream.writableLength, 0);
	assert.equal(subprocess.stdin.writableNeedDrain, false);
	assert.equal(stream.writableNeedDrain, false);

	assert.ok(stream.write(chunk));
	assert.equal(subprocess.stdin.writableLength, size);
	assert.equal(stream.writableLength, 0);
	assert.equal(subprocess.stdin.writableNeedDrain, false);
	assert.equal(stream.writableNeedDrain, false);

	assert.ok(stream.write(chunk));
	assert.equal(subprocess.stdin.writableLength, size * 2);
	assert.equal(stream.writableLength, size);
	assert.equal(subprocess.stdin.writableNeedDrain, true);
	assert.equal(stream.writableNeedDrain, false);

	assert.ok(!stream.write(chunk));
	assert.equal(subprocess.stdin.writableLength, size * 2);
	assert.equal(stream.writableLength, size * 2);
	assert.equal(subprocess.stdin.writableNeedDrain, true);
	assert.equal(stream.writableNeedDrain, true);

	await once(stream, 'drain');
	stream.end();

	return '.'.repeat(size * 3);
};

test('.writable() waits when its buffer is full', async () => {
	const subprocess = getReadWriteSubprocess({stdin: noopAsyncGenerator(false, true)});
	const stream = subprocess.writable();

	const expectedOutput = await writeUntilFull(stream, subprocess);

	await assertSubprocessOutput(subprocess, expectedOutput);
});

test('.duplex() waits when its buffer is full', async () => {
	const subprocess = getReadWriteSubprocess({stdin: noopAsyncGenerator(false, true)});
	const stream = subprocess.duplex();

	const expectedOutput = await writeUntilFull(stream, subprocess);

	await assertStreamOutput(stream, expectedOutput);
	await assertSubprocessOutput(subprocess, expectedOutput);
});

const testPropagateError = async methodName => {
	const cause = new Error(foobarString);
	const subprocess = getReadWriteSubprocess({stdin: throwingGenerator(cause)()});
	const stream = subprocess[methodName]();
	stream.end('.');
	await assertStreamError(stream, {cause});
};

test('.writable() propagates write errors', () => testPropagateError('writable'));
test('.duplex() propagates write errors', () => testPropagateError('duplex'));

const testWritev = async (methodName, waitForStream) => {
	const subprocess = getReadWriteSubprocess({stdin: noopAsyncGenerator()});
	const stream = subprocess[methodName]();

	const chunk = '.'.repeat(stream.writableHighWaterMark);
	stream.write(chunk);
	assert.equal(stream.writableNeedDrain, true);

	const [writeInOneTick] = await Promise.race([
		Promise.all([true, promisify(stream.write.bind(stream))(chunk)]),
		Promise.all([false, scheduler.yield()]),
	]);
	assert.equal(writeInOneTick, true);

	stream.end();
	await waitForStream(stream);
};

test('.writable() can use .writev()', () => testWritev('writable', finishedStream));
test('.duplex() can use .writev()', () => testWritev('duplex', text));

test('.writable() can set encoding', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.writable();

	stream.end(foobarBuffer.toString('hex'), 'hex');

	await finishedStream(stream);
	await assertSubprocessOutput(subprocess);
});

test('.duplex() can set encoding', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();

	stream.end(foobarBuffer.toString('hex'), 'hex');

	await assertStreamOutput(stream);
	await assertSubprocessOutput(subprocess);
});
