import {once} from 'node:events';
import test from 'ava';
import getStream from 'get-stream';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {fullStdio, getStdio} from '../helpers/stdio.js';
import {foobarString, foobarUppercase, foobarUppercaseUint8Array} from '../helpers/input.js';
import {resultGenerator, uppercaseGenerator, uppercaseBufferGenerator} from '../helpers/generator.js';

setFixtureDirectory();

const testLateStream = async (t, fdNumber, all) => {
	const subprocess = execa('noop-fd-ipc.js', [`${fdNumber}`, foobarString], {...getStdio(4, 'ipc', 4), buffer: false, all});
	await once(subprocess, 'message');
	const [output, allOutput] = await Promise.all([
		getStream(subprocess.stdio[fdNumber]),
		all ? getStream(subprocess.all) : undefined,
		subprocess,
	]);

	t.is(output, '');

	if (all) {
		t.is(allOutput, '');
	}
};

test('Lacks some data when stdout is read too late `buffer` set to `false`', testLateStream, 1, false);
test('Lacks some data when stderr is read too late `buffer` set to `false`', testLateStream, 2, false);
test('Lacks some data when stdio[*] is read too late `buffer` set to `false`', testLateStream, 3, false);
test('Lacks some data when all is read too late `buffer` set to `false`', testLateStream, 1, true);

const getFirstDataEvent = async stream => {
	const [output] = await once(stream, 'data');
	return output.toString();
};

// eslint-disable-next-line max-params
const testIterationBuffer = async (t, fdNumber, buffer, useDataEvents, all) => {
	const subprocess = execa('noop-fd.js', [`${fdNumber}`, foobarString], {...fullStdio, buffer, all});
	const getOutput = useDataEvents ? getFirstDataEvent : getStream;
	const [result, output, allOutput] = await Promise.all([
		subprocess,
		getOutput(subprocess.stdio[fdNumber]),
		all ? getOutput(subprocess.all) : undefined,
	]);

	const expectedResult = buffer ? foobarString : undefined;

	t.is(result.stdio[fdNumber], expectedResult);
	t.is(output, foobarString);

	if (all) {
		t.is(result.all, expectedResult);
		t.is(allOutput, foobarString);
	}
};

test('Can iterate stdout when `buffer` set to `false`', testIterationBuffer, 1, false, false, false);
test('Can iterate stderr when `buffer` set to `false`', testIterationBuffer, 2, false, false, false);
test('Can iterate stdio[*] when `buffer` set to `false`', testIterationBuffer, 3, false, false, false);
test('Can iterate all when `buffer` set to `false`', testIterationBuffer, 1, false, false, true);
test('Can iterate stdout when `buffer` set to `true`', testIterationBuffer, 1, true, false, false);
test('Can iterate stderr when `buffer` set to `true`', testIterationBuffer, 2, true, false, false);
test('Can iterate stdio[*] when `buffer` set to `true`', testIterationBuffer, 3, true, false, false);
test('Can iterate all when `buffer` set to `true`', testIterationBuffer, 1, true, false, true);
test('Can listen to `data` events on stdout when `buffer` set to `false`', testIterationBuffer, 1, false, true, false);
test('Can listen to `data` events on stderr when `buffer` set to `false`', testIterationBuffer, 2, false, true, false);
test('Can listen to `data` events on stdio[*] when `buffer` set to `false`', testIterationBuffer, 3, false, true, false);
test('Can listen to `data` events on all when `buffer` set to `false`', testIterationBuffer, 1, false, true, true);
test('Can listen to `data` events on stdout when `buffer` set to `true`', testIterationBuffer, 1, true, true, false);
test('Can listen to `data` events on stderr when `buffer` set to `true`', testIterationBuffer, 2, true, true, false);
test('Can listen to `data` events on stdio[*] when `buffer` set to `true`', testIterationBuffer, 3, true, true, false);
test('Can listen to `data` events on all when `buffer` set to `true`', testIterationBuffer, 1, true, true, true);

const testNoBufferStreamError = async (t, fdNumber, all) => {
	const subprocess = execa('noop-fd.js', [`${fdNumber}`], {...fullStdio, buffer: false, all});
	const stream = all ? subprocess.all : subprocess.stdio[fdNumber];
	const cause = new Error('test');
	stream.destroy(cause);
	t.like(await t.throwsAsync(subprocess), {cause});
};

test('Listen to stdout errors even when `buffer` is `false`', testNoBufferStreamError, 1, false);
test('Listen to stderr errors even when `buffer` is `false`', testNoBufferStreamError, 2, false);
test('Listen to stdio[*] errors even when `buffer` is `false`', testNoBufferStreamError, 3, false);
test('Listen to all errors even when `buffer` is `false`', testNoBufferStreamError, 1, true);

const testOutput = async (t, buffer, execaMethod) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {buffer});
	t.is(stdout, foobarString);
};

test('buffer: true returns output', testOutput, true, execa);
test('buffer: true returns output, fd-specific', testOutput, {stderr: false}, execa);
test('buffer: default returns output', testOutput, undefined, execa);
test('buffer: default returns output, fd-specific', testOutput, {}, execa);

const testNoOutput = async (t, stdioOption, buffer, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {stdout: stdioOption, buffer});
	t.is(stdout, undefined);
};

