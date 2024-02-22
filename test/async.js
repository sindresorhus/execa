import process from 'node:process';
import test from 'ava';
import {execa, execaSync} from '../index.js';
import {setFixtureDir} from './helpers/fixtures-dir.js';

setFixtureDir();

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
}

test('skip throwing when using reject option', async t => {
	const {exitCode} = await execa('fail.js', {reject: false});
	t.is(exitCode, 2);
});

test('skip throwing when using reject option in sync mode', t => {
	const {exitCode} = execaSync('fail.js', {reject: false});
	t.is(exitCode, 2);
});

test('execa() returns a promise with pid', async t => {
	const subprocess = execa('noop.js', ['foo']);
	t.is(typeof subprocess.pid, 'number');
	await subprocess;
});
