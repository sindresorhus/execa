import {Buffer} from 'node:buffer';
import test from 'ava';
import getStream from 'get-stream';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio} from '../helpers/stdio.js';
import {getEarlyErrorSubprocess, getEarlyErrorSubprocessSync} from '../helpers/early-error.js';
import {maxBuffer, assertErrorMessage} from '../helpers/max-buffer.js';

setFixtureDir();

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

test('maxBuffer does not affect other file descriptors with fd-specific options', async t => {
	const {isMaxBuffer} = await getMaxBufferSubprocess(execa, 2, {maxBuffer: {stdout: 1}});
	t.false(isMaxBuffer);
});

test('maxBuffer.stdout is used for other file descriptors with fd-specific options, sync', async t => {
	const length = 1;
	const {shortMessage, stderr} = await runMaxBuffer(t, execaSync, 2, {maxBuffer: {stdout: length}});
	assertErrorMessage(t, shortMessage, {execaMethod: execaSync, fdNumber: 2, length});
	t.is(stderr, getExpectedOutput(length));
});

const testAll = async (t, shouldFail) => {
	const difference = shouldFail ? 0 : 1;
	const maxBufferStdout = 2;
	const maxBufferStderr = 4 - difference;
	const {isMaxBuffer, shortMessage, stdout, stderr, all} = await execa(
		'noop-both.js',
		['\n'.repeat(maxBufferStdout - 1), '\n'.repeat(maxBufferStderr - difference)],
		{maxBuffer: {stdout: maxBufferStdout, stderr: maxBufferStderr}, all: true, stripFinalNewline: false, reject: false},
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

const testNoMaxBuffer = async (t, fdNumber) => {
	const subprocess = getMaxBufferSubprocess(execa, fdNumber, {buffer: false});
	const [{isMaxBuffer, stdio}, output] = await Promise.all([
		subprocess,
		getStream(subprocess.stdio[fdNumber]),
	]);
	t.false(isMaxBuffer);
	t.is(stdio[fdNumber], undefined);
	t.is(output, getExpectedOutput(maxBuffer + 1));
};

test('do not buffer stdout when `buffer` set to `false`', testNoMaxBuffer, 1);
test('do not buffer stderr when `buffer` set to `false`', testNoMaxBuffer, 2);
test('do not buffer stdio[*] when `buffer` set to `false`', testNoMaxBuffer, 3);

const testNoMaxBufferSync = (t, fdNumber) => {
	const {isMaxBuffer, stdio} = getMaxBufferSubprocess(execaSync, fdNumber, {buffer: false});
	t.false(isMaxBuffer);
	t.is(stdio[fdNumber], undefined);
};

// @todo: add a test for fd3 once the following Node.js bug is fixed.
// https://github.com/nodejs/node/issues/52338
test('do not buffer stdout when `buffer` set to `false`, sync', testNoMaxBufferSync, 1);
test('do not buffer stderr when `buffer` set to `false`, sync', testNoMaxBufferSync, 2);

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

const testEarlyError = async (t, getSubprocess) => {
	const {failed, isMaxBuffer} = await getSubprocess({reject: false, maxBuffer: 1});
	t.true(failed);
	t.false(isMaxBuffer);
};

test('error.isMaxBuffer is false on early errors', testEarlyError, getEarlyErrorSubprocess);
test('error.isMaxBuffer is false on early errors, sync', testEarlyError, getEarlyErrorSubprocessSync);
