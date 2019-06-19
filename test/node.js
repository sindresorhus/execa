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

test('node\'s forked script has a communication channel', async t => {
	const subprocess = execa.node('test/fixtures/send');
	subprocess.send('ping');

	const message = await pEvent(subprocess, 'message');
	t.is(message, 'pong');
});
