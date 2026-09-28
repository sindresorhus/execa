import assert from 'node:assert/strict';
import test from 'node:test';
import {assertThrows, assertRejects, assertLike} from '../helpers/assert.js';
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

const testOutput = async (fdNumber, execaMethod) => {
	const {stdout, stderr, stdio} = await execaMethod('noop-fd.js', [`${fdNumber}`, foobarString], fullStdio);
	assert.equal(stdio[fdNumber], foobarString);

	if (fdNumber === 1) {
		assert.equal(stdio[fdNumber], stdout);
	} else if (fdNumber === 2) {
		assert.equal(stdio[fdNumber], stderr);
	}
};

test('can return stdout', () => testOutput(1, execa));
test('can return stderr', () => testOutput(2, execa));
test('can return output stdio[*]', () => testOutput(3, execa));
test('can return stdout, sync', () => testOutput(1, execaSync));
test('can return stderr, sync', () => testOutput(2, execaSync));
test('can return output stdio[*], sync', () => testOutput(3, execaSync));

const testNoStdin = async execaMethod => {
	const {stdio} = await execaMethod('noop.js', [foobarString]);
	assert.equal(stdio[0], undefined);
};

test('cannot return stdin', () => testNoStdin(execa));
test('cannot return stdin, sync', () => testNoStdin(execaSync));

test('cannot return input stdio[*]', async () => {
	const {stdio} = await execa('stdin-fd.js', ['3'], getStdio(3, [[foobarString]]));
	assert.equal(stdio[3], undefined);
});

test('do not try to consume streams twice', async () => {
	const subprocess = execa('noop.js', ['foo']);
	const {stdout} = await subprocess;
	const {stdout: stdout2} = await subprocess;
	assert.equal(stdout, 'foo');
	assert.equal(stdout2, 'foo');
});

const testEmptyErrorStdio = async execaMethod => {
	const {failed, stdout, stderr, stdio} = await execaMethod('fail.js', {reject: false});
	assert.equal(failed, true);
	assert.equal(stdout, '');
	assert.equal(stderr, '');
	assert.deepEqual(stdio, [undefined, '', '']);
};

test('empty error.stdout/stderr/stdio', () => testEmptyErrorStdio(execa));
test('empty error.stdout/stderr/stdio, sync', () => testEmptyErrorStdio(execaSync));

const testUndefinedErrorStdio = async execaMethod => {
	const {stdout, stderr, stdio} = await execaMethod('empty.js', {stdio: 'ignore'});
	assert.equal(stdout, undefined);
	assert.equal(stderr, undefined);
	assert.deepEqual(stdio, [undefined, undefined, undefined]);
};

test('undefined error.stdout/stderr/stdio', () => testUndefinedErrorStdio(execa));
test('undefined error.stdout/stderr/stdio, sync', () => testUndefinedErrorStdio(execaSync));

const testEmptyAll = async (options, expectedValue, execaMethod) => {
	const {all} = await execaMethod('empty.js', options);
	assert.equal(all, expectedValue);
};

test('empty error.all', () => testEmptyAll({all: true}, '', execa));
test('undefined error.all', () => testEmptyAll({}, undefined, execa));
test('ignored error.all', () => testEmptyAll({all: true, stdio: 'ignore'}, undefined, execa));
test('empty error.all, sync', () => testEmptyAll({all: true}, '', execaSync));
test('undefined error.all, sync', () => testEmptyAll({}, undefined, execaSync));
test('ignored error.all, sync', () => testEmptyAll({all: true, stdio: 'ignore'}, undefined, execaSync));

test('empty error.stdio[0] even with input', async () => {
	const {stdio} = await assertRejects(execa('fail.js', {input: 'test'}));
	assert.equal(stdio[0], undefined);
});

const validateSpawnErrorStdio = ({stdout, stderr, stdio, all}) => {
	assert.equal(stdout, undefined);
	assert.equal(stderr, undefined);
	assert.equal(all, undefined);
	assert.deepEqual(stdio, [undefined, undefined, undefined]);
};

test('stdout/stderr/all/stdio on subprocess spawning errors', async () => {
	const error = await assertRejects(getEarlyErrorSubprocess({all: true}));
	assertLike(error, expectedEarlyError);
	validateSpawnErrorStdio(error);
});

test('stdout/stderr/all/stdio on subprocess spawning errors, sync', () => {
	const error = assertThrows(() => getEarlyErrorSubprocessSync({all: true}));
	assertLike(error, expectedEarlyErrorSync);
	validateSpawnErrorStdio(error);
});

const testErrorOutput = async execaMethod => {
	const {failed, stdout, stderr, stdio} = await execaMethod('echo-fail.js', {...fullStdio, reject: false});
	assert.equal(failed, true);
	assert.equal(stdout, 'stdout');
	assert.equal(stderr, 'stderr');
	assert.deepEqual(stdio, [undefined, 'stdout', 'stderr', 'fd3']);
};

test('error.stdout/stderr/stdio is defined', () => testErrorOutput(execa));
test('error.stdout/stderr/stdio is defined, sync', () => testErrorOutput(execaSync));

test('ipc on subprocess spawning errors', async () => {
	const error = await assertRejects(getEarlyErrorSubprocess({ipc: true}));
	assertLike(error, expectedEarlyError);
	assert.deepEqual(error.ipcOutput, []);
});

const testEarlyErrorNoIpc = async options => {
	const error = await assertRejects(getEarlyErrorSubprocess(options));
	assertLike(error, expectedEarlyError);
	assert.deepEqual(error.ipcOutput, []);
};

test('ipc on subprocess spawning errors, ipc false', () => testEarlyErrorNoIpc({ipc: false}));
test('ipc on subprocess spawning errors, buffer false', () => testEarlyErrorNoIpc({buffer: false}));
