import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';
import {platform} from 'node:process';
import {readFile, rm} from 'node:fs/promises';
import test from 'node:test';
import getStream from 'get-stream';
import tempfile from 'tempfile';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {fullStdio} from '../helpers/stdio.js';
import {getEarlyErrorSubprocess} from '../helpers/early-error.js';
import {maxBuffer, assertErrorMessage} from '../helpers/max-buffer.js';
import {foobarArray} from '../helpers/input.js';

setFixtureDirectory();

const maxBufferMessage = {message: /maxBuffer exceeded/};
const maxBufferCodeSync = {code: 'ENOBUFS'};

// Bound the regression even when exceeding maxBuffer does not terminate the subprocess.
const assertMaxBufferRejects = async subprocess => {
	const cleanup = setTimeout(() => {
		subprocess.kill('SIGKILL');
	}, 5000);
	try {
		const error = await assertRejects(subprocess);
		assert.equal(error.isMaxBuffer, true);
		return error;
	} finally {
		clearTimeout(cleanup);
	}
};

const assertMaxBufferTermination = async (subprocess, expectedSignal = 'SIGTERM') => {
	const error = await assertMaxBufferRejects(subprocess);
	assert.equal(error.isTerminated, true);
	assert.equal(error.signal, expectedSignal);
	assert.equal(error.exitCode, undefined);
	assert.equal(error.timedOut, false);
	return error;
};

const testAliveMaxBuffer = async (fdNumber, options = {}) => {
	const error = await assertMaxBufferTermination(execa('max-buffer-forever.js', [`${fdNumber}`, '100'], {...fullStdio, maxBuffer: 5, ...options}), options.killSignal);
	assert.equal(error.stdio[fdNumber], '.....');
};

test('maxBuffer terminates a subprocess that stays alive without more output', () => testAliveMaxBuffer(1));
test('maxBuffer terminates a subprocess that stays alive without more stderr', () => testAliveMaxBuffer(2));
test('maxBuffer terminates a subprocess that stays alive without more stdio[3]', () => testAliveMaxBuffer(3));
test('maxBuffer termination uses killSignal', () => testAliveMaxBuffer(1, {killSignal: 'SIGINT'}));

// Windows terminates immediately instead of delivering catchable signals.
if (platform !== 'win32') {
	test('maxBuffer termination forcefully kills a subprocess ignoring killSignal', async () => {
		const error = await assertMaxBufferTermination(execa('max-buffer-forever.js', ['1', '100', 'SIGINT'], {
			maxBuffer: 5,
			killSignal: 'SIGINT',
			forceKillAfterDelay: 50,
		}), 'SIGKILL');
		assert.equal(error.isForcefullyTerminated, true);
		assert.equal(error.stdout, '.....');
	});

	test('maxBuffer termination reports the exit code of a subprocess handling killSignal', async () => {
		const error = await assertMaxBufferRejects(execa('max-buffer-forever.js', ['1', '100', 'SIGTERM', '5'], {maxBuffer: 5}));
		assert.equal(error.isTerminated, false);
		assert.equal(error.signal, undefined);
		assert.equal(error.exitCode, 5);
		assert.equal(error.stdout, '.....');
	});
}

test('maxBuffer termination applies to lines', async () => {
	const error = await assertMaxBufferTermination(execa('max-buffer-forever.js', ['1', '100'], {
		maxBuffer: 1,
		lines: true,
		stdout: {
			* transform() {
				yield 'first\nsecond\n';
			},
			binary: true,
		},
	}));
	assert.deepEqual(error.stdout, ['first']);
	assertErrorMessage(error.shortMessage, {length: 1, unit: 'lines'});
});

test('maxBuffer termination applies to object mode', async () => {
	const error = await assertMaxBufferTermination(execa('max-buffer-forever.js', ['1', '100'], {
		maxBuffer: 1,
		stdout: {
			* transform() {
				yield {index: 1};
				yield {index: 2};
			},
			binary: true,
			objectMode: true,
		},
	}));
	assert.deepEqual(error.stdout, [{index: 1}]);
	assertErrorMessage(error.shortMessage, {length: 1, unit: 'objects'});
});

test('maxBuffer termination applies to IPC messages', async () => {
	const error = await assertMaxBufferTermination(execa('ipc-send-forever.js', {ipc: true, maxBuffer: {ipc: 0}}));
	assert.deepEqual(error.ipcOutput, []);
	assert.ok(error.shortMessage.includes('IPC output was larger than 0 messages'));
});

const runMaxBuffer = async (execaMethod, fdNumber, options) => {
	const error = execaMethod === execa
		? await assertRejects(getMaxBufferSubprocess(execaMethod, fdNumber, options), maxBufferMessage)
		: assertThrows(() => {
			getMaxBufferSubprocess(execaMethod, fdNumber, options);
		}, maxBufferCodeSync);
	assert.equal(error.isMaxBuffer, true);
	assert.equal(error.maxBufferInfo, undefined);
	return error;
};

