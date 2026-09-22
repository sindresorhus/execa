import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import path from 'node:path/win32';
import process from 'node:process';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import isRunning from 'is-running';
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

test('killDescendants terminates descendant processes', async t => {
	const {subprocess, descendantPid} = await spawnDescendant(true);
	t.true(isRunning(descendantPid));

	subprocess.kill();
	await t.throwsAsync(subprocess);
	t.false(isRunning(subprocess.pid));

	await Promise.race([
		setTimeout(1e4, undefined, {ref: false}),
		pollForSubprocessExit(descendantPid),
	]);
	t.false(isRunning(descendantPid));
});

test('killDescendants also terminates descendant processes when the subprocess times out', async t => {
	const {subprocess, descendantPid} = await spawnDescendant(true, {timeout: 1000});
	t.true(isRunning(descendantPid));

	const {timedOut} = await t.throwsAsync(subprocess);
	t.true(timedOut);

	await Promise.race([
		setTimeout(1e4, undefined, {ref: false}),
		pollForSubprocessExit(descendantPid),
	]);
	t.false(isRunning(descendantPid));
});

// On Windows, terminating the direct subprocess already terminates its descendants, so this
// only asserts the default Unix behavior of leaving descendants running.
if (!isWindows) {
	test('descendant processes are not terminated without killDescendants', async t => {
		const {subprocess, descendantPid} = await spawnDescendant(false);
		t.true(isRunning(descendantPid));

		subprocess.kill();
		await t.throwsAsync(subprocess);
		t.false(isRunning(subprocess.pid));

		t.true(isRunning(descendantPid));
		process.kill(descendantPid, 'SIGKILL');
	});

	test('timeout does not terminate descendants without killDescendants', async t => {
		const {subprocess, descendantPid} = await spawnDescendant(false, {timeout: 1000});
		t.true(isRunning(descendantPid));

		const {timedOut} = await t.throwsAsync(subprocess);
		t.true(timedOut);
		t.true(isRunning(descendantPid));
		process.kill(descendantPid, 'SIGKILL');
	});
}

/*
The `forceKillAfterDelay` escalation happens after the subprocess exited, since that is when its termination has been noticed.
A descendant which ignores `SIGTERM` is still running then, so the escalation must still reach it.
Otherwise, since that descendant keeps the subprocess' `stdout` open, awaiting the subprocess would never settle.
*/
test('killDescendants escalates to descendants which outlive the subprocess', async t => {
	const subprocess = execa('ipc-send-pid-stubborn.js', {
		ipc: true,
		killDescendants: true,
		forceKillAfterDelay: 1000,
	});
	const descendantPid = await subprocess.getOneMessage();
	t.true(isRunning(descendantPid));

	subprocess.kill();
	const settled = await Promise.race([
		t.throwsAsync(subprocess).then(() => 'settled'),
		setTimeout(1e4, 'pending', {ref: false}),
	]);
	t.is(settled, 'settled');
	t.false(isRunning(descendantPid));
});

if (!isWindows) {
	// A PID can be re-assigned to an unrelated process once Execa is done with the subprocess, so its process group must not be signaled anymore
	const testAbandonedProcessGroup = test.macro(async (t, getSubprocess) => {
		const subprocess = getSubprocess();
		await t.throwsAsync(subprocess);

		const originalKill = process.kill;
		t.teardown(() => {
			process.kill = originalKill;
		});

		const signaledProcesses = [];
		process.kill = (pid, signal) => {
			signaledProcesses.push([pid, signal]);
			return true;
		};

		t.false(subprocess.kill('SIGKILL'));
		t.deepEqual(signaledProcesses, []);
	});

	test.serial('killDescendants does not signal the process group once Execa is done with the subprocess', testAbandonedProcessGroup, () => execa('fail.js', {killDescendants: true}));

	test.serial('killDescendants does not signal the process group once Execa is done with a terminated subprocess', testAbandonedProcessGroup, () => {
		const subprocess = execa('forever.js', {killDescendants: true});
		subprocess.kill('SIGTERM');
		return subprocess;
	});

	// While Execa is still waiting on the subprocess, its process group is still its own
	test.serial('killDescendants signals the process group while Execa is not done with the subprocess', async t => {
		const subprocess = execa('forever.js', {killDescendants: true});

		const originalKill = process.kill;
		t.teardown(() => {
			process.kill = originalKill;
		});

		const signaledProcesses = [];
		process.kill = (pid, signal) => {
			signaledProcesses.push([pid, signal]);
			return originalKill(pid, signal);
		};

		t.true(subprocess.kill('SIGTERM'));
		t.deepEqual(signaledProcesses, [[-subprocess.pid, 'SIGTERM']]);
		process.kill = originalKill;
		await t.throwsAsync(subprocess);
	});
}

test('Cannot use "killDescendants" option, sync', t => {
	t.throws(() => {
		execaSync('empty.js', {killDescendants: true});
	}, {message: /The "killDescendants: true" option cannot be used/});
});

