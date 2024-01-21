import path from 'node:path';
import process from 'node:process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import test from 'ava';
import isRunning from 'is-running';
import getNode from 'get-node';
import which from 'which';
import {execa, execaSync, execaNode, $} from '../index.js';
import {setFixtureDir, PATH_KEY, FIXTURES_DIR_URL} from './helpers/fixtures-dir.js';
import {identity, fullStdio, getStdio} from './helpers/stdio.js';
import {noopGenerator} from './helpers/generator.js';

setFixtureDir();
process.env.FOO = 'foo';

const ENOENT_REGEXP = process.platform === 'win32' ? /failed with exit code 1/ : /spawn.* ENOENT/;

const testOutput = async (t, index, execaCommand) => {
	const {stdout, stderr, stdio} = await execaCommand('noop-fd.js', [`${index}`, 'foobar'], fullStdio);
	t.is(stdio[index], 'foobar');

	if (index === 1) {
		t.is(stdio[index], stdout);
	} else if (index === 2) {
		t.is(stdio[index], stderr);
	}
};

test('can return stdout', testOutput, 1, execa);
test('can return stderr', testOutput, 2, execa);
test('can return output stdio[*]', testOutput, 3, execa);
test('can return stdout - sync', testOutput, 1, execaSync);
test('can return stderr - sync', testOutput, 2, execaSync);
test('can return output stdio[*] - sync', testOutput, 3, execaSync);

const testNoStdin = async (t, execaCommand) => {
	const {stdio} = await execaCommand('noop.js', ['foobar']);
	t.is(stdio[0], undefined);
};

test('cannot return stdin', testNoStdin, execa);
test('cannot return stdin - sync', testNoStdin, execaSync);

