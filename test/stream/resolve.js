import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';

setFixtureDir();

const testIgnore = async (t, index, execaMethod) => {
	const result = await execaMethod('noop.js', getStdio(index, 'ignore'));
	t.is(result.stdio[index], undefined);
};

test('stdout is undefined if ignored', testIgnore, 1, execa);
test('stderr is undefined if ignored', testIgnore, 2, execa);
test('stdio[*] is undefined if ignored', testIgnore, 3, execa);
test('stdout is undefined if ignored - sync', testIgnore, 1, execaSync);
test('stderr is undefined if ignored - sync', testIgnore, 2, execaSync);
test('stdio[*] is undefined if ignored - sync', testIgnore, 3, execaSync);

const testProcessEventsCleanup = async (t, fixtureName) => {
	const childProcess = execa(fixtureName, {reject: false});
	t.deepEqual(childProcess.eventNames().map(String).sort(), ['Symbol(error)', 'error', 'exit', 'spawn']);
	await childProcess;
	t.deepEqual(childProcess.eventNames(), []);
};

test('childProcess listeners are cleaned up on success', testProcessEventsCleanup, 'empty.js');
test('childProcess listeners are cleaned up on failure', testProcessEventsCleanup, 'fail.js');

test('Aborting stdout should not abort stderr nor all', async t => {
	const subprocess = execa('empty.js', {all: true});

	subprocess.stdout.destroy();
	t.false(subprocess.stdout.readable);
	t.true(subprocess.stderr.readable);
	t.true(subprocess.all.readable);

	await subprocess;

	t.false(subprocess.stdout.readableEnded);
	t.is(subprocess.stdout.errored, null);
	t.true(subprocess.stdout.destroyed);
	t.true(subprocess.stderr.readableEnded);
	t.is(subprocess.stderr.errored, null);
	t.true(subprocess.stderr.destroyed);
	t.true(subprocess.all.readableEnded);
	t.is(subprocess.all.errored, null);
	t.true(subprocess.all.destroyed);
});
