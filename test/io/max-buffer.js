import {Buffer} from 'node:buffer';
import test from 'ava';
import getStream from 'get-stream';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {fullStdio} from '../helpers/stdio.js';
import {getEarlyErrorSubprocess} from '../helpers/early-error.js';
import {maxBuffer, assertErrorMessage} from '../helpers/max-buffer.js';
import {foobarArray} from '../helpers/input.js';

setFixtureDirectory();

const maxBufferMessage = {message: /maxBuffer exceeded/};
const maxBufferCodeSync = {code: 'ENOBUFS'};

const runMaxBuffer = async (t, execaMethod, fdNumber, options) => {
	const error = execaMethod === execa
		? await t.throwsAsync(getMaxBufferSubprocess(execaMethod, fdNumber, options), maxBufferMessage)
		: t.throws(() => {
			getMaxBufferSubprocess(execaMethod, fdNumber, options);
		}, maxBufferCodeSync);
	t.true(error.isMaxBuffer);
	t.is(error.maxBufferInfo, undefined);
	return error;
};

const getMaxBufferSubprocess = (execaMethod, fdNumber, {length = maxBuffer, ...options} = {}) =>
	execaMethod('max-buffer.js', [`${fdNumber}`, `${length + 1}`], {...fullStdio, maxBuffer, ...options});

const getExpectedOutput = (length = maxBuffer) => '.'.repeat(length);

const testMaxBufferSuccess = async (t, execaMethod, fdNumber, all) => {
	const {isMaxBuffer} = await getMaxBufferSubprocess(execaMethod, fdNumber, {all, length: maxBuffer - 1});
	t.false(isMaxBuffer);
};

test('maxBuffer does not affect stdout if too high', testMaxBufferSuccess, execa, 1, false);
test('maxBuffer does not affect stderr if too high', testMaxBufferSuccess, execa, 2, false);
test('maxBuffer does not affect stdio[*] if too high', testMaxBufferSuccess, execa, 3, false);
test('maxBuffer does not affect all if too high', testMaxBufferSuccess, execa, 1, true);
test('maxBuffer does not affect stdout if too high, sync', testMaxBufferSuccess, execaSync, 1, false);
test('maxBuffer does not affect stderr if too high, sync', testMaxBufferSuccess, execaSync, 2, false);
test('maxBuffer does not affect stdio[*] if too high, sync', testMaxBufferSuccess, execaSync, 3, false);
test('maxBuffer does not affect all if too high, sync', testMaxBufferSuccess, execaSync, 1, true);

const testGracefulExit = async (t, fixtureName, expectedExitCode) => {
	const {isMaxBuffer, shortMessage, exitCode, signal, stdout} = await t.throwsAsync(
		execa(fixtureName, ['1', '.'.repeat(maxBuffer + 1)], {maxBuffer}),
		maxBufferMessage,
	);
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage);
	t.is(exitCode, expectedExitCode);
	t.is(signal, undefined);
	t.is(stdout, getExpectedOutput());
};

test('maxBuffer terminates stream gracefully, more writes', testGracefulExit, 'noop-repeat.js', 1);
test('maxBuffer terminates stream gracefully, no more writes', testGracefulExit, 'noop-fd.js', 0);

const testGracefulExitSync = (t, fixtureName) => {
	const {isMaxBuffer, shortMessage, exitCode, signal, stdout} = t.throws(() => {
		execaSync(fixtureName, ['1', '.'.repeat(maxBuffer + 1)], {maxBuffer, killSignal: 'SIGINT'});
	}, maxBufferCodeSync);
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage, {execaMethod: execaSync});
	t.is(exitCode, undefined);
	t.is(signal, 'SIGINT');
	t.is(stdout, getExpectedOutput());
};

test('maxBuffer terminate stream with killSignal, more writes, sync', testGracefulExitSync, 'noop-repeat.js');
test('maxBuffer terminate stream with killSignal, no more writes, sync', testGracefulExitSync, 'noop-fd.js');

const testMaxBufferLimit = async (t, execaMethod, fdNumber, all) => {
	const length = all && execaMethod === execa ? maxBuffer * 2 : maxBuffer;
	const {shortMessage, all: allOutput, stdio} = await runMaxBuffer(t, execaMethod, fdNumber, {all, length});
	assertErrorMessage(t, shortMessage, {execaMethod, fdNumber});
	t.is(all ? allOutput : stdio[fdNumber], getExpectedOutput(length));
};