test('cannot return input stdio[*]', async t => {
	const {stdio} = await execa('stdin-fd.js', ['3'], getStdio(3, [['foobar']]));
	t.is(stdio[3], undefined);
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

test('execaSync() throws error if ENOENT', t => {
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

const testStripFinalNewline = async (t, index, stripFinalNewline, execaCommand) => {
	const {stdio} = await execaCommand('noop-fd.js', [`${index}`, 'foobar\n'], {...fullStdio, stripFinalNewline});
	t.is(stdio[index], `foobar${stripFinalNewline === false ? '\n' : ''}`);
};

test('stripFinalNewline: undefined with stdout', testStripFinalNewline, 1, undefined, execa);
test('stripFinalNewline: true with stdout', testStripFinalNewline, 1, true, execa);
test('stripFinalNewline: false with stdout', testStripFinalNewline, 1, false, execa);
test('stripFinalNewline: undefined with stderr', testStripFinalNewline, 2, undefined, execa);
test('stripFinalNewline: true with stderr', testStripFinalNewline, 2, true, execa);
test('stripFinalNewline: false with stderr', testStripFinalNewline, 2, false, execa);
test('stripFinalNewline: undefined with stdio[*]', testStripFinalNewline, 3, undefined, execa);
test('stripFinalNewline: true with stdio[*]', testStripFinalNewline, 3, true, execa);
test('stripFinalNewline: false with stdio[*]', testStripFinalNewline, 3, false, execa);
test('stripFinalNewline: undefined with stdout - sync', testStripFinalNewline, 1, undefined, execaSync);
test('stripFinalNewline: true with stdout - sync', testStripFinalNewline, 1, true, execaSync);
test('stripFinalNewline: false with stdout - sync', testStripFinalNewline, 1, false, execaSync);
test('stripFinalNewline: undefined with stderr - sync', testStripFinalNewline, 2, undefined, execaSync);
test('stripFinalNewline: true with stderr - sync', testStripFinalNewline, 2, true, execaSync);
test('stripFinalNewline: false with stderr - sync', testStripFinalNewline, 2, false, execaSync);
test('stripFinalNewline: undefined with stdio[*] - sync', testStripFinalNewline, 3, undefined, execaSync);
test('stripFinalNewline: true with stdio[*] - sync', testStripFinalNewline, 3, true, execaSync);
test('stripFinalNewline: false with stdio[*] - sync', testStripFinalNewline, 3, false, execaSync);

test('stripFinalNewline is not used in objectMode', async t => {
	const {stdout} = await execa('noop-fd.js', ['1', 'foobar\n'], {stripFinalNewline: true, stdout: noopGenerator(true)});
	t.deepEqual(stdout, ['foobar\n']);
});

const getPathWithoutLocalDir = () => {
	const newPath = process.env[PATH_KEY].split(path.delimiter).filter(pathDir => !BIN_DIR_REGEXP.test(pathDir)).join(path.delimiter);
	return {[PATH_KEY]: newPath};
};

const BIN_DIR_REGEXP = /node_modules[\\/]\.bin/;

test('preferLocal: true', async t => {
	await t.notThrowsAsync(execa('ava', ['--version'], {preferLocal: true, env: getPathWithoutLocalDir()}));
});

test('preferLocal: false', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {preferLocal: false, env: getPathWithoutLocalDir()}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {env: getPathWithoutLocalDir()}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined with $', async t => {
	await t.notThrowsAsync($({env: getPathWithoutLocalDir()})`ava --version`);
});

test('preferLocal: undefined with $.sync', t => {
	t.notThrows(() => $({env: getPathWithoutLocalDir()}).sync`ava --version`);
});

test('localDir option', async t => {
	const command = process.platform === 'win32' ? 'echo %PATH%' : 'echo $PATH';
	const {stdout} = await execa(command, {shell: true, preferLocal: true, localDir: '/test'});
	const envPaths = stdout.split(path.delimiter);
	t.true(envPaths.some(envPath => envPath.endsWith('.bin')));
});

const testExecPath = async (t, mapPath) => {
	const {path} = await getNode('16.0.0');
	const execPath = mapPath(path);
	const {stdout} = await execa('node', ['-p', 'process.env.Path || process.env.PATH'], {preferLocal: true, execPath});
	t.true(stdout.includes('16.0.0'));
};

test.serial('execPath option', testExecPath, identity);
test.serial('execPath option can be a file URL', testExecPath, pathToFileURL);

test('child process errors are handled', async t => {
	const subprocess = execa('noop.js');
	subprocess.emit('error', new Error('test'));
	await t.throwsAsync(subprocess, {message: /test/});
});

test('execa() returns a promise with pid', async t => {
	const subprocess = execa('noop.js', ['foo']);
	t.is(typeof subprocess.pid, 'number');
	await subprocess;
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
		execaSync('noop.js', {uid: -1});
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
		await t.throwsAsync(execa('non-executable.js'));
	});

	test('execa() rejects with correct error and doesn\'t throw if running non-executable with input', async t => {
		await t.throwsAsync(execa('non-executable.js', {input: 'Hey!'}), {message: /EACCES/});
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
	const {stdout} = await execa('environment.js', [], {env: {BAR: 'bar', [PATH_KEY]: process.env[PATH_KEY]}});
	t.deepEqual(stdout.split('\n'), ['foo', 'bar']);
});

test('do not extend environment with `extendEnv: false`', async t => {
	const {stdout} = await execa('environment.js', [], {env: {BAR: 'bar', [PATH_KEY]: process.env[PATH_KEY]}, extendEnv: false});
	t.deepEqual(stdout.split('\n'), ['undefined', 'bar']);
});

test('can use `options.cwd` as a string', async t => {
	const cwd = '/';
	const {stdout} = await execa('node', ['-p', 'process.cwd()'], {cwd});
	t.is(path.toNamespacedPath(stdout), path.toNamespacedPath(cwd));
});

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

test('can use `options.shell: true`', async t => {
	const {stdout} = await execa('node test/fixtures/noop.js foo', {shell: true});
	t.is(stdout, 'foo');
});

const testShellPath = async (t, mapPath) => {
	const shellPath = process.platform === 'win32' ? 'cmd.exe' : 'bash';
	const shell = mapPath(await which(shellPath));
	const {stdout} = await execa('node test/fixtures/noop.js foo', {shell});
	t.is(stdout, 'foo');
};

test('can use `options.shell: string`', testShellPath, identity);
test('can use `options.shell: file URL`', testShellPath, pathToFileURL);

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

const testFileUrl = async (t, execaMethod) => {
	const command = new URL('noop.js', FIXTURES_DIR_URL);
	const {stdout} = await execaMethod(command, ['foobar']);
	t.is(stdout, 'foobar');
};

test('execa()\'s command argument can be a file URL', testFileUrl, execa);
test('execaSync()\'s command argument can be a file URL', testFileUrl, execaSync);
test('execaNode()\'s command argument can be a file URL', testFileUrl, execaNode);

const testInvalidFileUrl = async (t, execaMethod) => {
	const invalidUrl = new URL('https://invalid.com');
	t.throws(() => {
		execaMethod(invalidUrl);
	}, {code: 'ERR_INVALID_URL_SCHEME'});
};

test('execa()\'s command argument cannot be a non-file URL', testInvalidFileUrl, execa);
test('execaSync()\'s command argument cannot be a non-file URL', testInvalidFileUrl, execaSync);
test('execaNode()\'s command argument cannot be a non-file URL', testInvalidFileUrl, execaNode);

const testInvalidCommand = async (t, execaMethod) => {
	t.throws(() => {
		execaMethod(['command', 'arg']);
	}, {message: /must be a string or a file URL/});
};

test('execa()\'s command argument must be a string or file URL', testInvalidCommand, execa);
test('execaSync()\'s command argument must be a string or file URL', testInvalidCommand, execaSync);
test('execaNode()\'s command argument must be a string or file URL', testInvalidCommand, execaNode);
