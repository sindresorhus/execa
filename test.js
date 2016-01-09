import test from 'ava';
import fn from './';

test('execa()', async t => {
	const {stdout} = await fn('echo', ['foo']);
	t.is(stdout, 'foo');
});

test('buffer', async t => {
	const {stdout} = await fn('echo', ['foo'], {encoding: null});
	t.true(Buffer.isBuffer(stdout));
	t.is(stdout.toString(), 'foo');
});

test('stdout/stderr available on errors', async t => {
	try {
		await fn('exit', ['2']);
	} catch (err) {
		t.is(typeof err.stdout, 'string');
		t.is(typeof err.stdout, 'string');
	}
});

test('execa.shell()', async t => {
	const {stdout} = await fn.shell('echo foo');
	t.is(stdout, 'foo');
});

test('stripEof option', async t => {
	const {stdout} = await fn('echo', ['foo'], {stripEof: false});
	t.is(stdout, 'foo\n');
});

test.serial('preferLocal option', async t => {
	t.true((await fn('cat-names')).stdout.length > 2);

	// account for npm adding local binaries to the PATH
	const _path = process.env.PATH;
	process.env.PATH = '';
	await t.throws(fn('cat-names', {preferLocal: false}), /spawn cat-names ENOENT/);
	process.env.PATH = _path;
});
