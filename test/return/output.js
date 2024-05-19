import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {fullStdio, getStdio} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';
import {
	getEarlyErrorSubprocess,
	getEarlyErrorSubprocessSync,
	expectedEarlyError,
	expectedEarlyErrorSync,
} from '../helpers/early-error.js';

setFixtureDirectory();

const testOutput = async (t, fdNumber, execaMethod) => {
	const {stdout, stderr, stdio} = await execaMethod('noop-fd.js', [`${fdNumber}`, foobarString], fullStdio);
	t.is(stdio[fdNumber], foobarString);

	if (fdNumber === 1) {
		t.is(stdio[fdNumber], stdout);
	} else if (fdNumber === 2) {
		t.is(stdio[fdNumber], stderr);
	}
};

test('can return stdout', testOutput, 1, execa);
test('can return stderr', testOutput, 2, execa);
test('can return output stdio[*]', testOutput, 3, execa);
test('can return stdout, sync', testOutput, 1, execaSync);
test('can return stderr, sync', testOutput, 2, execaSync);
test('can return output stdio[*], sync', testOutput, 3, execaSync);

const testNoStdin = async (t, execaMethod) => {
	const {stdio} = await execaMethod('noop.js', [foobarString]);
	t.is(stdio[0], undefined);
};

test('cannot return stdin', testNoStdin, execa);
test('cannot return stdin, sync', testNoStdin, execaSync);

test('cannot return input stdio[*]', async t => {
	const {stdio} = await execa('stdin-fd.js', ['3'], getStdio(3, [[foobarString]]));
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
test('empty error.stdout/stderr/stdio, sync', testEmptyErrorStdio, execaSync);

const testUndefinedErrorStdio = async (t, execaMethod) => {
	const {stdout, stderr, stdio} = await execaMethod('empty.js', {stdio: 'ignore'});
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.deepEqual(stdio, [undefined, undefined, undefined]);
};

test('undefined error.stdout/stderr/stdio', testUndefinedErrorStdio, execa);
test('undefined error.stdout/stderr/stdio, sync', testUndefinedErrorStdio, execaSync);

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

const validateSpawnErrorStdio = (t, {stdout, stderr, stdio, all}) => {
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.is(all, undefined);
	t.deepEqual(stdio, [undefined, undefined, undefined]);
};

test('stdout/stderr/all/stdio on subprocess spawning errors', async t => {
	const error = await t.throwsAsync(getEarlyErrorSubprocess({all: true}));
	t.like(error, expectedEarlyError);
	validateSpawnErrorStdio(t, error);
});

test('stdout/stderr/all/stdio on subprocess spawning errors, sync', t => {
	const error = t.throws(() => getEarlyErrorSubprocessSync({all: true}));
	t.like(error, expectedEarlyErrorSync);
	validateSpawnErrorStdio(t, error);
});

const testErrorOutput = async (t, execaMethod) => {
	const {failed, stdout, stderr, stdio} = await execaMethod('echo-fail.js', {...fullStdio, reject: false});
	t.true(failed);
	t.is(stdout, 'stdout');
	t.is(stderr, 'stderr');
	t.deepEqual(stdio, [undefined, 'stdout', 'stderr', 'fd3']);
};

test('error.stdout/stderr/stdio is defined', testErrorOutput, execa);
test('error.stdout/stderr/stdio is defined, sync', testErrorOutput, execaSync);

test('ipc on subprocess spawning errors', async t => {
	const error = await t.throwsAsync(getEarlyErrorSubprocess({ipc: true}));
	t.like(error, expectedEarlyError);
	t.deepEqual(error.ipcOutput, []);
});

const testEarlyErrorNoIpc = async (t, options) => {
	const error = await t.throwsAsync(getEarlyErrorSubprocess(options));
	t.like(error, expectedEarlyError);
	t.deepEqual(error.ipcOutput, []);
};

test('ipc on subprocess spawning errors, ipc false', testEarlyErrorNoIpc, {ipc: false});
test('ipc on subprocess spawning errors, buffer false', testEarlyErrorNoIpc, {buffer: false});
