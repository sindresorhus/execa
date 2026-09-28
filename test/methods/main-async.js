import assert from 'node:assert/strict';
import process from 'node:process';
import {ChildProcess} from 'node:child_process';
import test from 'node:test';
import {execa} from '../../index.js';
import {setFixtureDirectory, FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const isWindows = process.platform === 'win32';

if (isWindows) {
	test('execa() - cmd file', async () => {
		const {stdout} = await execa('hello.cmd');
		assert.equal(stdout, 'Hello World');
	});

	test('execa() - run cmd command', async () => {
		const {stdout} = await execa('cmd', ['/c', 'hello.cmd']);
		assert.equal(stdout, 'Hello World');
	});

	// A bare command name without an extension is resolved using `PATHEXT`.
	test('execa() - resolve command extension using PATHEXT', async () => {
		const {stdout} = await execa('hello');
		assert.equal(stdout, 'Hello World');
	});

	test('execa() - run cmd file using a relative path', async () => {
		const {stdout} = await execa('./hello.cmd', {cwd: FIXTURES_DIRECTORY});
		assert.equal(stdout, 'Hello World');
	});

	// The fixture's filename contains a space and it starts with a shebang.
	test('execa() - run file with a space in its path and a shebang', async () => {
		const {stdout} = await execa('command with space.js', ['foo']);
		assert.equal(stdout, 'foo');
	});
}

test('execa() returns a promise with pid', async () => {
	const subprocess = execa('noop.js', ['foo']);
	assert.equal(typeof subprocess.pid, 'number');
	await subprocess;
});

test('execa() returns a promise with nodeChildProcess', async () => {
	const subprocess = execa('noop.js', ['foo']);
	assert.ok(subprocess instanceof Promise);
	assert.ok(!(subprocess instanceof ChildProcess));
	assert.ok(subprocess.nodeChildProcess instanceof ChildProcess);
	assert.equal(subprocess.pid, subprocess.nodeChildProcess.pid);
	assert.equal(subprocess.stdout, subprocess.nodeChildProcess.stdout);
	assert.equal(subprocess.on, undefined);
	assert.equal(subprocess.once, undefined);
	assert.equal(subprocess.send, undefined);
	assert.equal(subprocess.ref, undefined);
	assert.equal(subprocess.unref, undefined);
	assert.equal(subprocess.disconnect, undefined);
	assert.equal(subprocess.channel, undefined);
	assert.equal(subprocess.connected, undefined);
	assert.equal(subprocess.exitCode, undefined);
	assert.equal(subprocess.signalCode, undefined);
	assert.equal(subprocess.killed, undefined);
	assert.equal(subprocess.spawnargs, undefined);
	assert.equal(subprocess.spawnfile, undefined);

	assert.equal(subprocess[Symbol.dispose], undefined);
	await subprocess;
});

test('nodeChildProcess does not include Execa-specific APIs', async () => {
	const subprocess = execa('noop.js', ['foo'], {all: true});
	assert.ok(!Object.hasOwn(subprocess.nodeChildProcess, 'all'));
	assert.equal(subprocess.nodeChildProcess.readable, undefined);
	assert.equal(subprocess.nodeChildProcess.writable, undefined);
	assert.equal(subprocess.nodeChildProcess.duplex, undefined);
	assert.equal(subprocess.nodeChildProcess.iterable, undefined);
	assert.equal(subprocess.nodeChildProcess[Symbol.asyncIterator], undefined);
	await subprocess;
});
