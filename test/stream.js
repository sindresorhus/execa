import {Buffer} from 'node:buffer';
import {exec} from 'node:child_process';
import process from 'node:process';
import fs from 'node:fs';
import Stream from 'node:stream';
import {promisify} from 'node:util';
import test from 'ava';
import getStream from 'get-stream';
import {pEvent} from 'p-event';
import tempfile from 'tempfile';
import {execa, execaSync, $} from '../index.js';
import {setFixtureDir, FIXTURES_DIR} from './helpers/fixtures-dir.js';

const pExec = promisify(exec);

setFixtureDir();

test('buffer', async t => {
	const {stdout} = await execa('noop.js', ['foo'], {encoding: null});
	t.true(Buffer.isBuffer(stdout));
	t.is(stdout.toString(), 'foo');
});

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

const checkBufferEncoding = async (t, encoding) => {
	const {stdout} = await execa('noop-no-newline.js', [STRING_TO_ENCODE], {encoding});
	t.true(BUFFER_TO_ENCODE.equals(stdout));

	const {stdout: nativeStdout} = await pExec(`node noop-no-newline.js ${STRING_TO_ENCODE}`, {encoding, cwd: FIXTURES_DIR});
	t.true(BUFFER_TO_ENCODE.equals(nativeStdout));
};

test('can pass encoding "buffer"', checkBufferEncoding, 'buffer');
test('can pass encoding null', checkBufferEncoding, null);

test('validate unknown encodings', async t => {
	await t.throwsAsync(execa('noop.js', {encoding: 'unknownEncoding'}), {code: 'ERR_UNKNOWN_ENCODING'});
});

test('pass `stdout` to a file descriptor', async t => {
	const file = tempfile({extension: '.txt'});
	await execa('noop.js', ['foo bar'], {stdout: fs.openSync(file, 'w')});
	t.is(fs.readFileSync(file, 'utf8'), 'foo bar\n');
});

test('pass `stderr` to a file descriptor', async t => {
	const file = tempfile({extension: '.txt'});
	await execa('noop-err.js', ['foo bar'], {stderr: fs.openSync(file, 'w')});
	t.is(fs.readFileSync(file, 'utf8'), 'foo bar\n');
});

test.serial('result.all shows both `stdout` and `stderr` intermixed', async t => {
	const {all} = await execa('noop-132.js', {all: true});
	t.is(all, '132');
});

test('result.all is undefined unless opts.all is true', async t => {
	const {all} = await execa('noop.js');
	t.is(all, undefined);
});

test('stdout/stderr/all are undefined if ignored', async t => {
	const {stdout, stderr, all} = await execa('noop.js', {stdio: 'ignore', all: true});
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.is(all, undefined);
});

test('stdout/stderr/all are undefined if ignored in sync mode', t => {
	const {stdout, stderr, all} = execaSync('noop.js', {stdio: 'ignore', all: true});
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.is(all, undefined);
});

test('stdin option can be a sync iterable of strings', async t => {
	const {stdout} = await execa('stdin.js', {stdin: ['foo', 'bar']});
	t.is(stdout, 'foobar');
});

const textEncoder = new TextEncoder();
const binaryFoo = textEncoder.encode('foo');
const binaryBar = textEncoder.encode('bar');

test('stdin option can be a sync iterable of Uint8Arrays', async t => {
	const {stdout} = await execa('stdin.js', {stdin: [binaryFoo, binaryBar]});
	t.is(stdout, 'foobar');
});

const stringGenerator = function * () {
	yield * ['foo', 'bar'];
};

const binaryGenerator = function * () {
	yield * [binaryFoo, binaryBar];
};

const throwingGenerator = function * () {
	yield 'foo';
	throw new Error('generator error');
};

test('stdin option can be an async iterable of strings', async t => {
	const {stdout} = await execa('stdin.js', {stdin: stringGenerator()});
	t.is(stdout, 'foobar');
});

test('stdin option can be an async iterable of Uint8Arrays', async t => {
	const {stdout} = await execa('stdin.js', {stdin: binaryGenerator()});
	t.is(stdout, 'foobar');
});

test('stdin option cannot be a sync iterable with execa.sync()', t => {
	t.throws(() => {
		execaSync('stdin.js', {stdin: ['foo', 'bar']});
	}, {message: /an iterable in sync mode/});
});

test('stdin option cannot be an async iterable with execa.sync()', t => {
	t.throws(() => {
		execaSync('stdin.js', {stdin: stringGenerator()});
	}, {message: /an iterable in sync mode/});
});

test('stdin option cannot be an iterable when "input" is used', t => {
	t.throws(() => {
		execa('stdin.js', {stdin: ['foo', 'bar'], input: 'foobar'});
	}, {message: /`input` and `stdin` options/});
});

test('stdin option cannot be an iterable when "inputFile" is used', t => {
	t.throws(() => {
		execa('stdin.js', {stdin: ['foo', 'bar'], inputFile: 'dummy.txt'});
	}, {message: /`inputFile` and `stdin` options/});
});

test('stdin option cannot be a generic iterable string', async t => {
	await t.throwsAsync(() => execa('stdin.js', {stdin: 'foobar'}), {code: 'ERR_INVALID_SYNC_FORK_INPUT'});
});

test('stdin option handles errors in iterables', async t => {
	const {originalMessage} = await t.throwsAsync(() => execa('stdin.js', {stdin: throwingGenerator()}));
	t.is(originalMessage, 'generator error');
});

test('input option can be a String', async t => {
	const {stdout} = await execa('stdin.js', {input: 'foobar'});
	t.is(stdout, 'foobar');
});

test('input option cannot be a String when stdin is set', t => {
	t.throws(() => {
		execa('stdin.js', {input: 'foobar', stdin: 'ignore'});
	}, {message: /`input` and `stdin` options/});
});

