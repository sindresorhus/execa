import process from 'node:process';
import {ChildProcess} from 'node:child_process';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory, FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const isWindows = process.platform === 'win32';

if (isWindows) {
	test('execa() - cmd file', async t => {
		const {stdout} = await execa('hello.cmd');
		t.is(stdout, 'Hello World');
	});

	test('execa() - run cmd command', async t => {
		const {stdout} = await execa('cmd', ['/c', 'hello.cmd']);
		t.is(stdout, 'Hello World');
	});

	// A bare command name without an extension is resolved using `PATHEXT`.
	test('execa() - resolve command extension using PATHEXT', async t => {
		const {stdout} = await execa('hello');
		t.is(stdout, 'Hello World');
	});

	test('execa() - run cmd file using a relative path', async t => {
		const {stdout} = await execa('./hello.cmd', {cwd: FIXTURES_DIRECTORY});
		t.is(stdout, 'Hello World');
	});

	// The fixture's filename contains a space and it starts with a shebang.
	test('execa() - run file with a space in its path and a shebang', async t => {
		const {stdout} = await execa('command with space.js', ['foo']);
		t.is(stdout, 'foo');
	});
}

test('execa() returns a promise with pid', async t => {
	const subprocess = execa('noop.js', ['foo']);
	t.is(typeof subprocess.pid, 'number');
	await subprocess;
});

test('execa() returns a promise with nodeChildProcess', async t => {
	const subprocess = execa('noop.js', ['foo']);
	t.true(subprocess instanceof Promise);
	t.false(subprocess instanceof ChildProcess);
	t.true(subprocess.nodeChildProcess instanceof ChildProcess);
	t.is(subprocess.pid, subprocess.nodeChildProcess.pid);
	t.is(subprocess.stdout, subprocess.nodeChildProcess.stdout);
	t.is(subprocess.on, undefined);
	t.is(subprocess.once, undefined);
	t.is(subprocess.send, undefined);
	t.is(subprocess.ref, undefined);
	t.is(subprocess.unref, undefined);
	t.is(subprocess.disconnect, undefined);
	t.is(subprocess.channel, undefined);
	t.is(subprocess.connected, undefined);
	t.is(subprocess.exitCode, undefined);
	t.is(subprocess.signalCode, undefined);
	t.is(subprocess.killed, undefined);
	t.is(subprocess.spawnargs, undefined);
	t.is(subprocess.spawnfile, undefined);
	t.is(subprocess[Symbol.dispose], undefined);
	await subprocess;
});

test('nodeChildProcess does not include Execa-specific APIs', async t => {
	const subprocess = execa('noop.js', ['foo'], {all: true});
	t.false(Object.hasOwn(subprocess.nodeChildProcess, 'all'));
	t.is(subprocess.nodeChildProcess.readable, undefined);
	t.is(subprocess.nodeChildProcess.writable, undefined);
	t.is(subprocess.nodeChildProcess.duplex, undefined);
	t.is(subprocess.nodeChildProcess.iterable, undefined);
	t.is(subprocess.nodeChildProcess[Symbol.asyncIterator], undefined);
	await subprocess;
});
