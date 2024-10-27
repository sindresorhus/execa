import {once} from 'node:events';
import {
	compose,
	Readable,
	Writable,
	PassThrough,
} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {text} from 'node:stream/consumers';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
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

test('.readable() success', async t => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();

	t.false(stream instanceof Writable);
	t.is(stream.writable, undefined);
	t.true(stream instanceof Readable);
	t.true(stream.readable);

	await assertStreamOutput(t, stream);
	await assertSubprocessOutput(t, subprocess);
});

// eslint-disable-next-line max-params
const testReadableDefault = async (t, fdNumber, from, options, hasResult) => {
	const subprocess = execa('noop-fd.js', [`${fdNumber}`, foobarString], options);
	const stream = subprocess.readable({from});

	await assertStreamOutput(t, stream, hasResult ? foobarString : '');
	await assertSubprocessOutput(t, subprocess, foobarString, fdNumber);
};

test('.readable() can use stdout', testReadableDefault, 1, 'stdout', {}, true);
test('.readable() can use stderr', testReadableDefault, 2, 'stderr', {}, true);
test('.readable() can use stdio[*]', testReadableDefault, 3, 'fd3', fullStdio, true);
test('.readable() uses stdout by default', testReadableDefault, 1, undefined, {}, true);
test('.readable() does not use stderr by default', testReadableDefault, 2, undefined, {}, false);
test('.readable() does not use stdio[*] by default', testReadableDefault, 3, undefined, fullStdio, false);
test('.readable() uses stdout even if stderr is "ignore"', testReadableDefault, 1, 'stdout', {stderr: 'ignore'}, true);
test('.readable() uses stderr even if stdout is "ignore"', testReadableDefault, 2, 'stderr', {stdout: 'ignore'}, true);
test('.readable() uses stdout if "all" is used', testReadableDefault, 1, 'all', {all: true}, true);
test('.readable() uses stderr if "all" is used', testReadableDefault, 2, 'all', {all: true}, true);

const testBuffering = async (t, methodName) => {
	const subprocess = execa('noop-stdin-fd.js', ['1'], {buffer: false});
	const stream = subprocess[methodName]();

	subprocess.stdin.write(foobarString);
	await once(subprocess.stdout, 'readable');
	subprocess.stdin.end();

	await assertStreamOutput(t, stream);
};

test('.readable() buffers until read', testBuffering, 'readable');
test('.duplex() buffers until read', testBuffering, 'duplex');

test('.readable() abort -> subprocess fail', async t => {
	const subprocess = execa('noop-repeat.js');
	const stream = subprocess.readable();

	stream.destroy();

	const error = await t.throwsAsync(text(stream));
	assertProcessNormalExit(t, error, 1);
	t.true(error.message.includes('EPIPE'));
	assertWritableAborted(t, subprocess.stdin);
	assertReadableAborted(t, subprocess.stdout);
	t.true(subprocess.stderr.readableEnded);
	await assertSubprocessError(t, subprocess, error);
});

test('.readable() error -> subprocess fail', async t => {
	const subprocess = execa('noop-repeat.js');
	const stream = subprocess.readable();

	const cause = new Error(foobarString);
	stream.destroy(cause);

	const error = await assertStreamReadError(t, stream, {cause});
	assertProcessNormalExit(t, error, 1);
	t.true(error.message.includes('EPIPE'));
	assertWritableAborted(t, subprocess.stdin);
	t.is(subprocess.stdout.errored, cause);
	t.true(subprocess.stderr.readableEnded);
	await assertSubprocessError(t, subprocess, error);
});

const testStdoutAbort = async (t, methodName) => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	const stream = subprocess[methodName]();

	subprocess.stdout.destroy();

	await subprocess.sendMessage(foobarString);
	const [error, message] = await Promise.all([
		t.throwsAsync(finishedStream(stream)),
		subprocess.getOneMessage(),
	]);
	t.like(error, prematureClose);
	t.is(message, foobarString);
	assertWritableAborted(t, subprocess.stdin);
	assertReadableAborted(t, subprocess.stdout);
	t.true(subprocess.stderr.readableEnded);
	await assertSubprocessOutput(t, subprocess, '');
};

test('subprocess.stdout abort + no more writes -> .readable() error + subprocess success', testStdoutAbort, 'readable');
test('subprocess.stdout abort + no more writes -> .duplex() error + subprocess success', testStdoutAbort, 'duplex');

const testStdoutError = async (t, methodName) => {
	const subprocess = execa('ipc-echo.js', {ipc: true});
	const stream = subprocess[methodName]();

	const cause = new Error(foobarString);
	subprocess.stdout.destroy(cause);

	await subprocess.sendMessage(foobarString);
	const [error, message] = await Promise.all([
		t.throwsAsync(finishedStream(stream)),
		subprocess.getOneMessage(),
	]);
	t.is(message, foobarString);
	t.is(error.cause, cause);
	assertProcessNormalExit(t, error);
	t.is(subprocess.stdout.errored, cause);
	t.true(subprocess.stderr.readableEnded);
	assertWritableAborted(t, subprocess.stdin);

	await assertSubprocessError(t, subprocess, error);
};