const getMaxBufferSubprocess = (execaMethod, fdNumber, {length = maxBuffer, ...options} = {}) =>
	execaMethod('max-buffer.js', [`${fdNumber}`, `${length + 1}`], {...fullStdio, maxBuffer, ...options});

const getExpectedOutput = (length = maxBuffer) => '.'.repeat(length);

const testMaxBufferSuccess = async (execaMethod, fdNumber, all) => {
	const {isMaxBuffer} = await getMaxBufferSubprocess(execaMethod, fdNumber, {all, length: maxBuffer - 1});
	assert.equal(isMaxBuffer, false);
};

test('maxBuffer does not affect stdout if too high', () => testMaxBufferSuccess(execa, 1, false));
test('maxBuffer does not affect stderr if too high', () => testMaxBufferSuccess(execa, 2, false));
test('maxBuffer does not affect stdio[*] if too high', () => testMaxBufferSuccess(execa, 3, false));
test('maxBuffer does not affect all if too high', () => testMaxBufferSuccess(execa, 1, true));
test('maxBuffer does not affect stdout if too high, sync', () => testMaxBufferSuccess(execaSync, 1, false));
test('maxBuffer does not affect stderr if too high, sync', () => testMaxBufferSuccess(execaSync, 2, false));
test('maxBuffer does not affect stdio[*] if too high, sync', () => testMaxBufferSuccess(execaSync, 3, false));
test('maxBuffer does not affect all if too high, sync', () => testMaxBufferSuccess(execaSync, 1, true));

// The subprocess might exit on its own before it is terminated, in which case its real exit is reported
const assertMaxBufferExit = ({exitCode, signal, isTerminated}, expectedExitCode) => {
	if (signal === undefined) {
		assert.equal(isTerminated, false);
		assert.equal(exitCode, expectedExitCode);
	} else {
		assert.equal(isTerminated, true);
		assert.equal(signal, 'SIGTERM');
		assert.equal(exitCode, undefined);
	}
};

const testMaxBufferExit = async (fixtureName, expectedExitCode) => {
	const error = await assertRejects(
		execa(fixtureName, ['1', '.'.repeat(maxBuffer + 1)], {maxBuffer}),
		maxBufferMessage,
	);
	assert.equal(error.isMaxBuffer, true);
	assertMaxBufferExit(error, expectedExitCode);
	assertErrorMessage(error.shortMessage);
	assert.equal(error.stdout, getExpectedOutput());
};

test('maxBuffer terminates subprocess, more writes', () => testMaxBufferExit('noop-repeat.js', 1));
test('maxBuffer terminates subprocess, no more writes', () => testMaxBufferExit('noop-fd.js', 0));

const testGracefulExitSync = fixtureName => {
	const {isMaxBuffer, shortMessage, exitCode, signal, stdout} = assertThrows(() => {
		execaSync(fixtureName, ['1', '.'.repeat(maxBuffer + 1)], {maxBuffer, killSignal: 'SIGINT'});
	}, maxBufferCodeSync);
	assert.equal(isMaxBuffer, true);
	assertErrorMessage(shortMessage, {execaMethod: execaSync});
	assert.equal(exitCode, undefined);
	assert.equal(signal, 'SIGINT');
	assert.equal(stdout, getExpectedOutput());
};

test('maxBuffer terminate stream with killSignal, more writes, sync', () => testGracefulExitSync('noop-repeat.js'));
test('maxBuffer terminate stream with killSignal, no more writes, sync', () => testGracefulExitSync('noop-fd.js'));

const testMaxBufferLimit = async (execaMethod, fdNumber, all) => {
	const length = all && execaMethod === execa ? maxBuffer * 2 : maxBuffer;
	const {shortMessage, all: allOutput, stdio} = await runMaxBuffer(execaMethod, fdNumber, {all, length});
	assertErrorMessage(shortMessage, {execaMethod, fdNumber});
	assert.equal(all ? allOutput : stdio[fdNumber], getExpectedOutput(length));
};

test('maxBuffer truncates stdout', () => testMaxBufferLimit(execa, 1, false));
test('maxBuffer truncates stderr', () => testMaxBufferLimit(execa, 2, false));
test('maxBuffer truncates stdio[*]', () => testMaxBufferLimit(execa, 3, false));
test('maxBuffer truncates all', () => testMaxBufferLimit(execa, 1, true));
test('maxBuffer truncates stdout, sync', () => testMaxBufferLimit(execaSync, 1, false));
test('maxBuffer truncates stderr, sync', () => testMaxBufferLimit(execaSync, 2, false));
test('maxBuffer truncates stdio[*], sync', () => testMaxBufferLimit(execaSync, 3, false));
test('maxBuffer truncates all, sync', () => testMaxBufferLimit(execaSync, 1, true));

const MAX_BUFFER_DEFAULT = 1e8;

