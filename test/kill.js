import path from 'path';
import test from 'ava';
import pEvent from 'p-event';
import isRunning from 'is-running';
import execa from '..';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

const TIMEOUT_REGEXP = /timed out after/;

test('kill("SIGKILL") should terminate cleanly', async t => {
	const subprocess = execa('node', ['./test/fixtures/no-killable'], {stdio: ['ipc']});
	await pEvent(subprocess, 'message');

	subprocess.kill('SIGKILL');

	const {signal} = await t.throwsAsync(subprocess);
	t.is(signal, 'SIGKILL');
});

// `SIGTERM` cannot be caught on Windows, and it always aborts the process (like `SIGKILL` on Unix).
// Therefore, this feature and those tests do not make sense on Windows.
if (process.platform !== 'win32') {
	test('`forceKillAfterTimeout: false` should not kill after a timeout', async t => {
		const subprocess = execa('node', ['./test/fixtures/no-killable'], {stdio: ['ipc']});
		await pEvent(subprocess, 'message');

		subprocess.kill('SIGTERM', {forceKillAfterTimeout: false});

		t.true(isRunning(subprocess.pid));
		subprocess.kill('SIGKILL');
	});

	test('`forceKillAfterTimeout: number` should kill after a timeout', async t => {
		const subprocess = execa('node', ['./test/fixtures/no-killable'], {stdio: ['ipc']});
		await pEvent(subprocess, 'message');

		subprocess.kill('SIGTERM', {forceKillAfterTimeout: 50});

		const {signal} = await t.throwsAsync(subprocess);
		t.is(signal, 'SIGKILL');
	});

	test('`forceKillAfterTimeout: true` should kill after a timeout', async t => {
		const subprocess = execa('node', ['./test/fixtures/no-killable'], {stdio: ['ipc']});
		await pEvent(subprocess, 'message');

		subprocess.kill('SIGTERM', {forceKillAfterTimeout: true});

		const {signal} = await t.throwsAsync(subprocess);
		t.is(signal, 'SIGKILL');
	});

	test('kill() with no arguments should kill after a timeout', async t => {
		const subprocess = execa('node', ['./test/fixtures/no-killable'], {stdio: ['ipc']});
		await pEvent(subprocess, 'message');

		subprocess.kill();

		const {signal} = await t.throwsAsync(subprocess);
		t.is(signal, 'SIGKILL');
	});

	test('`forceKillAfterTimeout` should not be NaN', t => {
		t.throws(() => {
			execa('noop').kill('SIGTERM', {forceKillAfterTimeout: NaN});
		}, {instanceOf: TypeError, message: /non-negative integer/});
	});

	test('`forceKillAfterTimeout` should not be negative', t => {
		t.throws(() => {
			execa('noop').kill('SIGTERM', {forceKillAfterTimeout: -1});
		}, {instanceOf: TypeError, message: /non-negative integer/});
	});
}

test('execa() returns a promise with kill()', t => {
	const {kill} = execa('noop', ['foo']);
	t.is(typeof kill, 'function');
});

test('timeout kills the process if it times out', async t => {
	const {killed, timedOut} = await t.throwsAsync(execa('noop', {timeout: 1}), TIMEOUT_REGEXP);
	t.false(killed);
	t.true(timedOut);
});

test('timeout kills the process if it times out, in sync mode', async t => {
	const {killed, timedOut} = await t.throws(() => {
		execa.sync('noop', {timeout: 1, message: TIMEOUT_REGEXP});
	});
	t.false(killed);
	t.true(timedOut);
});

test('timeout does not kill the process if it does not time out', async t => {
	const {timedOut} = await execa('delay', ['500'], {timeout: 1e8});
	t.false(timedOut);
});

const INVALID_TIMEOUT_REGEXP = /`timeout` option to be a non-negative integer/;

test('timeout must not be negative', async t => {
	await t.throws(() => {
		execa('noop', {timeout: -1});
	}, INVALID_TIMEOUT_REGEXP);
});

test('timeout must be an integer', async t => {
	await t.throws(() => {
		execa('noop', {timeout: false});
	}, INVALID_TIMEOUT_REGEXP);
});

test('timedOut is false if timeout is undefined', async t => {
	const {timedOut} = await execa('noop');
	t.false(timedOut);
});

test('timedOut is false if timeout is 0', async t => {
	const {timedOut} = await execa('noop', {timeout: 0});
	t.false(timedOut);
});

test('timedOut is false if timeout is undefined and exit code is 0 in sync mode', t => {
	const {timedOut} = execa.sync('noop');
	t.false(timedOut);
});

// When child process exits before parent process
const spawnAndExit = async (t, cleanup, detached) => {
	await t.notThrowsAsync(execa('sub-process-exit', [cleanup, detached]));
};

test('spawnAndExit', spawnAndExit, false, false);
test('spawnAndExit cleanup', spawnAndExit, true, false);
test('spawnAndExit detached', spawnAndExit, false, true);
test('spawnAndExit cleanup detached', spawnAndExit, true, true);

// When parent process exits before child process
const spawnAndKill = async (t, signal, cleanup, detached, isKilled) => {
	const subprocess = execa('sub-process', [cleanup, detached], {stdio: ['ignore', 'ignore', 'ignore', 'ipc']});

	const pid = await pEvent(subprocess, 'message');
	t.true(Number.isInteger(pid));
	t.true(isRunning(pid));

	process.kill(subprocess.pid, signal);

	await t.throwsAsync(subprocess);

	t.false(isRunning(subprocess.pid));
	t.is(isRunning(pid), !isKilled);

	if (isRunning(pid)) {
		process.kill(pid, 'SIGKILL');
	}
};

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

// See #128
test('removes exit handler on exit', async t => {
	// FIXME: This relies on `signal-exit` internals
	const emitter = process.__signal_exit_emitter__;

	const subprocess = execa('noop');
	const listener = emitter.listeners('exit').pop();

	await new Promise((resolve, reject) => {
		subprocess.on('error', reject);
		subprocess.on('exit', resolve);
	});

	const included = emitter.listeners('exit').includes(listener);
	t.false(included);
});

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
