import path from 'path';
import fs from 'fs';
import stream from 'stream';
import childProcess from 'child_process';
import test from 'ava';
import getStream from 'get-stream';
import isRunning from 'is-running';
import tempfile from 'tempfile';
import pEvent from 'p-event';
import execa from '..';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;
process.env.FOO = 'foo';

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

test.serial('result.all shows both `stdout` and `stderr` intermixed', async t => {
	const {all} = await execa('noop-132');
	t.is(all, '132');
});

test('stdout/stderr/all available on errors', async t => {
	const {stdout, stderr, all} = await t.throwsAsync(execa('exit', ['2']), {message: getExitRegExp('2')});
	t.is(typeof stdout, 'string');
	t.is(typeof stderr, 'string');
	t.is(typeof all, 'string');
});

test('stdout/stderr/all are undefined if ignored', async t => {
	const {stdout, stderr, all} = await execa('noop', {stdio: 'ignore'});
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.is(all, undefined);
});

test('stdout/stderr/all are undefined if ignored in sync mode', t => {
	const {stdout, stderr, all} = execa.sync('noop', {stdio: 'ignore'});
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.is(all, undefined);
});

test('stdout/stderr/all on process errors', async t => {
	const {stdout, stderr, all} = await t.throwsAsync(execa('wrong command'));
	t.is(stdout, '');
	t.is(stderr, '');
	t.is(all, '');
});

test('stdout/stderr/all on process errors, in sync mode', t => {
	const {stdout, stderr, all} = t.throws(() => {
		execa.sync('wrong command');
	});
	t.is(stdout, '');
	t.is(stderr, process.platform === 'win32' ?
		'\'wrong\' is not recognized as an internal or external command,\r\noperable program or batch file.' :
		'');
	t.is(all, undefined);
});

test('pass `stdout` to a file descriptor', async t => {
	const file = tempfile('.txt');
	await execa('test/fixtures/noop', ['foo bar'], {stdout: fs.openSync(file, 'w')});
	t.is(fs.readFileSync(file, 'utf8'), 'foo bar\n');
});

test('pass `stderr` to a file descriptor', async t => {
	const file = tempfile('.txt');
	await execa('test/fixtures/noop-err', ['foo bar'], {stderr: fs.openSync(file, 'w')});
	t.is(fs.readFileSync(file, 'utf8'), 'foo bar\n');
});

test('execa.sync()', t => {
	const {stdout} = execa.sync('noop', ['foo']);
	t.is(stdout, 'foo');
});

test('execa.sync() throws error if written to stderr', t => {
	t.throws(() => {
		execa.sync('foo');
	}, process.platform === 'win32' ? /failed with exit code 1/ : /spawnSync foo ENOENT/);
});

test('skip throwing when using reject option', async t => {
	const {exitCode} = await execa('fail', {reject: false});
	t.is(exitCode, 2);
});

test('skip throwing when using reject option in sync mode', t => {
	const {exitCode} = execa.sync('fail', {reject: false});
	t.is(exitCode, 2);
});

test('execa() with .kill() after it with SIGKILL should kill cleanly', async t => {
	const subprocess = execa('node', ['fixtures/no-killable'], {
		stdio: ['ipc']
	});

	await pEvent(subprocess, 'message');

	subprocess.kill('SIGKILL');

	const {signal} = await t.throwsAsync(subprocess);
	t.is(signal, 'SIGKILL');
});

// `SIGTERM` cannot be caught on Windows, and it always aborts the process (like `SIGKILL` on Unix).
// Therefore, this feature and those tests do not make sense on Windows.
if (process.platform !== 'win32') {
	test('execa() with .kill() after it with SIGTERM should not kill (no retry)', async t => {
		const subprocess = execa('node', ['fixtures/no-killable'], {
			stdio: ['ipc']
		});

		await pEvent(subprocess, 'message');

		subprocess.kill('SIGTERM', {
			forceKill: false,
			forceKillAfter: 50
		});

		t.true(isRunning(subprocess.pid));
		subprocess.kill('SIGKILL');
	});

	test('execa() with .kill() after it with SIGTERM should kill after 50 ms with SIGKILL', async t => {
		const subprocess = execa('node', ['fixtures/no-killable'], {
			stdio: ['ipc']
		});

		await pEvent(subprocess, 'message');

		subprocess.kill('SIGTERM', {
			forceKillAfter: 50
		});

		const {signal} = await t.throwsAsync(subprocess);
		t.is(signal, 'SIGKILL');
	});

	test('execa() with .kill() after it with nothing (undefined) should kill after 50 ms with SIGKILL', async t => {
		const subprocess = execa('node', ['fixtures/no-killable'], {
			stdio: ['ipc']
		});

		await pEvent(subprocess, 'message');

		subprocess.kill();

		const {signal} = await t.throwsAsync(subprocess);
		t.is(signal, 'SIGKILL');
	});
}

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