test('maxBuffer truncates stdout', testMaxBufferLimit, execa, 1, false);
test('maxBuffer truncates stderr', testMaxBufferLimit, execa, 2, false);
test('maxBuffer truncates stdio[*]', testMaxBufferLimit, execa, 3, false);
test('maxBuffer truncates all', testMaxBufferLimit, execa, 1, true);
test('maxBuffer truncates stdout, sync', testMaxBufferLimit, execaSync, 1, false);
test('maxBuffer truncates stderr, sync', testMaxBufferLimit, execaSync, 2, false);
test('maxBuffer truncates stdio[*], sync', testMaxBufferLimit, execaSync, 3, false);
test('maxBuffer truncates all, sync', testMaxBufferLimit, execaSync, 1, true);

const MAX_BUFFER_DEFAULT = 1e8;

const testMaxBufferDefault = async (t, execaMethod, fdNumber, maxBuffer) => {
	const length = MAX_BUFFER_DEFAULT;
	const {shortMessage, stdio} = await runMaxBuffer(t, execaMethod, fdNumber, {length: MAX_BUFFER_DEFAULT + 1, maxBuffer});
	assertErrorMessage(t, shortMessage, {execaMethod, fdNumber, length});
	t.is(stdio[fdNumber], getExpectedOutput(length));
};

test('maxBuffer has a default value with stdout', testMaxBufferDefault, execa, 1, undefined);
test('maxBuffer has a default value with stderr', testMaxBufferDefault, execa, 2, undefined);
test('maxBuffer has a default value with stdio[*]', testMaxBufferDefault, execa, 3, undefined);
test('maxBuffer has a default value with stdout, sync', testMaxBufferDefault, execaSync, 1, undefined);
test('maxBuffer has a default value with stderr, sync', testMaxBufferDefault, execaSync, 2, undefined);
test('maxBuffer has a default value with stdio[*], sync', testMaxBufferDefault, execaSync, 3, undefined);
test('maxBuffer has a default value with stdout with fd-specific options', testMaxBufferDefault, execa, 1, {stderr: 1e9});
test('maxBuffer has a default value with stderr with fd-specific options', testMaxBufferDefault, execa, 2, {stdout: 1e9});
test('maxBuffer has a default value with stdio[*] with fd-specific options', testMaxBufferDefault, execa, 3, {stdout: 1e9});
test('maxBuffer has a default value with stdout with empty fd-specific options', testMaxBufferDefault, execa, 1, {});

const testFdSpecific = async (t, fdNumber, fdName, execaMethod) => {
	const length = 1;
	const {shortMessage, stdio} = await runMaxBuffer(t, execaMethod, fdNumber, {maxBuffer: {[fdName]: length}});
	assertErrorMessage(t, shortMessage, {execaMethod, fdNumber, length});
	t.is(stdio[fdNumber], getExpectedOutput(length));
};

test('maxBuffer truncates file descriptors with fd-specific options, stdout', testFdSpecific, 1, 'stdout', execa);
test('maxBuffer truncates file descriptors with fd-specific options, fd1', testFdSpecific, 1, 'fd1', execa);
test('maxBuffer truncates file descriptors with fd-specific options, stderr', testFdSpecific, 2, 'stderr', execa);
test('maxBuffer truncates file descriptors with fd-specific options, fd2', testFdSpecific, 2, 'fd2', execa);
test('maxBuffer truncates file descriptors with fd-specific options, stdout, all', testFdSpecific, 1, 'all', execa);
test('maxBuffer truncates file descriptors with fd-specific options, stderr, all', testFdSpecific, 2, 'all', execa);
test('maxBuffer truncates file descriptors with fd-specific options, fd3', testFdSpecific, 3, 'fd3', execa);
test('maxBuffer.stdout is used for stdout with fd-specific options, stdout, sync', testFdSpecific, 1, 'stdout', execaSync);
test('maxBuffer.stderr is used for stderr with fd-specific options, stderr, sync', testFdSpecific, 2, 'stderr', execaSync);
test('maxBuffer.fd3 is used for stdio[*] with fd-specific options, fd3, sync', testFdSpecific, 3, 'fd3', execaSync);

