import {Buffer} from 'node:buffer';
import {once} from 'node:events';
import process from 'node:process';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import getStream from 'get-stream';
import {execa, execaSync} from '../index.js';
import {setFixtureDir} from './helpers/fixtures-dir.js';
import {fullStdio, getStdio} from './helpers/stdio.js';

setFixtureDir();

test.serial('result.all shows both `stdout` and `stderr` intermixed', async t => {
	const {all} = await execa('noop-132.js', {all: true});
	t.is(all, '132');
});

test('result.all is undefined unless opts.all is true', async t => {
	const {all} = await execa('noop.js');
	t.is(all, undefined);
});

test('result.all is undefined if ignored', async t => {
	const {all} = await execa('noop.js', {stdio: 'ignore', all: true});
	t.is(all, undefined);
});

const testAllIgnore = async (t, streamName, otherStreamName) => {
	const childProcess = execa('noop.js', {[otherStreamName]: 'ignore', all: true});
	t.is(childProcess.all, childProcess[streamName]);
	await childProcess;
};

test('can use all: true with stdout: ignore', testAllIgnore, 'stderr', 'stdout');
test('can use all: true with stderr: ignore', testAllIgnore, 'stdout', 'stderr');

const testIgnore = async (t, index, execaMethod) => {
	const result = await execaMethod('noop.js', getStdio(index, 'ignore'));
	t.is(result.stdio[index], undefined);
};

test('stdout is undefined if ignored', testIgnore, 1, execa);
test('stderr is undefined if ignored', testIgnore, 2, execa);
test('stdio[*] is undefined if ignored', testIgnore, 3, execa);
test('stdout is undefined if ignored - sync', testIgnore, 1, execaSync);
test('stderr is undefined if ignored - sync', testIgnore, 2, execaSync);
test('stdio[*] is undefined if ignored - sync', testIgnore, 3, execaSync);

const testIterationBuffer = async (t, index, buffer, expectedValue) => {
	const subprocess = execa('noop-fd.js', [`${index}`], {...fullStdio, buffer});
	const [output] = await Promise.all([
		getStream(subprocess.stdio[index]),
		subprocess,
	]);
	t.is(output, expectedValue);
};

test('Can iterate stdout when `buffer` set to `false`', testIterationBuffer, 1, false, 'foobar');
test('Can iterate stderr when `buffer` set to `false`', testIterationBuffer, 2, false, 'foobar');
test('Can iterate stdio[*] when `buffer` set to `false`', testIterationBuffer, 3, false, 'foobar');
test('Cannot iterate stdout when `buffer` set to `true`', testIterationBuffer, 1, true, '');
test('Cannot iterate stderr when `buffer` set to `true`', testIterationBuffer, 2, true, '');
test('Cannot iterate stdio[*] when `buffer` set to `true`', testIterationBuffer, 3, true, '');

const testDataEventsBuffer = async (t, index, buffer) => {
	const subprocess = execa('noop-fd.js', [`${index}`], {...fullStdio, buffer});
	const [[output]] = await Promise.all([
		once(subprocess.stdio[index], 'data'),
		subprocess,
	]);
	t.is(output.toString(), 'foobar');
};

test('Can listen to `data` events on stdout when `buffer` set to `false`', testDataEventsBuffer, 1, false);
test('Can listen to `data` events on stderr when `buffer` set to `false`', testDataEventsBuffer, 2, false);
test('Can listen to `data` events on stdio[*] when `buffer` set to `false`', testDataEventsBuffer, 3, false);
test('Can listen to `data` events on stdout when `buffer` set to `true`', testDataEventsBuffer, 1, true);
test('Can listen to `data` events on stderr when `buffer` set to `true`', testDataEventsBuffer, 2, true);
test('Can listen to `data` events on stdio[*] when `buffer` set to `true`', testDataEventsBuffer, 3, true);

const maxBuffer = 10;

const testMaxBufferSuccess = async (t, index, all) => {
	await t.notThrowsAsync(execa('max-buffer.js', [`${index}`, `${maxBuffer}`], {...fullStdio, maxBuffer, all}));
};

