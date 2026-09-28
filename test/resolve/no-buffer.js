import assert from 'node:assert/strict';
import {once} from 'node:events';
import test from 'node:test';
import getStream from 'get-stream';
import {assertRejects, assertLike} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {fullStdio} from '../helpers/stdio.js';
import {foobarString, foobarUppercase, foobarUppercaseUint8Array} from '../helpers/input.js';
import {resultGenerator, uppercaseGenerator, uppercaseBufferGenerator} from '../helpers/generator.js';

setFixtureDirectory();

const testLateStream = async (fdNumber, all) => {
	const subprocess = execa('noop-fd-ipc.js', [`${fdNumber}`, foobarString], {
		...fullStdio,
		ipc: true,
		buffer: false,
		all,
	});
	await subprocess.getOneMessage();
	const [output, allOutput] = await Promise.all([
		getStream(subprocess.stdio[fdNumber]),
		all ? getStream(subprocess.all) : undefined,
		subprocess,
	]);

	assert.equal(output, '');

	if (all) {
		assert.equal(allOutput, '');
	}
};

test('Lacks some data when stdout is read too late `buffer` set to `false`', () => testLateStream(1, false));
test('Lacks some data when stderr is read too late `buffer` set to `false`', () => testLateStream(2, false));
test('Lacks some data when stdio[*] is read too late `buffer` set to `false`', () => testLateStream(3, false));
test('Lacks some data when all is read too late `buffer` set to `false`', () => testLateStream(1, true));

const getFirstDataEvent = async stream => {
	const [output] = await once(stream, 'data');
	return output.toString();
};

const testIterationBuffer = async (fdNumber, buffer, useDataEvents, all) => {
	const subprocess = execa('noop-fd.js', [`${fdNumber}`, foobarString], {...fullStdio, buffer, all});
	const getOutput = useDataEvents ? getFirstDataEvent : getStream;
	const [result, output, allOutput] = await Promise.all([
		subprocess,
		getOutput(subprocess.stdio[fdNumber]),
		all ? getOutput(subprocess.all) : undefined,
	]);

	const expectedResult = buffer ? foobarString : undefined;

	assert.equal(result.stdio[fdNumber], expectedResult);
	assert.equal(output, foobarString);

	if (!all) {
		return;
	}

	assert.equal(result.all, expectedResult);
	assert.equal(allOutput, foobarString);
};

test('Can iterate stdout when `buffer` set to `false`', () => testIterationBuffer(1, false, false, false));
test('Can iterate stderr when `buffer` set to `false`', () => testIterationBuffer(2, false, false, false));
test('Can iterate stdio[*] when `buffer` set to `false`', () => testIterationBuffer(3, false, false, false));
test('Can iterate all when `buffer` set to `false`', () => testIterationBuffer(1, false, false, true));
test('Can iterate stdout when `buffer` set to `true`', () => testIterationBuffer(1, true, false, false));
test('Can iterate stderr when `buffer` set to `true`', () => testIterationBuffer(2, true, false, false));
test('Can iterate stdio[*] when `buffer` set to `true`', () => testIterationBuffer(3, true, false, false));
test('Can iterate all when `buffer` set to `true`', () => testIterationBuffer(1, true, false, true));
test('Can listen to `data` events on stdout when `buffer` set to `false`', () => testIterationBuffer(1, false, true, false));
test('Can listen to `data` events on stderr when `buffer` set to `false`', () => testIterationBuffer(2, false, true, false));
test('Can listen to `data` events on stdio[*] when `buffer` set to `false`', () => testIterationBuffer(3, false, true, false));
test('Can listen to `data` events on all when `buffer` set to `false`', () => testIterationBuffer(1, false, true, true));
test('Can listen to `data` events on stdout when `buffer` set to `true`', () => testIterationBuffer(1, true, true, false));
test('Can listen to `data` events on stderr when `buffer` set to `true`', () => testIterationBuffer(2, true, true, false));
test('Can listen to `data` events on stdio[*] when `buffer` set to `true`', () => testIterationBuffer(3, true, true, false));
test('Can listen to `data` events on all when `buffer` set to `true`', () => testIterationBuffer(1, true, true, true));

