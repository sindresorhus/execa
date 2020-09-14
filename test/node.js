import path from 'path';
import test from 'ava';
import pEvent from 'p-event';
import execa from '..';

process.env.PATH =
	path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

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
	const {stdout} = await execa.node(
		process.platform === 'win32' ? 'hello.cmd' : 'hello.sh',
		{
			stdout: 'pipe',
			nodePath: process.platform === 'win32' ? 'cmd.exe' : 'bash',
			nodeOptions: process.platform === 'win32' ? ['/c'] : []
		}
	);

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
		const originalArgv = process.execArgv;
		process.execArgv = ['--inspect', '-e'];
		const {stdout, stderr} = await execa.node('console.log("foo")', {
			stdout: 'pipe'
		});
		process.execArgv = originalArgv;

		t.is(stdout, 'foo');
		t.is(stderr, '');
	}
);

test.serial(
	'node removes --inspect=9222 from nodeOptions when defined by parent process',
	async t => {
		const originalArgv = process.execArgv;
		process.execArgv = ['--inspect=9222', '-e'];
		const {stdout, stderr} = await execa.node('console.log("foo")', {
			stdout: 'pipe'
		});
		process.execArgv = originalArgv;

		t.is(stdout, 'foo');
		t.is(stderr, '');
	}
);

test.serial(
	'node removes --inspect-brk from nodeOptions when defined by parent process',
	async t => {
		const originalArgv = process.execArgv;
		process.execArgv = ['--inspect-brk', '-e'];
		const childProc = execa.node('console.log("foo")', {
			stdout: 'pipe'
		});
		process.execArgv = originalArgv;

		setTimeout(() => {
			childProc.cancel();
		}, 1000);

		const {stdout, stderr} = await childProc.catch(error => error);

		t.is(stdout, 'foo');
		t.is(stderr, '');
	}
);

test.serial(
	'node removes --inspect-brk=9222 from nodeOptions when defined by parent process',
	async t => {
		const originalArgv = process.execArgv;
		process.execArgv = ['--inspect-brk=9222', '-e'];
		const childProc = execa.node('console.log("foo")', {
			stdout: 'pipe'
		});
		process.execArgv = originalArgv;

		setTimeout(() => {
			childProc.cancel();
		}, 1000);

		const {stdout, stderr} = await childProc.catch(error => error);

		t.is(stdout, 'foo');
		t.is(stderr, '');
	}
);

test.serial(
	'node should not remove --inspect when passed through nodeOptions',
	async t => {
		const {stdout, stderr} = await execa.node('console.log("foo")', {
			stdout: 'pipe',
			nodeOptions: ['--inspect', '-e']
		});

		t.is(stdout, 'foo');
		t.regex(
			stderr,
			/^Debugger listening on ws:\/\/127.0.0.1:9229\/.*[\r\n]+For help, see: https:\/\/nodejs.org\/en\/docs\/inspector$/
		);
	}
);

test('node\'s forked script has a communication channel', async t => {
	const subprocess = execa.node('test/fixtures/send');
	subprocess.send('ping');

	const message = await pEvent(subprocess, 'message');
	t.is(message, 'pong');
});
