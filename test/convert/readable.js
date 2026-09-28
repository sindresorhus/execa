import assert from 'node:assert/strict';
import {once} from 'node:events';
import {pipeline} from 'node:stream/promises';
import {text} from 'node:stream/consumers';
import {setTimeout} from 'node:timers/promises';
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
	assertStreamChunks,
	assertStreamError,
	assertStreamReadError,
	assertSubprocessOutput,
	assertSubprocessError,
	assertPromiseError,
	getReadableSubprocess,
	getReadWriteSubprocess,
} from '../helpers/convert.js';
import {foobarString, foobarBuffer, foobarObject} from '../helpers/input.js';
import {simpleFull} from '../helpers/lines.js';
import {majorNodeVersion} from '../helpers/node-version.js';
import {prematureClose, fullStdio} from '../helpers/stdio.js';
import {outputObjectGenerator, getOutputsAsyncGenerator} from '../helpers/generator.js';
import {defaultHighWaterMark, defaultObjectHighWaterMark} from '../helpers/stream.js';

setFixtureDirectory();

test('.readable() success', async () => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();

	assert.ok(!(stream instanceof Writable));
	assert.equal(stream.writable, undefined);
	assert.ok(stream instanceof Readable);
	assert.equal(stream.readable, true);

	await assertStreamOutput(stream);
	await assertSubprocessOutput(subprocess);
});

const testReadableDefault = async (fdNumber, from, options, hasResult) => {
	const subprocess = execa('noop-fd.js', [`${fdNumber}`, foobarString], options);
	const stream = subprocess.readable({from});

	await assertStreamOutput(stream, hasResult ? foobarString : '');
	await assertSubprocessOutput(subprocess, foobarString, fdNumber);
};

test('.readable() can use stdout', () => testReadableDefault(1, 'stdout', {}, true));
test('.readable() can use stderr', () => testReadableDefault(2, 'stderr', {}, true));
test('.readable() can use stdio[*]', () => testReadableDefault(3, 'fd3', fullStdio, true));
test('.readable() uses stdout by default', () => testReadableDefault(1, undefined, {}, true));
test('.readable() does not use stderr by default', () => testReadableDefault(2, undefined, {}, false));
test('.readable() does not use stdio[*] by default', () => testReadableDefault(3, undefined, fullStdio, false));
test('.readable() uses stdout even if stderr is "ignore"', () => testReadableDefault(1, 'stdout', {stderr: 'ignore'}, true));
test('.readable() uses stderr even if stdout is "ignore"', () => testReadableDefault(2, 'stderr', {stdout: 'ignore'}, true));
test('.readable() uses stdout if "all" is used', () => testReadableDefault(1, 'all', {all: true}, true));
test('.readable() uses stderr if "all" is used', () => testReadableDefault(2, 'all', {all: true}, true));

const testBuffering = async methodName => {
	const subprocess = execa('noop-stdin-fd.js', ['1'], {buffer: false});
	const stream = subprocess[methodName]();

	subprocess.stdin.write(foobarString);
	await once(subprocess.stdout, 'readable');
	subprocess.stdin.end();

	await assertStreamOutput(stream);
};

test('.readable() buffers until read', () => testBuffering('readable'));
test('.duplex() buffers until read', () => testBuffering('duplex'));

test('.readable() abort -> subprocess fail', async () => {
	const subprocess = execa('noop-repeat.js');
	const stream = subprocess.readable();

	stream.destroy();

	const error = await assertRejects(text(stream));
	assertProcessNormalExit(error, 1);
	assert.ok(error.message.includes('EPIPE'));
	assertWritableAborted(subprocess.stdin);
	assertReadableAborted(subprocess.stdout);
	assert.equal(subprocess.stderr.readableEnded, true);
	await assertSubprocessError(subprocess, error);
});