const testNoBufferStreamError = async (fdNumber, all) => {
	const subprocess = execa('noop-fd.js', [`${fdNumber}`], {...fullStdio, buffer: false, all});
	const stream = all ? subprocess.all : subprocess.stdio[fdNumber];
	const cause = new Error('test');
	stream.destroy(cause);
	assertLike(await assertRejects(subprocess), {cause});
};

test('Listen to stdout errors even when `buffer` is `false`', () => testNoBufferStreamError(1, false));
test('Listen to stderr errors even when `buffer` is `false`', () => testNoBufferStreamError(2, false));
test('Listen to stdio[*] errors even when `buffer` is `false`', () => testNoBufferStreamError(3, false));
test('Listen to all errors even when `buffer` is `false`', () => testNoBufferStreamError(1, true));

const testOutput = async (buffer, execaMethod) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {buffer});
	assert.equal(stdout, foobarString);
};

test('buffer: true returns output', () => testOutput(true, execa));
test('buffer: true returns output, fd-specific', () => testOutput({stderr: false}, execa));
test('buffer: default returns output', () => testOutput(undefined, execa));
test('buffer: default returns output, fd-specific', () => testOutput({}, execa));

const testNoOutput = async (stdioOption, buffer, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {stdout: stdioOption, buffer});
	assert.equal(stdout, undefined);
};

test('buffer: false does not return output', () => testNoOutput('pipe', false, execa));
test('buffer: false does not return output, fd-specific', () => testNoOutput('pipe', {stdout: false}, execa));
test('buffer: false does not return output, stdout undefined', () => testNoOutput(undefined, false, execa));
test('buffer: false does not return output, stdout null', () => testNoOutput(null, false, execa));
test('buffer: false does not return output, stdout ["pipe"]', () => testNoOutput(['pipe'], false, execa));
test('buffer: false does not return output, stdout [undefined]', () => testNoOutput([undefined], false, execa));
test('buffer: false does not return output, stdout [null]', () => testNoOutput([null], false, execa));
test('buffer: false does not return output, stdout ["pipe", undefined]', () => testNoOutput(['pipe', undefined], false, execa));
test('buffer: false does not return output, sync', () => testNoOutput('pipe', false, execaSync));
test('buffer: false does not return output, fd-specific, sync', () => testNoOutput('pipe', {stdout: false}, execaSync));
test('buffer: false does not return output, stdout undefined, sync', () => testNoOutput(undefined, false, execaSync));
test('buffer: false does not return output, stdout null, sync', () => testNoOutput(null, false, execaSync));
test('buffer: false does not return output, stdout ["pipe"], sync', () => testNoOutput(['pipe'], false, execaSync));
test('buffer: false does not return output, stdout [undefined], sync', () => testNoOutput([undefined], false, execaSync));
test('buffer: false does not return output, stdout [null], sync', () => testNoOutput([null], false, execaSync));
test('buffer: false does not return output, stdout ["pipe", undefined], sync', () => testNoOutput(['pipe', undefined], false, execaSync));

/*
With `buffer: false`, additional file descriptors must still be passed to the subprocess.
With synchronous methods, `ignore` is used to avoid buffering, but that only redirects `stdout`/`stderr` to `/dev/null`.
For other file descriptors, it does not pass them at all, which would make the subprocess fail when writing to them.
*/
const testNoOutputFdStays = async (buffer, execaMethod) => {
	const {stdio, failed} = await execaMethod('noop-fd.js', ['3', foobarString], {...fullStdio, buffer});
	assert.equal(failed, false);
	assert.equal(stdio[3], undefined);
};

test('buffer: false keeps stdio[*] open', () => testNoOutputFdStays(false, execa));
test('buffer: false keeps stdio[*] open, fd-specific', () => testNoOutputFdStays({fd3: false}, execa));
test('buffer: false keeps stdio[*] open, sync', () => testNoOutputFdStays(false, execaSync));
test('buffer: false keeps stdio[*] open, fd-specific, sync', () => testNoOutputFdStays({fd3: false}, execaSync));

