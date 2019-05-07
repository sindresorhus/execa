import path from 'path';
import fs from 'fs';
import stream from 'stream';
import childProcess from 'child_process';
import test from 'ava';
import getStream from 'get-stream';
import isRunning from 'is-running';
import delay from 'delay';
import tempfile from 'tempfile';
import execa from '.';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;
process.env.FOO = 'foo';

const NO_NEWLINES_REGEXP = /^[^\n]*$/;
const STDERR_STDOUT_REGEXP = /stderr[^]*stdout/;
const TIMEOUT_REGEXP = /timed out after/;

const getExitRegExp = exitMessage => new RegExp(`failed with exit code ${exitMessage}`);

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

test('buffer', async t => {
	const {stdout} = await execa('noop', ['foo'], {encoding: null});
	t.true(Buffer.isBuffer(stdout));
	t.is(stdout.toString(), 'foo');
});

test('execa.stdout()', async t => {
	const stdout = await execa.stdout('noop', ['foo']);
	t.is(stdout, 'foo');
});

test('execa.stderr()', async t => {
	const stderr = await execa.stderr('noop-err', ['foo']);
	t.is(stderr, 'foo');
});

test.serial('result.all shows both `stdout` and `stderr` intermixed', async t => {
	const result = await execa('noop-132');
	t.is(result.all, '132');
});

test('stdout/stderr/all available on errors', async t => {
	const err = await t.throwsAsync(execa('exit', ['2']), {message: getExitRegExp('2')});
	t.is(typeof err.stdout, 'string');
	t.is(typeof err.stderr, 'string');
	t.is(typeof err.all, 'string');
});

test('include stdout and stderr in errors for improved debugging', async t => {
	await t.throwsAsync(execa('fixtures/error-message.js'), {message: STDERR_STDOUT_REGEXP, code: 1});
});

test('do not include in errors when `stdio` is set to `inherit`', async t => {
	await t.throwsAsync(execa('fixtures/error-message.js', {stdio: 'inherit'}), {message: NO_NEWLINES_REGEXP});
});

test('do not include `stderr` and `stdout` in errors when set to `inherit`', async t => {
	await t.throwsAsync(execa('fixtures/error-message.js', {stdout: 'inherit', stderr: 'inherit'}), {message: NO_NEWLINES_REGEXP});
});

test('do not include `stderr` and `stdout` in errors when `stdio` is set to `inherit`', async t => {
	await t.throwsAsync(execa('fixtures/error-message.js', {stdio: [undefined, 'inherit', 'inherit']}), {message: NO_NEWLINES_REGEXP});
});

test('do not include `stdout` in errors when set to `inherit`', async t => {
	const err = await t.throwsAsync(execa('fixtures/error-message.js', {stdout: 'inherit'}), {message: /stderr/});
	t.notRegex(err.message, /stdout/);
});

test('do not include `stderr` in errors when set to `inherit`', async t => {
	const err = await t.throwsAsync(execa('fixtures/error-message.js', {stderr: 'inherit'}), {message: /stdout/});
	t.notRegex(err.message, /stderr/);
});

test('pass `stdout` to a file descriptor', async t => {
	const file = tempfile('.txt');
	await execa('fixtures/noop', ['foo bar'], {stdout: fs.openSync(file, 'w')});
	t.is(fs.readFileSync(file, 'utf8'), 'foo bar\n');
});

test('pass `stderr` to a file descriptor', async t => {
	const file = tempfile('.txt');
	await execa('fixtures/noop-err', ['foo bar'], {stderr: fs.openSync(file, 'w')});
	t.is(fs.readFileSync(file, 'utf8'), 'foo bar\n');
});

test('allow string arguments', async t => {
	const {stdout} = await execa('node fixtures/echo foo bar');
	t.is(stdout, 'foo\nbar');
});

test('allow string arguments in synchronous mode', t => {
	const {stdout} = execa.sync('node fixtures/echo foo bar');
	t.is(stdout, 'foo\nbar');
});

test('forbid string arguments together with array arguments', t => {
	t.throws(() => execa('node fixtures/echo foo bar', ['foo', 'bar']), /Arguments cannot be inside/);
});

test('ignore consecutive spaces in string arguments', async t => {
	const {stdout} = await execa('node fixtures/echo foo    bar');
	t.is(stdout, 'foo\nbar');
});

test('escape other whitespaces in string arguments', async t => {
	const {stdout} = await execa('node fixtures/echo foo\tbar');
	t.is(stdout, 'foo\tbar');
});