test('maxBuffer does not affect other file descriptors with fd-specific options', async t => {
	const {isMaxBuffer} = await getMaxBufferSubprocess(execa, 2, {maxBuffer: {stdout: 1}});
	t.false(isMaxBuffer);
});

test('maxBuffer.fd3 is invalid without stdio[3], even with ipc', t => {
	const {message} = t.throws(() => {
		execa('ipc-send-twice.js', {ipc: true, maxBuffer: {fd3: 1}});
	});
	t.true(message.includes('"maxBuffer.fd3" is invalid: that file descriptor does not exist.'));
});

test('maxBuffer.fd3 and maxBuffer.ipc are distinct', async t => {
	const {isMaxBuffer, ipcOutput} = await execa('ipc-send-twice.js', {
		ipc: true,
		stdio: ['ignore', 'pipe', 'pipe', 'pipe'],
		maxBuffer: {
			fd3: 1,
			ipc: 2,
		},
	});
	t.false(isMaxBuffer);
	t.deepEqual(ipcOutput, foobarArray);
});

test('maxBuffer.stdout is used for other file descriptors with fd-specific options, sync', async t => {
	const length = 1;
	const {shortMessage, stderr} = await runMaxBuffer(t, execaSync, 2, {maxBuffer: {stdout: length}});
	assertErrorMessage(t, shortMessage, {execaMethod: execaSync, fdNumber: 2, length});
	t.is(stderr, getExpectedOutput(length));
});

// `spawnSync()`'s native `maxBuffer` is `maxBuffer.stdout`, so a lower limit on another file descriptor is only enforced from the output, after the subprocess exits
test('maxBuffer.stderr is used when lower than maxBuffer.stdout, sync', t => {
	const length = 3;
	const error = t.throws(() => {
		execaSync('noop-both.js', ['.'.repeat(maxBuffer + 1)], {maxBuffer: {stdout: 1e8, stderr: length}});
	}, maxBufferCodeSync);
	t.true(error.isMaxBuffer);
	t.is(error.maxBufferInfo, undefined);
	assertErrorMessage(t, error.shortMessage, {execaMethod: execaSync, fdNumber: 2, length});
	t.is(error.stdout, getExpectedOutput(maxBuffer + 1));
	t.is(error.stderr, getExpectedOutput(length));
	t.is(error.signal, undefined);
	t.is(error.exitCode, 0);
});

test('maxBuffer.stderr is used when lower than maxBuffer.stdout', async t => {
	const length = 3;
	const error = await t.throwsAsync(execa('noop-both.js', ['.'.repeat(maxBuffer + 1)], {maxBuffer: {stdout: 1e8, stderr: length}}));
	t.true(error.isMaxBuffer);
	assertErrorMessage(t, error.shortMessage, {fdNumber: 2, length});
	t.is(error.stdout, getExpectedOutput(maxBuffer + 1));
	t.is(error.stderr, getExpectedOutput(length));
	t.is(error.signal, undefined);
	t.is(error.exitCode, 0);
});

test('maxBuffer is not hit when under each file descriptor\'s value, sync', t => {
	const length = 9;
	const {isMaxBuffer, stdout, stderr} = execaSync('noop-both.js', ['.'.repeat(length)], {maxBuffer: {stdout: 1e8, stderr: 10}});
	t.false(isMaxBuffer);
	t.is(stdout, getExpectedOutput(length));
	t.is(stderr, getExpectedOutput(length));
});

const testAll = async (t, shouldFail) => {
	const difference = shouldFail ? 0 : 1;
	const maxBufferStdout = 2;
	const maxBufferStderr = 4 - difference;
	const {isMaxBuffer, shortMessage, stdout, stderr, all} = await execa(
		'noop-both.js',
		['\n'.repeat(maxBufferStdout - 1), '\n'.repeat(maxBufferStderr - difference)],
		{
			maxBuffer: {stdout: maxBufferStdout, stderr: maxBufferStderr},
			all: true,
			stripFinalNewline: false,
			reject: false,
		},
	);
	t.is(isMaxBuffer, shouldFail);
	if (shouldFail) {
		assertErrorMessage(t, shortMessage, {fdNumber: 2, length: maxBufferStderr});
	}

	t.is(stdout, '\n'.repeat(maxBufferStdout));
	t.is(stderr, '\n'.repeat(maxBufferStderr));
	t.is(all, '\n'.repeat(maxBufferStdout + maxBufferStderr));
};