const testNoOutputFail = async execaMethod => {
	const {exitCode, stdout} = await execaMethod('fail.js', {buffer: false, reject: false});
	assert.equal(exitCode, 2);
	assert.equal(stdout, undefined);
};

test('buffer: false does not return output, failure', () => testNoOutputFail(execa));
test('buffer: false does not return output, failure, sync', () => testNoOutputFail(execaSync));

const testNoOutputAll = async (buffer, bufferStdout, bufferStderr, execaMethod) => {
	const {stdout, stderr, all} = await execaMethod('noop-both.js', {all: true, buffer, stripFinalNewline: false});
	assert.equal(stdout, bufferStdout ? `${foobarString}\n` : undefined);
	assert.equal(stderr, bufferStderr ? `${foobarString}\n` : undefined);
	const stdoutStderr = [stdout, stderr].filter(Boolean);
	assert.equal(all, stdoutStderr.length === 0 ? undefined : stdoutStderr.join(''));
};

test('buffer: {}, all: true', () => testNoOutputAll({}, true, true, execa));
test('buffer: {stdout: false}, all: true', () => testNoOutputAll({stdout: false}, false, true, execa));
test('buffer: {stderr: false}, all: true', () => testNoOutputAll({stderr: false}, true, false, execa));
test('buffer: {all: false}, all: true', () => testNoOutputAll({all: false}, false, false, execa));
test('buffer: {}, all: true, sync', () => testNoOutputAll({}, true, true, execaSync));
test('buffer: {stdout: false}, all: true, sync', () => testNoOutputAll({stdout: false}, false, true, execaSync));
test('buffer: {stderr: false}, all: true, sync', () => testNoOutputAll({stderr: false}, true, false, execaSync));
test('buffer: {all: false}, all: true, sync', () => testNoOutputAll({all: false}, false, false, execaSync));

// `result.all` only contains the buffered file descriptors, so its `stripFinalNewline` must only follow those
const testNoOutputAllStripFinalNewline = async (buffer, stripFinalNewline, execaMethod) => {
	const {all} = await execaMethod('noop-both.js', {all: true, buffer, stripFinalNewline});
	assert.equal(all, `${foobarString}\n`);
};

test('buffer: {stderr: false} only follows the buffered "stripFinalNewline" in result.all', () => testNoOutputAllStripFinalNewline({stderr: false}, {stdout: false, stderr: true}, execa));
test('buffer: {stdout: false} only follows the buffered "stripFinalNewline" in result.all', () => testNoOutputAllStripFinalNewline({stdout: false}, {stdout: true, stderr: false}, execa));
test('buffer: {stderr: false} only follows the buffered "stripFinalNewline" in result.all, sync', () => testNoOutputAllStripFinalNewline({stderr: false}, {stdout: false, stderr: true}, execaSync));
test('buffer: {stdout: false} only follows the buffered "stripFinalNewline" in result.all, sync', () => testNoOutputAllStripFinalNewline({stdout: false}, {stdout: true, stderr: false}, execaSync));

// `result.all` requires the `all` option, even when only one of the two file descriptors is buffered
const testNoAllWithoutOption = async (buffer, execaMethod) => {
	const {all} = await execaMethod('noop-both.js', {buffer, stripFinalNewline: false});
	assert.equal(all, undefined);
};

test('buffer: {stdout: false} does not set result.all', () => testNoAllWithoutOption({stdout: false}, execa));
test('buffer: {stderr: false} does not set result.all', () => testNoAllWithoutOption({stderr: false}, execa));
test('buffer: {stdout: false} does not set result.all, sync', () => testNoAllWithoutOption({stdout: false}, execaSync));
test('buffer: {stderr: false} does not set result.all, sync', () => testNoAllWithoutOption({stderr: false}, execaSync));

