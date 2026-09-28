import assert from 'node:assert/strict';
import test from 'node:test';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getStdio} from '../helpers/stdio.js';

setFixtureDirectory();

const testIgnore = async (fdNumber, execaMethod) => {
	const result = await execaMethod('noop.js', getStdio(fdNumber, 'ignore'));
	assert.equal(result.stdio[fdNumber], undefined);
};

test('stdout is undefined if ignored', () => testIgnore(1, execa));
test('stderr is undefined if ignored', () => testIgnore(2, execa));
test('stdio[*] is undefined if ignored', () => testIgnore(3, execa));
test('stdout is undefined if ignored - sync', () => testIgnore(1, execaSync));
test('stderr is undefined if ignored - sync', () => testIgnore(2, execaSync));
test('stdio[*] is undefined if ignored - sync', () => testIgnore(3, execaSync));

const testSubprocessEventsCleanup = async fixtureName => {
	const subprocess = execa(fixtureName, {reject: false});
	assert.deepEqual(subprocess.nodeChildProcess.eventNames().map(String).sort(), ['error', 'exit', 'spawn']);
	await subprocess;
	assert.deepEqual(subprocess.nodeChildProcess.eventNames(), []);
};

test('subprocess listeners are cleaned up on success', () => testSubprocessEventsCleanup('empty.js'));
test('subprocess listeners are cleaned up on failure', () => testSubprocessEventsCleanup('fail.js'));

test('Aborting stdout should not abort stderr nor all', async () => {
	const subprocess = execa('empty.js', {all: true});

	subprocess.stdout.destroy();
	assert.equal(subprocess.stdout.readable, false);
	assert.equal(subprocess.stderr.readable, true);
	assert.equal(subprocess.all.readable, true);

	await subprocess;

	assert.equal(subprocess.stdout.readableEnded, false);
	assert.equal(subprocess.stdout.errored, null);
	assert.equal(subprocess.stdout.destroyed, true);
	assert.equal(subprocess.stderr.readableEnded, true);
	assert.equal(subprocess.stderr.errored, null);
	assert.equal(subprocess.stderr.destroyed, true);
	assert.equal(subprocess.all.readableEnded, true);
	assert.equal(subprocess.all.errored, null);
	assert.equal(subprocess.all.destroyed, true);
});
