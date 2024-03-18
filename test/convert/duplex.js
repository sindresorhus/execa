import {compose, Readable, Writable, PassThrough} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {text} from 'node:stream/consumers';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {
	finishedStream,
	assertReadableAborted,
	assertWritableAborted,
	assertProcessNormalExit,
	assertStreamOutput,
	assertStreamError,
	assertStreamReadError,
	assertSubprocessOutput,
	assertSubprocessError,
	assertPromiseError,
	getReadWriteSubprocess,
} from '../helpers/convert.js';
import {foobarString} from '../helpers/input.js';
import {prematureClose, fullStdio, fullReadableStdio} from '../helpers/stdio.js';
import {defaultHighWaterMark} from '../helpers/stream.js';

setFixtureDir();

test('.duplex() success', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();

	t.true(stream instanceof Writable);
	t.true(stream.writable);
	t.true(stream instanceof Readable);
	t.true(stream.readable);

	stream.end(foobarString);

	await assertStreamOutput(t, stream);
	await assertSubprocessOutput(t, subprocess);
});

// eslint-disable-next-line max-params
const testReadableDuplexDefault = async (t, fdNumber, from, options, hasResult) => {
	const subprocess = execa('noop-stdin-fd.js', [`${fdNumber}`], options);
	const stream = subprocess.duplex({from});
	stream.end(foobarString);

	await assertStreamOutput(t, stream, hasResult ? foobarString : '');
	await assertSubprocessOutput(t, subprocess, foobarString, fdNumber);
};

test('.duplex() can use stdout', testReadableDuplexDefault, 1, 1, {}, true);
test('.duplex() can use stderr', testReadableDuplexDefault, 2, 2, {}, true);
test('.duplex() can use output stdio[*]', testReadableDuplexDefault, 3, 3, fullStdio, true);
test('.duplex() uses stdout by default', testReadableDuplexDefault, 1, undefined, {}, true);
test('.duplex() does not use stderr by default', testReadableDuplexDefault, 2, undefined, {}, false);
test('.duplex() does not use stdio[*] by default', testReadableDuplexDefault, 3, undefined, fullStdio, false);
test('.duplex() uses stdout even if stderr is "ignore"', testReadableDuplexDefault, 1, 1, {stderr: 'ignore'}, true);
test('.duplex() uses stderr even if stdout is "ignore"', testReadableDuplexDefault, 2, 2, {stdout: 'ignore'}, true);
test('.duplex() uses stdout if "all" is used', testReadableDuplexDefault, 1, 'all', {all: true}, true);
test('.duplex() uses stderr if "all" is used', testReadableDuplexDefault, 2, 'all', {all: true}, true);

const testWritableDuplexDefault = async (t, fdNumber, to, options) => {
	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], options);
	const stream = subprocess.duplex({to});

	stream.end(foobarString);

	await assertStreamOutput(t, stream, foobarString);
	await assertSubprocessOutput(t, subprocess);
};

test('.duplex() can use stdin', testWritableDuplexDefault, 0, 0, {});
test('.duplex() can use input stdio[*]', testWritableDuplexDefault, 3, 3, fullReadableStdio());
test('.duplex() uses stdin by default', testWritableDuplexDefault, 0, undefined, {});

test('.duplex() abort -> subprocess fail', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();
	const textPromise = text(stream);

	stream.destroy();

	const error = await t.throwsAsync(textPromise);
	t.like(error, prematureClose);
	assertProcessNormalExit(t, error);
	assertWritableAborted(t, subprocess.stdin);
	assertReadableAborted(t, subprocess.stdout);
	t.true(subprocess.stderr.readableEnded);
	await assertSubprocessError(t, subprocess, error);
});

test('.duplex() error -> subprocess fail', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();

	const cause = new Error(foobarString);
	stream.destroy(cause);

	const error = await assertStreamError(t, stream, {cause});
	assertProcessNormalExit(t, error);
	t.is(subprocess.stdin.errored, cause);
	t.is(subprocess.stdout.errored, cause);
	t.true(subprocess.stderr.readableEnded);
	await assertSubprocessError(t, subprocess, error);
});

test('.duplex() can be used with Stream.pipeline()', async t => {
	const subprocess = getReadWriteSubprocess();
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.duplex();
	const outputStream = new PassThrough();

	await pipeline(inputStream, stream, outputStream);

	await finishedStream(inputStream);
	await finishedStream(stream);
	await assertStreamOutput(t, outputStream);
	await assertSubprocessOutput(t, subprocess);
});

test('.duplex() can error with Stream.pipeline()', async t => {
	const subprocess = execa('stdin-fail.js');
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.duplex();
	const outputStream = new PassThrough();

	const error = await t.throwsAsync(pipeline(inputStream, stream, outputStream));
	assertProcessNormalExit(t, error, 2);
	t.like(error, {stdout: foobarString});

	await finishedStream(inputStream);
	await assertStreamError(t, stream, error);
	await assertStreamReadError(t, outputStream, error);
	await assertSubprocessError(t, subprocess, error);
});

test('.duplex() can pipe to errored stream with Stream.pipeline()', async t => {
	const subprocess = execa('stdin-fail.js');
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.duplex();
	const outputStream = new PassThrough();

	const cause = new Error('test');
	outputStream.destroy(cause);

	await assertPromiseError(t, pipeline(inputStream, stream, outputStream), cause);

	await assertStreamError(t, inputStream, cause);
	const error = await assertStreamError(t, stream, {cause});
	await assertStreamReadError(t, outputStream, cause);
	await assertSubprocessError(t, subprocess, error);
});

test('.duplex() can be piped to errored stream with Stream.pipeline()', async t => {
	const subprocess = execa('stdin-fail.js');
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.duplex();
	const outputStream = new PassThrough();

	const cause = new Error('test');
	inputStream.destroy(cause);

	await assertPromiseError(t, pipeline(inputStream, stream, outputStream), cause);

	await assertStreamError(t, inputStream, cause);
	const error = await assertStreamError(t, stream, {cause});
	await assertStreamReadError(t, outputStream, cause);
	await assertSubprocessError(t, subprocess, error);
});

test('.duplex() can be used with Stream.compose()', async t => {
	const subprocess = getReadWriteSubprocess();
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.duplex();
	const outputStream = new PassThrough();

	await assertStreamOutput(t, compose(inputStream, stream, outputStream));
	await assertSubprocessOutput(t, subprocess);
});

test('.duplex() has the right highWaterMark', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();
	t.is(stream.readableHighWaterMark, defaultHighWaterMark);
	t.is(stream.writableHighWaterMark, defaultHighWaterMark);
	stream.end();
	await text(stream);
});
