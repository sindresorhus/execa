import path from 'path';
import test from 'ava';
import pEvent from 'p-event';
import execa from '..';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

test.beforeEach(t => {
	t.context.originalArgv = process.execArgv;
});

test.afterEach(t => {
	process.execArgv = t.context.originalArgv;
});
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
	async t => {
		process.execArgv = ['--inspect', '-e'];
		const {stdout, stderr} = await execa.node('console.log("foo")', {
			reject: false
		});

		t.is(stdout, 'foo');
		t.is(stderr, '');
	}
);

test.serial(
	'node removes --inspect=9222 from nodeOptions when defined by parent process',
	async t => {
		process.execArgv = ['--inspect=9222', '-e'];
		const {stdout, stderr} = await execa.node('console.log("foo")', {
			reject: false
		});

		t.is(stdout, 'foo');
		t.is(stderr, '');
	}
);

test.serial(
	'node removes --inspect-brk from nodeOptions when defined by parent process',
	async t => {
		process.execArgv = ['--inspect-brk', '-e'];
		const subprocess = execa.node('console.log("foo")', {
			reject: false
		});

		const {stdout, stderr} = await subprocess.catch(error => error);

		t.is(stdout, 'foo');
		t.is(stderr, '');
	}
);

test.serial(
	'node removes --inspect-brk=9222 from nodeOptions when defined by parent process',
	async t => {
		process.execArgv = ['--inspect-brk=9222', '-e'];
		const subprocess = execa.node('console.log("foo")', {
			reject: false
		});

		const {stdout, stderr} = await subprocess.catch(error => error);

		t.is(stdout, 'foo');
		t.is(stderr, '');
	}
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
