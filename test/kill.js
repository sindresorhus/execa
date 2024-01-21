import process from 'node:process';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {pEvent} from 'p-event';
import isRunning from 'is-running';
import {execa, execaSync} from '../index.js';
import {setFixtureDir} from './helpers/fixtures-dir.js';

setFixtureDir();

const TIMEOUT_REGEXP = /timed out after/;

test('kill("SIGKILL") should terminate cleanly', async t => {
	const subprocess = execa('no-killable.js', {stdio: ['ipc']});
	await pEvent(subprocess, 'message');

	subprocess.kill('SIGKILL');

	const {signal} = await t.throwsAsync(subprocess);
	t.is(signal, 'SIGKILL');
});

// `SIGTERM` cannot be caught on Windows, and it always aborts the process (like `SIGKILL` on Unix).
// Therefore, this feature and those tests do not make sense on Windows.
if (process.platform !== 'win32') {
	test('`forceKillAfterTimeout: false` should not kill after a timeout', async t => {
		const subprocess = execa('no-killable.js', {stdio: ['ipc']});
		await pEvent(subprocess, 'message');

		subprocess.kill('SIGTERM', {forceKillAfterTimeout: false});

		t.true(isRunning(subprocess.pid));
		subprocess.kill('SIGKILL');

		const {signal} = await t.throwsAsync(subprocess);
		t.is(signal, 'SIGKILL');
	});

	const testForceKill = async (t, killArguments) => {
		const subprocess = execa('no-killable.js', {stdio: ['ipc']});
		await pEvent(subprocess, 'message');

		subprocess.kill(...killArguments);

		const {signal} = await t.throwsAsync(subprocess);
		t.is(signal, 'SIGKILL');
	};

	test('`forceKillAfterTimeout: number` should kill after a timeout', testForceKill, ['SIGTERM', {forceKillAfterTimeout: 50}]);
	test('`forceKillAfterTimeout: true` should kill after a timeout', testForceKill, ['SIGTERM', {forceKillAfterTimeout: true}]);
	test('kill("SIGTERM") should kill after a timeout', testForceKill, ['SIGTERM']);
	test('kill() with no arguments should kill after a timeout', testForceKill, []);

	const testInvalidForceKill = async (t, forceKillAfterTimeout) => {
		const childProcess = execa('noop.js');
		t.throws(() => {
			childProcess.kill('SIGTERM', {forceKillAfterTimeout});
		}, {instanceOf: TypeError, message: /non-negative integer/});
		const {signal} = await t.throwsAsync(childProcess);
		t.is(signal, 'SIGTERM');
	};

	test('`forceKillAfterTimeout` should not be NaN', testInvalidForceKill, Number.NaN);
	test('`forceKillAfterTimeout` should not be negative', testInvalidForceKill, -1);
}

test('execa() returns a promise with kill()', async t => {
	const subprocess = execa('noop.js', ['foo']);
	t.is(typeof subprocess.kill, 'function');
	await subprocess;
});

test('timeout kills the process if it times out', async t => {
	const {isTerminated, timedOut} = await t.throwsAsync(execa('noop.js', {timeout: 1}), {message: TIMEOUT_REGEXP});
	t.true(isTerminated);
	t.true(timedOut);
});

test('timeout kills the process if it times out, in sync mode', async t => {
	const {isTerminated, timedOut} = await t.throws(() => {
		execaSync('noop.js', {timeout: 1, message: TIMEOUT_REGEXP});
	});
	t.true(isTerminated);
	t.true(timedOut);
});

test('timeout does not kill the process if it does not time out', async t => {
	const {timedOut} = await execa('delay.js', ['500'], {timeout: 1e8});
	t.false(timedOut);
});

const INVALID_TIMEOUT_REGEXP = /`timeout` option to be a non-negative integer/;

test('timeout must not be negative', async t => {
	await t.throws(() => {
		execa('noop.js', {timeout: -1});
	}, {message: INVALID_TIMEOUT_REGEXP});
});

test('timeout must be an integer', async t => {
	await t.throws(() => {
		execa('noop.js', {timeout: false});
	}, {message: INVALID_TIMEOUT_REGEXP});
});

test('timedOut is false if timeout is undefined', async t => {
	const {timedOut} = await execa('noop.js');
	t.false(timedOut);
});

test('timedOut is false if timeout is 0', async t => {
	const {timedOut} = await execa('noop.js', {timeout: 0});
	t.false(timedOut);
});