test('maxBuffer does not affect stdout if too high', testMaxBufferSuccess, 1, false);
test('maxBuffer does not affect stderr if too high', testMaxBufferSuccess, 2, false);
test('maxBuffer does not affect stdio[*] if too high', testMaxBufferSuccess, 3, false);
test('maxBuffer does not affect all if too high', testMaxBufferSuccess, 1, true);

const testMaxBufferLimit = async (t, index, all) => {
	const length = all ? maxBuffer * 2 : maxBuffer;
	const result = await t.throwsAsync(
		execa('max-buffer.js', [`${index}`, `${length + 1}`], {...fullStdio, maxBuffer, all}),
		{message: /maxBuffer exceeded/},
	);
	t.is(all ? result.all : result.stdio[index], '.'.repeat(length));
};

test('maxBuffer affects stdout', testMaxBufferLimit, 1, false);
test('maxBuffer affects stderr', testMaxBufferLimit, 2, false);
test('maxBuffer affects stdio[*]', testMaxBufferLimit, 3, false);
test('maxBuffer affects all', testMaxBufferLimit, 1, true);

const testMaxBufferEncoding = async (t, index) => {
	const result = await t.throwsAsync(
		execa('max-buffer.js', [`${index}`, `${maxBuffer + 1}`], {...fullStdio, maxBuffer, encoding: 'buffer'}),
	);
	const stream = result.stdio[index];
	t.true(stream instanceof Uint8Array);
	t.is(Buffer.from(stream).toString(), '.'.repeat(maxBuffer));
};

test('maxBuffer works with encoding buffer and stdout', testMaxBufferEncoding, 1);
test('maxBuffer works with encoding buffer and stderr', testMaxBufferEncoding, 2);
test('maxBuffer works with encoding buffer and stdio[*]', testMaxBufferEncoding, 3);

const testMaxBufferHex = async (t, index) => {
	const halfMaxBuffer = maxBuffer / 2;
	const {stdio} = await t.throwsAsync(
		execa('max-buffer.js', [`${index}`, `${halfMaxBuffer + 1}`], {...fullStdio, maxBuffer, encoding: 'hex'}),
	);
	t.is(stdio[index], Buffer.from('.'.repeat(halfMaxBuffer)).toString('hex'));
};

test('maxBuffer works with other encodings and stdout', testMaxBufferHex, 1);
test('maxBuffer works with other encodings and stderr', testMaxBufferHex, 2);
test('maxBuffer works with other encodings and stdio[*]', testMaxBufferHex, 3);

const testNoMaxBuffer = async (t, index) => {
	const subprocess = execa('max-buffer.js', [`${index}`, `${maxBuffer}`], {...fullStdio, buffer: false});
	const [result, output] = await Promise.all([
		subprocess,
		getStream(subprocess.stdio[index]),
	]);
	t.is(result.stdio[index], undefined);
	t.is(output, '.'.repeat(maxBuffer));
};

test('do not buffer stdout when `buffer` set to `false`', testNoMaxBuffer, 1);
test('do not buffer stderr when `buffer` set to `false`', testNoMaxBuffer, 2);
test('do not buffer stdio[*] when `buffer` set to `false`', testNoMaxBuffer, 3);

const testNoMaxBufferOption = async (t, index) => {
	const length = maxBuffer + 1;
	const subprocess = execa('max-buffer.js', [`${index}`, `${length}`], {...fullStdio, maxBuffer, buffer: false});
	const [result, output] = await Promise.all([
		subprocess,
		getStream(subprocess.stdio[index]),
	]);
	t.is(result.stdio[index], undefined);
	t.is(output, '.'.repeat(length));
};

test('do not hit maxBuffer when `buffer` is `false` with stdout', testNoMaxBufferOption, 1);
test('do not hit maxBuffer when `buffer` is `false` with stderr', testNoMaxBufferOption, 2);
test('do not hit maxBuffer when `buffer` is `false` with stdio[*]', testNoMaxBufferOption, 3);