test('.readable() error -> subprocess fail', async () => {
	const subprocess = execa('noop-repeat.js');
	const stream = subprocess.readable();

	const cause = new Error(foobarString);
	stream.destroy(cause);

	const error = await assertStreamReadError(stream, {cause});
	assertProcessNormalExit(error, 1);
	assert.ok(error.message.includes('EPIPE'));
	assertWritableAborted(subprocess.stdin);
	assert.equal(subprocess.stdout.errored, cause);
	assert.equal(subprocess.stderr.readableEnded, true);
	await assertSubprocessError(subprocess, error);
});

const testStdoutAbort = async methodName => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	const stream = subprocess[methodName]();

	subprocess.stdout.destroy();

	await subprocess.sendMessage(foobarString);
	const [error, message] = await Promise.all([
		assertRejects(finishedStream(stream)),
		subprocess.getOneMessage(),
	]);
	assertLike(error, prematureClose);
	assert.equal(message, foobarString);
	assertWritableAborted(subprocess.stdin);
	assertReadableAborted(subprocess.stdout);
	assert.equal(subprocess.stderr.readableEnded, true);
	await assertSubprocessOutput(subprocess, '');
};

test('subprocess.stdout abort + no more writes -> .readable() error + subprocess success', () => testStdoutAbort('readable'));
test('subprocess.stdout abort + no more writes -> .duplex() error + subprocess success', () => testStdoutAbort('duplex'));

const testStdoutError = async methodName => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	const stream = subprocess[methodName]();

	const cause = new Error(foobarString);
	subprocess.stdout.destroy(cause);

	await subprocess.sendMessage(foobarString);
	const [error, message] = await Promise.all([
		assertRejects(finishedStream(stream)),
		subprocess.getOneMessage(),
	]);
	assert.equal(message, foobarString);
	assert.equal(error.cause, cause);
	assertProcessNormalExit(error);
	assert.equal(subprocess.stdout.errored, cause);
	assert.equal(subprocess.stderr.readableEnded, true);
	assertWritableAborted(subprocess.stdin);

	await assertSubprocessError(subprocess, error);
};

test('subprocess.stdout error + no more writes -> .readable() error + subprocess fail', () => testStdoutError('readable'));
test('subprocess.stdout error + no more writes -> .duplex() error + subprocess fail', () => testStdoutError('duplex'));

const testStdinAbortWrites = async methodName => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();

	subprocess.stdout.destroy();
	subprocess.stdin.end(foobarString);

	const error = await assertRejects(finishedStream(stream));
	assertProcessNormalExit(error, 1);
	assert.equal(subprocess.stdin.writableEnded, true);
	assertReadableAborted(subprocess.stdout);
	assert.equal(subprocess.stderr.readableEnded, true);
	await assertSubprocessError(subprocess, error);
};

test('subprocess.stdout abort + more writes -> .readable() error + subprocess fail', () => testStdinAbortWrites('readable'));
test('subprocess.stdout abort + more writes -> .duplex() error + subprocess fail', () => testStdinAbortWrites('duplex'));

const testStdinErrorWrites = async methodName => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();

	const cause = new Error(foobarString);
	subprocess.stdout.destroy(cause);
	subprocess.stdin.end(foobarString);

	const error = await assertStreamError(stream, {cause});
	assertProcessNormalExit(error, 1);
	assert.equal(subprocess.stdin.writableEnded, true);
	assert.equal(subprocess.stdout.errored, cause);
	assert.equal(subprocess.stderr.readableEnded, true);
	await assertSubprocessError(subprocess, error);
};

test('subprocess.stdout error + more writes -> .readable() error + subprocess fail', () => testStdinErrorWrites('readable'));
test('subprocess.stdout error + more writes -> .duplex() error + subprocess fail', () => testStdinErrorWrites('duplex'));

test('.readable() can be used with Stream.pipeline()', async () => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();
	const outputStream = new PassThrough();

	await pipeline(stream, outputStream);

	await finishedStream(stream);
	await assertStreamOutput(outputStream);
	await assertSubprocessOutput(subprocess);
});

