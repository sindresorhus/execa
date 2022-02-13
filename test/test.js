import path from 'node:path';
import process from 'node:process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import test from 'ava';
import isRunning from 'is-running';
import getNode from 'get-node';
import semver from 'semver';
import {execa, execaSync} from '../index.js';

process.env.PATH = fileURLToPath(new URL('fixtures', import.meta.url)) + path.delimiter + process.env.PATH;
process.env.FOO = 'foo';

const ENOENT_REGEXP = process.platform === 'win32' ? /failed with exit code 1/ : /spawn.* ENOENT/;

test('execa()', async t => {
	const {stdout} = await execa('noop.js', ['foo']);
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

test('execaSync()', t => {
	const {stdout} = execaSync('noop.js', ['foo']);
	t.is(stdout, 'foo');
});

test('execaSync() throws error if written to stderr', t => {
	t.throws(() => {
		execaSync('foo');
	}, {message: ENOENT_REGEXP});
});

test('skip throwing when using reject option', async t => {
	const {exitCode} = await execa('fail.js', {reject: false});
	t.is(exitCode, 2);
});

test('skip throwing when using reject option in sync mode', t => {
	const {exitCode} = execaSync('fail.js', {reject: false});
	t.is(exitCode, 2);
});

test('stripFinalNewline: true', async t => {
	const {stdout} = await execa('noop.js', ['foo']);
	t.is(stdout, 'foo');
});

test('stripFinalNewline: false', async t => {
	const {stdout} = await execa('noop.js', ['foo'], {stripFinalNewline: false});
	t.is(stdout, 'foo\n');
});

test('stripFinalNewline on failure', async t => {
	const {stderr} = await t.throwsAsync(execa('noop-throw.js', ['foo'], {stripFinalNewline: true}));
	t.is(stderr, 'foo');
});

test('stripFinalNewline in sync mode', t => {
	const {stdout} = execaSync('noop.js', ['foo'], {stripFinalNewline: true});
	t.is(stdout, 'foo');
});

test('stripFinalNewline in sync mode on failure', t => {
	const {stderr} = t.throws(() => {
		execaSync('noop-throw.js', ['foo'], {stripFinalNewline: true});
	});
	t.is(stderr, 'foo');
});

test('preferLocal: true', async t => {
	await t.notThrowsAsync(execa('ava', ['--version'], {preferLocal: true, env: {Path: '', PATH: ''}}));
});

test('preferLocal: false', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {preferLocal: false, env: {Path: '', PATH: ''}}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {env: {Path: '', PATH: ''}}), {message: ENOENT_REGEXP});
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
	const subprocess = execa('noop.js');
	subprocess.stdin.emit('error', new Error('test'));
	await t.throwsAsync(subprocess, {message: /test/});
});

test('child process errors are handled', async t => {
	const subprocess = execa('noop.js');
	subprocess.emit('error', new Error('test'));
	await t.throwsAsync(subprocess, {message: /test/});
});

test('child process errors rejects promise right away', async t => {
	const subprocess = execa('noop.js');
	subprocess.emit('error', new Error('test'));
	await t.throwsAsync(subprocess, {message: /test/});
});

test('execa() returns a promise with pid', t => {
	const {pid} = execa('noop.js', ['foo']);
	t.is(typeof pid, 'number');
});

test('child_process.spawn() propagated errors have correct shape', t => {
	const subprocess = execa('noop.js', {uid: -1});
	t.notThrows(() => {
		subprocess.catch(() => {});
		subprocess.unref();
		subprocess.on('error', () => {});
	});
});

test('child_process.spawn() errors are propagated', async t => {
	const {failed} = await t.throwsAsync(execa('noop.js', {uid: -1}));
	t.true(failed);
});

test('child_process.spawnSync() errors are propagated with a correct shape', t => {
	const {failed} = t.throws(() => {
		execaSync('noop.js', {timeout: -1});
	});
	t.true(failed);
});

test('do not try to consume streams twice', async t => {
	const subprocess = execa('noop.js', ['foo']);
	const {stdout} = await subprocess;
	const {stdout: stdout2} = await subprocess;
	t.is(stdout, 'foo');
	t.is(stdout2, 'foo');
});

test('use relative path with \'..\' chars', async t => {
	const pathViaParentDir = path.join('..', path.basename(fileURLToPath(new URL('..', import.meta.url))), 'test', 'fixtures', 'noop.js');
	const {stdout} = await execa(pathViaParentDir, ['foo']);
	t.is(stdout, 'foo');
});

if (process.platform !== 'win32') {
	test('execa() rejects if running non-executable', async t => {
		const subprocess = execa('non-executable.js');
		await t.throwsAsync(subprocess);
	});

	test('execa() rejects with correct error and doesn\'t throw if running non-executable with input', async t => {
		// On Node <12.6.0, `EACCESS` is emitted on `childProcess`.
		// On Node >=12.6.0, `EPIPE` is emitted on `childProcess.stdin`.
		await t.throwsAsync(execa('non-executable.js', {input: 'Hey!'}), {message: /EACCES|EPIPE/});
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
	const {stdout} = await execa('environment.js');
	t.deepEqual(stdout.split('\n'), ['foo', 'undefined']);
});

test('extend environment variables by default', async t => {
	const {stdout} = await execa('environment.js', [], {env: {BAR: 'bar'}});
	t.deepEqual(stdout.split('\n'), ['foo', 'bar']);
});

test('do not extend environment with `extendEnv: false`', async t => {
	const {stdout} = await execa('environment.js', [], {env: {BAR: 'bar', PATH: process.env.PATH}, extendEnv: false});
	t.deepEqual(stdout.split('\n'), ['undefined', 'bar']);
});

test('can use `options.cwd` as a string', async t => {
	const cwd = '/';
	const {stdout} = await execa('node', ['-p', 'process.cwd()'], {cwd});
	t.is(path.toNamespacedPath(stdout), path.toNamespacedPath(cwd));
});

if (semver.satisfies(process.version, '^14.18.0 || >=16.4.0')) {
	test('localDir option can be a URL', async t => {
		const command = process.platform === 'win32' ? 'echo %PATH%' : 'echo $PATH';
		const {stdout} = await execa(command, {shell: true, preferLocal: true, localDir: pathToFileURL('/test')});
		const envPaths = stdout.split(path.delimiter);
		t.true(envPaths.some(envPath => envPath.endsWith('.bin')));
	});

	test('can use `options.cwd` as a URL', async t => {
		const cwd = '/';
		const cwdUrl = pathToFileURL(cwd);
		const {stdout} = await execa('node', ['-p', 'process.cwd()'], {cwd: cwdUrl});
		t.is(path.toNamespacedPath(stdout), path.toNamespacedPath(cwd));
	});
}

test('can use `options.shell: true`', async t => {
	const {stdout} = await execa('node test/fixtures/noop.js foo', {shell: true});
	t.is(stdout, 'foo');
});

test('can use `options.shell: string`', async t => {
	const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
	const {stdout} = await execa('node test/fixtures/noop.js foo', {shell});
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
	const {stdout} = await execa('detach.js');
	const pid = Number(stdout);
	t.true(Number.isInteger(pid));
	t.true(isRunning(pid));

	process.kill(pid, 'SIGKILL');
});