test('input option cannot be a String when stdio is set', t => {
	t.throws(() => {
		execa('stdin.js', {input: 'foobar', stdio: 'ignore'});
	}, {message: /`input` and `stdin` options/});
});

test('input option can be a Buffer', async t => {
	const {stdout} = await execa('stdin.js', {input: 'testing12'});
	t.is(stdout, 'testing12');
});

test('input can be a Stream', async t => {
	const stream = new Stream.PassThrough();
	stream.write('howdy');
	stream.end();
	const {stdout} = await execa('stdin.js', {input: stream});
	t.is(stdout, 'howdy');
});

test('input option cannot be a Stream when stdin is set', t => {
	t.throws(() => {
		execa('stdin.js', {input: new Stream.PassThrough(), stdin: 'ignore'});
	}, {message: /`input` and `stdin` options/});
});

test('input option can be used with $', async t => {
	const {stdout} = await $({input: 'foobar'})`stdin.js`;
	t.is(stdout, 'foobar');
});

test('inputFile can be set', async t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const {stdout} = await execa('stdin.js', {inputFile});
	t.is(stdout, 'howdy');
});

test('inputFile can be set with $', async t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const {stdout} = await $({inputFile})`stdin.js`;
	t.is(stdout, 'howdy');
});

test('inputFile and input cannot be both set', t => {
	t.throws(() => execa('stdin.js', {inputFile: '', input: ''}), {
		message: /cannot be both set/,
	});
});

test('inputFile option cannot be set when stdin is set', t => {
	t.throws(() => {
		execa('stdin.js', {inputFile: '', stdin: 'ignore'});
	}, {message: /`inputFile` and `stdin` options/});
});

test('inputFile errors should be handled', async t => {
	await t.throwsAsync(execa('stdin.js', {inputFile: 'unknown'}), {code: 'ENOENT'});
});

test('you can write to child.stdin', async t => {
	const subprocess = execa('stdin.js');
	subprocess.stdin.end('unicorns');
	const {stdout} = await subprocess;
	t.is(stdout, 'unicorns');
});

test('input option can be a String - sync', t => {
	const {stdout} = execaSync('stdin.js', {input: 'foobar'});
	t.is(stdout, 'foobar');
});

test('input option can be used with $.sync', t => {
	const {stdout} = $({input: 'foobar'}).sync`stdin.js`;
	t.is(stdout, 'foobar');
});

test('input option can be a Buffer - sync', t => {
	const {stdout} = execaSync('stdin.js', {input: Buffer.from('testing12', 'utf8')});
	t.is(stdout, 'testing12');
});

test('opts.stdout:ignore - stdout will not collect data', async t => {
	const {stdout} = await execa('stdin.js', {
		input: 'hello',
		stdio: [undefined, 'ignore', undefined],
	});
	t.is(stdout, undefined);
});

test('helpful error trying to provide an input stream in sync mode', t => {
	t.throws(
		() => {
			execaSync('stdin.js', {input: new Stream.PassThrough()});
		},
		{message: /The `input` option cannot be a stream in sync mode/},
	);
});

test('inputFile can be set - sync', t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const {stdout} = execaSync('stdin.js', {inputFile});
	t.is(stdout, 'howdy');
});

test('inputFile option can be used with $.sync', t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const {stdout} = $({inputFile}).sync`stdin.js`;
	t.is(stdout, 'howdy');
});

test('inputFile and input cannot be both set - sync', t => {
	t.throws(() => execaSync('stdin.js', {inputFile: '', input: ''}), {
		message: /cannot be both set/,
	});
});

test('maxBuffer affects stdout', async t => {
	await t.notThrowsAsync(execa('max-buffer.js', ['stdout', '10'], {maxBuffer: 10}));
	const {stdout, all} = await t.throwsAsync(execa('max-buffer.js', ['stdout', '11'], {maxBuffer: 10, all: true}), {message: /max-buffer.js stdout/});
	t.is(stdout, '.'.repeat(10));
	t.is(all, '.'.repeat(10));
});

test('maxBuffer affects stderr', async t => {
	await t.notThrowsAsync(execa('max-buffer.js', ['stderr', '10'], {maxBuffer: 10}));
	const {stderr, all} = await t.throwsAsync(execa('max-buffer.js', ['stderr', '11'], {maxBuffer: 10, all: true}), {message: /max-buffer.js stderr/});
	t.is(stderr, '.'.repeat(10));
	t.is(all, '.'.repeat(10));
});

test('do not buffer stdout when `buffer` set to `false`', async t => {
	const promise = execa('max-buffer.js', ['stdout', '10'], {buffer: false});
	const [result, stdout] = await Promise.all([
		promise,
		getStream(promise.stdout),
	]);

	t.is(result.stdout, undefined);
	t.is(stdout, '.........\n');
});

test('do not buffer stderr when `buffer` set to `false`', async t => {
	const promise = execa('max-buffer.js', ['stderr', '10'], {buffer: false});
	const [result, stderr] = await Promise.all([
		promise,
		getStream(promise.stderr),
	]);

	t.is(result.stderr, undefined);
	t.is(stderr, '.........\n');
});

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

test('can use all: true with stdout: ignore', async t => {
	await t.notThrowsAsync(execa('max-buffer.js', {buffer: false, stdout: 'ignore', all: true}));
});

test('can use all: true with stderr: ignore', async t => {
	await t.notThrowsAsync(execa('max-buffer.js', ['stderr'], {buffer: false, stderr: 'ignore', all: true}));
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
	const childProcess = execa('forever');
	childProcess.stdout.destroy();
	await t.throwsAsync(childProcess, {code: 'ERR_STREAM_PREMATURE_CLOSE'});
});