const testMaxBufferAbort = async (t, index) => {
	const childProcess = execa('max-buffer.js', [`${index}`, `${maxBuffer + 1}`], {...fullStdio, maxBuffer});
	await Promise.all([
		t.throwsAsync(childProcess, {message: /maxBuffer exceeded/}),
		t.throwsAsync(getStream(childProcess.stdio[index]), {code: 'ABORT_ERR'}),
	]);
};

test('abort stream when hitting maxBuffer with stdout', testMaxBufferAbort, 1);
test('abort stream when hitting maxBuffer with stderr', testMaxBufferAbort, 2);
test('abort stream when hitting maxBuffer with stdio[*]', testMaxBufferAbort, 3);

test('buffer: false > promise resolves', async t => {
	await t.notThrowsAsync(execa('noop.js', {buffer: false}));
});

test('buffer: false > promise rejects when process returns non-zero', async t => {
	const {exitCode} = await t.throwsAsync(execa('fail.js', {buffer: false}));
	t.is(exitCode, 2);
});

const testStreamEnd = async (t, index, buffer) => {
	const subprocess = execa('wrong command', {...fullStdio, buffer});
	await Promise.all([
		t.throwsAsync(subprocess, {message: /wrong command/}),
		once(subprocess.stdio[index], 'end'),
	]);
};

test('buffer: false > emits end event on stdout when promise is rejected', testStreamEnd, 1, false);
test('buffer: false > emits end event on stderr when promise is rejected', testStreamEnd, 2, false);
test('buffer: false > emits end event on stdio[*] when promise is rejected', testStreamEnd, 3, false);
test('buffer: true > emits end event on stdout when promise is rejected', testStreamEnd, 1, true);
test('buffer: true > emits end event on stderr when promise is rejected', testStreamEnd, 2, true);
test('buffer: true > emits end event on stdio[*] when promise is rejected', testStreamEnd, 3, true);

const testBufferIgnore = async (t, index, all) => {
	await t.notThrowsAsync(execa('max-buffer.js', [`${index}`], {...getStdio(index, 'ignore'), buffer: false, all}));
};

test('Process buffers stdout, which does not prevent exit if ignored', testBufferIgnore, 1, false);
test('Process buffers stderr, which does not prevent exit if ignored', testBufferIgnore, 2, false);
test('Process buffers all, which does not prevent exit if ignored', testBufferIgnore, 1, true);

// This specific behavior does not happen on Windows.
// Also, on macOS, it randomly happens, which would make those tests randomly fail.
if (process.platform === 'linux') {
	const testBufferNotRead = async (t, index, all) => {
		const {timedOut} = await t.throwsAsync(execa('max-buffer.js', [`${index}`], {...fullStdio, buffer: false, all, timeout: 1e3}));
		t.true(timedOut);
	};

	test.serial('Process buffers stdout, which prevents exit if not read and buffer is false', testBufferNotRead, 1, false);
	test.serial('Process buffers stderr, which prevents exit if not read and buffer is false', testBufferNotRead, 2, false);
	test.serial('Process buffers stdio[*], which prevents exit if not read and buffer is false', testBufferNotRead, 3, false);
	test.serial('Process buffers all, which prevents exit if not read and buffer is false', testBufferNotRead, 1, true);

	const testBufferRead = async (t, index, all) => {
		const subprocess = execa('max-buffer.js', [`${index}`], {...fullStdio, buffer: false, all, timeout: 1e4});
		const stream = all ? subprocess.all : subprocess.stdio[index];
		stream.resume();
		await t.notThrowsAsync(subprocess);
	};

	test.serial('Process buffers stdout, which does not prevent exit if read and buffer is false', testBufferRead, 1, false);
	test.serial('Process buffers stderr, which does not prevent exit if read and buffer is false', testBufferRead, 2, false);
	test.serial('Process buffers stdio[*], which does not prevent exit if read and buffer is false', testBufferRead, 3, false);
	test.serial('Process buffers all, which does not prevent exit if read and buffer is false', testBufferRead, 1, true);
}