test('.readable() can error with Stream.pipeline()', async () => {
	const subprocess = execa('noop-fail.js', ['1', foobarString]);
	const stream = subprocess.readable();
	const outputStream = new PassThrough();

	const error = await assertRejects(pipeline(stream, outputStream));
	assertProcessNormalExit(error, 2);
	assertLike(error, {stdout: foobarString});

	await assertStreamError(stream, error);
	await assertStreamReadError(outputStream, error);
	await assertSubprocessError(subprocess, error);
});

test('.readable() can pipe to errored stream with Stream.pipeline()', async () => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();
	const outputStream = new PassThrough();

	const cause = new Error('test');
	outputStream.destroy(cause);

	// Node 23 does not allow calling `stream.pipeline()` with an already errored stream
	if (majorNodeVersion >= 23) {
		outputStream.on('error', () => {});
		await assertRejects(pipeline(stream, outputStream), {code: 'ERR_STREAM_UNABLE_TO_PIPE'});
	} else {
		await assertPromiseError(pipeline(stream, outputStream), cause);
		await assertRejects(finishedStream(stream));

		const error = await assertStreamError(stream, cause);
		await assertStreamReadError(outputStream, cause);
		await assertSubprocessError(subprocess, {cause: error});
	}
});

test('.readable() can be used with Stream.compose()', async () => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();
	const outputStream = new PassThrough();

	await assertStreamOutput(compose(stream, outputStream));
	await assertSubprocessOutput(subprocess);
});

test('.readable() works with objectMode', async () => {
	const subprocess = execa('noop.js', {stdout: outputObjectGenerator()});
	const stream = subprocess.readable();
	assert.equal(stream.readableObjectMode, true);
	assert.equal(stream.readableHighWaterMark, defaultObjectHighWaterMark);

	await assertStreamChunks(stream, [foobarObject]);
	await assertSubprocessOutput(subprocess, [foobarObject]);
});

test('.duplex() works with objectMode and reads', async () => {
	const subprocess = getReadWriteSubprocess({stdout: outputObjectGenerator()});
	const stream = subprocess.duplex();
	assert.equal(stream.readableObjectMode, true);
	assert.equal(stream.readableHighWaterMark, defaultObjectHighWaterMark);
	assert.equal(stream.writableObjectMode, false);
	assert.equal(stream.writableHighWaterMark, defaultHighWaterMark);
	stream.end(foobarString);

	await assertStreamChunks(stream, [foobarObject]);
	await assertSubprocessOutput(subprocess, [foobarObject]);
});

test('.readable() works with default encoding', async () => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();
	assert.equal(stream.readableEncoding, null);

	await assertStreamChunks(stream, [foobarBuffer]);
	await assertSubprocessOutput(subprocess, foobarString);
});

test('.duplex() works with default encoding', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();
	assert.equal(stream.readableEncoding, null);
	stream.end(foobarString);

	await assertStreamChunks(stream, [foobarBuffer]);
	await assertSubprocessOutput(subprocess, foobarString);
});

test('.readable() works with encoding "utf8"', async () => {
	const subprocess = getReadableSubprocess();
	subprocess.stdout.setEncoding('utf8');
	const stream = subprocess.readable();
	assert.equal(stream.readableEncoding, 'utf8');

	await assertStreamChunks(stream, [foobarString]);
	await assertSubprocessOutput(subprocess, foobarString);
});

test('.duplex() works with encoding "utf8"', async () => {
	const subprocess = getReadWriteSubprocess();
	subprocess.stdout.setEncoding('utf8');
	const stream = subprocess.duplex();
	assert.equal(stream.readableEncoding, 'utf8');
	stream.end(foobarBuffer);

	await assertStreamChunks(stream, [foobarString]);
	await assertSubprocessOutput(subprocess, foobarString);
});

test('.readable() has the right highWaterMark', async () => {
	const subprocess = execa('noop.js');
	const stream = subprocess.readable();
	assert.equal(stream.readableHighWaterMark, defaultHighWaterMark);
	await text(stream);
});