test('subprocess.stdout error + no more writes -> .readable() error + subprocess fail', testStdoutError, 'readable');
test('subprocess.stdout error + no more writes -> .duplex() error + subprocess fail', testStdoutError, 'duplex');

const testStdinAbortWrites = async (t, methodName) => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();

	subprocess.stdout.destroy();
	subprocess.stdin.end(foobarString);

	const error = await t.throwsAsync(finishedStream(stream));
	assertProcessNormalExit(t, error, 1);
	t.true(subprocess.stdin.writableEnded);
	assertReadableAborted(t, subprocess.stdout);
	t.true(subprocess.stderr.readableEnded);
	await assertSubprocessError(t, subprocess, error);
};

test('subprocess.stdout abort + more writes -> .readable() error + subprocess fail', testStdinAbortWrites, 'readable');
test('subprocess.stdout abort + more writes -> .duplex() error + subprocess fail', testStdinAbortWrites, 'duplex');

const testStdinErrorWrites = async (t, methodName) => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();

	const cause = new Error(foobarString);
	subprocess.stdout.destroy(cause);
	subprocess.stdin.end(foobarString);

	const error = await assertStreamError(t, stream, {cause});
	assertProcessNormalExit(t, error, 1);
	t.true(subprocess.stdin.writableEnded);
	t.is(subprocess.stdout.errored, cause);
	t.true(subprocess.stderr.readableEnded);
	await assertSubprocessError(t, subprocess, error);
};

test('subprocess.stdout error + more writes -> .readable() error + subprocess fail', testStdinErrorWrites, 'readable');
test('subprocess.stdout error + more writes -> .duplex() error + subprocess fail', testStdinErrorWrites, 'duplex');

test('.readable() can be used with Stream.pipeline()', async t => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();
	const outputStream = new PassThrough();

	await pipeline(stream, outputStream);

	await finishedStream(stream);
	await assertStreamOutput(t, outputStream);
	await assertSubprocessOutput(t, subprocess);
});

test('.readable() can error with Stream.pipeline()', async t => {
	const subprocess = execa('noop-fail.js', ['1', foobarString]);
	const stream = subprocess.readable();
	const outputStream = new PassThrough();

	const error = await t.throwsAsync(pipeline(stream, outputStream));
	assertProcessNormalExit(t, error, 2);
	t.like(error, {stdout: foobarString});

	await assertStreamError(t, stream, error);
	await assertStreamReadError(t, outputStream, error);
	await assertSubprocessError(t, subprocess, error);
});

test('.readable() can pipe to errored stream with Stream.pipeline()', async t => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();
	const outputStream = new PassThrough();

	const cause = new Error('test');
	outputStream.destroy(cause);

	// Node 23 does not allow calling `stream.pipeline()` with an already errored stream
	if (majorNodeVersion >= 23) {
		outputStream.on('error', () => {});
		await t.throwsAsync(pipeline(stream, outputStream), {code: 'ERR_STREAM_UNABLE_TO_PIPE'});
	} else {
		await assertPromiseError(t, pipeline(stream, outputStream), cause);
		await t.throwsAsync(finishedStream(stream));

		const error = await assertStreamError(t, stream, cause);
		await assertStreamReadError(t, outputStream, cause);
		await assertSubprocessError(t, subprocess, {cause: error});
	}
});

test('.readable() can be used with Stream.compose()', async t => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();
	const outputStream = new PassThrough();

	await assertStreamOutput(t, compose(stream, outputStream));
	await assertSubprocessOutput(t, subprocess);
});

test('.readable() works with objectMode', async t => {
	const subprocess = execa('noop.js', {stdout: outputObjectGenerator()});
	const stream = subprocess.readable();
	t.true(stream.readableObjectMode);
	t.is(stream.readableHighWaterMark, defaultObjectHighWaterMark);

	await assertStreamChunks(t, stream, [foobarObject]);
	await assertSubprocessOutput(t, subprocess, [foobarObject]);
});

test('.duplex() works with objectMode and reads', async t => {
	const subprocess = getReadWriteSubprocess({stdout: outputObjectGenerator()});
	const stream = subprocess.duplex();
	t.true(stream.readableObjectMode);
	t.is(stream.readableHighWaterMark, defaultObjectHighWaterMark);
	t.false(stream.writableObjectMode);
	t.is(stream.writableHighWaterMark, defaultHighWaterMark);
	stream.end(foobarString);

	await assertStreamChunks(t, stream, [foobarObject]);
	await assertSubprocessOutput(t, subprocess, [foobarObject]);
});

test('.readable() works with default encoding', async t => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();
	t.is(stream.readableEncoding, null);

	await assertStreamChunks(t, stream, [foobarBuffer]);
	await assertSubprocessOutput(t, subprocess, foobarString);
});