test('allow escaping spaces in string arguments', async t => {
	const {stdout} = await execa('node fixtures/echo foo\\ bar');
	t.is(stdout, 'foo bar');
});

test('trim string arguments', async t => {
	const {stdout} = await execa('  node fixtures/echo foo bar  ');
	t.is(stdout, 'foo\nbar');
});

test('execa.shell()', async t => {
	const {stdout} = await execa.shell('node fixtures/noop foo');
	t.is(stdout, 'foo');
});

test('execa.sync()', t => {
	const {stdout} = execa.sync('noop', ['foo']);
	t.is(stdout, 'foo');
});

test('execa.sync() throws error if written to stderr', t => {
	t.throws(() => execa.sync('foo'), process.platform === 'win32' ? /'foo' is not recognized as an internal or external command/ : /spawnSync foo ENOENT/);
});

test('execa.sync() includes stdout and stderr in errors for improved debugging', t => {
	t.throws(() => execa.sync('node', ['fixtures/error-message.js']), {message: STDERR_STDOUT_REGEXP, code: 1});
});

test('skip throwing when using reject option in execa.sync()', t => {
	const err = execa.sync('node', ['fixtures/error-message.js'], {reject: false});
	t.is(typeof err.stdout, 'string');
	t.is(typeof err.stderr, 'string');
});

test('execa.shellSync()', t => {
	const {stdout} = execa.shellSync('node fixtures/noop foo');
	t.is(stdout, 'foo');
});

test('execa.shellSync() includes stdout and stderr in errors for improved debugging', t => {
	t.throws(() => execa.shellSync('node fixtures/error-message.js'), {message: STDERR_STDOUT_REGEXP, code: 1});
});

test('skip throwing when using reject option in execa.shellSync()', t => {
	const err = execa.shellSync('node fixtures/error-message.js', {reject: false});
	t.is(typeof err.stdout, 'string');
	t.is(typeof err.stderr, 'string');
});

test('stripEof option (legacy)', async t => {
	const {stdout} = await execa('noop', ['foo'], {stripEof: false});
	t.is(stdout, 'foo\n');
});

test('stripFinalNewline option', async t => {
	const {stdout} = await execa('noop', ['foo'], {stripFinalNewline: false});
	t.is(stdout, 'foo\n');
});

test('preferLocal option', async t => {
	await execa('ava', ['--version'], {env: {PATH: ''}});
	await t.throwsAsync(execa('ava', ['--version'], {preferLocal: false, env: {PATH: ''}}), /spawn .* ENOENT/);
});

test.serial('localDir option', async t => {
	const cwd = 'fixtures/local-dir';
	const bin = path.resolve(cwd, 'node_modules/.bin/self-path');

	await execa('npm', ['install', '--no-package-lock'], {cwd});

	const {stdout} = await execa(bin, {localDir: cwd});

	t.is(path.relative(cwd, stdout), path.normalize('node_modules/self-path'));
});

test('input option can be a String', async t => {
	const {stdout} = await execa('stdin', {input: 'foobar'});
	t.is(stdout, 'foobar');
});

test('input option can be a Buffer', async t => {
	const {stdout} = await execa('stdin', {input: 'testing12'});
	t.is(stdout, 'testing12');
});

test('input can be a Stream', async t => {
	const s = new stream.PassThrough();
	s.write('howdy');
	s.end();
	const {stdout} = await execa('stdin', {input: s});
	t.is(stdout, 'howdy');
});

test('you can write to child.stdin', async t => {
	const child = execa('stdin');
	child.stdin.end('unicorns');
	t.is((await child).stdout, 'unicorns');
});

test('input option can be a String - sync', t => {
	const {stdout} = execa.sync('stdin', {input: 'foobar'});
	t.is(stdout, 'foobar');
});

test('input option can be a Buffer - sync', t => {
	const {stdout} = execa.sync('stdin', {input: Buffer.from('testing12', 'utf8')});
	t.is(stdout, 'testing12');
});

test('opts.stdout:ignore - stdout will not collect data', async t => {
	const {stdout} = await execa('stdin', {
		input: 'hello',
		stdio: [undefined, 'ignore', undefined]
	});
	t.is(stdout, undefined);
});

test('helpful error trying to provide an input stream in sync mode', t => {
	t.throws(
		() => execa.sync('stdin', {input: new stream.PassThrough()}),
		/The `input` option cannot be a stream in sync mode/
	);
});