test('.readable() can iterate over lines', async () => {
	const subprocess = execa('noop-fd.js', ['1', simpleFull]);
	const lines = await Array.fromAsync(subprocess.readable({binary: false, preserveNewlines: false}));

	const expectedLines = ['aaa', 'bbb', 'ccc'];
	assert.deepEqual(lines, expectedLines);
	await assertSubprocessOutput(subprocess, simpleFull);
});

test('.readable() can wait for data', async () => {
	const subprocess = execa('noop.js', {stdout: getOutputsAsyncGenerator([foobarString, foobarString])(false, true)});
	const stream = subprocess.readable();

	assert.equal(stream.read(), null);
	await once(stream, 'readable');
	assert.equal(stream.read().toString(), foobarString);
	assert.equal(stream.read(), null);
	await once(stream, 'readable');
	assert.equal(stream.read().toString(), foobarString);
	assert.equal(stream.read(), null);
	await once(stream, 'readable');
	assert.equal(stream.read(), null);

	await finishedStream(stream);
	await assertSubprocessOutput(subprocess, `${foobarString}${foobarString}`);
});

const testBufferData = async methodName => {
	const chunk = '.'.repeat(defaultHighWaterMark).repeat(2);
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();
	subprocess.stdin.end(chunk);

	await assertStreamOutput(stream, chunk);
	await assertSubprocessOutput(subprocess, chunk);
};

test('.readable() can buffer data', () => testBufferData('readable'));
test('.duplex() can buffer data', () => testBufferData('duplex'));

const assertDataEvents = async (stream, subprocess) => {
	const [output] = await once(stream, 'data');
	assert.equal(output.toString(), foobarString);

	await finishedStream(stream);
	await assertSubprocessOutput(subprocess);
};

test('.readable() can be read with "data" events', async () => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();

	await assertDataEvents(stream, subprocess);
});

test('.duplex() can be read with "data" events', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();
	stream.end(foobarString);

	await assertDataEvents(stream, subprocess);
});

const assertPause = async (stream, subprocess) => {
	const onceData = once(stream, 'data');
	stream.pause();

	assert.equal(stream.readableLength, 0);
	do {
		// eslint-disable-next-line no-await-in-loop
		await setTimeout(10);
	} while (stream.readableLength === 0);

	assert.ok(!await Promise.race([onceData, false]));

	stream.resume();
	const [output] = await onceData;
	assert.equal(output.toString(), foobarString);

	await finishedStream(stream);
	await assertSubprocessOutput(subprocess);
};

test('.readable() can be paused', async () => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();

	await assertPause(stream, subprocess);
});

test('.duplex() can be paused', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();
	stream.end(foobarString);

	await assertPause(stream, subprocess);
});

// This feature does not work on Node 18.
// @todo: remove after dropping support for Node 18.
if (majorNodeVersion >= 20) {
	const testHighWaterMark = async methodName => {
		const subprocess = execa('stdin.js');
		const stream = subprocess[methodName]();

		let count = 0;
		const onPause = once(subprocess.stdout, 'pause');
		for (; !subprocess.stdout.isPaused(); count += 1) {
			subprocess.stdin.write('.');
			// eslint-disable-next-line no-await-in-loop
			await Promise.race([onPause, once(subprocess.stdout, 'data')]);
		}

		const expectedCount = defaultObjectHighWaterMark + 1;
		const expectedOutput = '.'.repeat(expectedCount);
		assert.equal(count, expectedCount);
		subprocess.stdin.end();
		await assertStreamOutput(stream, expectedOutput);
		await assertSubprocessOutput(subprocess, expectedOutput);
	};

	test('.readable() pauses its buffering when too high', () => testHighWaterMark('readable'));
	test('.duplex() pauses its buffering when too high', () => testHighWaterMark('duplex'));
}

const testBigOutput = async methodName => {
	const bigChunk = '.'.repeat(1e6);
	const subprocess = execa('stdin.js', {input: bigChunk});
	const stream = subprocess[methodName]();

	await assertStreamOutput(stream, bigChunk);
	await assertSubprocessOutput(subprocess, bigChunk);
};

test('.readable() with big output', () => testBigOutput('readable'));
test('.duplex() with big output', () => testBigOutput('duplex'));