test('buffer: false does not return output', testNoOutput, 'pipe', false, execa);
test('buffer: false does not return output, fd-specific', testNoOutput, 'pipe', {stdout: false}, execa);
test('buffer: false does not return output, stdout undefined', testNoOutput, undefined, false, execa);
test('buffer: false does not return output, stdout null', testNoOutput, null, false, execa);
test('buffer: false does not return output, stdout ["pipe"]', testNoOutput, ['pipe'], false, execa);
test('buffer: false does not return output, stdout [undefined]', testNoOutput, [undefined], false, execa);
test('buffer: false does not return output, stdout [null]', testNoOutput, [null], false, execa);
test('buffer: false does not return output, stdout ["pipe", undefined]', testNoOutput, ['pipe', undefined], false, execa);
test('buffer: false does not return output, sync', testNoOutput, 'pipe', false, execaSync);
test('buffer: false does not return output, fd-specific, sync', testNoOutput, 'pipe', {stdout: false}, execaSync);
test('buffer: false does not return output, stdout undefined, sync', testNoOutput, undefined, false, execaSync);
test('buffer: false does not return output, stdout null, sync', testNoOutput, null, false, execaSync);
test('buffer: false does not return output, stdout ["pipe"], sync', testNoOutput, ['pipe'], false, execaSync);
test('buffer: false does not return output, stdout [undefined], sync', testNoOutput, [undefined], false, execaSync);
test('buffer: false does not return output, stdout [null], sync', testNoOutput, [null], false, execaSync);
test('buffer: false does not return output, stdout ["pipe", undefined], sync', testNoOutput, ['pipe', undefined], false, execaSync);

const testNoOutputFail = async (t, execaMethod) => {
	const {exitCode, stdout} = await execaMethod('fail.js', {buffer: false, reject: false});
	t.is(exitCode, 2);
	t.is(stdout, undefined);
};

test('buffer: false does not return output, failure', testNoOutputFail, execa);
test('buffer: false does not return output, failure, sync', testNoOutputFail, execaSync);

// eslint-disable-next-line max-params
const testNoOutputAll = async (t, buffer, bufferStdout, bufferStderr, execaMethod) => {
	const {stdout, stderr, all} = await execaMethod('noop-both.js', {all: true, buffer, stripFinalNewline: false});
	t.is(stdout, bufferStdout ? `${foobarString}\n` : undefined);
	t.is(stderr, bufferStderr ? `${foobarString}\n` : undefined);
	const stdoutStderr = [stdout, stderr].filter(Boolean);
	t.is(all, stdoutStderr.length === 0 ? undefined : stdoutStderr.join(''));
};

test('buffer: {}, all: true', testNoOutputAll, {}, true, true, execa);
test('buffer: {stdout: false}, all: true', testNoOutputAll, {stdout: false}, false, true, execa);
test('buffer: {stderr: false}, all: true', testNoOutputAll, {stderr: false}, true, false, execa);
test('buffer: {all: false}, all: true', testNoOutputAll, {all: false}, false, false, execa);
test('buffer: {}, all: true, sync', testNoOutputAll, {}, true, true, execaSync);
test('buffer: {stdout: false}, all: true, sync', testNoOutputAll, {stdout: false}, false, true, execaSync);
test('buffer: {stderr: false}, all: true, sync', testNoOutputAll, {stderr: false}, true, false, execaSync);
test('buffer: {all: false}, all: true, sync', testNoOutputAll, {all: false}, false, false, execaSync);

const testTransform = async (t, objectMode, execaMethod) => {
	const lines = [];
	const {stdout} = await execaMethod('noop.js', {
		buffer: false,
		stdout: [uppercaseGenerator(objectMode), resultGenerator(lines)(objectMode)],
	});
	t.is(stdout, undefined);
	t.deepEqual(lines, [foobarUppercase]);
};

test('buffer: false still runs transforms', testTransform, false, execa);
test('buffer: false still runs transforms, objectMode', testTransform, true, execa);
test('buffer: false still runs transforms, sync', testTransform, false, execaSync);
test('buffer: false still runs transforms, objectMode, sync', testTransform, true, execaSync);

const testTransformBinary = async (t, objectMode, execaMethod) => {
	const lines = [];
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {
		buffer: false,
		stdout: [uppercaseBufferGenerator(objectMode, true), resultGenerator(lines)(objectMode)],
		encoding: 'buffer',
	});
	t.is(stdout, undefined);
	t.deepEqual(lines, [foobarUppercaseUint8Array]);
};

test('buffer: false still runs transforms, encoding "buffer"', testTransformBinary, false, execa);
test('buffer: false still runs transforms, encoding "buffer", objectMode', testTransformBinary, true, execa);
test('buffer: false still runs transforms, encoding "buffer", sync', testTransformBinary, false, execaSync);
test('buffer: false still runs transforms, encoding "buffer", objectMode, sync', testTransformBinary, true, execaSync);

const testStreamEnd = async (t, fdNumber, buffer) => {
	const subprocess = execa('wrong command', {...fullStdio, buffer});
	await Promise.all([
		t.throwsAsync(subprocess, {message: /wrong command/}),
		once(subprocess.stdio[fdNumber], 'end'),
	]);
};

test('buffer: false > emits end event on stdout when promise is rejected', testStreamEnd, 1, false);
test('buffer: false > emits end event on stderr when promise is rejected', testStreamEnd, 2, false);
test('buffer: false > emits end event on stdio[*] when promise is rejected', testStreamEnd, 3, false);
test('buffer: true > emits end event on stdout when promise is rejected', testStreamEnd, 1, true);
test('buffer: true > emits end event on stderr when promise is rejected', testStreamEnd, 2, true);
test('buffer: true > emits end event on stdio[*] when promise is rejected', testStreamEnd, 3, true);