test('execa() returns a promise with kill() and pid', t => {
	const promise = execa('noop', ['foo']);
	t.is(typeof promise.kill, 'function');
	t.is(typeof promise.pid, 'number');
});

test('maxBuffer affects stdout', async t => {
	await t.throwsAsync(execa('max-buffer', ['stdout', '11'], {maxBuffer: 10}), /stdout maxBuffer exceeded/);
	await t.notThrowsAsync(execa('max-buffer', ['stdout', '10'], {maxBuffer: 10}));
});

test('maxBuffer affects stderr', async t => {
	await t.throwsAsync(execa('max-buffer', ['stderr', '13'], {maxBuffer: 12}), /stderr maxBuffer exceeded/);
	await t.notThrowsAsync(execa('max-buffer', ['stderr', '12'], {maxBuffer: 12}));
});

test('do not buffer stdout when `buffer` set to `false`', async t => {
	const promise = execa('max-buffer', ['stdout', '10'], {buffer: false});
	const [result, stdout] = await Promise.all([
		promise,
		getStream(promise.stdout),
		getStream(promise.all)
	]);

	t.is(result.stdout, undefined);
	t.is(stdout, '.........\n');
});

test('do not buffer stderr when `buffer` set to `false`', async t => {
	const promise = execa('max-buffer', ['stderr', '10'], {buffer: false});
	const [result, stderr] = await Promise.all([
		promise,
		getStream(promise.stderr),
		getStream(promise.all)
	]);

	t.is(result.stderr, undefined);
	t.is(stderr, '.........\n');
});

test('skip throwing when using reject option', async t => {
	const error = await execa('exit', ['2'], {reject: false});
	t.is(typeof error.stdout, 'string');
	t.is(typeof error.stderr, 'string');
});

test('allow unknown exit code', async t => {
	const {exitCode, exitCodeName} = await t.throwsAsync(execa('exit', ['255']), {message: /exit code 255 \(Unknown system error -255\)/});
	t.is(exitCode, 255);
	t.is(exitCodeName, 'Unknown system error -255');
});

test('execa() returns code and failed properties', async t => {
	const {code, exitCode, exitCodeName, failed} = await execa('noop', ['foo']);
	t.is(code, 0);
	t.is(exitCode, 0);
	t.is(exitCodeName, 'SUCCESS');
	t.false(failed);

	const error = await t.throwsAsync(execa('exit', ['2']), {code: 2, message: getExitRegExp('2')});
	t.is(error.exitCode, 2);
	const expectedName = process.platform === 'win32' ? 'Unknown system error -2' : 'ENOENT';
	t.is(error.exitCodeName, expectedName);
	t.true(error.failed);
});

