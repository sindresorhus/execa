import path from 'path';
import test from 'ava';
import isRunning from 'is-running';
import getNode from 'get-node';
import execa from '..';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;
process.env.FOO = 'foo';

const ENOENT_REGEXP = process.platform === 'win32' ? /failed with exit code 1/ : /spawn.* ENOENT/;

test('execa()', async t => {
	const {stdout} = await execa('noop', ['foo']);
	t.is(stdout, 'foo');
});

if (process.platform === 'win32') {
	test('execa() - cmd file', async t => {
		const {stdout} = await execa('hello.cmd');
		t.is(stdout, 'Hello World');
	});

	test('execa() - run cmd command', async t => {
		const {stdout} = await execa('cmd', ['/c', 'hello.cmd']);
		t.is(stdout, 'Hello World');
	});
}

test('execa.sync()', t => {
	const {stdout} = execa.sync('noop', ['foo']);
	t.is(stdout, 'foo');
});

test('execa.sync() throws error if written to stderr', t => {
	t.throws(() => {
		execa.sync('foo');
	}, ENOENT_REGEXP);
});

test('skip throwing when using reject option', async t => {
	const {exitCode} = await execa('fail', {reject: false});
	t.is(exitCode, 2);
});

test('skip throwing when using reject option in sync mode', t => {
	const {exitCode} = execa.sync('fail', {reject: false});
	t.is(exitCode, 2);
});

test('stripFinalNewline: true', async t => {
	const {stdout} = await execa('noop', ['foo']);
	t.is(stdout, 'foo');
});

test('stripFinalNewline: false', async t => {
	const {stdout} = await execa('noop', ['foo'], {stripFinalNewline: false});
	t.is(stdout, 'foo\n');
});

test('stripFinalNewline on failure', async t => {
	const {stderr} = await t.throwsAsync(execa('noop-throw', ['foo'], {stripFinalNewline: true}));
	t.is(stderr, 'foo');
});

test('stripFinalNewline in sync mode', t => {
	const {stdout} = execa.sync('noop', ['foo'], {stripFinalNewline: true});
	t.is(stdout, 'foo');
});

test('stripFinalNewline in sync mode on failure', t => {
	const {stderr} = t.throws(() => {
		execa.sync('noop-throw', ['foo'], {stripFinalNewline: true});
	});
	t.is(stderr, 'foo');
});

test('preferLocal: true', async t => {
	await t.notThrowsAsync(execa('ava', ['--version'], {preferLocal: true, env: {Path: '', PATH: ''}}));
});

test('preferLocal: false', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {preferLocal: false, env: {Path: '', PATH: ''}}), ENOENT_REGEXP);
});

test('preferLocal: undefined', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {env: {Path: '', PATH: ''}}), ENOENT_REGEXP);
});

test('localDir option', async t => {
	const command = process.platform === 'win32' ? 'echo %PATH%' : 'echo $PATH';
	const {stdout} = await execa(command, {shell: true, preferLocal: true, localDir: '/test'});
	const envPaths = stdout.split(path.delimiter);
	t.true(envPaths.some(envPath => envPath.endsWith('.bin')));
});

test('execPath option', async t => {
	const {path: execPath} = await getNode('6.0.0');
	const {stdout} = await execa('node', ['-p', 'process.env.Path || process.env.PATH'], {preferLocal: true, execPath});
	t.true(stdout.includes('6.0.0'));
});

test('stdin errors are handled', async t => {
	const subprocess = execa('noop');
	subprocess.stdin.emit('error', new Error('test'));
	await t.throwsAsync(subprocess, /test/);
});

test('child process errors are handled', async t => {
	const subprocess = execa('noop');
	subprocess.emit('error', new Error('test'));
	await t.throwsAsync(subprocess, /test/);
});

test('child process errors rejects promise right away', async t => {
	const subprocess = execa('noop');
	subprocess.emit('error', new Error('test'));
	await t.throwsAsync(subprocess, /test/);
});