test('maxBuffer.stdout can differ from maxBuffer.stderr, combined with all, below threshold', testAll, false);
test('maxBuffer.stdout can differ from maxBuffer.stderr, combined with all, above threshold', testAll, true);

const testInvalidFd = async (t, fdName, execaMethod) => {
	const {message} = t.throws(() => {
		execaMethod('empty.js', {maxBuffer: {[fdName]: 0}});
	});
	t.true(message.includes(`"maxBuffer.${fdName}" is invalid`));
};

test('maxBuffer.stdin is invalid', testInvalidFd, 'stdin', execa);
test('maxBuffer.fd0 is invalid', testInvalidFd, 'fd0', execa);
test('maxBuffer.other is invalid', testInvalidFd, 'other', execa);
test('maxBuffer.fd10 is invalid', testInvalidFd, 'fd10', execa);
test('maxBuffer.stdin is invalid, sync', testInvalidFd, 'stdin', execaSync);
test('maxBuffer.fd0 is invalid, sync', testInvalidFd, 'fd0', execaSync);
test('maxBuffer.other is invalid, sync', testInvalidFd, 'other', execaSync);
test('maxBuffer.fd10 is invalid, sync', testInvalidFd, 'fd10', execaSync);

// These tests need the subprocess to have written its output before the timeout kills it, which is only guaranteed if the timeout leaves room for the subprocess to start. On a busy machine, starting Node.js can take over a second.
const SYNC_TIMEOUT = 1e4;

// A file descriptor limit lower than `maxBuffer.stdout` does not stop the subprocess with synchronous methods, so the subprocess can still time out afterwards
const testMaxBufferTimeoutSync = (t, fdNumber, fdName) => {
	const length = 3;
	const error = t.throws(() => {
		execaSync('max-buffer-forever.js', [`${fdNumber}`, `${maxBuffer}`], {...fullStdio, timeout: SYNC_TIMEOUT, maxBuffer: {[fdName]: length}});
	}, {code: 'ETIMEDOUT'});
	t.true(error.timedOut);
	t.false(error.isMaxBuffer);
	t.is(error.maxBufferInfo, undefined);
	t.false(Object.hasOwn(error.cause, 'maxBufferInfo'));
	t.true(error.shortMessage.startsWith(`Command timed out after ${SYNC_TIMEOUT} milliseconds`));
	t.is(error.stdio[fdNumber], getExpectedOutput(length));
};

test('timeout is reported instead of maxBuffer.stderr, sync', testMaxBufferTimeoutSync, 2, 'stderr');
test('timeout is reported instead of maxBuffer.fd3, sync', testMaxBufferTimeoutSync, 3, 'fd3');

test('timeout does not truncate output under maxBuffer.stderr, sync', t => {
	const {timedOut, isMaxBuffer, stderr} = t.throws(() => {
		execaSync('max-buffer-forever.js', ['2', `${maxBuffer}`], {timeout: SYNC_TIMEOUT, maxBuffer: {stderr: maxBuffer}});
	}, {code: 'ETIMEDOUT'});
	t.true(timedOut);
	t.false(isMaxBuffer);
	t.is(stderr, getExpectedOutput(maxBuffer));
});

// `maxBuffer.stdout` is enforced by `spawnSync()` itself, which stops the subprocess before it can time out
test('maxBuffer.stdout is reported before timeout, sync', t => {
	const length = 3;
	const error = t.throws(() => {
		execaSync('max-buffer-forever.js', ['1', `${maxBuffer}`], {timeout: SYNC_TIMEOUT, maxBuffer: {stdout: length}});
	}, maxBufferCodeSync);
	t.false(error.timedOut);
	t.true(error.isMaxBuffer);
	t.is(error.maxBufferInfo, undefined);
	assertErrorMessage(t, error.shortMessage, {execaMethod: execaSync, length});
	t.is(error.stdout, getExpectedOutput(length));
});