const testMaxBufferDefault = async (execaMethod, fdNumber, maxBuffer) => {
	const length = MAX_BUFFER_DEFAULT;
	const {shortMessage, stdio} = await runMaxBuffer(execaMethod, fdNumber, {length: MAX_BUFFER_DEFAULT + 1, maxBuffer});
	assertErrorMessage(shortMessage, {execaMethod, fdNumber, length});
	assert.equal(stdio[fdNumber], getExpectedOutput(length));
};

test('maxBuffer has a default value with stdout', () => testMaxBufferDefault(execa, 1, undefined));
test('maxBuffer has a default value with stderr', () => testMaxBufferDefault(execa, 2, undefined));
test('maxBuffer has a default value with stdio[*]', () => testMaxBufferDefault(execa, 3, undefined));
test('maxBuffer has a default value with stdout, sync', () => testMaxBufferDefault(execaSync, 1, undefined));
test('maxBuffer has a default value with stderr, sync', () => testMaxBufferDefault(execaSync, 2, undefined));
test('maxBuffer has a default value with stdio[*], sync', () => testMaxBufferDefault(execaSync, 3, undefined));
test('maxBuffer has a default value with stdout with fd-specific options', () => testMaxBufferDefault(execa, 1, {stderr: 1e9}));
test('maxBuffer has a default value with stderr with fd-specific options', () => testMaxBufferDefault(execa, 2, {stdout: 1e9}));
test('maxBuffer has a default value with stdio[*] with fd-specific options', () => testMaxBufferDefault(execa, 3, {stdout: 1e9}));
test('maxBuffer has a default value with stdout with empty fd-specific options', () => testMaxBufferDefault(execa, 1, {}));

const testFdSpecific = async (fdNumber, fdName, execaMethod) => {
	const length = 1;
	const {shortMessage, stdio} = await runMaxBuffer(execaMethod, fdNumber, {maxBuffer: {[fdName]: length}});
	assertErrorMessage(shortMessage, {execaMethod, fdNumber, length});
	assert.equal(stdio[fdNumber], getExpectedOutput(length));
};

test('maxBuffer truncates file descriptors with fd-specific options, stdout', () => testFdSpecific(1, 'stdout', execa));
test('maxBuffer truncates file descriptors with fd-specific options, fd1', () => testFdSpecific(1, 'fd1', execa));
test('maxBuffer truncates file descriptors with fd-specific options, stderr', () => testFdSpecific(2, 'stderr', execa));
test('maxBuffer truncates file descriptors with fd-specific options, fd2', () => testFdSpecific(2, 'fd2', execa));
test('maxBuffer truncates file descriptors with fd-specific options, stdout, all', () => testFdSpecific(1, 'all', execa));
test('maxBuffer truncates file descriptors with fd-specific options, stderr, all', () => testFdSpecific(2, 'all', execa));
test('maxBuffer truncates file descriptors with fd-specific options, fd3', () => testFdSpecific(3, 'fd3', execa));
test('maxBuffer.stdout is used for stdout with fd-specific options, stdout, sync', () => testFdSpecific(1, 'stdout', execaSync));
test('maxBuffer.stderr is used for stderr with fd-specific options, stderr, sync', () => testFdSpecific(2, 'stderr', execaSync));
test('maxBuffer.fd3 is used for stdio[*] with fd-specific options, fd3, sync', () => testFdSpecific(3, 'fd3', execaSync));

test('maxBuffer does not affect other file descriptors with fd-specific options', async () => {
	const {isMaxBuffer} = await getMaxBufferSubprocess(execa, 2, {maxBuffer: {stdout: 1}});
	assert.equal(isMaxBuffer, false);
});

test('maxBuffer.fd3 is invalid without stdio[3], even with ipc', () => {
	const {message} = assertThrows(() => {
		execa('ipc-send-twice.js', {ipc: true, maxBuffer: {fd3: 1}});
	});
	assert.ok(message.includes('"maxBuffer.fd3" is invalid: that file descriptor does not exist.'));
});

test('maxBuffer.fd3 and maxBuffer.ipc are distinct', async () => {
	const {isMaxBuffer, ipcOutput} = await execa('ipc-send-twice.js', {
		ipc: true,
		stdio: ['ignore', 'pipe', 'pipe', 'pipe'],
		maxBuffer: {
			fd3: 1,
			ipc: 2,
		},
	});
	assert.equal(isMaxBuffer, false);
	assert.deepEqual(ipcOutput, foobarArray);
});

test('maxBuffer.stdout is used for other file descriptors with fd-specific options, sync', async () => {
	const length = 1;
	const {shortMessage, stderr} = await runMaxBuffer(execaSync, 2, {maxBuffer: {stdout: length}});
	assertErrorMessage(shortMessage, {execaMethod: execaSync, fdNumber: 2, length});
	assert.equal(stderr, getExpectedOutput(length));
});

