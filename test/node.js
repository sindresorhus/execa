import process from 'node:process';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import {pEvent} from 'p-event';
import {execa, execaNode} from '../index.js';
import {setFixtureDir, FIXTURES_DIR} from './helpers/fixtures-dir.js';
import {fullStdio} from './helpers/stdio.js';
import {foobarString} from './helpers/input.js';

setFixtureDir();

test('node()', async t => {
	const {exitCode} = await execaNode('test/fixtures/noop.js');
	t.is(exitCode, 0);
});

test('node pipe stdout', async t => {
	const {stdout} = await execaNode('test/fixtures/noop.js', ['foo'], {
		stdout: 'pipe',
	});

	t.is(stdout, 'foo');
});

test('node does not return ipc channel\'s output', async t => {
	const {stdio} = await execaNode('test/fixtures/noop.js', ['foo']);
	t.deepEqual(stdio, [undefined, 'foo', '', undefined]);
});

test('node correctly use nodePath', async t => {
	const {stdout} = await execaNode(process.platform === 'win32' ? 'hello.cmd' : 'hello.sh', {
		stdout: 'pipe',
		nodePath: process.platform === 'win32' ? 'cmd.exe' : 'bash',
		nodeOptions: process.platform === 'win32' ? ['/c'] : [],
	});

	t.is(stdout, 'Hello World');
});

test('The nodePath option can be a file URL', async t => {
	const nodePath = pathToFileURL(process.execPath);
	const {stdout} = await execaNode('test/fixtures/noop.js', ['foo'], {nodePath});
	t.is(stdout, 'foo');
});

test('node pass on nodeOptions', async t => {
	const {stdout} = await execaNode('console.log("foo")', {
		stdout: 'pipe',
		nodeOptions: ['-e'],
	});

	t.is(stdout, 'foo');
});

const spawnNestedExecaNode = (realExecArgv, fakeExecArgv, nodeOptions) => execa(
	'node',
	[...realExecArgv, 'nested-node.js', fakeExecArgv, nodeOptions, 'noop.js', foobarString],
	{...fullStdio, cwd: FIXTURES_DIR},
);

const testInspectRemoval = async (t, fakeExecArgv) => {
	const {stdout, stdio} = await spawnNestedExecaNode([], fakeExecArgv, '');
	t.is(stdout, foobarString);
	t.is(stdio[3], '');
};

test('node removes --inspect without a port from nodeOptions when defined by parent process', testInspectRemoval, '--inspect');
test('node removes --inspect with a port from nodeOptions when defined by parent process', testInspectRemoval, '--inspect=9222');
test('node removes --inspect-brk without a port from nodeOptions when defined by parent process', testInspectRemoval, '--inspect-brk');
test('node removes --inspect-brk with a port from nodeOptions when defined by parent process', testInspectRemoval, '--inspect-brk=9223');

test('node allows --inspect with a different port from nodeOptions even when defined by parent process', async t => {
	const {stdout, stdio} = await spawnNestedExecaNode(['--inspect=9225'], '', '--inspect=9224');
	t.is(stdout, foobarString);
	t.true(stdio[3].includes('Debugger listening'));
});

test('node forbids --inspect with the same port from nodeOptions when defined by parent process', async t => {
	const {stdout, stdio} = await spawnNestedExecaNode(['--inspect=9226'], '', '--inspect=9226');
	t.is(stdout, foobarString);
	t.true(stdio[3].includes('address already in use'));
});

test('node\'s forked script has a communication channel', async t => {
	const subprocess = execaNode('test/fixtures/send.js');
	await pEvent(subprocess, 'message');

	subprocess.send('ping');

	const message = await pEvent(subprocess, 'message');
	t.is(message, 'pong');

	subprocess.kill();

	const {signal} = await t.throwsAsync(subprocess);
	t.is(signal, 'SIGTERM');
});
