import {dirname, relative} from 'node:path';
import process, {version} from 'node:process';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import getNode from 'get-node';
import {execa, execaSync, execaNode} from '../../index.js';
import {FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';
import {identity, fullStdio} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';

process.chdir(FIXTURES_DIRECTORY);

const runWithNodeOption = (file, commandArguments, options) => Array.isArray(commandArguments)
	? execa(file, commandArguments, {...options, node: true})
	: execa(file, {...options, node: true});
const runWithNodeOptionSync = (file, commandArguments, options) => Array.isArray(commandArguments)
	? execaSync(file, commandArguments, {...options, node: true})
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

test('execaNode(options) succeeds', async t => {
	const {stdout} = await execaNode({stripFinalNewline: false})('noop.js', [foobarString]);
	t.is(stdout, `${foobarString}\n`);
});

test('execaNode`...` succeeds', async t => {
	const {stdout} = await execaNode`noop.js ${foobarString}`;
	t.is(stdout, foobarString);
});

test('execaNode().pipe(execaNode()) succeeds', async t => {
	const {stdout} = await execaNode('noop.js').pipe(execaNode('--version'));
	t.is(stdout, version);
});

test('execaNode().pipe(execa()) requires using "node"', async t => {
	await t.throwsAsync(execaNode('noop.js').pipe(execa('--version')));
});

test('execaNode().pipe(...) requires using "node"', async t => {
	await t.throwsAsync(execaNode('noop.js').pipe('--version'));
});

test('execaNode().pipe`...` requires using "node"', async t => {
	await t.throwsAsync(execaNode('noop.js').pipe`--version`);
});

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
test.serial('The "nodePath" option can be used - "node" option sync', testNodePath, runWithNodeOptionSync, identity);
test.serial('The "nodePath" option can be a file URL - "node" option sync', testNodePath, runWithNodeOptionSync, pathToFileURL);

const testNodePathDefault = async (t, execaMethod) => {
	const {stdout} = await execaMethod('--version');
	t.is(stdout, process.version);
};

test('The "nodePath" option defaults to the current Node.js binary - execaNode()', testNodePathDefault, execaNode);
test('The "nodePath" option defaults to the current Node.js binary - "node" option', testNodePathDefault, runWithNodeOption);
test('The "nodePath" option defaults to the current Node.js binary - "node" option sync', testNodePathDefault, runWithNodeOptionSync);

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

const nodePathArguments = ['-p', ['process.env.Path || process.env.PATH']];

const testSubprocessNodePath = async (t, execaMethod, mapPath) => {
	const nodePath = mapPath(await getNodePath());
	const {stdout} = await execaMethod(...nodePathArguments, {nodePath});
	t.true(stdout.includes(TEST_NODE_VERSION));
};

test.serial('The "nodePath" option impacts the subprocess - execaNode()', testSubprocessNodePath, execaNode, identity);
test.serial('The "nodePath" option impacts the subprocess - "node" option', testSubprocessNodePath, runWithNodeOption, identity);
test.serial('The "nodePath" option impacts the subprocess - "node" option sync', testSubprocessNodePath, runWithNodeOptionSync, identity);

const testSubprocessNodePathDefault = async (t, execaMethod) => {
	const {stdout} = await execaMethod(...nodePathArguments);
	t.true(stdout.includes(dirname(process.execPath)));
};

test('The "nodePath" option defaults to the current Node.js binary in the subprocess - execaNode()', testSubprocessNodePathDefault, execaNode);
test('The "nodePath" option defaults to the current Node.js binary in the subprocess - "node" option', testSubprocessNodePathDefault, runWithNodeOption);
test('The "nodePath" option defaults to the current Node.js binary in the subprocess - "node" option sync', testSubprocessNodePathDefault, runWithNodeOptionSync);

test.serial('The "nodePath" option requires "node: true" to impact the subprocess', async t => {
	const nodePath = await getNodePath();
	const {stdout} = await execa('node', nodePathArguments.flat(), {nodePath});
	t.false(stdout.includes(TEST_NODE_VERSION));
});

const testSubprocessNodePathCwd = async (t, execaMethod) => {
	const nodePath = await getNodePath();
	const cwd = dirname(dirname(nodePath));
	const relativeExecPath = relative(cwd, nodePath);
	const {stdout} = await execaMethod(...nodePathArguments, {nodePath: relativeExecPath, cwd});
	t.true(stdout.includes(TEST_NODE_VERSION));
};

test.serial('The "nodePath" option is relative to "cwd" when used in the subprocess - execaNode()', testSubprocessNodePathCwd, execaNode);
test.serial('The "nodePath" option is relative to "cwd" when used in the subprocess - "node" option', testSubprocessNodePathCwd, runWithNodeOption);
test.serial('The "nodePath" option is relative to "cwd" when used in the subprocess - "node" option sync', testSubprocessNodePathCwd, runWithNodeOptionSync);

const testCwdNodePath = async (t, execaMethod) => {
	const nodePath = await getNodePath();
	const cwd = dirname(dirname(nodePath));
	const relativeExecPath = relative(cwd, nodePath);
	const {stdout} = await execaMethod('--version', [], {nodePath: relativeExecPath, cwd});
	t.is(stdout, `v${TEST_NODE_VERSION}`);
};

test.serial('The "nodePath" option is relative to "cwd" - execaNode()', testCwdNodePath, execaNode);
test.serial('The "nodePath" option is relative to "cwd" - "node" option', testCwdNodePath, runWithNodeOption);
test.serial('The "nodePath" option is relative to "cwd" - "node" option sync', testCwdNodePath, runWithNodeOptionSync);

const testNodeOptions = async (t, execaMethod) => {
	const {stdout} = await execaMethod('empty.js', [], {nodeOptions: ['--version']});
	t.is(stdout, process.version);
};

test('The "nodeOptions" option can be used - execaNode()', testNodeOptions, execaNode);
test('The "nodeOptions" option can be used - "node" option', testNodeOptions, runWithNodeOption);
test('The "nodeOptions" option can be used - "node" option sync', testNodeOptions, runWithNodeOptionSync);

const spawnNestedExecaNode = (realExecArgv, fakeExecArgv, execaMethod, nodeOptions) => execa(
	'node',
	[...realExecArgv, 'nested-node.js', fakeExecArgv, execaMethod, nodeOptions, 'noop.js', foobarString],
	{...fullStdio, cwd: FIXTURES_DIRECTORY},
);

const testInspectRemoval = async (t, fakeExecArgv, execaMethod) => {
	const {stdout, stdio} = await spawnNestedExecaNode([], fakeExecArgv, execaMethod, '');
	t.is(stdout, foobarString);
	t.is(stdio[3], '');
};

test('The "nodeOptions" option removes --inspect without a port when defined by current process - execaNode()', testInspectRemoval, '--inspect', 'execaNode');
test('The "nodeOptions" option removes --inspect without a port when defined by current process - "node" option', testInspectRemoval, '--inspect', 'nodeOption');
test('The "nodeOptions" option removes --inspect with a port when defined by current process - execaNode()', testInspectRemoval, '--inspect=9222', 'execaNode');
test('The "nodeOptions" option removes --inspect with a port when defined by current process - "node" option', testInspectRemoval, '--inspect=9222', 'nodeOption');
test('The "nodeOptions" option removes --inspect-brk without a port when defined by current process - execaNode()', testInspectRemoval, '--inspect-brk', 'execaNode');
test('The "nodeOptions" option removes --inspect-brk without a port when defined by current process - "node" option', testInspectRemoval, '--inspect-brk', 'nodeOption');
test('The "nodeOptions" option removes --inspect-brk with a port when defined by current process - execaNode()', testInspectRemoval, '--inspect-brk=9223', 'execaNode');
test('The "nodeOptions" option removes --inspect-brk with a port when defined by current process - "node" option', testInspectRemoval, '--inspect-brk=9223', 'nodeOption');

const testInspectDifferentPort = async (t, execaMethod) => {
	const {stdout, stdio} = await spawnNestedExecaNode(['--inspect=9225'], '', execaMethod, '--inspect=9224');
	t.is(stdout, foobarString);
	t.true(stdio[3].includes('Debugger listening'));
};

test.serial('The "nodeOptions" option allows --inspect with a different port even when defined by current process - execaNode()', testInspectDifferentPort, 'execaNode');
test.serial('The "nodeOptions" option allows --inspect with a different port even when defined by current process - "node" option', testInspectDifferentPort, 'nodeOption');

const testInspectSamePort = async (t, execaMethod) => {
	const {stdout, stdio} = await spawnNestedExecaNode(['--inspect=9226'], '', execaMethod, '--inspect=9226');
	t.is(stdout, foobarString);
	t.true(stdio[3].includes('address already in use'));
};

test.serial('The "nodeOptions" option forbids --inspect with the same port when defined by current process - execaNode()', testInspectSamePort, 'execaNode');
test.serial('The "nodeOptions" option forbids --inspect with the same port when defined by current process - "node" option', testInspectSamePort, 'nodeOption');

const testIpc = async (t, execaMethod, options) => {
	const subprocess = execaMethod('ipc-echo.js', [], options);

	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);

	const {stdio} = await subprocess;
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

const NO_SEND_MESSAGE = 'sendMessage() can only be used';

test('No ipc channel is added by default', async t => {
	const {message, stdio} = await t.throwsAsync(execa('node', ['ipc-send.js']));
	t.true(message.includes(NO_SEND_MESSAGE));
	t.is(stdio.length, 3);
});

const testDisableIpc = async (t, execaMethod) => {
	const {failed, message, stdio} = await execaMethod('ipc-send.js', [], {ipc: false, reject: false});
	t.true(failed);
	t.true(message.includes(NO_SEND_MESSAGE));
	t.is(stdio.length, 3);
};

test('Can disable "ipc" - execaNode()', testDisableIpc, execaNode);
test('Can disable "ipc" - "node" option', testDisableIpc, runWithNodeOption);
test('Can disable "ipc" - "node" option sync', testDisableIpc, runWithNodeOptionSync);

const NO_IPC_MESSAGE = /The "ipc: true" option cannot be used/;

const testNoIpcSync = (t, node) => {
	t.throws(() => {
		execaSync('node', ['ipc-send.js'], {ipc: true, node});
	}, {message: NO_IPC_MESSAGE});
};

test('Cannot use "ipc: true" with execaSync()', testNoIpcSync, undefined);
test('Cannot use "ipc: true" with execaSync() - "node: false"', testNoIpcSync, false);

test('Cannot use "ipc: true" with execaSync() - "node: true"', t => {
	t.throws(() => {
		execaSync('ipc-send.js', {ipc: true, node: true});
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

test('The "serialization" option defaults to "advanced"', async t => {
	const subprocess = execa('node', ['ipc-echo.js'], {ipc: true});
	await subprocess.sendMessage([0n]);
	const message = await subprocess.getOneMessage();
	t.is(message[0], 0n);
	await subprocess;
});

test('The "serialization" option can be set to "json"', async t => {
	const subprocess = execa('node', ['ipc-echo.js'], {ipc: true, serialization: 'json'});
	await t.throwsAsync(subprocess.sendMessage([0n]), {message: /serialize a BigInt/});
	await t.throwsAsync(subprocess);
});