test('maxBuffer.stderr is reported with a non-zero exit code, sync', t => {
	const length = 3;
	const error = t.throws(() => {
		execaSync('noop-both-fail.js', ['.'.repeat(maxBuffer)], {maxBuffer: {stdout: 1e8, stderr: length}});
	});
	t.true(error.isMaxBuffer);
	t.is(error.maxBufferInfo, undefined);
	assertErrorMessage(t, error.shortMessage, {execaMethod: execaSync, fdNumber: 2, length});
	t.is(error.exitCode, 1);
	t.is(error.stdout, getExpectedOutput(maxBuffer));
	t.is(error.stderr, getExpectedOutput(length));
});

test('maxBuffer.stderr works with reject false, sync', t => {
	const length = 3;
	const {failed, isMaxBuffer, maxBufferInfo, shortMessage, stderr} = execaSync('noop-fd.js', ['2', '.'.repeat(maxBuffer)], {maxBuffer: {stdout: 1e8, stderr: length}, reject: false});
	t.true(failed);
	t.true(isMaxBuffer);
	t.is(maxBufferInfo, undefined);
	assertErrorMessage(t, shortMessage, {execaMethod: execaSync, fdNumber: 2, length});
	t.is(stderr, getExpectedOutput(length));
});

test('maxBuffer.stderr works with lines, sync', t => {
	const length = 3;
	const {isMaxBuffer, stderr} = t.throws(() => {
		execaSync('noop-both.js', ['.'.repeat(maxBuffer)], {maxBuffer: {stdout: 1e8, stderr: length}, lines: true});
	}, maxBufferCodeSync);
	t.true(isMaxBuffer);
	t.deepEqual(stderr, [getExpectedOutput(length)]);
});

test('maxBuffer.stdout is an upper bound for maxBuffer.stderr, sync', t => {
	const length = 3;
	const {isMaxBuffer, shortMessage, stderr} = t.throws(() => {
		execaSync('noop-fd.js', ['2', '.'.repeat(maxBuffer)], {maxBuffer: {stdout: length, stderr: 1e8}});
	}, maxBufferCodeSync);
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage, {execaMethod: execaSync, fdNumber: 2, length});
	t.is(stderr, getExpectedOutput(length));
});

test('maxBuffer.stderr is not reported on spawn errors, sync', t => {
	const {code, isMaxBuffer} = t.throws(() => {
		execaSync('non-existent-command', {maxBuffer: {stderr: 1}});
	});
	t.is(code, 'ENOENT');
	t.false(isMaxBuffer);
});

const testMaxBufferEncoding = async (t, execaMethod, fdNumber) => {
	const {shortMessage, stdio} = await runMaxBuffer(t, execaMethod, fdNumber, {encoding: 'buffer'});
	assertErrorMessage(t, shortMessage, {execaMethod, fdNumber, unit: 'bytes'});
	const stream = stdio[fdNumber];
	t.true(stream instanceof Uint8Array);
	t.is(Buffer.from(stream).toString(), getExpectedOutput());
};

test('maxBuffer works with encoding buffer and stdout', testMaxBufferEncoding, execa, 1);
test('maxBuffer works with encoding buffer and stderr', testMaxBufferEncoding, execa, 2);
test('maxBuffer works with encoding buffer and stdio[*]', testMaxBufferEncoding, execa, 3);
test('maxBuffer works with encoding buffer and stdout, sync', testMaxBufferEncoding, execaSync, 1);
test('maxBuffer works with encoding buffer and stderr, sync', testMaxBufferEncoding, execaSync, 2);
test('maxBuffer works with encoding buffer and stdio[*], sync', testMaxBufferEncoding, execaSync, 3);

const testMaxBufferHex = async (t, fdNumber) => {
	const length = maxBuffer / 2;
	const {shortMessage, stdio} = await runMaxBuffer(t, execa, fdNumber, {length, encoding: 'hex'});
	assertErrorMessage(t, shortMessage, {fdNumber});
	t.is(stdio[fdNumber], Buffer.from(getExpectedOutput(length)).toString('hex'));
};

test('maxBuffer works with other encodings and stdout', testMaxBufferHex, 1);
test('maxBuffer works with other encodings and stderr', testMaxBufferHex, 2);
test('maxBuffer works with other encodings and stdio[*]', testMaxBufferHex, 3);

