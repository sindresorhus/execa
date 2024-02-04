import {dirname} from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import getNode from 'get-node';
import {pEvent} from 'p-event';
import {execa, execaSync, execaNode} from '../index.js';
import {FIXTURES_DIR} from './helpers/fixtures-dir.js';
import {identity, fullStdio} from './helpers/stdio.js';
import {foobarString} from './helpers/input.js';

process.chdir(FIXTURES_DIR);

test('execaNode() succeeds', async t => {
	const {exitCode} = await execaNode('noop.js');
	t.is(exitCode, 0);
});

test('execaNode() returns stdout', async t => {
	const {stdout} = await execaNode('noop.js', ['foo']);
	t.is(stdout, 'foo');
});

const getNodePath = async () => {
	const {path} = await getNode(TEST_NODE_VERSION);
	return path;
};

const TEST_NODE_VERSION = '16.0.0';

const testNodePath = async (t, mapPath) => {
	const nodePath = mapPath(await getNodePath());
	const {stdout} = await execaNode('--version', {nodePath});
	t.is(stdout, `v${TEST_NODE_VERSION}`);
};

test.serial('The "nodePath" option can be used', testNodePath, identity);
test.serial('The "nodePath" option can be a file URL', testNodePath, pathToFileURL);

test('The "nodePath" option defaults to the current Node.js binary', async t => {
	const {stdout} = await execaNode('--version');
	t.is(stdout, process.version);
});

const nodePathArguments = ['node', ['-p', 'process.env.Path || process.env.PATH']];

const testExecPath = async (t, mapPath) => {
	const execPath = mapPath(await getNodePath());
	const {stdout} = await execa(...nodePathArguments, {preferLocal: true, execPath});
	t.true(stdout.includes(TEST_NODE_VERSION));
};

test.serial('The "execPath" option can be used', testExecPath, identity);
test.serial('The "execPath" option can be a file URL', testExecPath, pathToFileURL);

test('The "execPath" option defaults to the current Node.js binary', async t => {
	const {stdout} = await execa(...nodePathArguments, {preferLocal: true});
	t.true(stdout.includes(dirname(process.execPath)));
});

test.serial('The "execPath" option requires "preferLocal: true"', async t => {
	const execPath = await getNodePath();
	const {stdout} = await execa(...nodePathArguments, {execPath});
	t.false(stdout.includes(TEST_NODE_VERSION));
});

test('The "nodeOptions" option can be used', async t => {
	const {stdout} = await execaNode('empty.js', {nodeOptions: ['--version']});
	t.is(stdout, process.version);
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

test('The "nodeOptions" option removes --inspect without a port when defined by parent process', testInspectRemoval, '--inspect');
test('The "nodeOptions" option removes --inspect with a port when defined by parent process', testInspectRemoval, '--inspect=9222');
test('The "nodeOptions" option removes --inspect-brk without a port when defined by parent process', testInspectRemoval, '--inspect-brk');
test('The "nodeOptions" option removes --inspect-brk with a port when defined by parent process', testInspectRemoval, '--inspect-brk=9223');

test('The "nodeOptions" option allows --inspect with a different port even when defined by parent process', async t => {
	const {stdout, stdio} = await spawnNestedExecaNode(['--inspect=9225'], '', '--inspect=9224');
	t.is(stdout, foobarString);
	t.true(stdio[3].includes('Debugger listening'));
});

test('The "nodeOptions" option forbids --inspect with the same port when defined by parent process', async t => {
	const {stdout, stdio} = await spawnNestedExecaNode(['--inspect=9226'], '', '--inspect=9226');
	t.is(stdout, foobarString);
	t.true(stdio[3].includes('address already in use'));
});

const runWithIpc = (file, options) => execa('node', [file], {...options, ipc: true});

const testIpc = async (t, execaMethod, options) => {
	const subprocess = execaMethod('send.js', options);
	await pEvent(subprocess, 'message');
	subprocess.send(foobarString);
	const {stdout, stdio} = await subprocess;
	t.is(stdout, foobarString);
	t.is(stdio.length, 4);
	t.is(stdio[3], undefined);
};

test('execaNode() adds an ipc channel', testIpc, execaNode, {});
test('The "ipc" option adds an ipc channel', testIpc, runWithIpc, {});
test('The "ipc" option works with "stdio: \'pipe\'"', testIpc, runWithIpc, {stdio: 'pipe'});
test('The "ipc" option works with "stdio: [\'pipe\', \'pipe\', \'pipe\']"', testIpc, runWithIpc, {stdio: ['pipe', 'pipe', 'pipe']});
test('The "ipc" option works with "stdio: [\'pipe\', \'pipe\', \'pipe\', \'ipc\']"', testIpc, runWithIpc, {stdio: ['pipe', 'pipe', 'pipe', 'ipc']});
test('The "ipc" option works with "stdout: \'pipe\'"', testIpc, runWithIpc, {stdout: 'pipe'});

test('No ipc channel is added by default', async t => {
	const {stdio} = await t.throwsAsync(execa('node', ['send.js']), {message: /process.send is not a function/});
	t.is(stdio.length, 3);
});

test('Can disable "ipc" with execaNode', async t => {
	const {stdio} = await t.throwsAsync(execaNode('send.js', {ipc: false}), {message: /process.send is not a function/});
	t.is(stdio.length, 3);
});

test('Cannot use the "ipc" option with execaSync()', t => {
	t.throws(() => {
		execaSync('node', ['send.js'], {ipc: true});
	}, {message: /The "ipc: true" option cannot be used/});
});
