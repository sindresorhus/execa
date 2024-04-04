import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio, getStdio} from '../helpers/stdio.js';
import {noopGenerator} from '../helpers/generator.js';

setFixtureDir();

const testOutput = async (t, fdNumber, execaMethod) => {
	const {stdout, stderr, stdio} = await execaMethod('noop-fd.js', [`${fdNumber}`, 'foobar'], fullStdio);
	t.is(stdio[fdNumber], 'foobar');

	if (fdNumber === 1) {
		t.is(stdio[fdNumber], stdout);
	} else if (fdNumber === 2) {
		t.is(stdio[fdNumber], stderr);
	}
};

test('can return stdout', testOutput, 1, execa);
test('can return stderr', testOutput, 2, execa);
test('can return output stdio[*]', testOutput, 3, execa);
test('can return stdout - sync', testOutput, 1, execaSync);
test('can return stderr - sync', testOutput, 2, execaSync);
test('can return output stdio[*] - sync', testOutput, 3, execaSync);

const testNoStdin = async (t, execaMethod) => {
	const {stdio} = await execaMethod('noop.js', ['foobar']);
	t.is(stdio[0], undefined);
};

test('cannot return stdin', testNoStdin, execa);
test('cannot return stdin - sync', testNoStdin, execaSync);

test('cannot return input stdio[*]', async t => {
	const {stdio} = await execa('stdin-fd.js', ['3'], getStdio(3, [['foobar']]));
	t.is(stdio[3], undefined);
});

test('do not try to consume streams twice', async t => {
	const subprocess = execa('noop.js', ['foo']);
	const {stdout} = await subprocess;
	const {stdout: stdout2} = await subprocess;
	t.is(stdout, 'foo');
	t.is(stdout2, 'foo');
});

const testEmptyErrorStdio = async (t, execaMethod) => {
	const {failed, stdout, stderr, stdio} = await execaMethod('fail.js', {reject: false});
	t.true(failed);
	t.is(stdout, '');
	t.is(stderr, '');
	t.deepEqual(stdio, [undefined, '', '']);
};

test('empty error.stdout/stderr/stdio', testEmptyErrorStdio, execa);
test('empty error.stdout/stderr/stdio - sync', testEmptyErrorStdio, execaSync);

const testUndefinedErrorStdio = async (t, execaMethod) => {
	const {stdout, stderr, stdio} = await execaMethod('empty.js', {stdio: 'ignore'});
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.deepEqual(stdio, [undefined, undefined, undefined]);
};

test('undefined error.stdout/stderr/stdio', testUndefinedErrorStdio, execa);
test('undefined error.stdout/stderr/stdio - sync', testUndefinedErrorStdio, execaSync);

const testEmptyAll = async (t, options, expectedValue, execaMethod) => {
	const {all} = await execaMethod('empty.js', options);
	t.is(all, expectedValue);
};

test('empty error.all', testEmptyAll, {all: true}, '', execa);
test('undefined error.all', testEmptyAll, {}, undefined, execa);
test('ignored error.all', testEmptyAll, {all: true, stdio: 'ignore'}, undefined, execa);
test('empty error.all, sync', testEmptyAll, {all: true}, '', execaSync);
test('undefined error.all, sync', testEmptyAll, {}, undefined, execaSync);
test('ignored error.all, sync', testEmptyAll, {all: true, stdio: 'ignore'}, undefined, execaSync);

test('empty error.stdio[0] even with input', async t => {
	const {stdio} = await t.throwsAsync(execa('fail.js', {input: 'test'}));
	t.is(stdio[0], undefined);
});

// `error.code` is OS-specific here
const SPAWN_ERROR_CODES = new Set(['EINVAL', 'ENOTSUP', 'EPERM']);

const testSpawnError = async (t, execaMethod) => {
	const {code, stdout, stderr, stdio, all} = await execaMethod('empty.js', {uid: -1, all: true, reject: false});
	t.true(SPAWN_ERROR_CODES.has(code));
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.is(all, undefined);
	t.deepEqual(stdio, [undefined, undefined, undefined]);
};

test('stdout/stderr/all/stdio on subprocess spawning errors', testSpawnError, execa);
test('stdout/stderr/all/stdio on subprocess spawning errors - sync', testSpawnError, execaSync);

const testErrorOutput = async (t, execaMethod) => {
	const {failed, stdout, stderr, stdio} = await execaMethod('echo-fail.js', {...fullStdio, reject: false});
	t.true(failed);
	t.is(stdout, 'stdout');
	t.is(stderr, 'stderr');
	t.deepEqual(stdio, [undefined, 'stdout', 'stderr', 'fd3']);
};

test('error.stdout/stderr/stdio is defined', testErrorOutput, execa);
test('error.stdout/stderr/stdio is defined - sync', testErrorOutput, execaSync);

const testStripFinalNewline = async (t, fdNumber, stripFinalNewline, execaMethod) => {
	const {stdio} = await execaMethod('noop-fd.js', [`${fdNumber}`, 'foobar\n'], {...fullStdio, stripFinalNewline});
	t.is(stdio[fdNumber], `foobar${stripFinalNewline === false ? '\n' : ''}`);
};

test('stripFinalNewline: undefined with stdout', testStripFinalNewline, 1, undefined, execa);
test('stripFinalNewline: true with stdout', testStripFinalNewline, 1, true, execa);
test('stripFinalNewline: false with stdout', testStripFinalNewline, 1, false, execa);
test('stripFinalNewline: undefined with stderr', testStripFinalNewline, 2, undefined, execa);
test('stripFinalNewline: true with stderr', testStripFinalNewline, 2, true, execa);
test('stripFinalNewline: false with stderr', testStripFinalNewline, 2, false, execa);
test('stripFinalNewline: undefined with stdio[*]', testStripFinalNewline, 3, undefined, execa);
test('stripFinalNewline: true with stdio[*]', testStripFinalNewline, 3, true, execa);
test('stripFinalNewline: false with stdio[*]', testStripFinalNewline, 3, false, execa);
test('stripFinalNewline: undefined with stdout - sync', testStripFinalNewline, 1, undefined, execaSync);
test('stripFinalNewline: true with stdout - sync', testStripFinalNewline, 1, true, execaSync);
test('stripFinalNewline: false with stdout - sync', testStripFinalNewline, 1, false, execaSync);
test('stripFinalNewline: undefined with stderr - sync', testStripFinalNewline, 2, undefined, execaSync);
test('stripFinalNewline: true with stderr - sync', testStripFinalNewline, 2, true, execaSync);
test('stripFinalNewline: false with stderr - sync', testStripFinalNewline, 2, false, execaSync);
test('stripFinalNewline: undefined with stdio[*] - sync', testStripFinalNewline, 3, undefined, execaSync);
test('stripFinalNewline: true with stdio[*] - sync', testStripFinalNewline, 3, true, execaSync);
test('stripFinalNewline: false with stdio[*] - sync', testStripFinalNewline, 3, false, execaSync);

test('stripFinalNewline is not used in objectMode', async t => {
	const {stdout} = await execa('noop-fd.js', ['1', 'foobar\n'], {stripFinalNewline: true, stdout: noopGenerator(true, false, true)});
	t.deepEqual(stdout, ['foobar\n']);
});
