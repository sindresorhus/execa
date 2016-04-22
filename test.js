import test from 'ava';
import getStream from 'get-stream';
import m from './';

test('execa()', async t => {
	const {stdout} = await m('echo', ['foo']);
	t.is(stdout, 'foo');
});

test('buffer', async t => {
	const {stdout} = await m('echo', ['foo'], {encoding: null});
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
	const {stdout} = await m.shell('echo foo');
	t.is(stdout, 'foo');
});

test('execa.spawn()', async t => {
	t.is(typeof m.spawn('echo').pid, 'number');
	t.is((await getStream(m.spawn('echo', ['foo']).stdout)).trim(), 'foo');
});

test('execa.sync()', t => {
	const stdout = m.sync('echo', ['foo']);
	t.is(stdout, 'foo');
});

test('stripEof option', async t => {
	const {stdout} = await m('echo', ['foo'], {stripEof: false});
	t.is(stdout, 'foo\n');
});

test.serial('preferLocal option', async t => {
	t.true((await m('cat-names')).stdout.length > 2);

	// account for npm adding local binaries to the PATH
	const _path = process.env.PATH;
	process.env.PATH = '';
	await t.throws(m('cat-names', {preferLocal: false}), /spawn cat-names ENOENT/);
	process.env.PATH = _path;
});

test('execa() returns a promise with kill() and pid', t => {
	const promise = m('echo', ['foo']);
	t.is(typeof promise.kill, 'function');
	t.is(typeof promise.pid, 'number');
});