test('preferLocal option', async t => {
	await execa('ava', ['--version'], {env: {PATH: ''}});
	const errorRegExp = process.platform === 'win32' ? /failed with exit code 1/ : /spawn ava ENOENT/;
	await t.throwsAsync(execa('ava', ['--version'], {preferLocal: false, env: {PATH: ''}}), errorRegExp);
});

test('localDir option', async t => {
	const command = process.platform === 'win32' ? 'echo %PATH%' : 'echo $PATH';
	const {stdout} = await execa(command, {shell: true, localDir: '/test'});
	const envPaths = stdout.split(path.delimiter).map(envPath =>
		envPath.replace(/\\/g, '/').replace(/^[^/]+/, '')
	);
	t.true(envPaths.some(envPath => envPath === '/test/node_modules/.bin'));
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

test('child process errors are handled', async t => {
	const child = execa('noop');
	child.emit('error', new Error('test'));
	await t.throwsAsync(child, /Command failed.*\ntest/);
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
		() => {
			execa.sync('stdin', {input: new stream.PassThrough()});
		},
		/The `input` option cannot be a stream in sync mode/
	);
});

test('child process errors rejects promise right away', async t => {
	const child = execa('forever');
	child.emit('error', new Error('test'));
	await t.throwsAsync(child, /test/);
});

test('execa() returns a promise with kill() and pid', t => {
	const {kill, pid} = execa('noop', ['foo']);
	t.is(typeof kill, 'function');
	t.is(typeof pid, 'number');
});

test('child_process.spawn() errors are propagated', async t => {
	const {exitCodeName} = await t.throwsAsync(execa('noop', {uid: -1}));
	t.is(exitCodeName, process.platform === 'win32' ? 'ENOTSUP' : 'EINVAL');
});

test('child_process.spawnSync() errors are propagated', t => {
	const {exitCodeName} = t.throws(() => {
		execa.sync('noop', {uid: -1});
	});
	t.is(exitCodeName, process.platform === 'win32' ? 'ENOTSUP' : 'EINVAL');
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

test('allow unknown exit code', async t => {
	const {exitCode, exitCodeName} = await t.throwsAsync(execa('exit', ['255']), {message: /exit code 255 \(Unknown system error -255\)/});
	t.is(exitCode, 255);
	t.is(exitCodeName, 'Unknown system error -255');
});

test('execa() does not return code and failed properties on success', async t => {
	const {exitCode, exitCodeName, failed} = await execa('noop', ['foo']);
	t.is(exitCode, 0);
	t.is(exitCodeName, 'SUCCESS');
	t.false(failed);
});

test('execa() returns code and failed properties', async t => {
	const {exitCode, exitCodeName, failed} = await t.throwsAsync(execa('exit', ['2']), {message: getExitRegExp('2')});
	t.is(exitCode, 2);
	const expectedName = process.platform === 'win32' ? 'Unknown system error -2' : 'ENOENT';
	t.is(exitCodeName, expectedName);
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

test('error.killed is true if process was killed directly', async t => {
	const cp = execa('forever');

	cp.kill();

	const {killed} = await t.throwsAsync(cp, {message: /was killed with SIGTERM/});
	t.true(killed);
});

test('error.killed is false if process was killed indirectly', async t => {
	const cp = execa('forever');

	process.kill(cp.pid, 'SIGINT');

	// `process.kill()` is emulated by Node.js on Windows
	const message = process.platform === 'win32' ? /failed with exit code 1/ : /was killed with SIGINT/;
	const {killed} = await t.throwsAsync(cp, {message});
	t.false(killed);
});

test('result.killed is false if not killed', async t => {
	const {killed} = await execa('noop');
	t.false(killed);
});

test('result.killed is false if not killed, in sync mode', t => {
	const {killed} = execa.sync('noop');
	t.false(killed);
});

test('result.killed is false on process error', async t => {
	const {killed} = await t.throwsAsync(execa('wrong command'));
	t.false(killed);
});

test('result.killed is false on process error, in sync mode', t => {
	const {killed} = t.throws(() => {
		execa.sync('wrong command');
	});
	t.false(killed);
});

if (process.platform === 'darwin') {
	test.cb('sanity check: child_process.exec also has killed.false if killed indirectly', t => {
		const {pid} = childProcess.exec('forever', error => {
			t.truthy(error);
			t.false(error.killed);
			t.end();
		});

		process.kill(pid, 'SIGINT');
	});
}

if (process.platform !== 'win32') {
	test('error.signal is SIGINT', async t => {
		const cp = execa('forever');

		process.kill(cp.pid, 'SIGINT');

		const {signal} = await t.throwsAsync(cp, {message: /was killed with SIGINT/});
		t.is(signal, 'SIGINT');
	});

	test('error.signal is SIGTERM', async t => {
		const cp = execa('forever');

		process.kill(cp.pid, 'SIGTERM');

		const {signal} = await t.throwsAsync(cp, {message: /was killed with SIGTERM/});
		t.is(signal, 'SIGTERM');
	});

	test('custom error.signal', async t => {
		const {signal} = await t.throwsAsync(execa('forever', {killSignal: 'SIGHUP', timeout: 1, message: TIMEOUT_REGEXP}));
		t.is(signal, 'SIGHUP');
	});
}

test('result.signal is undefined for successful execution', async t => {
	const {signal} = await execa('noop');
	t.is(signal, undefined);
});

test('result.signal is undefined if process failed, but was not killed', async t => {
	const {signal} = await t.throwsAsync(execa('exit', [2]), {message: getExitRegExp('2')});
	t.is(signal, undefined);
});

async function testExitCode(t, num) {
	const {exitCode} = await t.throwsAsync(execa('exit', [`${num}`]), {message: getExitRegExp(num)});
	t.is(exitCode, num);
}

test('error.exitCode is 2', testExitCode, 2);
test('error.exitCode is 3', testExitCode, 3);
test('error.exitCode is 4', testExitCode, 4);

test('timeout kills the process if it times out', async t => {
	const {killed, timedOut} = await t.throwsAsync(execa('forever', {timeout: 1, message: TIMEOUT_REGEXP}));
	t.false(killed);
	t.true(timedOut);
});

test('timeout kills the process if it times out, in sync mode', async t => {
	const {killed, timedOut} = await t.throws(() => {
		execa.sync('forever', {timeout: 1, message: TIMEOUT_REGEXP});
	});
	t.false(killed);
	t.true(timedOut);
});

test('timeout does not kill the process if it does not time out', async t => {
	const {timedOut} = await execa('delay', ['500'], {timeout: 1e8});
	t.false(timedOut);
});

test('timedOut is false if no timeout was set', async t => {
	const {timedOut} = await execa('noop');
	t.false(timedOut);
});

test('timedOut will be false if no timeout was set and zero exit code in sync mode', t => {
	const {timedOut} = execa.sync('noop');
	t.false(timedOut);
});

async function errorMessage(t, expected, ...args) {
	await t.throwsAsync(execa('exit', args), {message: expected});
}

errorMessage.title = (message, expected) => `error.message matches: ${expected}`;

test(errorMessage, /Command failed with exit code 2.*: exit 2 foo bar/, 2, 'foo', 'bar');
test(errorMessage, /Command failed with exit code 3.*: exit 3 baz quz/, 3, 'baz', 'quz');

async function command(t, expected, ...args) {
	const {command: failCommand} = await t.throwsAsync(execa('fail', args));
	t.is(failCommand, `fail${expected}`);

	const {command} = await execa('noop', args);
	t.is(command, `noop${expected}`);
}

command.title = (message, expected) => `command is: ${JSON.stringify(expected)}`;

test(command, ' foo bar', 'foo', 'bar');
test(command, ' baz quz', 'baz', 'quz');
test(command, '');

// When child process exits before parent process
async function spawnAndExit(t, cleanup, detached) {
	await t.notThrowsAsync(execa('sub-process-exit', [cleanup, detached]));
}

test('spawnAndExit', spawnAndExit, false, false);
test('spawnAndExit cleanup', spawnAndExit, true, false);
test('spawnAndExit detached', spawnAndExit, false, true);
test('spawnAndExit cleanup detached', spawnAndExit, true, true);

// When parent process exits before child process
async function spawnAndKill(t, signal, cleanup, detached, isKilled) {
	const subprocess = execa('sub-process', [cleanup, detached], {stdio: ['ignore', 'ignore', 'ignore', 'ipc']});

	const pid = await pEvent(subprocess, 'message');
	t.true(Number.isInteger(pid));
	t.true(isRunning(pid));

	process.kill(subprocess.pid, signal);

	await t.throwsAsync(subprocess);

	t.false(isRunning(subprocess.pid));
	t.is(isRunning(pid), !isKilled);

	if (!isKilled) {
		process.kill(pid, 'SIGKILL');
	}
}

// Without `options.cleanup`:
//   - on Windows subprocesses are killed if `options.detached: false`, but not
//     if `options.detached: true`
//   - on Linux subprocesses are never killed regardless of `options.detached`
// With `options.cleanup`, subprocesses are always killed
//   - `options.cleanup` with SIGKILL is a noop, since it cannot be handled
const exitIfWindows = process.platform === 'win32';
test('spawnAndKill SIGTERM', spawnAndKill, 'SIGTERM', false, false, exitIfWindows);
test('spawnAndKill SIGKILL', spawnAndKill, 'SIGKILL', false, false, exitIfWindows);
test('spawnAndKill cleanup SIGTERM', spawnAndKill, 'SIGTERM', true, false, true);
test('spawnAndKill cleanup SIGKILL', spawnAndKill, 'SIGKILL', true, false, exitIfWindows);
test('spawnAndKill detached SIGTERM', spawnAndKill, 'SIGTERM', false, true, false);
test('spawnAndKill detached SIGKILL', spawnAndKill, 'SIGKILL', false, true, false);
test('spawnAndKill cleanup detached SIGTERM', spawnAndKill, 'SIGTERM', true, true, false);
test('spawnAndKill cleanup detached SIGKILL', spawnAndKill, 'SIGKILL', true, true, false);

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

test('do not buffer when streaming', async t => {
	const {stdout} = execa('max-buffer', ['stdout', '21'], {maxBuffer: 10});
	const result = await getStream(stdout);
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

test('cancel method kills the subprocess', t => {
	const subprocess = execa('node');
	subprocess.cancel();
	t.true(subprocess.killed);
});

test('result.isCanceled is false when spawned.cancel() isn\'t called (success)', async t => {
	const {isCanceled} = await execa('noop');
	t.false(isCanceled);
});

test('result.isCanceled is false when spawned.cancel() isn\'t called (failure)', async t => {
	const {isCanceled} = await t.throwsAsync(execa('fail'));
	t.false(isCanceled);
});

test('result.isCanceled is false when spawned.cancel() isn\'t called in sync mode (success)', t => {
	const {isCanceled} = execa.sync('noop');
	t.false(isCanceled);
});

test('result.isCanceled is false when spawned.cancel() isn\'t called in sync mode (failure)', t => {
	const {isCanceled} = t.throws(() => {
		execa.sync('fail');
	});
	t.false(isCanceled);
});

test('calling cancel method throws an error with message "Command was canceled"', async t => {
	const subprocess = execa('noop');
	subprocess.cancel();
	await t.throwsAsync(subprocess, {message: /Command was canceled/});
});

test('error.isCanceled is true when cancel method is used', async t => {
	const subprocess = execa('noop');
	subprocess.cancel();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
});

test('error.isCanceled is false when kill method is used', async t => {
	const subprocess = execa('noop');
	subprocess.kill();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.false(isCanceled);
});

test('calling cancel method twice should show the same behaviour as calling it once', async t => {
	const subprocess = execa('noop');
	subprocess.cancel();
	subprocess.cancel();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
	t.true(subprocess.killed);
});

test('calling cancel method on a successfully completed process does not make result.isCanceled true', async t => {
	const subprocess = execa('noop');
	const {isCanceled} = await subprocess;
	subprocess.cancel();
	t.false(isCanceled);
});

test('calling cancel method on a process which has been killed does not make error.isCanceled true', async t => {
	const subprocess = execa('noop');
	subprocess.kill();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.false(isCanceled);
});

test('allow commands with spaces and no array arguments', async t => {
	const {stdout} = await execa('./fixtures/command with space');
	t.is(stdout, '');
});

test('allow commands with spaces and array arguments', async t => {
	const {stdout} = await execa('./fixtures/command with space', ['foo', 'bar']);
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
	const {stdout} = await execa.command('./fixtures/command\\ with\\ space foo bar');
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
