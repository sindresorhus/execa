import process from 'node:process';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import isRunning from 'is-running';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const isWindows = process.platform === 'win32';

// When subprocess exits before current process
const spawnAndExit = async (t, worker, cleanup, detached) => {
	const {nestedResult: {stdout}} = await nestedSubprocess('noop-fd.js', ['1', foobarString], {worker, cleanup, detached});
	t.is(stdout, foobarString);
};

test('spawnAndExit', spawnAndExit, false, false, false);
test('spawnAndExit cleanup', spawnAndExit, false, true, false);
test('spawnAndExit detached', spawnAndExit, false, false, true);
test('spawnAndExit cleanup detached', spawnAndExit, false, true, true);
test('spawnAndExit, worker', spawnAndExit, true, false, false);
test('spawnAndExit cleanup, worker', spawnAndExit, true, true, false);
test('spawnAndExit detached, worker', spawnAndExit, true, false, true);
test('spawnAndExit cleanup detached, worker', spawnAndExit, true, true, true);

// When current process exits before subprocess
const spawnAndKill = async (t, [signal, cleanup, detached, isKilled]) => {
	const subprocess = execa('ipc-send-pid.js', [cleanup, detached], {stdio: 'ignore', ipc: true});

	const pid = await subprocess.getOneMessage();
	t.true(Number.isInteger(pid));
	t.true(isRunning(pid));

	process.kill(subprocess.pid, signal);

	await t.throwsAsync(subprocess);
	t.false(isRunning(subprocess.pid));

	if (isKilled) {
		await Promise.race([
			setTimeout(1e4, undefined, {ref: false}),
			pollForSubprocessExit(pid),
		]);
		t.is(isRunning(pid), false);
	} else {
		t.is(isRunning(pid), true);
		process.kill(pid, 'SIGKILL');
	}
};

const pollForSubprocessExit = async pid => {
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

test('detach subprocess', async t => {
	const {stdout} = await execa('detach.js');
	const pid = Number(stdout);
	t.true(Number.isInteger(pid));
	t.true(isRunning(pid));

	process.kill(pid, 'SIGKILL');
});

test('Cannot use "detached" option, sync', t => {
	t.throws(() => {
		execaSync('empty.js', {detached: true});
	}, {message: /The "detached: true" option cannot be used/});
});
