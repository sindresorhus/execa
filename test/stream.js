import path from 'path';
import stream from 'stream';
import test from 'ava';
import getStream from 'get-stream';
import execa from '..';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

test('buffer', async t => {
	const {stdout} = await execa('noop', ['foo'], {encoding: null});
	t.true(Buffer.isBuffer(stdout));
	t.is(stdout.toString(), 'foo');
});

test.serial('result.all shows both `stdout` and `stderr` intermixed', async t => {
	const {all} = await execa('noop-132');
	t.is(all, '132');
});

test('stdout/stderr/all are undefined if ignored', async t => {
	const {stdout, stderr, all} = await execa('noop', {stdio: 'ignore'});
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.is(all, undefined);
});

test('stdout/stderr/all are undefined if ignored in sync mode', t => {
	const {stdout, stderr, all} = execa.sync('noop', {stdio: 'ignore'});
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
	const s = new stream.PassThrough();
	s.write('howdy');
	s.end();
	const {stdout} = await execa('stdin', {input: s});
	t.is(stdout, 'howdy');
});

test('you can write to child.stdin', async t => {
	const child = execa('stdin');
	child.stdin.end('unicorns');
	t.is((await child).stdout, 'unicorns');
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
			execa.sync('stdin', {input: new stream.PassThrough()});
		},
		/The `input` option cannot be a stream in sync mode/
	);
});

test('maxBuffer affects stdout', async t => {
	await t.notThrowsAsync(execa('max-buffer', ['stdout', '10'], {maxBuffer: 10}));
	const {stdout, all} = await t.throwsAsync(execa('max-buffer', ['stdout', '11'], {maxBuffer: 10}), /max-buffer stdout/);
	t.is(stdout, '.'.repeat(10));
	t.is(all, '.'.repeat(10));
});

test('maxBuffer affects stderr', async t => {
	await t.notThrowsAsync(execa('max-buffer', ['stderr', '10'], {maxBuffer: 10}));
	const {stderr, all} = await t.throwsAsync(execa('max-buffer', ['stderr', '11'], {maxBuffer: 10}), /max-buffer stderr/);
	t.is(stderr, '.'.repeat(10));
	t.is(all, '.'.repeat(10));
});

test('do not buffer stdout when `buffer` set to `false`', async t => {
	const promise = execa('max-buffer', ['stdout', '10'], {buffer: false});
	const [result, stdout] = await Promise.all([
		promise,
		getStream(promise.stdout),
		getStream(promise.all)
	]);

	t.is(result.stdout, undefined);
	t.is(stdout, '.........\n');
});

test('do not buffer stderr when `buffer` set to `false`', async t => {
	const promise = execa('max-buffer', ['stderr', '10'], {buffer: false});
	const [result, stderr] = await Promise.all([
		promise,
		getStream(promise.stderr),
		getStream(promise.all)
	]);

	t.is(result.stderr, undefined);
	t.is(stderr, '.........\n');
});

test('do not buffer when streaming', async t => {
	const {stdout} = execa('max-buffer', ['stdout', '21'], {maxBuffer: 10});
	const result = await getStream(stdout);
	t.is(result, '....................\n');
});