test('execa() returns a promise with pid', t => {
	const {pid} = execa('noop', ['foo']);
	t.is(typeof pid, 'number');
});

test('child_process.spawn() propagated errors have correct shape', t => {
	const subprocess = execa('noop', {uid: -1});
	t.notThrows(() => {
		subprocess.catch(() => {});
		subprocess.unref();
		subprocess.on('error', () => {});
	});
});

test('child_process.spawn() errors are propagated', async t => {
	const {failed} = await t.throwsAsync(execa('noop', {uid: -1}));
	t.true(failed);
});

test('child_process.spawnSync() errors are propagated with a correct shape', t => {
	const {failed} = t.throws(() => {
		execa.sync('noop', {timeout: -1});
	});
	t.true(failed);
});

test('do not try to consume streams twice', async t => {
	const subprocess = execa('noop', ['foo']);
	t.is((await subprocess).stdout, 'foo');
	t.is((await subprocess).stdout, 'foo');
});

test('use relative path with \'..\' chars', async t => {
	const pathViaParentDir = path.join('..', path.basename(path.dirname(__dirname)), 'test', 'fixtures', 'noop');
	const {stdout} = await execa(pathViaParentDir, ['foo']);
	t.is(stdout, 'foo');
});

if (process.platform !== 'win32') {
	test('execa() rejects if running non-executable', async t => {
		const subprocess = execa('non-executable');
		await t.throwsAsync(subprocess);
	});

	test('execa() rejects with correct error and doesn\'t throw if running non-executable with input', async t => {
		// On Node <12.6.0, `EACCESS` is emitted on `childProcess`.
		// On Node >=12.6.0, `EPIPE` is emitted on `childProcess.stdin`.
		await t.throwsAsync(execa('non-executable', {input: 'Hey!'}), /EACCES|EPIPE/);
	});
}

if (process.platform !== 'win32') {
	test('write to fast-exit process', async t => {
		// Try-catch here is necessary, because this test is not 100% accurate
		// Sometimes process can manage to accept input before exiting
		try {
			await execa(`fast-exit-${process.platform}`, [], {input: 'data'});
			t.pass();
		} catch (error) {
			t.is(error.code, 'EPIPE');
		}
	});
}

test('use environment variables by default', async t => {
	const {stdout} = await execa('environment');
	t.deepEqual(stdout.split('\n'), ['foo', 'undefined']);
});

test('extend environment variables by default', async t => {
	const {stdout} = await execa('environment', [], {env: {BAR: 'bar'}});
	t.deepEqual(stdout.split('\n'), ['foo', 'bar']);
});

test('do not extend environment with `extendEnv: false`', async t => {
	const {stdout} = await execa('environment', [], {env: {BAR: 'bar', PATH: process.env.PATH}, extendEnv: false});
	t.deepEqual(stdout.split('\n'), ['undefined', 'bar']);
});

test('can use `options.shell: true`', async t => {
	const {stdout} = await execa('node test/fixtures/noop foo', {shell: true});
	t.is(stdout, 'foo');
});

test('can use `options.shell: string`', async t => {
	const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
	const {stdout} = await execa('node test/fixtures/noop foo', {shell});
	t.is(stdout, 'foo');
});

test('use extend environment with `extendEnv: true` and `shell: true`', async t => {
	process.env.TEST = 'test';
	const command = process.platform === 'win32' ? 'echo %TEST%' : 'echo $TEST';
	const {stdout} = await execa(command, {shell: true, env: {}, extendEnv: true});
	t.is(stdout, 'test');
	delete process.env.TEST;
});

test('detach child process', async t => {
	const {stdout} = await execa('detach');
	const pid = Number(stdout);
	t.true(Number.isInteger(pid));
	t.true(isRunning(pid));

	process.kill(pid, 'SIGKILL');
});
