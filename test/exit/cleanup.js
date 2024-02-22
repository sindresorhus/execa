import process from 'node:process';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {pEvent} from 'p-event';
import isRunning from 'is-running';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const isWindows = process.platform === 'win32';

// When child process exits before parent process
const spawnAndExit = async (t, cleanup, detached) => {
	await t.notThrowsAsync(execa('nested.js', [JSON.stringify({cleanup, detached}), 'noop.js']));
};

test('spawnAndExit', spawnAndExit, false, false);
test('spawnAndExit cleanup', spawnAndExit, true, false);
test('spawnAndExit detached', spawnAndExit, false, true);
test('spawnAndExit cleanup detached', spawnAndExit, true, true);

// When parent process exits before child process
const spawnAndKill = async (t, [signal, cleanup, detached, isKilled]) => {
	const subprocess = execa('sub-process.js', [cleanup, detached], {stdio: 'ignore', ipc: true});

	const pid = await pEvent(subprocess, 'message');
	t.true(Number.isInteger(pid));
	t.true(isRunning(pid));

	process.kill(subprocess.pid, signal);

	await t.throwsAsync(subprocess);
	t.false(isRunning(subprocess.pid));

	if (isKilled) {
		await Promise.race([
			setTimeout(1e4, undefined, {ref: false}),
			pollForProcessExit(pid),
		]);
		t.is(isRunning(pid), false);
	} else {
		t.is(isRunning(pid), true);
		process.kill(pid, 'SIGKILL');
	}
};

const pollForProcessExit = async pid => {
	while (isRunning(pid)) {
		// eslint-disable-next-line no-await-in-loop
		await setTimeout(100);
	}
};

// Without `options.cleanup`:
//   - on Windows subprocesses are killed if `options.detached: false`, but not
//     if `options.detached: true`
//   - on Linux subprocesses are never killed regardless of `options.detached`
// With `options.cleanup`, subprocesses are always killed
//   - `options.cleanup` with SIGKILL is a noop, since it cannot be handled
test('spawnAndKill SIGTERM', spawnAndKill, ['SIGTERM', false, false, isWindows]);
test('spawnAndKill SIGKILL', spawnAndKill, ['SIGKILL', false, false, isWindows]);
test('spawnAndKill cleanup SIGTERM', spawnAndKill, ['SIGTERM', true, false, true]);
test('spawnAndKill cleanup SIGKILL', spawnAndKill, ['SIGKILL', true, false, isWindows]);
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

test('detach child process', async t => {
	const {stdout} = await execa('detach.js');
	const pid = Number(stdout);
	t.true(Number.isInteger(pid));
	t.true(isRunning(pid));

	process.kill(pid, 'SIGKILL');
});
