import path from 'path';
import test from 'ava';
import isRunning from 'is-running';
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
	await t.notThrowsAsync(execa('ava', ['--version'], {preferLocal: true, env: {PATH: ''}}));
});

test('preferLocal: false', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {preferLocal: false, env: {PATH: ''}}), ENOENT_REGEXP);
});

test('preferLocal: undefined', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {env: {PATH: ''}}), ENOENT_REGEXP);
});

test('localDir option', async t => {
	const command = process.platform === 'win32' ? 'echo %PATH%' : 'echo $PATH';
	const {stdout} = await execa(command, {shell: true, preferLocal: true, localDir: '/test'});
	const envPaths = stdout.split(path.delimiter).map(envPath =>
		envPath.replace(/\\/g, '/').replace(/^[^/]+/, '')
	);
	t.true(envPaths.some(envPath => envPath === '/test/node_modules/.bin'));
});

test('stdin errors are handled', async t => {
	const child = execa('noop');
	child.stdin.emit('error', new Error('test'));
	await t.throwsAsync(child, /test/);
});

test('child process errors are handled', async t => {
	const child = execa('noop');
	child.emit('error', new Error('test'));
	await t.throwsAsync(child, /test/);
});

test('child process errors rejects promise right away', async t => {
	const child = execa('forever');
	child.emit('error', new Error('test'));
	await t.throwsAsync(child, /test/);
});

test('execa() returns a promise with pid', t => {
	const {pid} = execa('noop', ['foo']);
	t.is(typeof pid, 'number');
});

test('child_process.spawn() propagated errors have correct shape', t => {
	const cp = execa('noop', {uid: -1});
	t.notThrows(() => {
		cp.catch(() => {});
		cp.unref();
		cp.on('error', () => {});
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

test('use relative path with \'..\' chars', async t => {
	const pathViaParentDir = path.join('..', path.basename(path.dirname(__dirname)), 'test', 'fixtures', 'noop');
	const {stdout} = await execa(pathViaParentDir, ['foo']);
	t.is(stdout, 'foo');
});

if (process.platform !== 'win32') {
	test('execa() rejects if running non-executable', async t => {
		const cp = execa('non-executable');
		await t.throwsAsync(cp);
	});

	test('execa() rejects with correct error and doesn\'t throw if running non-executable with input', async t => {
		await t.throwsAsync(execa('non-executable', {input: 'Hey!'}), /EACCES/);
	});
}

const command = async (t, expected, ...args) => {
	const {command: failCommand} = await t.throwsAsync(execa('fail', args));
	t.is(failCommand, `fail${expected}`);

	const {command} = await execa('noop', args);
	t.is(command, `noop${expected}`);
};

command.title = (message, expected) => `command is: ${JSON.stringify(expected)}`;

test(command, ' foo bar', 'foo', 'bar');
test(command, ' baz quz', 'baz', 'quz');
test(command, '');

if (process.platform !== 'win32') {
	test('write to fast-exit process', async t => {
		// Try-catch here is necessary, because this test is not 100% accurate
		// Sometimes process can manage to accept input before exiting
		try {
			await execa(`fast-exit-${process.platform}`, [], {input: 'data'});
			t.pass();
		} catch (error) {
			t.is(error.exitCode, 32);
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

test('promise methods are not enumerable', t => {
	const descriptors = Object.getOwnPropertyDescriptors(execa('noop'));
	// eslint-disable-next-line promise/prefer-await-to-then
	t.false(descriptors.then.enumerable);
	t.false(descriptors.catch.enumerable);
	// TOOD: Remove the `if`-guard when targeting Node.js 10
	if (Promise.prototype.finally) {
		t.false(descriptors.finally.enumerable);
	}
});

// TOOD: Remove the `if`-guard when targeting Node.js 10
if (Promise.prototype.finally) {
	test('finally function is executed on success', async t => {
		let isCalled = false;
		const {stdout} = await execa('noop', ['foo']).finally(() => {
			isCalled = true;
		});
		t.is(isCalled, true);
		t.is(stdout, 'foo');
	});

	test('finally function is executed on failure', async t => {
		let isError = false;
		const {stdout, stderr} = await t.throwsAsync(execa('exit', ['2']).finally(() => {
			isError = true;
		}));
		t.is(isError, true);
		t.is(typeof stdout, 'string');
		t.is(typeof stderr, 'string');
	});

	test('throw in finally function bubbles up on success', async t => {
		const {message} = await t.throwsAsync(execa('noop', ['foo']).finally(() => {
			throw new Error('called');
		}));
		t.is(message, 'called');
	});

	test('throw in finally bubbles up on error', async t => {
		const {message} = await t.throwsAsync(execa('exit', ['2']).finally(() => {
			throw new Error('called');
		}));
		t.is(message, 'called');
	});
}

test('allow commands with spaces and no array arguments', async t => {
	const {stdout} = await execa('command with space');
	t.is(stdout, '');
});

test('allow commands with spaces and array arguments', async t => {
	const {stdout} = await execa('command with space', ['foo', 'bar']);
	t.is(stdout, 'foo\nbar');
});

test('execa.command()', async t => {
	const {stdout} = await execa.command('node test/fixtures/echo foo bar');
	t.is(stdout, 'foo\nbar');
});

test('execa.command() ignores consecutive spaces', async t => {
	const {stdout} = await execa.command('node test/fixtures/echo foo    bar');
	t.is(stdout, 'foo\nbar');
});

test('execa.command() allows escaping spaces in commands', async t => {
	const {stdout} = await execa.command('command\\ with\\ space foo bar');
	t.is(stdout, 'foo\nbar');
});

test('execa.command() allows escaping spaces in arguments', async t => {
	const {stdout} = await execa.command('node test/fixtures/echo foo\\ bar');
	t.is(stdout, 'foo bar');
});

test('execa.command() escapes other whitespaces', async t => {
	const {stdout} = await execa.command('node test/fixtures/echo foo\tbar');
	t.is(stdout, 'foo\tbar');
});

test('execa.command() trims', async t => {
	const {stdout} = await execa.command('  node test/fixtures/echo foo bar  ');
	t.is(stdout, 'foo\nbar');
});

test('execa.command.sync()', t => {
	const {stdout} = execa.commandSync('node test/fixtures/echo foo bar');
	t.is(stdout, 'foo\nbar');
});
