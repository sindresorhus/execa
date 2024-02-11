import {dirname, relative} from 'node:path';
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

const runWithNodeOption = (file, args, options) => Array.isArray(args)
	? execa(file, args, {...options, node: true})
	: execa(file, {...options, node: true});
const runWithNodeOptionSync = (file, args, options) => Array.isArray(args)
	? execaSync(file, args, {...options, node: true})
	: execaSync(file, {...options, node: true});
const runWithIpc = (file, options) => execa('node', [file], {...options, ipc: true});

const testNodeSuccess = async (t, execaMethod) => {
	const {exitCode, stdout} = await execaMethod('noop.js', [foobarString]);
	t.is(exitCode, 0);
	t.is(stdout, foobarString);
};

test('execaNode() succeeds', testNodeSuccess, execaNode);
test('The "node" option succeeds', testNodeSuccess, runWithNodeOption);
test('The "node" option succeeds - sync', testNodeSuccess, runWithNodeOptionSync);

test('execaNode() cannot set the "node" option to false', t => {
	t.throws(() => {
		execaNode('empty.js', {node: false});
	}, {message: /The "node" option cannot be false/});
});

const testDoubleNode = (t, nodePath, execaMethod) => {
	t.throws(() => {
		execaMethod(nodePath, ['noop.js']);
	}, {message: /does not need to be "node"/});
};

test('Cannot use "node" as binary - execaNode()', testDoubleNode, 'node', execaNode);
test('Cannot use "node" as binary - "node" option', testDoubleNode, 'node', runWithNodeOption);
test('Cannot use "node" as binary - "node" option sync', testDoubleNode, 'node', runWithNodeOptionSync);
test('Cannot use path to "node" as binary - execaNode()', testDoubleNode, process.execPath, execaNode);
test('Cannot use path to "node" as binary - "node" option', testDoubleNode, process.execPath, runWithNodeOption);
test('Cannot use path to "node" as binary - "node" option sync', testDoubleNode, process.execPath, runWithNodeOptionSync);

const getNodePath = async () => {
	const {path} = await getNode(TEST_NODE_VERSION);
	return path;
};

const TEST_NODE_VERSION = '16.0.0';

const testNodePath = async (t, execaMethod, mapPath) => {
	const nodePath = mapPath(await getNodePath());
	const {stdout} = await execaMethod('--version', [], {nodePath});
	t.is(stdout, `v${TEST_NODE_VERSION}`);
};

test.serial('The "nodePath" option can be used - execaNode()', testNodePath, execaNode, identity);
test.serial('The "nodePath" option can be a file URL - execaNode()', testNodePath, execaNode, pathToFileURL);
test.serial('The "nodePath" option can be used - "node" option', testNodePath, runWithNodeOption, identity);
test.serial('The "nodePath" option can be a file URL - "node" option', testNodePath, runWithNodeOption, pathToFileURL);

const testNodePathDefault = async (t, execaMethod) => {
	const {stdout} = await execaMethod('--version');
	t.is(stdout, process.version);
};

test('The "nodePath" option defaults to the current Node.js binary - execaNode()', testNodePathDefault, execaNode);
test('The "nodePath" option defaults to the current Node.js binary - "node" option', testNodePathDefault, runWithNodeOption);

const testNodePathInvalid = (t, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', [], {nodePath: true});
	}, {message: /The "nodePath" option must be a string or a file URL/});
};

test('The "nodePath" option must be a string or URL - execaNode()', testNodePathInvalid, execaNode);
test('The "nodePath" option must be a string or URL - "node" option', testNodePathInvalid, runWithNodeOption);
test('The "nodePath" option must be a string or URL - "node" option sync', testNodePathInvalid, runWithNodeOptionSync);

const testFormerNodePath = (t, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', [], {execPath: process.execPath});
	}, {message: /The "execPath" option has been removed/});
};

test('The "execPath" option cannot be used - execaNode()', testFormerNodePath, execaNode);
test('The "execPath" option cannot be used - "node" option', testFormerNodePath, runWithNodeOption);
test('The "execPath" option cannot be used - "node" option sync', testFormerNodePath, runWithNodeOptionSync);

const nodePathArguments = ['node', ['-p', 'process.env.Path || process.env.PATH']];