// `spawnSync()`'s native `maxBuffer` is `maxBuffer.stdout`, so a lower limit on another file descriptor is only enforced from the output, after the subprocess exits
test('maxBuffer.stderr is used when lower than maxBuffer.stdout, sync', () => {
	const length = 3;
	const error = assertThrows(() => {
		execaSync('noop-both.js', ['.'.repeat(maxBuffer + 1)], {maxBuffer: {stdout: 1e8, stderr: length}});
	}, maxBufferCodeSync);
	assert.equal(error.isMaxBuffer, true);
	assert.equal(error.maxBufferInfo, undefined);
	assertErrorMessage(error.shortMessage, {execaMethod: execaSync, fdNumber: 2, length});
	assert.equal(error.stdout, getExpectedOutput(maxBuffer + 1));
	assert.equal(error.stderr, getExpectedOutput(length));
	// Unlike asynchronous methods, the subprocess is not terminated, since it already exited
	assert.equal(error.isTerminated, false);
	assert.equal(error.signal, undefined);
	assert.equal(error.exitCode, 0);
});

test('maxBuffer.stderr is used when lower than maxBuffer.stdout', async () => {
	const length = 3;
	const error = await assertRejects(execa('noop-both.js', ['.'.repeat(maxBuffer + 1)], {maxBuffer: {stdout: 1e8, stderr: length}}));
	assert.equal(error.isMaxBuffer, true);
	assertErrorMessage(error.shortMessage, {fdNumber: 2, length});
	assert.equal(error.stdout, getExpectedOutput(maxBuffer + 1));
	assert.equal(error.stderr, getExpectedOutput(length));
	assertMaxBufferExit(error, 0);
});

test('maxBuffer is not hit when under each file descriptor\'s value, sync', () => {
	const length = 9;
	const {isMaxBuffer, stdout, stderr} = execaSync('noop-both.js', ['.'.repeat(length)], {maxBuffer: {stdout: 1e8, stderr: 10}});
	assert.equal(isMaxBuffer, false);
	assert.equal(stdout, getExpectedOutput(length));
	assert.equal(stderr, getExpectedOutput(length));
});

// Like with asynchronous methods, a file descriptor which is not buffered is not limited by its own `maxBuffer` value.
// With synchronous methods, it still counts towards `maxBuffer.stdout`, which limits the total output.
const testMaxBufferNoBuffer = async execaMethod => {
	const filePath = tempfile();
	const length = 3;
	const {isMaxBuffer, stderr} = await execaMethod('noop-both.js', ['.'.repeat(length + 1)], {buffer: {stderr: false}, maxBuffer: {stderr: length}, stderr: ['pipe', {file: filePath}]});
	assert.equal(isMaxBuffer, false);
	assert.equal(stderr, undefined);
	assert.equal(await readFile(filePath, 'utf8'), `${'.'.repeat(length + 1)}\n`);
	await rm(filePath);
};

test('maxBuffer.stderr is ignored with buffer: false', () => testMaxBufferNoBuffer(execa));
test('maxBuffer.stderr is ignored with buffer: false, sync', () => testMaxBufferNoBuffer(execaSync));

// `spawnSync()`'s native `maxBuffer` limits the total output of all file descriptors, even when none of them is over its own limit
test('maxBuffer.stdout limits the total output, sync', () => {
	const length = 10;
	const {isMaxBuffer, shortMessage} = execaSync('noop-both.js', ['.'.repeat(length / 2)], {maxBuffer: length, reject: false});
	assert.equal(isMaxBuffer, true);
	assert.ok(shortMessage.startsWith(`Command's output was larger than ${length} bytes`));
});

const testAll = async shouldFail => {
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
	assert.equal(isMaxBuffer, shouldFail);
	if (shouldFail) {
		assertErrorMessage(shortMessage, {fdNumber: 2, length: maxBufferStderr});
	}

	assert.equal(stdout, '\n'.repeat(maxBufferStdout));
	assert.equal(stderr, '\n'.repeat(maxBufferStderr));
	assert.equal(all, '\n'.repeat(maxBufferStdout + maxBufferStderr));
};

test('maxBuffer.stdout can differ from maxBuffer.stderr, combined with all, below threshold', () => testAll(false));
test('maxBuffer.stdout can differ from maxBuffer.stderr, combined with all, above threshold', () => testAll(true));

const testInvalidFd = async (fdName, execaMethod) => {
	const {message} = assertThrows(() => {
		execaMethod('empty.js', {maxBuffer: {[fdName]: 0}});
	});
	assert.ok(message.includes(`"maxBuffer.${fdName}" is invalid`));
};

test('maxBuffer.stdin is invalid', () => testInvalidFd('stdin', execa));
test('maxBuffer.fd0 is invalid', () => testInvalidFd('fd0', execa));
test('maxBuffer.other is invalid', () => testInvalidFd('other', execa));
test('maxBuffer.fd10 is invalid', () => testInvalidFd('fd10', execa));
test('maxBuffer.stdin is invalid, sync', () => testInvalidFd('stdin', execaSync));
test('maxBuffer.fd0 is invalid, sync', () => testInvalidFd('fd0', execaSync));
test('maxBuffer.other is invalid, sync', () => testInvalidFd('other', execaSync));
test('maxBuffer.fd10 is invalid, sync', () => testInvalidFd('fd10', execaSync));

