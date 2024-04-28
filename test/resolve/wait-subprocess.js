import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getStdio} from '../helpers/stdio.js';

setFixtureDirectory();

const testIgnore = async (t, fdNumber, execaMethod) => {
	const result = await execaMethod('noop.js', getStdio(fdNumber, 'ignore'));
	t.is(result.stdio[fdNumber], undefined);
};

test('stdout is undefined if ignored', testIgnore, 1, execa);
test('stderr is undefined if ignored', testIgnore, 2, execa);
test('stdio[*] is undefined if ignored', testIgnore, 3, execa);
test('stdout is undefined if ignored - sync', testIgnore, 1, execaSync);
test('stderr is undefined if ignored - sync', testIgnore, 2, execaSync);
test('stdio[*] is undefined if ignored - sync', testIgnore, 3, execaSync);

const testSubprocessEventsCleanup = async (t, fixtureName) => {
	const subprocess = execa(fixtureName, {reject: false});
	t.deepEqual(subprocess.eventNames().map(String).sort(), ['error', 'exit', 'spawn']);
	await subprocess;
	t.deepEqual(subprocess.eventNames(), []);
};

test('subprocess listeners are cleaned up on success', testSubprocessEventsCleanup, 'empty.js');
test('subprocess listeners are cleaned up on failure', testSubprocessEventsCleanup, 'fail.js');

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
