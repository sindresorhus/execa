import path from 'path';
import stream from 'stream';
import test from 'ava';
import getStream from 'get-stream';
import m from './';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

test('execa()', async t => {
	const {stdout} = await m('noop', ['foo']);
	t.is(stdout, 'foo');
});

test('buffer', async t => {
	const {stdout} = await m('noop', ['foo'], {encoding: null});
	t.true(Buffer.isBuffer(stdout));
	t.is(stdout.toString(), 'foo');
});

test('execa.stdout()', async t => {
	const stdout = await m.stdout('noop', ['foo']);
	t.is(stdout, 'foo');
});

test('execa.stderr()', async t => {
	const stderr = await m.stderr('noop-err', ['foo']);
	t.is(stderr, 'foo');
});

test('stdout/stderr available on errors', async t => {
	const err = await t.throws(m('exit', ['2']));
	t.is(typeof err.stdout, 'string');
	t.is(typeof err.stderr, 'string');
});

test('include stdout in errors for improved debugging', async t => {
	const err = await t.throws(m('./fixtures/error-message.js'));
	t.regex(err.message, /stdout/);
});

test('execa.shell()', async t => {
	const {stdout} = await m.shell('node fixtures/noop foo');
	t.is(stdout, 'foo');
});

test('execa.spawn()', async t => {
	t.is(typeof m.spawn('noop').pid, 'number');
	t.is((await getStream(m.spawn('noop', ['foo']).stdout)).trim(), 'foo');
});

test('execa.sync()', t => {
	const {stdout} = m.sync('noop', ['foo']);
	t.is(stdout, 'foo');
});

test('execa.shellSync()', t => {
	const {stdout} = m.shellSync('node fixtures/noop foo');
	t.is(stdout, 'foo');
});

test('stripEof option', async t => {
	const {stdout} = await m('noop', ['foo'], {stripEof: false});
	t.is(stdout, 'foo\n');
});

test.serial('preferLocal option', async t => {
	t.true((await m('cat-names')).stdout.length > 2);

	if (process.platform === 'win32') {
		// TODO: figure out how to make the below not hang on Windows
		return;
	}

	// account for npm adding local binaries to the PATH
	const _path = process.env.PATH;
	process.env.PATH = '';
	await t.throws(m('cat-names', {preferLocal: false}), /spawn .* ENOENT/);
	process.env.PATH = _path;
});

test('input option can be a String', async t => {
	const {stdout} = await m('stdin', {input: 'foobar'});
	t.is(stdout, 'foobar');
});

test('input option can be a Buffer', async t => {
	const {stdout} = await m('stdin', {input: 'testing12'});
	t.is(stdout, 'testing12');
});

test('input can be a Stream', async t => {
	var s = new stream.PassThrough();
	s.write('howdy');
	s.end();
	const {stdout} = await m('stdin', {input: s});
	t.is(stdout, 'howdy');
});

test('you can write to child.stdin', async t => {
	const child = m('stdin');
	child.stdin.end('unicorns');
	t.is((await child).stdout, 'unicorns');
});

test('input option can be a String - sync', async t => {
	const {stdout} = m.sync('stdin', {input: 'foobar'});
	t.is(stdout, 'foobar');
});

test('input option can be a Buffer - sync', async t => {
	const {stdout} = m.sync('stdin', {input: new Buffer('testing12', 'utf8')});
	t.is(stdout, 'testing12');
});

test('opts.stdout:ignore - stdout will not collect data', async t => {
	const {stdout} = await m('stdin', {input: 'hello', stdio: [null, 'ignore', null]});
	t.is(stdout, null);
});

test('helpful error trying to provide an input stream in sync mode', t => {
	t.throws(
		() => m.sync('stdin', {input: new stream.PassThrough()}),
		/The `input` option cannot be a stream in sync mode/
	);
});

test('execa() returns a promise with kill() and pid', t => {
	const promise = m('noop', ['foo']);
	t.is(typeof promise.kill, 'function');
	t.is(typeof promise.pid, 'number');
});