const testMaxBufferHexSync = async (t, fdNumber) => {
	const length = maxBuffer / 2;
	const {isMaxBuffer, stdio} = await getMaxBufferSubprocess(execaSync, fdNumber, {length, encoding: 'hex'});
	t.false(isMaxBuffer);
	t.is(stdio[fdNumber], Buffer.from(getExpectedOutput(length + 1)).toString('hex'));
};

test('maxBuffer ignores other encodings and stdout, sync', testMaxBufferHexSync, 1);
test('maxBuffer ignores other encodings and stderr, sync', testMaxBufferHexSync, 2);
test('maxBuffer ignores other encodings and stdio[*], sync', testMaxBufferHexSync, 3);

const testNoMaxBuffer = async (t, fdNumber, buffer) => {
	const subprocess = getMaxBufferSubprocess(execa, fdNumber, {buffer});
	const [{isMaxBuffer, stdio}, output] = await Promise.all([
		subprocess,
		getStream(subprocess.stdio[fdNumber]),
	]);
	t.false(isMaxBuffer);
	t.is(stdio[fdNumber], undefined);
	t.is(output, getExpectedOutput(maxBuffer + 1));
};

test('do not buffer stdout when `buffer` set to `false`', testNoMaxBuffer, 1, false);
test('do not buffer stdout when `buffer` set to `false`, fd-specific', testNoMaxBuffer, 1, {stdout: false});
test('do not buffer stderr when `buffer` set to `false`', testNoMaxBuffer, 2, false);
test('do not buffer stderr when `buffer` set to `false`, fd-specific', testNoMaxBuffer, 2, {stderr: false});
test('do not buffer stdio[*] when `buffer` set to `false`', testNoMaxBuffer, 3, false);
test('do not buffer stdio[*] when `buffer` set to `false`, fd-specific', testNoMaxBuffer, 3, {fd3: false});

const testNoMaxBufferSync = (t, fdNumber, buffer) => {
	const {isMaxBuffer, stdio} = getMaxBufferSubprocess(execaSync, fdNumber, {buffer});
	t.false(isMaxBuffer);
	t.is(stdio[fdNumber], undefined);
};

// @todo: add tests for fd3 once the following Node.js bug is fixed.
// https://github.com/nodejs/node/issues/52422
test('do not buffer stdout when `buffer` set to `false`, sync', testNoMaxBufferSync, 1, false);
test('do not buffer stdout when `buffer` set to `false`, fd-specific, sync', testNoMaxBufferSync, 1, {stdout: false});
test('do not buffer stderr when `buffer` set to `false`, sync', testNoMaxBufferSync, 2, false);
test('do not buffer stderr when `buffer` set to `false`, fd-specific, sync', testNoMaxBufferSync, 2, {stderr: false});

const testNoMaxBufferSyncObjectPipe = (t, fdNumber, fdName, stdioOption) => {
	const {isMaxBuffer, stdio} = execaSync('max-buffer.js', [`${fdNumber}`, `${maxBuffer + 1}`], {
		[fdName]: stdioOption,
		buffer: false,
		maxBuffer,
	});
	t.false(isMaxBuffer);
	t.is(stdio[fdNumber], undefined);
};

test('do not buffer stdout object pipe when `buffer` set to `false`, sync', testNoMaxBufferSyncObjectPipe, 1, 'stdout', {value: 'pipe'});
test('do not buffer stdout object pipe with input false when `buffer` set to `false`, sync', testNoMaxBufferSyncObjectPipe, 1, 'stdout', {value: 'pipe', input: false});
test('do not buffer stdout object pipe with input true when `buffer` set to `false`, sync', testNoMaxBufferSyncObjectPipe, 1, 'stdout', {value: 'pipe', input: true});
test('do not buffer stderr object pipe with input true when `buffer` set to `false`, sync', testNoMaxBufferSyncObjectPipe, 2, 'stderr', {value: 'pipe', input: true});

const testMaxBufferAbort = async (t, fdNumber) => {
	const subprocess = getMaxBufferSubprocess(execa, fdNumber);
	const [{isMaxBuffer, shortMessage}] = await Promise.all([
		t.throwsAsync(subprocess, maxBufferMessage),
		t.throwsAsync(getStream(subprocess.stdio[fdNumber]), {code: 'ERR_STREAM_PREMATURE_CLOSE'}),
	]);
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage, {execaMethod: execa, fdNumber});
};