test('use relative path with \'..\' chars', async t => {
	const pathViaParentDir = path.join('..', path.basename(__dirname), 'fixtures', 'noop');
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

test('error.killed is true if process was killed directly', async t => {
	const cp = execa('forever');

	setTimeout(() => {
		cp.kill();
	}, 100);

	const error = await t.throwsAsync(cp, {message: /was killed with SIGTERM/});
	t.true(error.killed);
});

// TODO: Should this really be the case, or should we improve on child_process?
test('error.killed is false if process was killed indirectly', async t => {
	const cp = execa('forever');

	setTimeout(() => {
		process.kill(cp.pid, 'SIGINT');
	}, 100);

	// `process.kill()` is emulated by Node.js on Windows
	const message = process.platform === 'win32' ? /failed with exit code 1/ : /was killed with SIGINT/;
	const error = await t.throwsAsync(cp, {message});
	t.false(error.killed);
});

if (process.platform === 'darwin') {
	test.cb('sanity check: child_process.exec also has killed.false if killed indirectly', t => {
		const cp = childProcess.exec('forever', error => {
			t.truthy(error);
			t.false(error.killed);
			t.end();
		});

		setTimeout(() => {
			process.kill(cp.pid, 'SIGINT');
		}, 100);
	});
}

if (process.platform !== 'win32') {
	test('error.signal is SIGINT', async t => {
		const cp = execa('forever');

		setTimeout(() => {
			process.kill(cp.pid, 'SIGINT');
		}, 100);

		const error = await t.throwsAsync(cp, {message: /was killed with SIGINT/});
		t.is(error.signal, 'SIGINT');
	});

	test('error.signal is SIGTERM', async t => {
		const cp = execa('forever');

		setTimeout(() => {
			process.kill(cp.pid, 'SIGTERM');
		}, 100);

		const error = await t.throwsAsync(cp, {message: /was killed with SIGTERM/});
		t.is(error.signal, 'SIGTERM');
	});

	test('custom error.signal', async t => {
		const error = await t.throwsAsync(execa('delay', ['3000', '0'], {killSignal: 'SIGHUP', timeout: 1500, message: TIMEOUT_REGEXP}));
		t.is(error.signal, 'SIGHUP');
	});
}

test('result.signal is undefined for successful execution', async t => {
	t.is((await execa('noop')).signal, undefined);
});

test('result.signal is undefined if process failed, but was not killed', async t => {
	const error = await t.throwsAsync(execa('exit', [2]), {message: getExitRegExp('2')});
	t.is(error.signal, undefined);
});

async function code(t, num) {
	const error = await t.throwsAsync(execa('exit', [`${num}`]), {code: num, message: getExitRegExp(num)});
	t.is(error.exitCode, num);
}

test('error.code is 2', code, 2);
test('error.code is 3', code, 3);
test('error.code is 4', code, 4);

test.serial('timeout will kill the process early', async t => {
	const time = Date.now();
	const error = await t.throwsAsync(execa('delay', ['60000', '0'], {timeout: 500, message: TIMEOUT_REGEXP}));
	const diff = Date.now() - time;

	t.true(error.timedOut);
	t.not(error.exitCode, 22);
	t.true(diff < 4000);
});

test.serial('timeout will kill the process early (sleep)', async t => {
	const time = Date.now();
	const error = await t.throwsAsync(execa('sleeper', [], {timeout: 500, message: TIMEOUT_REGEXP}));
	const diff = Date.now() - time;

	t.true(error.timedOut);
	t.not(error.stdout, 'ok');
	t.true(diff < 4000);
});

test('timeout will not kill the process early', async t => {
	const error = await t.throwsAsync(execa('delay', ['2000', '22'], {timeout: 30000}), {code: 22, message: getExitRegExp('22')});
	t.false(error.timedOut);
});

test('timedOut will be false if no timeout was set and zero exit code', async t => {
	const result = await execa('delay', ['1000', '0']);
	t.false(result.timedOut);
});

test('timedOut will be false if no timeout was set and non-zero exit code', async t => {
	const error = await t.throwsAsync(execa('delay', ['1000', '3']), {message: getExitRegExp('3')});
	t.false(error.timedOut);
});

async function errorMessage(t, expected, ...args) {
	await t.throwsAsync(execa('exit', args), {message: expected});
}

errorMessage.title = (message, expected) => `error.message matches: ${expected}`;

test(errorMessage, /Command failed with exit code 2.*: exit 2 foo bar/, 2, 'foo', 'bar');
test(errorMessage, /Command failed with exit code 3.*: exit 3 baz quz/, 3, 'baz', 'quz');

async function command(t, expected, ...args) {
	const error = await t.throwsAsync(execa('fail', args));
	t.is(error.command, `fail${expected}`);

	const result = await execa('noop', args);
	t.is(result.command, `noop${expected}`);
}

command.title = (message, expected) => `command is: ${JSON.stringify(expected)}`;

test(command, ' foo bar', 'foo', 'bar');
test(command, ' baz quz', 'baz', 'quz');
test(command, '');

async function spawnAndKill(t, signal, cleanup) {
	const name = cleanup ? 'sub-process' : 'sub-process-false';
	const cp = execa(name);
	let pid;

	cp.stdout.setEncoding('utf8');
	cp.stdout.on('data', chunk => {
		pid = parseInt(chunk, 10);
		t.is(typeof pid, 'number');

		setTimeout(() => {
			process.kill(cp.pid, signal);
		}, 100);
	});

	await t.throwsAsync(cp);

	// Give everybody some time to breath and kill things
	await delay(200);

	t.false(isRunning(cp.pid));
	t.is(isRunning(pid), !cleanup);
}

test('cleanup - SIGINT', spawnAndKill, 'SIGINT', true);
test('cleanup - SIGKILL', spawnAndKill, 'SIGTERM', true);

if (process.platform !== 'win32') {
	// On Windows the subprocesses are actually always killed
	test('cleanup false - SIGINT', spawnAndKill, 'SIGTERM', false);
	test('cleanup false - SIGKILL', spawnAndKill, 'SIGKILL', false);
}

test('execa.shell() supports the `shell` option', async t => {
	const {stdout} = await execa.shell('node fixtures/noop foo', {
		shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
	});
	t.is(stdout, 'foo');
});

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
	const result = await execa.stdout('environment');

	t.deepEqual(result.split('\n'), [
		'foo',
		'undefined'
	]);
});