// These tests need the subprocess to have written its output before the timeout kills it, which is only guaranteed if the timeout leaves room for the subprocess to start. On a busy machine, starting Node.js can take over a second.
const SYNC_TIMEOUT = 1e4;

test('maxBuffer 0 terminates on the first output byte before timeout, sync', () => {
	const error = assertThrows(() => {
		execaSync('max-buffer-forever.js', ['1', '1'], {timeout: SYNC_TIMEOUT, maxBuffer: 0});
	}, maxBufferCodeSync);
	assert.equal(error.timedOut, false);
	assert.equal(error.isMaxBuffer, true);
	assert.equal(error.stdout, '');
	assertErrorMessage(error.shortMessage, {execaMethod: execaSync, length: 0});
});

const testZeroMaxBufferSync = (fdNumber, maxBuffer, encoding = 'utf8') => {
	const error = execaSync('max-buffer-forever.js', [`${fdNumber}`, '1'], {
		...fullStdio,
		timeout: SYNC_TIMEOUT,
		maxBuffer,
		encoding,
		reject: false,
	});
	assert.equal(error.code, 'ENOBUFS');
	assert.equal(error.failed, true);
	assert.equal(error.timedOut, false);
	assert.equal(error.isMaxBuffer, true);
	assert.deepEqual(error.stdio[fdNumber], encoding === 'buffer' ? new Uint8Array() : '');
	assertErrorMessage(error.shortMessage, {execaMethod: execaSync, fdNumber, length: 0});
};

test('maxBuffer 0 terminates on the first stderr byte before timeout, sync', () => testZeroMaxBufferSync(2, 0));
test('maxBuffer 0 terminates on the first fd3 byte before timeout with binary output, sync', () => testZeroMaxBufferSync(3, 0, 'buffer'));
test('maxBuffer 0 terminates on the first output byte with stdout-specific limit, sync', () => testZeroMaxBufferSync(1, {stdout: 0}));
test('maxBuffer 0 terminates on the first fd3 byte with fd1-specific limit, sync', () => testZeroMaxBufferSync(3, {fd1: 0}));

const testZeroMaxBufferEmptySync = (maxBuffer, encoding = 'utf8') => {
	const {failed, isMaxBuffer, stdout} = execaSync('empty.js', {maxBuffer, encoding});
	assert.equal(failed, false);
	assert.equal(isMaxBuffer, false);
	assert.deepEqual(stdout, encoding === 'buffer' ? new Uint8Array() : '');
};

test('maxBuffer 0 allows empty text output, sync', () => testZeroMaxBufferEmptySync(0));
test('maxBuffer 0 allows empty binary output, sync', () => testZeroMaxBufferEmptySync(0, 'buffer'));
test('maxBuffer 0 allows empty output with stdout-specific limit, sync', () => testZeroMaxBufferEmptySync({stdout: 0}));

test('maxBuffer small positive limit allows exactly one byte, sync', () => {
	const {failed, isMaxBuffer, stdout} = execaSync('max-buffer.js', ['1', '1'], {maxBuffer: 1});
	assert.equal(failed, false);
	assert.equal(isMaxBuffer, false);
	assert.equal(stdout, '.');
});

test('maxBuffer small positive fractional limit rejects the first byte, sync', () => {
	const error = assertThrows(() => {
		execaSync('max-buffer-forever.js', ['1', '1'], {timeout: SYNC_TIMEOUT, maxBuffer: 0.5});
	}, maxBufferCodeSync);
	assert.equal(error.timedOut, false);
	assert.equal(error.isMaxBuffer, true);
	assert.equal(error.stdout, '');
	assertErrorMessage(error.shortMessage, {execaMethod: execaSync, length: 0.5});
});

// A file descriptor limit lower than `maxBuffer.stdout` does not stop the subprocess with synchronous methods, so the subprocess can still time out afterwards
const testMaxBufferTimeoutSync = (fdNumber, fdName) => {
	const length = 3;
	const error = assertThrows(() => {
		execaSync('max-buffer-forever.js', [`${fdNumber}`, `${maxBuffer}`], {...fullStdio, timeout: SYNC_TIMEOUT, maxBuffer: {[fdName]: length}});
	}, {code: 'ETIMEDOUT'});
	assert.equal(error.timedOut, true);
	assert.equal(error.isMaxBuffer, false);
	assert.equal(error.maxBufferInfo, undefined);
	assert.ok(!Object.hasOwn(error.cause, 'maxBufferInfo'));
	assert.ok(error.shortMessage.startsWith(`Command timed out after ${SYNC_TIMEOUT} milliseconds`));
	assert.equal(error.stdio[fdNumber], getExpectedOutput(length));
};

test('timeout is reported instead of maxBuffer.stderr, sync', () => testMaxBufferTimeoutSync(2, 'stderr'));
test('timeout is reported instead of maxBuffer.fd3, sync', () => testMaxBufferTimeoutSync(3, 'fd3'));