test('timedOut is false if timeout is undefined and exit code is 0 in sync mode', t => {
	const {timedOut} = execaSync('noop.js');
	t.false(timedOut);
});

// When child process exits before parent process
const spawnAndExit = async (t, cleanup, detached) => {
	await t.notThrowsAsync(execa('sub-process-exit.js', [cleanup, detached]));
};

test('spawnAndExit', spawnAndExit, false, false);
test('spawnAndExit cleanup', spawnAndExit, true, false);
test('spawnAndExit detached', spawnAndExit, false, true);
test('spawnAndExit cleanup detached', spawnAndExit, true, true);

// When parent process exits before child process
const spawnAndKill = async (t, [signal, cleanup, detached, isKilled]) => {
	const subprocess = execa('sub-process.js', [cleanup, detached], {stdio: ['ignore', 'ignore', 'ignore', 'ipc']});

	const pid = await pEvent(subprocess, 'message');
	t.true(Number.isInteger(pid));
	t.true(isRunning(pid));

	process.kill(subprocess.pid, signal);

	await t.throwsAsync(subprocess);

	// The `cleanup` option can introduce a race condition in this test.
	// This is especially true when run concurrently, so we use `test.serial()` and a manual timeout.
	if (signal === 'SIGTERM' && cleanup && !detached) {
		await setTimeout(1e3);
	}

	t.false(isRunning(subprocess.pid));
	t.not(isRunning(pid), isKilled);

	if (!isKilled) {
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
test('spawnAndKill SIGTERM', spawnAndKill, ['SIGTERM', false, false, exitIfWindows]);
test('spawnAndKill SIGKILL', spawnAndKill, ['SIGKILL', false, false, exitIfWindows]);
test.serial('spawnAndKill cleanup SIGTERM', spawnAndKill, ['SIGTERM', true, false, true]);
test('spawnAndKill cleanup SIGKILL', spawnAndKill, ['SIGKILL', true, false, exitIfWindows]);
test('spawnAndKill detached SIGTERM', spawnAndKill, ['SIGTERM', false, true, false]);
test('spawnAndKill detached SIGKILL', spawnAndKill, ['SIGKILL', false, true, false]);
test('spawnAndKill cleanup detached SIGTERM', spawnAndKill, ['SIGTERM', true, true, false]);
test('spawnAndKill cleanup detached SIGKILL', spawnAndKill, ['SIGKILL', true, true, false]);

// See #128
test('removes exit handler on exit', async t => {
	// @todo this relies on `signal-exit` internals
	const exitListeners = globalThis[Symbol.for('signal-exit emitter')].listeners.exit;

	const subprocess = execa('noop.js');
	const listener = exitListeners.at(-1);

	await subprocess;
	t.false(exitListeners.includes(listener));
});

test('result.isCanceled is false when abort isn\'t called (success)', async t => {
	const {isCanceled} = await execa('noop.js');
	t.false(isCanceled);
});

test('result.isCanceled is false when abort isn\'t called (failure)', async t => {
	const {isCanceled} = await t.throwsAsync(execa('fail.js'));
	t.false(isCanceled);
});

test('result.isCanceled is false when abort isn\'t called in sync mode (success)', t => {
	const {isCanceled} = execaSync('noop.js');
	t.false(isCanceled);
});

test('result.isCanceled is false when abort isn\'t called in sync mode (failure)', t => {
	const {isCanceled} = t.throws(() => {
		execaSync('fail.js');
	});
	t.false(isCanceled);
});

test('calling abort is not considered a signal termination', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {signal: abortController.signal});
	abortController.abort();
	const {isTerminated, signal} = await t.throwsAsync(subprocess);
	t.false(isTerminated);
	t.is(signal, undefined);
});

test('error.isCanceled is true when abort is used', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {signal: abortController.signal});
	abortController.abort();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
});

test('error.isCanceled is false when kill method is used', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {signal: abortController.signal});
	subprocess.kill();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.false(isCanceled);
});

test('calling abort throws an error with message "Command was canceled"', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {signal: abortController.signal});
	abortController.abort();
	await t.throwsAsync(subprocess, {message: /Command was canceled/});
});

test('calling abort twice should show the same behaviour as calling it once', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {signal: abortController.signal});
	abortController.abort();
	abortController.abort();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
});

test('calling abort on a successfully completed process does not make result.isCanceled true', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {signal: abortController.signal});
	const result = await subprocess;
	abortController.abort();
	t.false(result.isCanceled);
});
