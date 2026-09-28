import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import path from 'node:path/win32';
import process from 'node:process';
import {setTimeout} from 'node:timers/promises';
import test from 'node:test';
import isRunning from 'is-running';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {getTaskkillFile} from '../../lib/terminate/kill-descendants.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const isWindows = process.platform === 'win32';

const pollForSubprocessExit = async pid => {
	while (isRunning(pid)) {
		// eslint-disable-next-line no-await-in-loop
		await setTimeout(100);
	}
};

// `ipc-send-pid.js` spawns a descendant process (`forever.js`) and sends back its PID.
const spawnDescendant = async (killDescendants, options) => {
	const subprocess = execa('ipc-send-pid.js', ['false', 'false'], {
		stdio: 'ignore',
		ipc: true,
		killDescendants,
		...options,
	});
	const descendantPid = await subprocess.getOneMessage();
	return {subprocess, descendantPid};
};

test('killDescendants terminates descendant processes', async () => {
	const {subprocess, descendantPid} = await spawnDescendant(true);
	assert.ok(isRunning(descendantPid));

	subprocess.kill();
	await assertRejects(subprocess);
	assert.ok(!isRunning(subprocess.pid));

	await Promise.race([
		setTimeout(1e4, undefined, {ref: false}),
		pollForSubprocessExit(descendantPid),
	]);
	assert.ok(!isRunning(descendantPid));
});

test('killDescendants also terminates descendant processes when the subprocess times out', async () => {
	const {subprocess, descendantPid} = await spawnDescendant(true, {timeout: 1000});
	assert.ok(isRunning(descendantPid));

	const {timedOut} = await assertRejects(subprocess);
	assert.equal(timedOut, true);

	await Promise.race([
		setTimeout(1e4, undefined, {ref: false}),
		pollForSubprocessExit(descendantPid),
	]);
	assert.ok(!isRunning(descendantPid));
});

// On Windows, terminating the direct subprocess already terminates its descendants, so this
// only asserts the default Unix behavior of leaving descendants running.
if (!isWindows) {
	test('descendant processes are not terminated without killDescendants', async () => {
		const {subprocess, descendantPid} = await spawnDescendant(false);
		assert.ok(isRunning(descendantPid));

		subprocess.kill();
		await assertRejects(subprocess);
		assert.ok(!isRunning(subprocess.pid));

		assert.ok(isRunning(descendantPid));
		process.kill(descendantPid, 'SIGKILL');
	});

	test('timeout does not terminate descendants without killDescendants', async () => {
		const {subprocess, descendantPid} = await spawnDescendant(false, {timeout: 1000});
		assert.ok(isRunning(descendantPid));

		const {timedOut} = await assertRejects(subprocess);
		assert.equal(timedOut, true);
		assert.ok(isRunning(descendantPid));
		process.kill(descendantPid, 'SIGKILL');
	});
}

/*
The `forceKillAfterDelay` escalation happens after the subprocess exited, since that is when its termination has been noticed.
A descendant which ignores `SIGTERM` is still running then, so the escalation must still reach it.
Otherwise, since that descendant keeps the subprocess' `stdout` open, awaiting the subprocess would never settle.
*/
test('killDescendants escalates to descendants which outlive the subprocess', async () => {
	const subprocess = execa('ipc-send-pid-stubborn.js', {
		ipc: true,
		killDescendants: true,
		forceKillAfterDelay: 1000,
	});
	const descendantPid = await subprocess.getOneMessage();
	assert.ok(isRunning(descendantPid));

	subprocess.kill();
	const settled = await Promise.race([
		assertRejects(subprocess).then(() => 'settled'),
		setTimeout(1e4, 'pending', {ref: false}),
	]);
	assert.equal(settled, 'settled');
	assert.ok(!isRunning(descendantPid));
});

if (!isWindows) {
	// The process group ID stays reserved while a descendant is running, so the descendants which outlive the subprocess can still be terminated once Execa is done with it
	test('killDescendants terminates background descendants once Execa is done with the subprocess', async () => {
		const subprocess = execa({shell: true, killDescendants: true})`sleep 100 > /dev/null 2>&1 & echo $!`;
		const {stdout} = await subprocess;
		const descendantPid = Number(stdout);

		try {
			assert.ok(isRunning(descendantPid));
			assert.ok(subprocess.kill());
			await pollForSubprocessExit(descendantPid);
		} finally {
			if (isRunning(descendantPid)) {
				process.kill(descendantPid, 'SIGKILL');
			}
		}
	});

	// Once the whole process group exited, its PID is not signaled since `process.kill()` fails
	test('killDescendants returns false once the whole process group exited', async () => {
		const subprocess = execa('empty.js', {killDescendants: true});
		await subprocess;
		assert.equal(subprocess.kill(), false);
	});

	// While Execa is still waiting on the subprocess, its process group is still its own
	test('killDescendants signals the process group while Execa is not done with the subprocess', async t => {
		const subprocess = execa('forever.js', {killDescendants: true});

		const originalKill = process.kill;
		t.after(() => {
			process.kill = originalKill;
		});

		const signaledProcesses = [];
		process.kill = (pid, signal) => {
			signaledProcesses.push([pid, signal]);
			return originalKill(pid, signal);
		};

		assert.ok(subprocess.kill('SIGTERM'));
		assert.deepEqual(signaledProcesses, [[-subprocess.pid, 'SIGTERM']]);
		process.kill = originalKill;
		await assertRejects(subprocess);
	});
}

test('Cannot use "killDescendants" option, sync', () => {
	assertThrows(() => {
		execaSync('empty.js', {killDescendants: true});
	}, {message: /The "killDescendants: true" option cannot be used/});
});

