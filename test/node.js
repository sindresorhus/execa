import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import test from 'ava';
import {pEvent} from 'p-event';
import {execaNode} from '../index.js';

process.env.PATH = fileURLToPath(new URL('fixtures', import.meta.url)) + path.delimiter + process.env.PATH;

async function inspectMacro(t, input) {
	const originalArgv = process.execArgv;
	process.execArgv = [input, '-e'];
	try {
		const subprocess = execaNode('console.log("foo")', {
			reject: false,
		});

		const {stdout, stderr} = await subprocess;

		t.is(stdout, 'foo');
		t.is(stderr, '');
	} finally {
		process.execArgv = originalArgv;
	}
}

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

test('node correctly use nodePath', async t => {
	const {stdout} = await execaNode(process.platform === 'win32' ? 'hello.cmd' : 'hello.sh', {
		stdout: 'pipe',
		nodePath: process.platform === 'win32' ? 'cmd.exe' : 'bash',
		nodeOptions: process.platform === 'win32' ? ['/c'] : [],
	});

	t.is(stdout, 'Hello World');
});

test('node pass on nodeOptions', async t => {
	const {stdout} = await execaNode('console.log("foo")', {
		stdout: 'pipe',
		nodeOptions: ['-e'],
	});

	t.is(stdout, 'foo');
});

test.serial(
	'node removes --inspect from nodeOptions when defined by parent process',
	inspectMacro,
	'--inspect',
);

test.serial(
	'node removes --inspect=9222 from nodeOptions when defined by parent process',
	inspectMacro,
	'--inspect=9222',
);

test.serial(
	'node removes --inspect-brk from nodeOptions when defined by parent process',
	inspectMacro,
	'--inspect-brk',
);

test.serial(
	'node removes --inspect-brk=9222 from nodeOptions when defined by parent process',
	inspectMacro,
	'--inspect-brk=9222',
);

test.serial(
	'node should not remove --inspect when passed through nodeOptions',
	async t => {
		const {stdout, stderr} = await execaNode('console.log("foo")', {
			reject: false,
			nodeOptions: ['--inspect', '-e'],
		});

		t.is(stdout, 'foo');
		t.true(stderr.includes('Debugger listening'));
	},
);

test('node\'s forked script has a communication channel', async t => {
	const subprocess = execaNode('test/fixtures/send.js');
	await pEvent(subprocess, 'message');

	subprocess.send('ping');

	const message = await pEvent(subprocess, 'message');
	t.is(message, 'pong');
});