test('abort stream when hitting maxBuffer with stdout', testMaxBufferAbort, 1);
test('abort stream when hitting maxBuffer with stderr', testMaxBufferAbort, 2);
test('abort stream when hitting maxBuffer with stdio[*]', testMaxBufferAbort, 3);

test('error.isMaxBuffer is false on early errors', async t => {
	const {failed, isMaxBuffer} = await getEarlyErrorSubprocess({reject: false, maxBuffer: 1});
	t.true(failed);
	t.false(isMaxBuffer);
});

test('maxBuffer works with result.ipcOutput', async t => {
	const {
		isMaxBuffer,
		shortMessage,
		message,
		stderr,
		ipcOutput,
	} = await t.throwsAsync(execa('ipc-send-twice.js', {ipc: true, maxBuffer: {ipc: 1}}));
	t.true(isMaxBuffer);
	t.is(shortMessage, 'Command\'s IPC output was larger than 1 messages: ipc-send-twice.js\nmaxBuffer exceeded');
	t.true(message.endsWith(`\n\n${foobarArray[0]}`));
	t.is(stderr, '');
	t.deepEqual(ipcOutput, [foobarArray[0]]);
});

test('maxBuffer is ignored with result.ipcOutput if buffer is false', async t => {
	const {ipcOutput} = await execa('ipc-send-twice.js', {ipc: true, maxBuffer: {ipc: 1}, buffer: false});
	t.deepEqual(ipcOutput, []);
});

/*
`result.ipcOutput` is counted in messages, which are indivisible, so any `maxBuffer` value the count cannot land on exactly must still be enforced.
The threshold is hit as soon as buffering one more message would exceed it, which is how the stream-based `maxBuffer` behaves too.
*/
const testIpcMaxBufferValue = async (t, maxBuffer, expectedOutput) => {
	const {isMaxBuffer, ipcOutput} = await t.throwsAsync(execa('ipc-send-twice.js', {ipc: true, maxBuffer: {ipc: maxBuffer}}));
	t.true(isMaxBuffer);
	t.deepEqual(ipcOutput, expectedOutput);
};

test('maxBuffer works with result.ipcOutput, negative', testIpcMaxBufferValue, -1, []);
test('maxBuffer works with result.ipcOutput, 0', testIpcMaxBufferValue, 0, []);
test('maxBuffer works with result.ipcOutput, below 1', testIpcMaxBufferValue, 0.5, []);
test('maxBuffer works with result.ipcOutput, 1', testIpcMaxBufferValue, 1, [foobarArray[0]]);
test('maxBuffer works with result.ipcOutput, fractional', testIpcMaxBufferValue, 1.5, [foobarArray[0]]);

const testIpcMaxBufferNotHit = async (t, maxBuffer) => {
	const {isMaxBuffer, ipcOutput} = await execa('ipc-send-twice.js', {ipc: true, maxBuffer: {ipc: maxBuffer}});
	t.false(isMaxBuffer);
	t.deepEqual(ipcOutput, foobarArray);
};

test('maxBuffer is not hit with result.ipcOutput, exact count', testIpcMaxBufferNotHit, 2);
test('maxBuffer is not hit with result.ipcOutput, fractional', testIpcMaxBufferNotHit, 2.5);

// The same `maxBuffer` value must be interpreted the same way whether the output is buffered as messages or as characters
const testIpcMaxBufferLikeStream = async (t, maxBuffer) => {
	const [ipcResult, streamResult] = await Promise.all([
		execa('ipc-send-twice.js', {ipc: true, maxBuffer: {ipc: maxBuffer}, reject: false}),
		execa('noop-fd.js', ['1', 'ab'], {maxBuffer, reject: false}),
	]);
	t.is(ipcResult.isMaxBuffer, streamResult.isMaxBuffer);
	t.is(ipcResult.ipcOutput.length, streamResult.stdout.length);
};

test('maxBuffer with result.ipcOutput matches stdout, 0.5', testIpcMaxBufferLikeStream, 0.5);
test('maxBuffer with result.ipcOutput matches stdout, 1', testIpcMaxBufferLikeStream, 1);
test('maxBuffer with result.ipcOutput matches stdout, 1.5', testIpcMaxBufferLikeStream, 1.5);
test('maxBuffer with result.ipcOutput matches stdout, 2', testIpcMaxBufferLikeStream, 2);