test('.duplex() works with default encoding', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();
	t.is(stream.readableEncoding, null);
	stream.end(foobarString);

	await assertStreamChunks(t, stream, [foobarBuffer]);
	await assertSubprocessOutput(t, subprocess, foobarString);
});

test('.readable() works with encoding "utf8"', async t => {
	const subprocess = getReadableSubprocess();
	subprocess.stdout.setEncoding('utf8');
	const stream = subprocess.readable();
	t.is(stream.readableEncoding, 'utf8');

	await assertStreamChunks(t, stream, [foobarString]);
	await assertSubprocessOutput(t, subprocess, foobarString);
});

test('.duplex() works with encoding "utf8"', async t => {
	const subprocess = getReadWriteSubprocess();
	subprocess.stdout.setEncoding('utf8');
	const stream = subprocess.duplex();
	t.is(stream.readableEncoding, 'utf8');
	stream.end(foobarBuffer);

	await assertStreamChunks(t, stream, [foobarString]);
	await assertSubprocessOutput(t, subprocess, foobarString);
});

test('.readable() has the right highWaterMark', async t => {
	const subprocess = execa('noop.js');
	const stream = subprocess.readable();
	t.is(stream.readableHighWaterMark, defaultHighWaterMark);
	await text(stream);
});

test('.readable() can iterate over lines', async t => {
	const subprocess = execa('noop-fd.js', ['1', simpleFull]);
	const lines = [];
	for await (const line of subprocess.readable({binary: false, preserveNewlines: false})) {
		lines.push(line);
	}

	const expectedLines = ['aaa', 'bbb', 'ccc'];
	t.deepEqual(lines, expectedLines);
	await assertSubprocessOutput(t, subprocess, simpleFull);
});

test('.readable() can wait for data', async t => {
	const subprocess = execa('noop.js', {stdout: getOutputsAsyncGenerator([foobarString, foobarString])(false, true)});
	const stream = subprocess.readable();

	t.is(stream.read(), null);
	await once(stream, 'readable');
	t.is(stream.read().toString(), foobarString);
	t.is(stream.read(), null);
	await once(stream, 'readable');
	t.is(stream.read().toString(), foobarString);
	t.is(stream.read(), null);
	await once(stream, 'readable');
	t.is(stream.read(), null);

	await finishedStream(stream);
	await assertSubprocessOutput(t, subprocess, `${foobarString}${foobarString}`);
});

const testBufferData = async (t, methodName) => {
	const chunk = '.'.repeat(defaultHighWaterMark).repeat(2);
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();
	subprocess.stdin.end(chunk);

	await assertStreamOutput(t, stream, chunk);
	await assertSubprocessOutput(t, subprocess, chunk);
};

test('.readable() can buffer data', testBufferData, 'readable');
test('.duplex() can buffer data', testBufferData, 'duplex');

const assertDataEvents = async (t, stream, subprocess) => {
	const [output] = await once(stream, 'data');
	t.is(output.toString(), foobarString);

	await finishedStream(stream);
	await assertSubprocessOutput(t, subprocess);
};

test('.readable() can be read with "data" events', async t => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();

	await assertDataEvents(t, stream, subprocess);
});

test('.duplex() can be read with "data" events', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();
	stream.end(foobarString);

	await assertDataEvents(t, stream, subprocess);
});

const assertPause = async (t, stream, subprocess) => {
	const onceData = once(stream, 'data');
	stream.pause();

	t.is(stream.readableLength, 0);
	do {
		// eslint-disable-next-line no-await-in-loop
		await setTimeout(10);
	} while (stream.readableLength === 0);

	t.false(await Promise.race([onceData, false]));

	stream.resume();
	const [output] = await onceData;
	t.is(output.toString(), foobarString);

	await finishedStream(stream);
	await assertSubprocessOutput(t, subprocess);
};

test('.readable() can be paused', async t => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readable();

	await assertPause(t, stream, subprocess);
});

test('.duplex() can be paused', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.duplex();
	stream.end(foobarString);

	await assertPause(t, stream, subprocess);
});

// This feature does not work on Node 18.
// @todo: remove after dropping support for Node 18.
if (majorNodeVersion >= 20) {
	const testHighWaterMark = async (t, methodName) => {
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
		t.is(count, expectedCount);
		subprocess.stdin.end();
		await assertStreamOutput(t, stream, expectedOutput);
		await assertSubprocessOutput(t, subprocess, expectedOutput);
	};

	test('.readable() pauses its buffering when too high', testHighWaterMark, 'readable');
	test('.duplex() pauses its buffering when too high', testHighWaterMark, 'duplex');
}

const testBigOutput = async (t, methodName) => {
	const bigChunk = '.'.repeat(1e6);
	const subprocess = execa('stdin.js', {input: bigChunk});
	const stream = subprocess[methodName]();

	await assertStreamOutput(t, stream, bigChunk);
	await assertSubprocessOutput(t, subprocess, bigChunk);
};

test('.readable() with big output', testBigOutput, 'readable');
test('.duplex() with big output', testBigOutput, 'duplex');
