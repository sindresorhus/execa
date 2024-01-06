import {Buffer} from 'node:buffer';
import {exec} from 'node:child_process';
import process from 'node:process';
import {setTimeout} from 'node:timers/promises';
import {promisify} from 'node:util';
import test from 'ava';
import getStream from 'get-stream';
import {pEvent} from 'p-event';
import {execa, execaSync} from '../index.js';
import {setFixtureDir, FIXTURES_DIR} from './helpers/fixtures-dir.js';

const pExec = promisify(exec);

setFixtureDir();

const checkEncoding = async (t, encoding) => {
	const {stdout} = await execa('noop-no-newline.js', [STRING_TO_ENCODE], {encoding});
	t.is(stdout, BUFFER_TO_ENCODE.toString(encoding));

	const {stdout: nativeStdout} = await pExec(`node noop-no-newline.js ${STRING_TO_ENCODE}`, {encoding, cwd: FIXTURES_DIR});
	t.is(stdout, nativeStdout);
};

// This string gives different outputs with each encoding type
const STRING_TO_ENCODE = '\u1000.';
const BUFFER_TO_ENCODE = Buffer.from(STRING_TO_ENCODE);

test('can pass encoding "utf8"', checkEncoding, 'utf8');
test('can pass encoding "utf-8"', checkEncoding, 'utf8');
test('can pass encoding "utf16le"', checkEncoding, 'utf16le');
test('can pass encoding "utf-16le"', checkEncoding, 'utf16le');
test('can pass encoding "ucs2"', checkEncoding, 'utf16le');
test('can pass encoding "ucs-2"', checkEncoding, 'utf16le');
test('can pass encoding "latin1"', checkEncoding, 'latin1');
test('can pass encoding "binary"', checkEncoding, 'latin1');
test('can pass encoding "ascii"', checkEncoding, 'ascii');
test('can pass encoding "hex"', checkEncoding, 'hex');
test('can pass encoding "base64"', checkEncoding, 'base64');
test('can pass encoding "base64url"', checkEncoding, 'base64url');

const checkBufferEncoding = async (t, execaMethod) => {
	const {stdout} = await execaMethod('noop-no-newline.js', [STRING_TO_ENCODE], {encoding: 'buffer'});
	t.true(ArrayBuffer.isView(stdout));
	t.true(BUFFER_TO_ENCODE.equals(stdout));

	const {stdout: nativeStdout} = await pExec(`node noop-no-newline.js ${STRING_TO_ENCODE}`, {encoding: 'buffer', cwd: FIXTURES_DIR});
	t.true(Buffer.isBuffer(nativeStdout));
	t.true(BUFFER_TO_ENCODE.equals(nativeStdout));
};

test('can pass encoding "buffer"', checkBufferEncoding, execa);
test('can pass encoding "buffer" - sync', checkBufferEncoding, execaSync);

test('validate unknown encodings', async t => {
	await t.throwsAsync(execa('noop.js', {encoding: 'unknownEncoding'}), {code: 'ERR_UNKNOWN_ENCODING'});
});

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

const testIgnore = async (t, streamName, execaMethod) => {
	const result = await execaMethod('noop.js', {[streamName]: 'ignore'});
	t.is(result[streamName], undefined);
};

test('stdout is undefined if ignored', testIgnore, 'stdout', execa);
test('stderr is undefined if ignored', testIgnore, 'stderr', execa);
test('stdout is undefined if ignored - sync', testIgnore, 'stdout', execaSync);
test('stderr is undefined if ignored - sync', testIgnore, 'stderr', execaSync);

const testMaxBuffer = async (t, streamName) => {
	await t.notThrowsAsync(execa('max-buffer.js', [streamName, '10'], {maxBuffer: 10}));
	const {[streamName]: stream, all} = await t.throwsAsync(
		execa('max-buffer.js', [streamName, '11'], {maxBuffer: 10, all: true}),
		{message: new RegExp(`max-buffer.js ${streamName}`)},
	);
	t.is(stream, '.'.repeat(10));
	t.is(all, '.'.repeat(10));
};

test('maxBuffer affects stdout', testMaxBuffer, 'stdout');
test('maxBuffer affects stderr', testMaxBuffer, 'stderr');