test('extend environment variables by default', async t => {
	const result = await execa.stdout('environment', [], {env: {BAR: 'bar'}});

	t.deepEqual(result.split('\n'), [
		'foo',
		'bar'
	]);
});

test('do not extend environment with `extendEnv: false`', async t => {
	const result = await execa.stdout('environment', [], {env: {BAR: 'bar', PATH: process.env.PATH}, extendEnv: false});

	t.deepEqual(result.split('\n'), [
		'undefined',
		'bar'
	]);
});

test('use extend environment with `extendEnv: true` and `shell: true`', async t => {
	process.env.TEST = 'test';
	const command = process.platform === 'win32' ? 'echo %TEST%' : 'echo $TEST';
	const stdout = await execa.stdout(command, {shell: true, env: {}, extendEnv: true});
	t.is(stdout, 'test');
	delete process.env.TEST;
});

test('do not buffer when streaming', async t => {
	const result = await getStream(execa('max-buffer', ['stdout', '21'], {maxBuffer: 10}).stdout);

	t.is(result, '....................\n');
});

test('detach child process', async t => {
	const {stdout} = await execa('detach');
	const pid = Number(stdout);
	t.true(Number.isInteger(pid));
	t.true(isRunning(pid));

	process.kill(pid, 'SIGKILL');
});

// See #128
test('removes exit handler on exit', async t => {
	// FIXME: This relies on `signal-exit` internals
	const ee = process.__signal_exit_emitter__;

	const child = execa('noop');
	const listener = ee.listeners('exit').pop();

	await new Promise((resolve, reject) => {
		child.on('error', reject);
		child.on('exit', resolve);
	});

	const included = ee.listeners('exit').includes(listener);
	t.false(included);
});

// TOOD: Remove the `if`-guard when targeting Node.js 10
if (Promise.prototype.finally) {
	test('finally function is executed on success', async t => {
		let called = false;
		const {stdout} = await execa('noop', ['foo']).finally(() => {
			called = true;
		});
		t.is(called, true);
		t.is(stdout, 'foo');
	});

	test('finally function is executed on failure', async t => {
		let called = false;
		const err = await t.throwsAsync(execa('exit', ['2']).finally(() => {
			called = true;
		}));
		t.is(called, true);
		t.is(typeof err.stdout, 'string');
		t.is(typeof err.stderr, 'string');
	});

	test('throw in finally function bubbles up on success', async t => {
		const result = await t.throwsAsync(execa('noop', ['foo']).finally(() => {
			throw new Error('called');
		}));
		t.is(result.message, 'called');
	});

	test('throw in finally bubbles up on error', async t => {
		const result = await t.throwsAsync(execa('exit', ['2']).finally(() => {
			throw new Error('called');
		}));
		t.is(result.message, 'called');
	});
}

test('cancel method kills the subprocess', t => {
	const subprocess = execa('node');
	subprocess.cancel();
	t.true(subprocess.killed);
});

test('result.isCanceled is false when spawned.cancel isn\'t called', async t => {
	const result = await execa('noop');
	t.false(result.isCanceled);
});

test('calling cancel method throws an error with message "Command was canceled"', async t => {
	const subprocess = execa('noop');
	subprocess.cancel();
	await t.throwsAsync(subprocess, {message: /Command was canceled/});
});

test('error.isCanceled is true when cancel method is used', async t => {
	const subprocess = execa('noop');
	subprocess.cancel();
	const error = await t.throwsAsync(subprocess);
	t.true(error.isCanceled);
});

test('error.isCanceled is false when kill method is used', async t => {
	const subprocess = execa('noop');
	subprocess.kill();
	const error = await t.throwsAsync(subprocess);
	t.false(error.isCanceled);
});

test('calling cancel method twice should show the same behaviour as calling it once', async t => {
	const subprocess = execa('noop');
	subprocess.cancel();
	subprocess.cancel();
	const error = await t.throwsAsync(subprocess);
	t.true(error.isCanceled);
	t.true(subprocess.killed);
});

test('calling cancel method on a successfuly completed process does not make result.isCanceled true', async t => {
	const subprocess = execa('noop');
	const result = await subprocess;
	subprocess.cancel();
	t.false(result.isCanceled);
});

test('calling cancel method on a process which has been killed does not make error.isCanceled true', async t => {
	const subprocess = execa('noop');
	subprocess.kill();
	const error = await t.throwsAsync(subprocess);
	t.false(error.isCanceled);
});