const testTransform = async (objectMode, execaMethod) => {
	const lines = [];
	const {stdout} = await execaMethod('noop.js', {
		buffer: false,
		stdout: [uppercaseGenerator(objectMode), resultGenerator(lines)(objectMode)],
	});
	assert.equal(stdout, undefined);
	assert.deepEqual(lines, [foobarUppercase]);
};

test('buffer: false still runs transforms', () => testTransform(false, execa));
test('buffer: false still runs transforms, objectMode', () => testTransform(true, execa));
test('buffer: false still runs transforms, sync', () => testTransform(false, execaSync));
test('buffer: false still runs transforms, objectMode, sync', () => testTransform(true, execaSync));

const testTransformBinary = async (objectMode, execaMethod) => {
	const lines = [];
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {
		buffer: false,
		stdout: [uppercaseBufferGenerator(objectMode, true), resultGenerator(lines)(objectMode)],
		encoding: 'buffer',
	});
	assert.equal(stdout, undefined);
	assert.deepEqual(lines, [foobarUppercaseUint8Array]);
};

test('buffer: false still runs transforms, encoding "buffer"', () => testTransformBinary(false, execa));
test('buffer: false still runs transforms, encoding "buffer", objectMode', () => testTransformBinary(true, execa));
test('buffer: false still runs transforms, encoding "buffer", sync', () => testTransformBinary(false, execaSync));
test('buffer: false still runs transforms, encoding "buffer", objectMode, sync', () => testTransformBinary(true, execaSync));

const testStreamEnd = async (fdNumber, buffer) => {
	const subprocess = execa('wrong command', {...fullStdio, buffer});
	await Promise.all([
		assertRejects(subprocess, {message: /wrong command/}),
		once(subprocess.stdio[fdNumber], 'end'),
	]);
};

test('buffer: false > emits end event on stdout when promise is rejected', () => testStreamEnd(1, false));
test('buffer: false > emits end event on stderr when promise is rejected', () => testStreamEnd(2, false));
test('buffer: false > emits end event on stdio[*] when promise is rejected', () => testStreamEnd(3, false));
test('buffer: true > emits end event on stdout when promise is rejected', () => testStreamEnd(1, true));
test('buffer: true > emits end event on stderr when promise is rejected', () => testStreamEnd(2, true));
test('buffer: true > emits end event on stdio[*] when promise is rejected', () => testStreamEnd(3, true));

// When only one file descriptor is buffered, `result.all` is read from its own stream, not from `subprocess.all`.
// `subprocess.all` still merges both file descriptors, so it must be drained. Otherwise, it fills up and applies backpressure on them, hanging the subprocess which is still writing to them.
const LARGE_OUTPUT = 1e6;

const testNoBufferAllBackpressure = async (fdNumber, buffer) => {
	const {exitCode, all} = await execa('noop-fd-large.js', [`${fdNumber}`, `${LARGE_OUTPUT}`], {all: true, buffer});
	assert.equal(exitCode, 0);
	assert.equal(all.length, LARGE_OUTPUT);
};

// Without the fix, the subprocess hangs until the test times out
test('all: true does not hang on a large stdout with buffer: {stderr: false}', () => testNoBufferAllBackpressure(1, {stderr: false}));
test('all: true does not hang on a large stderr with buffer: {stdout: false}', () => testNoBufferAllBackpressure(2, {stdout: false}));

// `subprocess.all` must keep interleaving a file descriptor which is not buffered, even though Execa does not read it itself
const testAllStreamWithNoBuffer = async (fdNumber, optionName) => {
	const subprocess = execa('noop-fd.js', [`${fdNumber}`, foobarString], {all: true, buffer: {[optionName]: false}});
	const [, allContents] = await Promise.all([subprocess, getStream(subprocess.all)]);
	assert.equal(allContents, foobarString);
};

test('subprocess.all includes an unbuffered stdout', () => testAllStreamWithNoBuffer(1, 'stdout'));
test('subprocess.all includes an unbuffered stderr', () => testAllStreamWithNoBuffer(2, 'stderr'));