const testNoMaxBuffer = async (t, streamName) => {
	const promise = execa('max-buffer.js', [streamName, '10'], {buffer: false});
	const [result, output] = await Promise.all([
		promise,
		getStream(promise[streamName]),
	]);

	t.is(result[streamName], undefined);
	t.is(output, '.........\n');
};

test('do not buffer stdout when `buffer` set to `false`', testNoMaxBuffer, 'stdout');
test('do not buffer stderr when `buffer` set to `false`', testNoMaxBuffer, 'stderr');

test('do not buffer when streaming', async t => {
	const {stdout} = execa('max-buffer.js', ['stdout', '21'], {maxBuffer: 10});
	const result = await getStream(stdout);
	t.is(result, '....................\n');
});

test('buffer: false > promise resolves', async t => {
	await t.notThrowsAsync(execa('noop.js', {buffer: false}));
});

test('buffer: false > promise resolves when output is big but is not pipable', async t => {
	await t.notThrowsAsync(execa('max-buffer.js', {buffer: false, stdout: 'ignore'}));
});

test('buffer: false > promise resolves when output is big and is read', async t => {
	const subprocess = execa('max-buffer.js', {buffer: false});
	subprocess.stdout.resume();
	subprocess.stderr.resume();
	await t.notThrowsAsync(subprocess);
});

test('buffer: false > promise resolves when output is big and "all" is used and is read', async t => {
	const subprocess = execa('max-buffer.js', {buffer: false, all: true});
	subprocess.all.resume();
	await t.notThrowsAsync(subprocess);
});

test('buffer: false > promise rejects when process returns non-zero', async t => {
	const subprocess = execa('fail.js', {buffer: false});
	const {exitCode} = await t.throwsAsync(subprocess);
	t.is(exitCode, 2);
});

test('buffer: false > emits end event when promise is rejected', async t => {
	const subprocess = execa('wrong command', {buffer: false, reject: false});
	await t.notThrowsAsync(Promise.all([subprocess, pEvent(subprocess.stdout, 'end')]));
});

const BUFFER_TIMEOUT = 1e3;

// On Unix (not Windows), a process won't exit if stdout has not been read.
if (process.platform !== 'win32') {
	test.serial('buffer: false > promise does not resolve when output is big and is not read', async t => {
		const {timedOut} = await t.throwsAsync(execa('max-buffer.js', {buffer: false, timeout: BUFFER_TIMEOUT}));
		t.true(timedOut);
	});

	test.serial('buffer: false > promise does not resolve when output is big and "all" is used but not read', async t => {
		const subprocess = execa('max-buffer.js', {buffer: false, all: true, timeout: BUFFER_TIMEOUT});
		subprocess.stdout.resume();
		subprocess.stderr.resume();
		const {timedOut} = await t.throwsAsync(subprocess);
		t.true(timedOut);
	});
}

test('Errors on streams should make the process exit', async t => {
	const childProcess = execa('forever.js');
	childProcess.stdout.destroy();
	await t.throwsAsync(childProcess, {code: 'ERR_STREAM_PREMATURE_CLOSE'});
});

test.serial('Processes wait on stdin before exiting', async t => {
	const childProcess = execa('stdin.js');
	await setTimeout(1e3);
	childProcess.stdin.end('foobar');
	const {stdout} = await childProcess;
	t.is(stdout, 'foobar');
});

test.serial('Processes buffer stdout before it is read', async t => {
	const childProcess = execa('noop-delay.js', ['foobar']);
	await setTimeout(5e2);
	const {stdout} = await childProcess;
	t.is(stdout, 'foobar');
});

// This test is not the desired behavior, but is the current one.
// I.e. this is mostly meant for documentation and regression testing.
test.serial('Processes might successfully exit before their stdout is read', async t => {
	const childProcess = execa('noop.js', ['foobar']);
	await setTimeout(1e3);
	const {stdout} = await childProcess;
	t.is(stdout, '');
});

test.serial('Processes might fail before their stdout is read', async t => {
	const childProcess = execa('noop-fail.js', ['foobar'], {reject: false});
	await setTimeout(1e3);
	const {stdout} = await childProcess;
	t.is(stdout, '');
});