test('timeout does not truncate output under maxBuffer.stderr, sync', () => {
	const {timedOut, isMaxBuffer, stderr} = assertThrows(() => {
		execaSync('max-buffer-forever.js', ['2', `${maxBuffer}`], {timeout: SYNC_TIMEOUT, maxBuffer: {stderr: maxBuffer}});
	}, {code: 'ETIMEDOUT'});
	assert.equal(timedOut, true);
	assert.equal(isMaxBuffer, false);
	assert.equal(stderr, getExpectedOutput(maxBuffer));
});

// `maxBuffer.stdout` is enforced by `spawnSync()` itself, which stops the subprocess before it can time out
test('maxBuffer.stdout is reported before timeout, sync', () => {
	const length = 3;
	const error = assertThrows(() => {
		execaSync('max-buffer-forever.js', ['1', `${maxBuffer}`], {timeout: SYNC_TIMEOUT, maxBuffer: {stdout: length}});
	}, maxBufferCodeSync);
	assert.equal(error.timedOut, false);
	assert.equal(error.isMaxBuffer, true);
	assert.equal(error.maxBufferInfo, undefined);
	assertErrorMessage(error.shortMessage, {execaMethod: execaSync, length});
	assert.equal(error.stdout, getExpectedOutput(length));
});

test('maxBuffer.stderr is reported with a non-zero exit code, sync', () => {
	const length = 3;
	const error = assertThrows(() => {
		execaSync('noop-both-fail.js', ['.'.repeat(maxBuffer)], {maxBuffer: {stdout: 1e8, stderr: length}});
	});
	assert.equal(error.isMaxBuffer, true);
	assert.equal(error.maxBufferInfo, undefined);
	assertErrorMessage(error.shortMessage, {execaMethod: execaSync, fdNumber: 2, length});
	assert.equal(error.exitCode, 1);
	assert.equal(error.stdout, getExpectedOutput(maxBuffer));
	assert.equal(error.stderr, getExpectedOutput(length));
});

test('maxBuffer.stderr works with reject false, sync', () => {
	const length = 3;
	const {failed, isMaxBuffer, maxBufferInfo, shortMessage, stderr} = execaSync('noop-fd.js', ['2', '.'.repeat(maxBuffer)], {maxBuffer: {stdout: 1e8, stderr: length}, reject: false});
	assert.equal(failed, true);
	assert.equal(isMaxBuffer, true);
	assert.equal(maxBufferInfo, undefined);
	assertErrorMessage(shortMessage, {execaMethod: execaSync, fdNumber: 2, length});
	assert.equal(stderr, getExpectedOutput(length));
});

test('maxBuffer.stderr works with lines, sync', () => {
	const length = 3;
	const {isMaxBuffer, stderr} = assertThrows(() => {
		execaSync('noop-both.js', ['.'.repeat(maxBuffer)], {maxBuffer: {stdout: 1e8, stderr: length}, lines: true});
	}, maxBufferCodeSync);
	assert.equal(isMaxBuffer, true);
	assert.deepEqual(stderr, [getExpectedOutput(length)]);
});

test('maxBuffer.stdout is an upper bound for maxBuffer.stderr, sync', () => {
	const length = 3;
	const {isMaxBuffer, shortMessage, stderr} = assertThrows(() => {
		execaSync('noop-fd.js', ['2', '.'.repeat(maxBuffer)], {maxBuffer: {stdout: length, stderr: 1e8}});
	}, maxBufferCodeSync);
	assert.equal(isMaxBuffer, true);
	assertErrorMessage(shortMessage, {execaMethod: execaSync, fdNumber: 2, length});
	assert.equal(stderr, getExpectedOutput(length));
});

test('maxBuffer.stderr is not reported on spawn errors, sync', () => {
	const {code, isMaxBuffer} = assertThrows(() => {
		execaSync('empty.js', {cwd: 'does_not_exist', maxBuffer: {stderr: 1}});
	});
	assert.equal(code, 'ENOENT');
	assert.equal(isMaxBuffer, false);
});

const testMaxBufferEncoding = async (execaMethod, fdNumber) => {
	const {shortMessage, stdio} = await runMaxBuffer(execaMethod, fdNumber, {encoding: 'buffer'});
	assertErrorMessage(shortMessage, {execaMethod, fdNumber, unit: 'bytes'});
	const stream = stdio[fdNumber];
	assert.ok(stream instanceof Uint8Array);
	assert.equal(Buffer.from(stream).toString(), getExpectedOutput());
};

test('maxBuffer works with encoding buffer and stdout', () => testMaxBufferEncoding(execa, 1));
test('maxBuffer works with encoding buffer and stderr', () => testMaxBufferEncoding(execa, 2));
test('maxBuffer works with encoding buffer and stdio[*]', () => testMaxBufferEncoding(execa, 3));
test('maxBuffer works with encoding buffer and stdout, sync', () => testMaxBufferEncoding(execaSync, 1));
test('maxBuffer works with encoding buffer and stderr, sync', () => testMaxBufferEncoding(execaSync, 2));
test('maxBuffer works with encoding buffer and stdio[*], sync', () => testMaxBufferEncoding(execaSync, 3));

