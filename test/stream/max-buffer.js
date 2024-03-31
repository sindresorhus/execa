import {Buffer} from 'node:buffer';
import test from 'ava';
import getStream from 'get-stream';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio} from '../helpers/stdio.js';

setFixtureDir();

const maxBuffer = 10;
const maxBufferMessage = /maxBuffer exceeded/;

const testMaxBufferSuccess = async (t, fdNumber, all) => {
	await t.notThrowsAsync(execa('max-buffer.js', [`${fdNumber}`, `${maxBuffer}`], {...fullStdio, maxBuffer, all}));
};

test('maxBuffer does not affect stdout if too high', testMaxBufferSuccess, 1, false);
test('maxBuffer does not affect stderr if too high', testMaxBufferSuccess, 2, false);
test('maxBuffer does not affect stdio[*] if too high', testMaxBufferSuccess, 3, false);
test('maxBuffer does not affect all if too high', testMaxBufferSuccess, 1, true);

test('maxBuffer uses killSignal', async t => {
	const {isTerminated, signal} = await t.throwsAsync(
		execa('noop-forever.js', ['.'.repeat(maxBuffer + 1)], {maxBuffer, killSignal: 'SIGINT'}),
		{message: maxBufferMessage},
	);
	t.true(isTerminated);
	t.is(signal, 'SIGINT');
});

const testMaxBufferLimit = async (t, fdNumber, all) => {
	const length = all ? maxBuffer * 2 : maxBuffer;
	const result = await t.throwsAsync(
		execa('max-buffer.js', [`${fdNumber}`, `${length + 1}`], {...fullStdio, maxBuffer, all}),
		{message: maxBufferMessage},
	);
	t.is(all ? result.all : result.stdio[fdNumber], '.'.repeat(length));
};

test('maxBuffer affects stdout', testMaxBufferLimit, 1, false);
test('maxBuffer affects stderr', testMaxBufferLimit, 2, false);
test('maxBuffer affects stdio[*]', testMaxBufferLimit, 3, false);
test('maxBuffer affects all', testMaxBufferLimit, 1, true);

const testMaxBufferEncoding = async (t, fdNumber) => {
	const result = await t.throwsAsync(
		execa('max-buffer.js', [`${fdNumber}`, `${maxBuffer + 1}`], {...fullStdio, maxBuffer, encoding: 'buffer'}),
	);
	const stream = result.stdio[fdNumber];
	t.true(stream instanceof Uint8Array);
	t.is(Buffer.from(stream).toString(), '.'.repeat(maxBuffer));
};

test('maxBuffer works with encoding buffer and stdout', testMaxBufferEncoding, 1);
test('maxBuffer works with encoding buffer and stderr', testMaxBufferEncoding, 2);
test('maxBuffer works with encoding buffer and stdio[*]', testMaxBufferEncoding, 3);

const testMaxBufferHex = async (t, fdNumber) => {
	const halfMaxBuffer = maxBuffer / 2;
	const {stdio} = await t.throwsAsync(
		execa('max-buffer.js', [`${fdNumber}`, `${halfMaxBuffer + 1}`], {...fullStdio, maxBuffer, encoding: 'hex'}),
	);
	t.is(stdio[fdNumber], Buffer.from('.'.repeat(halfMaxBuffer)).toString('hex'));
};

test('maxBuffer works with other encodings and stdout', testMaxBufferHex, 1);
test('maxBuffer works with other encodings and stderr', testMaxBufferHex, 2);
test('maxBuffer works with other encodings and stdio[*]', testMaxBufferHex, 3);

const testNoMaxBuffer = async (t, fdNumber) => {
	const subprocess = execa('max-buffer.js', [`${fdNumber}`, `${maxBuffer}`], {...fullStdio, buffer: false});
	const [result, output] = await Promise.all([
		subprocess,
		getStream(subprocess.stdio[fdNumber]),
	]);
	t.is(result.stdio[fdNumber], undefined);
	t.is(output, '.'.repeat(maxBuffer));
};

test('do not buffer stdout when `buffer` set to `false`', testNoMaxBuffer, 1);
test('do not buffer stderr when `buffer` set to `false`', testNoMaxBuffer, 2);
test('do not buffer stdio[*] when `buffer` set to `false`', testNoMaxBuffer, 3);

const testNoMaxBufferSync = (t, fdNumber) => {
	const {stdio} = execaSync('max-buffer.js', [`${fdNumber}`, `${maxBuffer}`], {...fullStdio, buffer: false});
	t.is(stdio[fdNumber], undefined);
};

// @todo: add a test for fd3 once the following Node.js bug is fixed.
// https://github.com/nodejs/node/issues/52338
test('do not buffer stdout when `buffer` set to `false`, sync', testNoMaxBufferSync, 1);
test('do not buffer stderr when `buffer` set to `false`, sync', testNoMaxBufferSync, 2);

const testNoMaxBufferOption = async (t, fdNumber) => {
	const length = maxBuffer + 1;
	const subprocess = execa('max-buffer.js', [`${fdNumber}`, `${length}`], {...fullStdio, maxBuffer, buffer: false});
	const [result, output] = await Promise.all([
		subprocess,
		getStream(subprocess.stdio[fdNumber]),
	]);
	t.is(result.stdio[fdNumber], undefined);
	t.is(output, '.'.repeat(length));
};

test('do not hit maxBuffer when `buffer` is `false` with stdout', testNoMaxBufferOption, 1);
test('do not hit maxBuffer when `buffer` is `false` with stderr', testNoMaxBufferOption, 2);
test('do not hit maxBuffer when `buffer` is `false` with stdio[*]', testNoMaxBufferOption, 3);

const testMaxBufferAbort = async (t, fdNumber) => {
	const subprocess = execa('max-buffer.js', [`${fdNumber}`, `${maxBuffer + 1}`], {...fullStdio, maxBuffer});
	await Promise.all([
		t.throwsAsync(subprocess, {message: maxBufferMessage}),
		t.throwsAsync(getStream(subprocess.stdio[fdNumber]), {code: 'ERR_STREAM_PREMATURE_CLOSE'}),
	]);
};

test('abort stream when hitting maxBuffer with stdout', testMaxBufferAbort, 1);
test('abort stream when hitting maxBuffer with stderr', testMaxBufferAbort, 2);
test('abort stream when hitting maxBuffer with stdio[*]', testMaxBufferAbort, 3);