const testChildNodePath = async (t, mapPath) => {
	const nodePath = mapPath(await getNodePath());
	const {stdout} = await execa(...nodePathArguments, {preferLocal: true, nodePath});
	t.true(stdout.includes(TEST_NODE_VERSION));
};

test.serial('The "nodePath" option impacts the child process', testChildNodePath, identity);
test.serial('The "nodePath" option can be a file URL', testChildNodePath, pathToFileURL);

test('The "nodePath" option defaults to the current Node.js binary in the child process', async t => {
	const {stdout} = await execa(...nodePathArguments, {preferLocal: true});
	t.true(stdout.includes(dirname(process.execPath)));
});

test.serial('The "nodePath" option requires "preferLocal: true" to impact the child process', async t => {
	const nodePath = await getNodePath();
	const {stdout} = await execa(...nodePathArguments, {nodePath});
	t.false(stdout.includes(TEST_NODE_VERSION));
});

test.serial('The "nodePath" option is relative to "cwd" when used in the child process', async t => {
	const nodePath = await getNodePath();
	const cwd = dirname(dirname(nodePath));
	const relativeExecPath = relative(cwd, nodePath);
	const {stdout} = await execa(...nodePathArguments, {preferLocal: true, nodePath: relativeExecPath, cwd});
	t.true(stdout.includes(TEST_NODE_VERSION));
});

const testCwdNodePath = async (t, execaMethod) => {
	const nodePath = await getNodePath();
	const cwd = dirname(dirname(nodePath));
	const relativeExecPath = relative(cwd, nodePath);
	const {stdout} = await execaMethod('--version', [], {nodePath: relativeExecPath, cwd});
	t.is(stdout, `v${TEST_NODE_VERSION}`);
};

test.serial('The "nodePath" option is relative to "cwd" - execaNode()', testCwdNodePath, execaNode);
test.serial('The "nodePath" option is relative to "cwd" - "node" option', testCwdNodePath, runWithNodeOption);

const testNodeOptions = async (t, execaMethod) => {
	const {stdout} = await execaMethod('empty.js', [], {nodeOptions: ['--version']});
	t.is(stdout, process.version);
};

test('The "nodeOptions" option can be used - execaNode()', testNodeOptions, execaNode);
test('The "nodeOptions" option can be used - "node" option', testNodeOptions, runWithNodeOption);

const spawnNestedExecaNode = (realExecArgv, fakeExecArgv, execaMethod, nodeOptions) => execa(
	'node',
	[...realExecArgv, 'nested-node.js', fakeExecArgv, execaMethod, nodeOptions, 'noop.js', foobarString],
	{...fullStdio, cwd: FIXTURES_DIR},
);

const testInspectRemoval = async (t, fakeExecArgv, execaMethod) => {
	const {stdout, stdio} = await spawnNestedExecaNode([], fakeExecArgv, execaMethod, '');
	t.is(stdout, foobarString);
	t.is(stdio[3], '');
};

test('The "nodeOptions" option removes --inspect without a port when defined by parent process - execaNode()', testInspectRemoval, '--inspect', 'execaNode');
test('The "nodeOptions" option removes --inspect without a port when defined by parent process - "node" option', testInspectRemoval, '--inspect', 'nodeOption');
test('The "nodeOptions" option removes --inspect with a port when defined by parent process - execaNode()', testInspectRemoval, '--inspect=9222', 'execaNode');
test('The "nodeOptions" option removes --inspect with a port when defined by parent process - "node" option', testInspectRemoval, '--inspect=9222', 'nodeOption');
test('The "nodeOptions" option removes --inspect-brk without a port when defined by parent process - execaNode()', testInspectRemoval, '--inspect-brk', 'execaNode');
test('The "nodeOptions" option removes --inspect-brk without a port when defined by parent process - "node" option', testInspectRemoval, '--inspect-brk', 'nodeOption');
test('The "nodeOptions" option removes --inspect-brk with a port when defined by parent process - execaNode()', testInspectRemoval, '--inspect-brk=9223', 'execaNode');
test('The "nodeOptions" option removes --inspect-brk with a port when defined by parent process - "node" option', testInspectRemoval, '--inspect-brk=9223', 'nodeOption');

