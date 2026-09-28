import assert from 'node:assert/strict';
import {pipeline} from 'node:stream/promises';
import {text} from 'node:stream/consumers';
import test from 'node:test';
import {
	compose,
	Readable,
	Writable,
	PassThrough,
} from 'node:stream';
import {assertRejects, assertLike} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
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
import {majorNodeVersion} from '../helpers/node-version.js';
import {
	getStdio,
	prematureClose,
	fullStdio,
	fullReadableStdio,
} from '../helpers/stdio.js';
import {defaultHighWaterMark} from '../helpers/stream.js';

setFixtureDirectory();

test('.duplex() success', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();

	assert.ok(stream instanceof Writable);
	assert.equal(stream.writable, true);
	assert.ok(stream instanceof Readable);
	assert.equal(stream.readable, true);

	stream.end(foobarString);

	await assertStreamOutput(stream);
	await assertSubprocessOutput(subprocess);
});

const testReadableDuplexDefault = async (fdNumber, from, options, hasResult) => {
	const subprocess = execa('noop-stdin-fd.js', [`${fdNumber}`], options);
	const stream = subprocess.duplex({from});
	stream.end(foobarString);

	await assertStreamOutput(stream, hasResult ? foobarString : '');
	await assertSubprocessOutput(subprocess, foobarString, fdNumber);
};

test('.duplex() can use stdout', () => testReadableDuplexDefault(1, 'stdout', {}, true));
test('.duplex() can use stderr', () => testReadableDuplexDefault(2, 'stderr', {}, true));
test('.duplex() can use output stdio[*]', () => testReadableDuplexDefault(3, 'fd3', fullStdio, true));
test('.duplex() uses stdout by default', () => testReadableDuplexDefault(1, undefined, {}, true));
test('.duplex() does not use stderr by default', () => testReadableDuplexDefault(2, undefined, {}, false));
test('.duplex() does not use stdio[*] by default', () => testReadableDuplexDefault(3, undefined, fullStdio, false));
test('.duplex() uses stdout even if stderr is "ignore"', () => testReadableDuplexDefault(1, 'stdout', {stderr: 'ignore'}, true));
test('.duplex() uses stderr even if stdout is "ignore"', () => testReadableDuplexDefault(2, 'stderr', {stdout: 'ignore'}, true));
test('.duplex() uses stdout if "all" is used', () => testReadableDuplexDefault(1, 'all', {all: true}, true));
test('.duplex() uses stderr if "all" is used', () => testReadableDuplexDefault(2, 'all', {all: true}, true));

const testWritableDuplexDefault = async (fdNumber, to, options) => {
	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], options);
	const stream = subprocess.duplex({to});

	stream.end(foobarString);

	await assertStreamOutput(stream, foobarString);
	await assertSubprocessOutput(subprocess);
};

test('.duplex() can use stdin', () => testWritableDuplexDefault(0, 'stdin', {}));
test('.duplex() can use input stdio[*]', () => testWritableDuplexDefault(3, 'fd3', fullReadableStdio()));
test('.duplex() can use input stdio[*] with { value: "pipe", input: true }', () => testWritableDuplexDefault(3, 'fd3', getStdio(3, {value: 'pipe', input: true})));
test('.duplex() uses stdin by default', () => testWritableDuplexDefault(0, undefined, {}));

test('.duplex() abort -> subprocess fail', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();
	const textPromise = text(stream);

	stream.destroy();

	const error = await assertRejects(textPromise);
	assertLike(error, prematureClose);
	assertProcessNormalExit(error);
	assertWritableAborted(subprocess.stdin);
	assertReadableAborted(subprocess.stdout);
	assert.equal(subprocess.stderr.readableEnded, true);
	await assertSubprocessError(subprocess, error);
});

test('.duplex() error -> subprocess fail', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();

	const cause = new Error(foobarString);
	stream.destroy(cause);

	const error = await assertStreamError(stream, {cause});
	assertProcessNormalExit(error);
	assert.equal(subprocess.stdin.errored, cause);
	assert.equal(subprocess.stdout.errored, cause);
	assert.equal(subprocess.stderr.readableEnded, true);
	await assertSubprocessError(subprocess, error);
});

test('.duplex() can be used with Stream.pipeline()', async () => {
	const subprocess = getReadWriteSubprocess();
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.duplex();
	const outputStream = new PassThrough();

	await pipeline(inputStream, stream, outputStream);

	await finishedStream(inputStream);
	await finishedStream(stream);
	await assertStreamOutput(outputStream);
	await assertSubprocessOutput(subprocess);
});

test('.duplex() can error with Stream.pipeline()', async () => {
	const subprocess = execa('stdin-fail.js');
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.duplex();
	const outputStream = new PassThrough();

	const error = await assertRejects(pipeline(inputStream, stream, outputStream));
	assertProcessNormalExit(error, 2);
	assertLike(error, {stdout: foobarString});

	await finishedStream(inputStream);
	await assertStreamError(stream, error);
	await assertStreamReadError(outputStream, error);
	await assertSubprocessError(subprocess, error);
});

test('.duplex() can pipe to errored stream with Stream.pipeline()', async () => {
	const subprocess = execa('stdin-fail.js');
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.duplex();
	const outputStream = new PassThrough();

	const cause = new Error('test');
	outputStream.destroy(cause);

	// Node 23 does not allow calling `stream.pipeline()` with an already errored stream
	if (majorNodeVersion >= 23) {
		outputStream.on('error', () => {});
		stream.on('error', () => {});
		await assertRejects(pipeline(stream, outputStream), {code: 'ERR_STREAM_UNABLE_TO_PIPE'});
		stream.end();
	} else {
		await assertPromiseError(pipeline(inputStream, stream, outputStream), cause);
		await assertRejects(finishedStream(stream));

		await assertStreamError(inputStream, cause);
		const error = await assertStreamError(stream, cause);
		await assertStreamReadError(outputStream, cause);
		await assertSubprocessError(subprocess, {cause: error});
	}
});

test('.duplex() can be piped to errored stream with Stream.pipeline()', async () => {
	const subprocess = execa('stdin-fail.js');
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.duplex();
	const outputStream = new PassThrough();

	const cause = new Error('test');
	inputStream.destroy(cause);

	await assertPromiseError(pipeline(inputStream, stream, outputStream), cause);
	await assertRejects(finishedStream(stream));

	await assertStreamError(inputStream, cause);
	const error = await assertStreamError(stream, cause);
	await assertStreamReadError(outputStream, cause);
	await assertSubprocessError(subprocess, {cause: error});
});

test('.duplex() can be used with Stream.compose()', async () => {
	const subprocess = getReadWriteSubprocess();
	const inputStream = Readable.from([foobarString]);
	const stream = subprocess.duplex();
	const outputStream = new PassThrough();

	await assertStreamOutput(compose(inputStream, stream, outputStream));
	await assertSubprocessOutput(subprocess);
});

test('.duplex() has the right highWaterMark', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();
	assert.equal(stream.readableHighWaterMark, defaultHighWaterMark);
	assert.equal(stream.writableHighWaterMark, defaultHighWaterMark);
	stream.end();
	await text(stream);
});
