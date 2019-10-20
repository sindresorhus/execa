import path from 'path';
import fs from 'fs';
import Stream from 'stream';
import test from 'ava';
import getStream from 'get-stream';
import tempfile from 'tempfile';
import execa from '..';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

test('buffer', async t => {
	const {stdout} = await execa('noop', ['foo'], {encoding: null});
	t.true(Buffer.isBuffer(stdout));
	t.is(stdout.toString(), 'foo');
});

test('pass `stdout` to a file descriptor', async t => {
	const file = tempfile('.txt');
	await execa('test/fixtures/noop', ['foo bar'], {stdout: fs.openSync(file, 'w')});
	t.is(fs.readFileSync(file, 'utf8'), 'foo bar\n');
});

test('pass `stderr` to a file descriptor', async t => {
	const file = tempfile('.txt');
	await execa('test/fixtures/noop-err', ['foo bar'], {stderr: fs.openSync(file, 'w')});
	t.is(fs.readFileSync(file, 'utf8'), 'foo bar\n');
});

test.serial('result.all shows both `stdout` and `stderr` intermixed', async t => {
	const {all} = await execa('noop-132', {all: true});
	t.is(all, '132');
});

test('result.all is undefined unless opts.all is true', async t => {
	const {all} = await execa('noop');
	t.is(all, undefined);
});

test('stdout/stderr/all are undefined if ignored', async t => {
	const {stdout, stderr, all} = await execa('noop', {stdio: 'ignore', all: true});
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.is(all, undefined);
});

test('stdout/stderr/all are undefined if ignored in sync mode', t => {
	const {stdout, stderr, all} = execa.sync('noop', {stdio: 'ignore', all: true});
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.is(all, undefined);
});

test('input option can be a String', async t => {
	const {stdout} = await execa('stdin', {input: 'foobar'});
	t.is(stdout, 'foobar');
});

test('input option can be a Buffer', async t => {
	const {stdout} = await execa('stdin', {input: 'testing12'});
	t.is(stdout, 'testing12');
});

test('input can be a Stream', async t => {
	const stream = new Stream.PassThrough();
	stream.write('howdy');
	stream.end();
	const {stdout} = await execa('stdin', {input: stream});
	t.is(stdout, 'howdy');
});

test('you can write to child.stdin', async t => {
	const subprocess = execa('stdin');
	subprocess.stdin.end('unicorns');
	t.is((await subprocess).stdout, 'unicorns');
});

test('input option can be a String - sync', t => {
	const {stdout} = execa.sync('stdin', {input: 'foobar'});
	t.is(stdout, 'foobar');
});

test('input option can be a Buffer - sync', t => {
	const {stdout} = execa.sync('stdin', {input: Buffer.from('testing12', 'utf8')});
	t.is(stdout, 'testing12');
});

test('opts.stdout:ignore - stdout will not collect data', async t => {
	const {stdout} = await execa('stdin', {
		input: 'hello',
		stdio: [undefined, 'ignore', undefined]
	});
	t.is(stdout, undefined);
});

test('helpful error trying to provide an input stream in sync mode', t => {
	t.throws(
		() => {
			execa.sync('stdin', {input: new Stream.PassThrough()});
		},
		/The `input` option cannot be a stream in sync mode/
	);
});

test('maxBuffer affects stdout', async t => {
	await t.notThrowsAsync(execa('max-buffer', ['stdout', '10'], {maxBuffer: 10}));
	const {stdout, all} = await t.throwsAsync(execa('max-buffer', ['stdout', '11'], {maxBuffer: 10, all: true}), /max-buffer stdout/);
	t.is(stdout, '.'.repeat(10));
	t.is(all, '.'.repeat(10));
});

test('maxBuffer affects stderr', async t => {
	await t.notThrowsAsync(execa('max-buffer', ['stderr', '10'], {maxBuffer: 10}));
	const {stderr, all} = await t.throwsAsync(execa('max-buffer', ['stderr', '11'], {maxBuffer: 10, all: true}), /max-buffer stderr/);
	t.is(stderr, '.'.repeat(10));
	t.is(all, '.'.repeat(10));
});

test('do not buffer stdout when `buffer` set to `false`', async t => {
	const promise = execa('max-buffer', ['stdout', '10'], {buffer: false});
	const [result, stdout] = await Promise.all([
		promise,
		getStream(promise.stdout)
	]);

	t.is(result.stdout, undefined);
	t.is(stdout, '.........\n');
});

test('do not buffer stderr when `buffer` set to `false`', async t => {
	const promise = execa('max-buffer', ['stderr', '10'], {buffer: false});
	const [result, stderr] = await Promise.all([
		promise,
		getStream(promise.stderr)
	]);

	t.is(result.stderr, undefined);
	t.is(stderr, '.........\n');
});

test('do not buffer when streaming', async t => {
	const {stdout} = execa('max-buffer', ['stdout', '21'], {maxBuffer: 10});
	const result = await getStream(stdout);
	t.is(result, '....................\n');
});

test('buffer: false > promise resolves', async t => {
	await t.notThrowsAsync(execa('noop', {buffer: false}));
});

test('buffer: false > promise resolves when output is big but is not pipable', async t => {
	await t.notThrowsAsync(execa('max-buffer', {buffer: false, stdout: 'ignore'}));
});

test('buffer: false > promise resolves when output is big and is read', async t => {
	const subprocess = execa('max-buffer', {buffer: false});
	subprocess.stdout.resume();
	subprocess.stderr.resume();
	await t.notThrowsAsync(subprocess);
});

test('buffer: false > promise resolves when output is big and "all" is used and is read', async t => {
	const subprocess = execa('max-buffer', {buffer: false, all: true});
	subprocess.all.resume();
	await t.notThrowsAsync(subprocess);
});

test('buffer: false > promise rejects when process returns non-zero', async t => {
	const subprocess = execa('fail', {buffer: false});
	const {exitCode} = await t.throwsAsync(subprocess);
	t.is(exitCode, 2);
});

test('can use all: true with stdout: ignore', async t => {
	await t.notThrowsAsync(execa('max-buffer', {buffer: false, stdout: 'ignore', all: true}));
});

test('can use all: true with stderr: ignore', async t => {
	await t.notThrowsAsync(execa('max-buffer', ['stderr'], {buffer: false, stderr: 'ignore', all: true}));
});

const BUFFER_TIMEOUT = 1e3;

// On Unix (not Windows), a process won't exit if stdout has not been read.
if (process.platform !== 'win32') {
	test.serial('buffer: false > promise does not resolve when output is big and is not read', async t => {
		const {timedOut} = await t.throwsAsync(execa('max-buffer', {buffer: false, timeout: BUFFER_TIMEOUT}));
		t.true(timedOut);
	});

	test.serial('buffer: false > promise does not resolve when output is big and "all" is used but not read', async t => {
		const subprocess = execa('max-buffer', {buffer: false, all: true, timeout: BUFFER_TIMEOUT});
		subprocess.stdout.resume();
		subprocess.stderr.resume();
		const {timedOut} = await t.throwsAsync(subprocess);
		t.true(timedOut);
	});
}
