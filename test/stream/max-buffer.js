import {Buffer} from 'node:buffer';
import test from 'ava';
import getStream from 'get-stream';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio} from '../helpers/stdio.js';

setFixtureDir();

const maxBuffer = 10;
const maxBufferMessage = /maxBuffer exceeded/;

const runMaxBuffer = (t, execaMethod, fdNumber, options) => execaMethod === execa
	? t.throwsAsync(getMaxBufferSubprocess(execaMethod, fdNumber, options), {message: maxBufferMessage})
	: t.throws(() => {
		getMaxBufferSubprocess(execaMethod, fdNumber, options);
	}, {code: 'ENOBUFS'});

const getMaxBufferSubprocess = (execaMethod, fdNumber, {length = maxBuffer, ...options} = {}) =>
	execaMethod('max-buffer.js', [`${fdNumber}`, `${length + 1}`], {...fullStdio, maxBuffer, ...options});

const getExpectedOutput = (length = maxBuffer) => '.'.repeat(length);

const testMaxBufferSuccess = async (t, fdNumber, all) => {
	await t.notThrowsAsync(getMaxBufferSubprocess(execa, fdNumber, {all, length: maxBuffer - 1}));
};

test('maxBuffer does not affect stdout if too high', testMaxBufferSuccess, 1, false);
test('maxBuffer does not affect stderr if too high', testMaxBufferSuccess, 2, false);
test('maxBuffer does not affect stdio[*] if too high', testMaxBufferSuccess, 3, false);
test('maxBuffer does not affect all if too high', testMaxBufferSuccess, 1, true);

const testMaxBufferSuccessSync = (t, fdNumber, all) => {
	t.notThrows(() => {
		getMaxBufferSubprocess(execaSync, fdNumber, {all, length: maxBuffer - 1});
	});
};

test('maxBuffer does not affect stdout if too high, sync', testMaxBufferSuccessSync, 1, false);
test('maxBuffer does not affect stderr if too high, sync', testMaxBufferSuccessSync, 2, false);
test('maxBuffer does not affect stdio[*] if too high, sync', testMaxBufferSuccessSync, 3, false);
test('maxBuffer does not affect all if too high, sync', testMaxBufferSuccessSync, 1, true);

const testGracefulExit = async (t, fixtureName, expectedExitCode) => {
	const {exitCode, signal, stdout} = await t.throwsAsync(
		execa(fixtureName, ['1', '.'.repeat(maxBuffer + 1)], {maxBuffer}),
		{message: maxBufferMessage},
	);
	t.is(exitCode, expectedExitCode);
	t.is(signal, undefined);
	t.is(stdout, getExpectedOutput());
};

test('maxBuffer terminates stream gracefully, more writes', testGracefulExit, 'noop-repeat.js', 1);
test('maxBuffer terminates stream gracefully, no more writes', testGracefulExit, 'noop-fd.js', 0);

const testGracefulExitSync = (t, fixtureName) => {
	const {exitCode, signal, stdout} = t.throws(() => {
		execaSync(fixtureName, ['1', '.'.repeat(maxBuffer + 1)], {maxBuffer, killSignal: 'SIGINT'});
	}, {code: 'ENOBUFS'});
	t.is(exitCode, undefined);
	t.is(signal, 'SIGINT');
	t.is(stdout, getExpectedOutput());
};

test('maxBuffer terminate stream with killSignal, more writes, sync', testGracefulExitSync, 'noop-repeat.js');
test('maxBuffer terminate stream with killSignal, no more writes, sync', testGracefulExitSync, 'noop-fd.js');

const testMaxBufferLimit = async (t, execaMethod, fdNumber, all) => {
	const length = all && execaMethod === execa ? maxBuffer * 2 : maxBuffer;
	const result = await runMaxBuffer(t, execaMethod, fdNumber, {all, length});
	t.is(all ? result.all : result.stdio[fdNumber], getExpectedOutput(length));
};

