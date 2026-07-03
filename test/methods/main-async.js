import process from 'node:process';
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