const testStreamDestroy = async (t, index) => {
	const childProcess = execa('forever.js', fullStdio);
	const error = new Error('test');
	childProcess.stdio[index].destroy(error);
	await t.throwsAsync(childProcess, {message: /test/});
};

test('Destroying stdin should make the process exit', testStreamDestroy, 0);
test('Destroying stdout should make the process exit', testStreamDestroy, 1);
test('Destroying stderr should make the process exit', testStreamDestroy, 2);
test('Destroying stdio[*] should make the process exit', testStreamDestroy, 3);

const testStreamError = async (t, index) => {
	const childProcess = execa('forever.js', fullStdio);
	await setTimeout(0);
	const error = new Error('test');
	childProcess.stdio[index].emit('error', error);
	await t.throwsAsync(childProcess, {message: /test/});
};

test('Errors on stdin should make the process exit', testStreamError, 0);
test('Errors on stdout should make the process exit', testStreamError, 1);
test('Errors on stderr should make the process exit', testStreamError, 2);
test('Errors on stdio[*] should make the process exit', testStreamError, 3);

const testWaitOnStreamEnd = async (t, index) => {
	const childProcess = execa('stdin-fd.js', [`${index}`], fullStdio);
	await setTimeout(100);
	childProcess.stdio[index].end('foobar');
	const {stdout} = await childProcess;
	t.is(stdout, 'foobar');
};

test.serial('Process waits on stdin before exiting', testWaitOnStreamEnd, 0);
test.serial('Process waits on stdio[*] before exiting', testWaitOnStreamEnd, 3);

const testBufferExit = async (t, index, fixtureName, reject) => {
	const childProcess = execa(fixtureName, [`${index}`], {...fullStdio, reject});
	await setTimeout(100);
	const {stdio} = await childProcess;
	t.is(stdio[index], 'foobar');
};

test.serial('Process buffers stdout before it is read', testBufferExit, 1, 'noop-delay.js', true);
test.serial('Process buffers stderr before it is read', testBufferExit, 2, 'noop-delay.js', true);
test.serial('Process buffers stdio[*] before it is read', testBufferExit, 3, 'noop-delay.js', true);
test.serial('Process buffers stdout right away, on successfully exit', testBufferExit, 1, 'noop-fd.js', true);
test.serial('Process buffers stderr right away, on successfully exit', testBufferExit, 2, 'noop-fd.js', true);
test.serial('Process buffers stdio[*] right away, on successfully exit', testBufferExit, 3, 'noop-fd.js', true);
test.serial('Process buffers stdout right away, on failure', testBufferExit, 1, 'noop-fail.js', false);
test.serial('Process buffers stderr right away, on failure', testBufferExit, 2, 'noop-fail.js', false);
test.serial('Process buffers stdio[*] right away, on failure', testBufferExit, 3, 'noop-fail.js', false);

const testBufferDirect = async (t, index) => {
	const childProcess = execa('noop-fd.js', [`${index}`], fullStdio);
	const data = await once(childProcess.stdio[index], 'data');
	t.is(data.toString().trim(), 'foobar');
	const result = await childProcess;
	t.is(result.stdio[index], 'foobar');
};

test('Process buffers stdout right away, even if directly read', testBufferDirect, 1);
test('Process buffers stderr right away, even if directly read', testBufferDirect, 2);
test('Process buffers stdio[*] right away, even if directly read', testBufferDirect, 3);

const testBufferDestroyOnEnd = async (t, index) => {
	const childProcess = execa('noop-fd.js', [`${index}`], fullStdio);
	const result = await childProcess;
	t.is(result.stdio[index], 'foobar');
	t.true(childProcess.stdio[index].destroyed);
};

test('childProcess.stdout must be read right away', testBufferDestroyOnEnd, 1);
test('childProcess.stderr must be read right away', testBufferDestroyOnEnd, 2);
test('childProcess.stdio[*] must be read right away', testBufferDestroyOnEnd, 3);