test('maxBuffer truncates stdout', testMaxBufferLimit, execa, 1, false);
test('maxBuffer truncates stderr', testMaxBufferLimit, execa, 2, false);
test('maxBuffer truncates stdio[*]', testMaxBufferLimit, execa, 3, false);
test('maxBuffer truncates all', testMaxBufferLimit, execa, 1, true);
test('maxBuffer truncates stdout, sync', testMaxBufferLimit, execaSync, 1, false);
test('maxBuffer truncates stderr, sync', testMaxBufferLimit, execaSync, 2, false);
test('maxBuffer truncates stdio[*], sync', testMaxBufferLimit, execaSync, 3, false);
test('maxBuffer truncates all, sync', testMaxBufferLimit, execaSync, 1, true);

const testMaxBufferEncoding = async (t, execaMethod, fdNumber) => {
	const result = await runMaxBuffer(t, execaMethod, fdNumber, {encoding: 'buffer'});
	const stream = result.stdio[fdNumber];
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
	const {stdio} = await runMaxBuffer(t, execa, fdNumber, {length, encoding: 'hex'});
	t.is(stdio[fdNumber], Buffer.from(getExpectedOutput(length)).toString('hex'));
};

test('maxBuffer works with other encodings and stdout', testMaxBufferHex, 1);
test('maxBuffer works with other encodings and stderr', testMaxBufferHex, 2);
test('maxBuffer works with other encodings and stdio[*]', testMaxBufferHex, 3);

const testMaxBufferHexSync = async (t, fdNumber) => {
	const length = maxBuffer / 2;
	const {stdio} = await getMaxBufferSubprocess(execaSync, fdNumber, {length, encoding: 'hex'});
	t.is(stdio[fdNumber], Buffer.from(getExpectedOutput(length + 1)).toString('hex'));
};

test('maxBuffer ignores other encodings and stdout, sync', testMaxBufferHexSync, 1);
test('maxBuffer ignores other encodings and stderr, sync', testMaxBufferHexSync, 2);
test('maxBuffer ignores other encodings and stdio[*], sync', testMaxBufferHexSync, 3);

const testNoMaxBuffer = async (t, fdNumber) => {
	const subprocess = getMaxBufferSubprocess(execa, fdNumber, {buffer: false});
	const [{stdio}, output] = await Promise.all([
		subprocess,
		getStream(subprocess.stdio[fdNumber]),
	]);
	t.is(stdio[fdNumber], undefined);
	t.is(output, getExpectedOutput(maxBuffer + 1));
};

test('do not buffer stdout when `buffer` set to `false`', testNoMaxBuffer, 1);
test('do not buffer stderr when `buffer` set to `false`', testNoMaxBuffer, 2);
test('do not buffer stdio[*] when `buffer` set to `false`', testNoMaxBuffer, 3);

const testNoMaxBufferSync = (t, fdNumber) => {
	const {stdio} = getMaxBufferSubprocess(execaSync, fdNumber, {buffer: false});
	t.is(stdio[fdNumber], undefined);
};

// @todo: add a test for fd3 once the following Node.js bug is fixed.
// https://github.com/nodejs/node/issues/52338
test('do not buffer stdout when `buffer` set to `false`, sync', testNoMaxBufferSync, 1);
test('do not buffer stderr when `buffer` set to `false`, sync', testNoMaxBufferSync, 2);

const testMaxBufferAbort = async (t, fdNumber) => {
	const subprocess = getMaxBufferSubprocess(execa, fdNumber);
	await Promise.all([
		t.throwsAsync(subprocess, {message: maxBufferMessage}),
		t.throwsAsync(getStream(subprocess.stdio[fdNumber]), {code: 'ERR_STREAM_PREMATURE_CLOSE'}),
	]);
};

test('abort stream when hitting maxBuffer with stdout', testMaxBufferAbort, 1);
test('abort stream when hitting maxBuffer with stderr', testMaxBufferAbort, 2);
test('abort stream when hitting maxBuffer with stdio[*]', testMaxBufferAbort, 3);