const testMaxBufferHex = async fdNumber => {
	const length = maxBuffer / 2;
	const {shortMessage, stdio} = await runMaxBuffer(execa, fdNumber, {length, encoding: 'hex'});
	assertErrorMessage(shortMessage, {fdNumber});
	assert.equal(stdio[fdNumber], Buffer.from(getExpectedOutput(length)).toString('hex'));
};

test('maxBuffer works with other encodings and stdout', () => testMaxBufferHex(1));
test('maxBuffer works with other encodings and stderr', () => testMaxBufferHex(2));
test('maxBuffer works with other encodings and stdio[*]', () => testMaxBufferHex(3));

const testMaxBufferHexSync = async fdNumber => {
	const length = maxBuffer / 2;
	const {isMaxBuffer, stdio} = await getMaxBufferSubprocess(execaSync, fdNumber, {length, encoding: 'hex'});
	assert.equal(isMaxBuffer, false);
	assert.equal(stdio[fdNumber], Buffer.from(getExpectedOutput(length + 1)).toString('hex'));
};

test('maxBuffer ignores other encodings and stdout, sync', () => testMaxBufferHexSync(1));
test('maxBuffer ignores other encodings and stderr, sync', () => testMaxBufferHexSync(2));
test('maxBuffer ignores other encodings and stdio[*], sync', () => testMaxBufferHexSync(3));

const testNoMaxBuffer = async (fdNumber, buffer) => {
	const subprocess = getMaxBufferSubprocess(execa, fdNumber, {buffer});
	const [{isMaxBuffer, stdio}, output] = await Promise.all([
		subprocess,
		getStream(subprocess.stdio[fdNumber]),
	]);
	assert.equal(isMaxBuffer, false);
	assert.equal(stdio[fdNumber], undefined);
	assert.equal(output, getExpectedOutput(maxBuffer + 1));
};

test('do not buffer stdout when `buffer` set to `false`', () => testNoMaxBuffer(1, false));
test('do not buffer stdout when `buffer` set to `false`, fd-specific', () => testNoMaxBuffer(1, {stdout: false}));
test('do not buffer stderr when `buffer` set to `false`', () => testNoMaxBuffer(2, false));
test('do not buffer stderr when `buffer` set to `false`, fd-specific', () => testNoMaxBuffer(2, {stderr: false}));
test('do not buffer stdio[*] when `buffer` set to `false`', () => testNoMaxBuffer(3, false));
test('do not buffer stdio[*] when `buffer` set to `false`, fd-specific', () => testNoMaxBuffer(3, {fd3: false}));

const testNoMaxBufferSync = (fdNumber, buffer) => {
	const {isMaxBuffer, stdio} = getMaxBufferSubprocess(execaSync, fdNumber, {buffer});
	assert.equal(isMaxBuffer, false);
	assert.equal(stdio[fdNumber], undefined);
};

// @todo: add tests for fd3 once the following Node.js bug is fixed.
// https://github.com/nodejs/node/issues/52422
test('do not buffer stdout when `buffer` set to `false`, sync', () => testNoMaxBufferSync(1, false));
test('do not buffer stdout when `buffer` set to `false`, fd-specific, sync', () => testNoMaxBufferSync(1, {stdout: false}));
test('do not buffer stderr when `buffer` set to `false`, sync', () => testNoMaxBufferSync(2, false));
test('do not buffer stderr when `buffer` set to `false`, fd-specific, sync', () => testNoMaxBufferSync(2, {stderr: false}));

const testNoMaxBufferSyncObjectPipe = (fdNumber, fdName, stdioOption) => {
	const {isMaxBuffer, stdio} = execaSync('max-buffer.js', [`${fdNumber}`, `${maxBuffer + 1}`], {
		[fdName]: stdioOption,
		buffer: false,
		maxBuffer,
	});
	assert.equal(isMaxBuffer, false);
	assert.equal(stdio[fdNumber], undefined);
};

test('do not buffer stdout object pipe when `buffer` set to `false`, sync', () => testNoMaxBufferSyncObjectPipe(1, 'stdout', {value: 'pipe'}));
test('do not buffer stdout object pipe with input false when `buffer` set to `false`, sync', () => testNoMaxBufferSyncObjectPipe(1, 'stdout', {value: 'pipe', input: false}));
test('do not buffer stdout object pipe with input true when `buffer` set to `false`, sync', () => testNoMaxBufferSyncObjectPipe(1, 'stdout', {value: 'pipe', input: true}));
test('do not buffer stderr object pipe with input true when `buffer` set to `false`, sync', () => testNoMaxBufferSyncObjectPipe(2, 'stderr', {value: 'pipe', input: true}));

