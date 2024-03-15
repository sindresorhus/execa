import {once} from 'node:events';
import test from 'ava';
import getStream from 'get-stream';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio, getStdio} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';

setFixtureDir();

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
	const error = new Error('test');
	stream.destroy(error);
	t.is(await t.throwsAsync(subprocess), error);
};

test('Listen to stdout errors even when `buffer` is `false`', testNoBufferStreamError, 1, false);
test('Listen to stderr errors even when `buffer` is `false`', testNoBufferStreamError, 2, false);
test('Listen to stdio[*] errors even when `buffer` is `false`', testNoBufferStreamError, 3, false);
test('Listen to all errors even when `buffer` is `false`', testNoBufferStreamError, 1, true);

test('buffer: false > promise resolves', async t => {
	await t.notThrowsAsync(execa('noop.js', {buffer: false}));
});

test('buffer: false > promise rejects when subprocess returns non-zero', async t => {
	const {exitCode} = await t.throwsAsync(execa('fail.js', {buffer: false}));
	t.is(exitCode, 2);
});

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