const testInspectDifferentPort = async (t, execaMethod) => {
	const {stdout, stdio} = await spawnNestedExecaNode(['--inspect=9225'], '', execaMethod, '--inspect=9224');
	t.is(stdout, foobarString);
	t.true(stdio[3].includes('Debugger listening'));
};

test.serial('The "nodeOptions" option allows --inspect with a different port even when defined by parent process - execaNode()', testInspectDifferentPort, 'execaNode');
test.serial('The "nodeOptions" option allows --inspect with a different port even when defined by parent process - "node" option', testInspectDifferentPort, 'nodeOption');

const testInspectSamePort = async (t, execaMethod) => {
	const {stdout, stdio} = await spawnNestedExecaNode(['--inspect=9226'], '', execaMethod, '--inspect=9226');
	t.is(stdout, foobarString);
	t.true(stdio[3].includes('address already in use'));
};

test.serial('The "nodeOptions" option forbids --inspect with the same port when defined by parent process - execaNode()', testInspectSamePort, 'execaNode');
test.serial('The "nodeOptions" option forbids --inspect with the same port when defined by parent process - "node" option', testInspectSamePort, 'nodeOption');

const testIpc = async (t, execaMethod, options) => {
	const subprocess = execaMethod('send.js', [], options);
	await pEvent(subprocess, 'message');
	subprocess.send(foobarString);
	const {stdout, stdio} = await subprocess;
	t.is(stdout, foobarString);
	t.is(stdio.length, 4);
	t.is(stdio[3], undefined);
};

test('execaNode() adds an ipc channel', testIpc, execaNode, {});
test('The "node" option adds an ipc channel', testIpc, runWithNodeOption, {});
test('The "ipc" option adds an ipc channel', testIpc, runWithIpc, {});
test('The "ipc" option works with "stdio: \'pipe\'"', testIpc, runWithIpc, {stdio: 'pipe'});
test('The "ipc" option works with "stdio: [\'pipe\', \'pipe\', \'pipe\']"', testIpc, runWithIpc, {stdio: ['pipe', 'pipe', 'pipe']});
test('The "ipc" option works with "stdio: [\'pipe\', \'pipe\', \'pipe\', \'ipc\']"', testIpc, runWithIpc, {stdio: ['pipe', 'pipe', 'pipe', 'ipc']});
test('The "ipc" option works with "stdout: \'pipe\'"', testIpc, runWithIpc, {stdout: 'pipe'});

test('No ipc channel is added by default', async t => {
	const {stdio} = await t.throwsAsync(execa('node', ['send.js']), {message: /process.send is not a function/});
	t.is(stdio.length, 3);
});

const testDisableIpc = async (t, execaMethod) => {
	const {failed, message, stdio} = await execaMethod('send.js', [], {ipc: false, reject: false});
	t.true(failed);
	t.true(message.includes('process.send is not a function'));
	t.is(stdio.length, 3);
};

test('Can disable "ipc" - execaNode()', testDisableIpc, execaNode);
test('Can disable "ipc" - "node" option', testDisableIpc, runWithNodeOption);
test('Can disable "ipc" - "node" option sync', testDisableIpc, runWithNodeOptionSync);

const NO_IPC_MESSAGE = /The "ipc: true" option cannot be used/;

const testNoIpcSync = (t, node) => {
	t.throws(() => {
		execaSync('node', ['send.js'], {ipc: true, node});
	}, {message: NO_IPC_MESSAGE});
};

test('Cannot use "ipc: true" with execaSync()', testNoIpcSync, undefined);
test('Cannot use "ipc: true" with execaSync() - "node: false"', testNoIpcSync, false);

test('Cannot use "ipc: true" with execaSync() - "node: true"', t => {
	t.throws(() => {
		execaSync('send.js', {ipc: true, node: true});
	}, {message: NO_IPC_MESSAGE});
});

const testNoShell = async (t, execaMethod) => {
	const {failed, message} = await execaMethod('node --version', [], {shell: true, reject: false});
	t.true(failed);
	t.true(message.includes('MODULE_NOT_FOUND'));
};

test('Cannot use "shell: true" - execaNode()', testNoShell, execaNode);
test('Cannot use "shell: true" - "node" option', testNoShell, runWithNodeOption);
test('Cannot use "shell: true" - "node" option sync', testNoShell, runWithNodeOptionSync);