test('taskkill is resolved from the Windows directory when available', t => {
	const {SystemRoot, windir} = process.env;
	t.after(() => {
		restoreEnvironment('SystemRoot', SystemRoot);
		restoreEnvironment('windir', windir);
	});

	process.env.SystemRoot = 'C:\\Windows';
	process.env.windir = 'D:\\Windows';
	assert.equal(getTaskkillFile(), path.join('C:\\Windows', 'System32', 'taskkill.exe'));

	process.env.SystemRoot = 'C:/Windows';
	assert.equal(getTaskkillFile(), path.join('C:/Windows', 'System32', 'taskkill.exe'));

	process.env.SystemRoot = 'Windows';
	assert.equal(getTaskkillFile(), path.join('D:\\Windows', 'System32', 'taskkill.exe'));

	process.env.SystemRoot = '\\Windows';
	assert.equal(getTaskkillFile(), path.join('D:\\Windows', 'System32', 'taskkill.exe'));

	delete process.env.SystemRoot;
	assert.equal(getTaskkillFile(), path.join('D:\\Windows', 'System32', 'taskkill.exe'));

	process.env.windir = 'Windows';
	assert.equal(getTaskkillFile(), undefined);

	process.env.windir = '\\Windows';
	assert.equal(getTaskkillFile(), undefined);

	process.env.windir = '\\\\server\\share\\Windows';
	assert.equal(getTaskkillFile(), undefined);

	process.env.windir = '';
	assert.equal(getTaskkillFile(), undefined);

	delete process.env.windir;
	assert.equal(getTaskkillFile(), undefined);
});

/*
The `taskkill` logic only runs on Windows, so the platform, the Windows directory and `taskkill` itself are faked to test it on any OS.
`lib/terminate/kill-descendants.js` reads `process.platform` when it is loaded, so it must be re-imported once the platform has been faked.
*/
let fakeWindowsCount = 0;

const fakeWindows = async (t, systemRoot, execFile = () => {}) => {
	const platformDescriptor = Object.getOwnPropertyDescriptor(process, 'platform');
	const originalExecFile = childProcess.execFile;
	const {SystemRoot, windir} = process.env;
	t.after(() => {
		Object.defineProperty(process, 'platform', platformDescriptor);
		childProcess.execFile = originalExecFile;
		syncBuiltinESMExports();
		restoreEnvironment('SystemRoot', SystemRoot);
		restoreEnvironment('windir', windir);
	});

	Object.defineProperty(process, 'platform', {value: 'win32'});
	process.env.SystemRoot = systemRoot;
	delete process.env.windir;
	childProcess.execFile = execFile;
	syncBuiltinESMExports();

	fakeWindowsCount += 1;
	const {getKillFunction} = await import(`../../lib/terminate/kill-descendants.js?fake-windows=${fakeWindowsCount}`);
	return getKillFunction;
};

// Mimics the `ChildProcess` properties used to send the signal and to detect whether the subprocess is still running
const createFakeSubprocess = ({exitCode = null, signalCode = null} = {}) => {
	const subprocess = {
		pid: 123,
		exitCode,
		signalCode,
		kill(signal) {
			subprocess.killedWith = signal;
			return true;
		},
	};
	return subprocess;
};

test('taskkill fallback uses direct subprocess kill when Windows directory is unavailable', async t => {
	const getKillFunction = await fakeWindows(t, 'Windows');
	const subprocess = createFakeSubprocess();

	const kill = getKillFunction(subprocess, {killDescendants: true});
	assert.ok(kill('SIGTERM'));
	assert.equal(subprocess.killedWith, 'SIGTERM');
});

test('taskkill fallback uses direct subprocess kill when taskkill cannot be spawned', async t => {
	const taskkillFailure = Promise.withResolvers();
	const getKillFunction = await fakeWindows(t, 'C:\\MissingWindows', (file, arguments_, callback) => {
		assert.equal(file, path.join('C:\\MissingWindows', 'System32', 'taskkill.exe'));
		assert.deepEqual(arguments_, ['/pid', '123', '/T', '/F']);
		queueMicrotask(() => {
			callback(new Error('spawn failed'));
			taskkillFailure.resolve();
		});
	});
	const subprocess = createFakeSubprocess();

	const kill = getKillFunction(subprocess, {killDescendants: true});
	assert.ok(kill('SIGTERM'));
	assert.equal(subprocess.killedWith, undefined);

	await taskkillFailure.promise;
	assert.equal(subprocess.killedWith, 'SIGTERM');
});

// On Windows, the PID is not reserved anymore once the subprocess exited, even while Execa is still waiting on it
test('taskkill is not spawned once the subprocess exited', async t => {
	let isTaskkillSpawned = false;
	const getKillFunction = await fakeWindows(t, 'C:\\Windows', () => {
		isTaskkillSpawned = true;
	});
	const subprocess = createFakeSubprocess({exitCode: 0});

	const kill = getKillFunction(subprocess, {killDescendants: true});
	assert.equal(kill('SIGTERM'), false);
	assert.equal(isTaskkillSpawned, false);
	assert.equal(subprocess.killedWith, undefined);
});

// A subprocess which never spawned has no PID to signal
test('taskkill is not spawned when the subprocess has no PID', async t => {
	let isTaskkillSpawned = false;
	const getKillFunction = await fakeWindows(t, 'C:\\Windows', () => {
		isTaskkillSpawned = true;
	});
	const subprocess = createFakeSubprocess();
	subprocess.pid = undefined;

	const kill = getKillFunction(subprocess, {killDescendants: true});
	assert.equal(kill('SIGTERM'), false);
	assert.equal(isTaskkillSpawned, false);
	assert.equal(subprocess.killedWith, undefined);
});

const restoreEnvironment = (name, value) => {
	if (value === undefined) {
		delete process.env[name];
	} else {
		process.env[name] = value;
	}
};
