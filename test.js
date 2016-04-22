import path from 'path';
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

test('stdout/stderr available on errors', async t => {
	const err = await t.throws(m('exit', ['2']));
	t.is(typeof err.stdout, 'string');
	t.is(typeof err.stderr, 'string');
});

test('include stdout in errors for improved debugging', async t => {
	const err = await t.throws(m('./fixtures/error-message.js'));
	t.true(err.message.indexOf('stdout') !== -1);
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
	const stdout = m.sync('noop', ['foo']);
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

test('execa() returns a promise with kill() and pid', t => {
	const promise = m('noop', ['foo']);
	t.is(typeof promise.kill, 'function');
	t.is(typeof promise.pid, 'number');
});

test('input option', async t => {
	const {stdout} = await m('stdin', [], {input: 'foobar'});
	t.is(stdout, 'foobar');
});
