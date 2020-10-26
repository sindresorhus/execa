import path from 'path';
import test from 'ava';
import pEvent from 'p-event';
import execa from '..';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

async function inspectMacro(t, input) {
	const originalArgv = process.execArgv;
	process.execArgv = [input, '-e'];
	try {
		const subprocess = execa.node('console.log("foo")', {
			reject: false
		});

		const {stdout, stderr} = await subprocess;

		t.is(stdout, 'foo');
		t.is(stderr, '');
	} finally {
		process.execArgv = originalArgv;
	}
}

test('node()', async t => {
	const {exitCode} = await execa.node('test/fixtures/noop');
	t.is(exitCode, 0);
});

test('node pipe stdout', async t => {
	const {stdout} = await execa.node('test/fixtures/noop', ['foo'], {
		stdout: 'pipe'
	});

	t.is(stdout, 'foo');
});

test('node correctly use nodePath', async t => {
	const {stdout} = await execa.node(process.platform === 'win32' ? 'hello.cmd' : 'hello.sh', {
		stdout: 'pipe',
		nodePath: process.platform === 'win32' ? 'cmd.exe' : 'bash',
		nodeOptions: process.platform === 'win32' ? ['/c'] : []
	});

	t.is(stdout, 'Hello World');
});

test('node pass on nodeOptions', async t => {
	const {stdout} = await execa.node('console.log("foo")', {
		stdout: 'pipe',
		nodeOptions: ['-e']
	});

	t.is(stdout, 'foo');
});

test.serial(
	'node removes --inspect from nodeOptions when defined by parent process',
	inspectMacro,
	'--inspect'
);

test.serial(
	'node removes --inspect=9222 from nodeOptions when defined by parent process',
	inspectMacro,
	'--inspect=9222'
);

test.serial(
	'node removes --inspect-brk from nodeOptions when defined by parent process',
	inspectMacro,
	'--inspect-brk'
);

test.serial(
	'node removes --inspect-brk=9222 from nodeOptions when defined by parent process',
	inspectMacro,
	'--inspect-brk=9222'
);

test.serial(
	'node should not remove --inspect when passed through nodeOptions',
	async t => {
		const {stdout, stderr} = await execa.node('console.log("foo")', {
			reject: false,
			nodeOptions: ['--inspect', '-e']
		});

		t.is(stdout, 'foo');
		t.true(stderr.includes('Debugger listening'));
	}
);

test('node\'s forked script has a communication channel', async t => {
	const subprocess = execa.node('test/fixtures/send');
	subprocess.send('ping');

	const message = await pEvent(subprocess, 'message');
	t.is(message, 'pong');
});
