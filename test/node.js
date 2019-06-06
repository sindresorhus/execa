import test from 'ava';
import pEvent from 'p-event';
import path from 'path';
import execa from '..';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

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

test('node correctly use execPath', async t => {
	const {stdout} = await execa.node(process.platform === 'win32' ? 'hello.cmd' : 'hello.sh', {
		stdout: 'pipe',
		execPath: process.platform === 'win32' ? 'cmd.exe' : 'bash',
		execArgv: process.platform === 'win32' ? ['/c'] : []
	});

	t.is(stdout, 'Hello World');
});

test('node pass on execArgv', async t => {
	const {stdout} = await execa.node('console.log("foo")', {
		stdout: 'pipe',
		execArgv: ['-e']
	});

	t.is(stdout, 'foo');
});

test('node\'s forked script has a communication channel', async t => {
	const subprocess = execa.node('test/fixtures/send.js');
	subprocess.send('ping');

	const message = await pEvent(subprocess, 'message');
	t.is(message, 'pong');
});