test.serial('taskkill is resolved from the Windows directory when available', t => {
	const {SystemRoot, windir} = process.env;
	t.teardown(() => {
		restoreEnvironment('SystemRoot', SystemRoot);
		restoreEnvironment('windir', windir);
	});

	process.env.SystemRoot = 'C:\\Windows';
	process.env.windir = 'D:\\Windows';
	t.is(getTaskkillFile(), path.join('C:\\Windows', 'System32', 'taskkill.exe'));

	process.env.SystemRoot = 'C:/Windows';
	t.is(getTaskkillFile(), path.join('C:/Windows', 'System32', 'taskkill.exe'));

	process.env.SystemRoot = 'Windows';
	t.is(getTaskkillFile(), path.join('D:\\Windows', 'System32', 'taskkill.exe'));

	process.env.SystemRoot = '\\Windows';
	t.is(getTaskkillFile(), path.join('D:\\Windows', 'System32', 'taskkill.exe'));

	delete process.env.SystemRoot;
	t.is(getTaskkillFile(), path.join('D:\\Windows', 'System32', 'taskkill.exe'));

	process.env.windir = 'Windows';
	t.is(getTaskkillFile(), undefined);

	process.env.windir = '\\Windows';
	t.is(getTaskkillFile(), undefined);

	process.env.windir = '\\\\server\\share\\Windows';
	t.is(getTaskkillFile(), undefined);

	process.env.windir = '';
	t.is(getTaskkillFile(), undefined);

	delete process.env.windir;
	t.is(getTaskkillFile(), undefined);
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
	t.teardown(() => {
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

const abortedController = () => {
	const controller = new AbortController();
	controller.abort();
	return controller;
};

test.serial('taskkill fallback uses direct subprocess kill when Windows directory is unavailable', async t => {
	const getKillFunction = await fakeWindows(t, 'Windows');
	const subprocess = createFakeSubprocess();

	const kill = getKillFunction(subprocess, {killDescendants: true}, new AbortController());
	t.true(kill('SIGTERM'));
	t.is(subprocess.killedWith, 'SIGTERM');
});

test.serial('taskkill fallback uses direct subprocess kill when taskkill cannot be spawned', async t => {
	const taskkillFailure = Promise.withResolvers();
	const getKillFunction = await fakeWindows(t, 'C:\\MissingWindows', (file, arguments_, callback) => {
		t.is(file, path.join('C:\\MissingWindows', 'System32', 'taskkill.exe'));
		t.deepEqual(arguments_, ['/pid', '123', '/T', '/F']);
		queueMicrotask(() => {
			callback(new Error('spawn failed'));
			taskkillFailure.resolve();
		});
	});
	const subprocess = createFakeSubprocess();

	const kill = getKillFunction(subprocess, {killDescendants: true}, new AbortController());
	t.true(kill('SIGTERM'));
	t.is(subprocess.killedWith, undefined);

	await taskkillFailure.promise;
	t.is(subprocess.killedWith, 'SIGTERM');
});

// Once Execa is done with the subprocess, its PID can be re-assigned by the OS, so its process tree must not be terminated anymore
test.serial('taskkill is not spawned once Execa is done with the subprocess', async t => {
	let isTaskkillSpawned = false;
	const getKillFunction = await fakeWindows(t, 'C:\\Windows', () => {
		isTaskkillSpawned = true;
	});
	const subprocess = createFakeSubprocess({exitCode: 0});

	const kill = getKillFunction(subprocess, {killDescendants: true}, abortedController());
	t.false(kill('SIGTERM'));
	t.false(isTaskkillSpawned);
	t.is(subprocess.killedWith, undefined);
});

// While Execa is still waiting on the subprocess, its process tree is still its own, even after it exited
test.serial('taskkill is still spawned after the subprocess exited', async t => {
	let taskkillArguments;
	const getKillFunction = await fakeWindows(t, 'C:\\Windows', (file, arguments_) => {
		taskkillArguments = arguments_;
	});
	const subprocess = createFakeSubprocess({exitCode: 0});

	const kill = getKillFunction(subprocess, {killDescendants: true}, new AbortController());
	t.true(kill('SIGTERM'));
	t.deepEqual(taskkillArguments, ['/pid', '123', '/T', '/F']);
});

// A subprocess which never spawned has no PID to signal
test.serial('taskkill is not spawned when the subprocess has no PID', async t => {
	let isTaskkillSpawned = false;
	const getKillFunction = await fakeWindows(t, 'C:\\Windows', () => {
		isTaskkillSpawned = true;
	});
	const subprocess = createFakeSubprocess();
	subprocess.pid = undefined;

	const kill = getKillFunction(subprocess, {killDescendants: true}, new AbortController());
	t.false(kill('SIGTERM'));
	t.false(isTaskkillSpawned);
	t.is(subprocess.killedWith, undefined);
});

const restoreEnvironment = (name, value) => {
	if (value === undefined) {
		delete process.env[name];
	} else {
		process.env[name] = value;
	}
};