const testMaxBufferAbort = async fdNumber => {
	const subprocess = getMaxBufferSubprocess(execa, fdNumber);
	const [{isMaxBuffer, shortMessage}] = await Promise.all([
		assertRejects(subprocess, maxBufferMessage),
		assertRejects(getStream(subprocess.stdio[fdNumber]), {code: 'ERR_STREAM_PREMATURE_CLOSE'}),
	]);
	assert.equal(isMaxBuffer, true);
	assertErrorMessage(shortMessage, {execaMethod: execa, fdNumber});
};

test('abort stream when hitting maxBuffer with stdout', () => testMaxBufferAbort(1));
test('abort stream when hitting maxBuffer with stderr', () => testMaxBufferAbort(2));
test('abort stream when hitting maxBuffer with stdio[*]', () => testMaxBufferAbort(3));

test('error.isMaxBuffer is false on early errors', async () => {
	const {failed, isMaxBuffer} = await getEarlyErrorSubprocess({reject: false, maxBuffer: 1});
	assert.equal(failed, true);
	assert.equal(isMaxBuffer, false);
});

test('maxBuffer works with result.ipcOutput', async () => {
	const {
		isMaxBuffer,
		shortMessage,
		message,
		stderr,
		ipcOutput,
	} = await assertRejects(execa('ipc-send-twice.js', {ipc: true, maxBuffer: {ipc: 1}}));
	assert.equal(isMaxBuffer, true);
	assert.equal(shortMessage, 'Command\'s IPC output was larger than 1 messages: ipc-send-twice.js\nmaxBuffer exceeded');
	assert.ok(message.endsWith(`\n\n${foobarArray[0]}`));
	assert.equal(stderr, '');
	assert.deepEqual(ipcOutput, [foobarArray[0]]);
});

test('maxBuffer is ignored with result.ipcOutput if buffer is false', async () => {
	const {ipcOutput} = await execa('ipc-send-twice.js', {ipc: true, maxBuffer: {ipc: 1}, buffer: false});
	assert.deepEqual(ipcOutput, []);
});

/*
`result.ipcOutput` is counted in messages, which are indivisible, so any `maxBuffer` value the count cannot land on exactly must still be enforced.
The threshold is hit as soon as buffering one more message would exceed it, which is how the stream-based `maxBuffer` behaves too.
*/
const testIpcMaxBufferValue = async (maxBuffer, expectedOutput) => {
	const {isMaxBuffer, ipcOutput} = await assertRejects(execa('ipc-send-twice.js', {ipc: true, maxBuffer: {ipc: maxBuffer}}));
	assert.equal(isMaxBuffer, true);
	assert.deepEqual(ipcOutput, expectedOutput);
};

test('maxBuffer works with result.ipcOutput, negative', () => testIpcMaxBufferValue(-1, []));
test('maxBuffer works with result.ipcOutput, 0', () => testIpcMaxBufferValue(0, []));
test('maxBuffer works with result.ipcOutput, below 1', () => testIpcMaxBufferValue(0.5, []));
test('maxBuffer works with result.ipcOutput, 1', () => testIpcMaxBufferValue(1, [foobarArray[0]]));
test('maxBuffer works with result.ipcOutput, fractional', () => testIpcMaxBufferValue(1.5, [foobarArray[0]]));

const testIpcMaxBufferNotHit = async maxBuffer => {
	const {isMaxBuffer, ipcOutput} = await execa('ipc-send-twice.js', {ipc: true, maxBuffer: {ipc: maxBuffer}});
	assert.equal(isMaxBuffer, false);
	assert.deepEqual(ipcOutput, foobarArray);
};

test('maxBuffer is not hit with result.ipcOutput, exact count', () => testIpcMaxBufferNotHit(2));
test('maxBuffer is not hit with result.ipcOutput, fractional', () => testIpcMaxBufferNotHit(2.5));

// The same `maxBuffer` value must be interpreted the same way whether the output is buffered as messages or as characters
const testIpcMaxBufferLikeStream = async maxBuffer => {
	const [ipcResult, streamResult] = await Promise.all([
		execa('ipc-send-twice.js', {ipc: true, maxBuffer: {ipc: maxBuffer}, reject: false}),
		execa('noop-fd.js', ['1', 'ab'], {maxBuffer, reject: false}),
	]);
	assert.equal(ipcResult.isMaxBuffer, streamResult.isMaxBuffer);
	assert.equal(ipcResult.ipcOutput.length, streamResult.stdout.length);
};

test('maxBuffer with result.ipcOutput matches stdout, 0.5', () => testIpcMaxBufferLikeStream(0.5));
test('maxBuffer with result.ipcOutput matches stdout, 1', () => testIpcMaxBufferLikeStream(1));
test('maxBuffer with result.ipcOutput matches stdout, 1.5', () => testIpcMaxBufferLikeStream(1.5));
test('maxBuffer with result.ipcOutput matches stdout, 2', () => testIpcMaxBufferLikeStream(2));
