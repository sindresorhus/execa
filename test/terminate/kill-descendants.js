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

test.serial('taskkill fallback uses direct subprocess kill when Windows directory is unavailable', async t => {
	const platformDescriptor = Object.getOwnPropertyDescriptor(process, 'platform');
	const {SystemRoot, windir} = process.env;
	t.teardown(() => {
		Object.defineProperty(process, 'platform', platformDescriptor);
		restoreEnvironment('SystemRoot', SystemRoot);
		restoreEnvironment('windir', windir);
	});

	Object.defineProperty(process, 'platform', {value: 'win32'});
	process.env.SystemRoot = 'Windows';
	delete process.env.windir;

	const {getKillFunction} = await import(`../../lib/terminate/kill-descendants.js?taskkill-fallback=${Date.now()}`);
	let killedWith;
	const subprocess = {
		pid: 123,
		kill(signal) {
			killedWith = signal;
			return true;
		},
	};

	const kill = getKillFunction(subprocess, {killDescendants: true});
	t.true(kill('SIGTERM'));
	t.is(killedWith, 'SIGTERM');
});

test.serial('taskkill fallback uses direct subprocess kill when taskkill cannot be spawned', async t => {
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
	process.env.SystemRoot = 'C:\\MissingWindows';
	delete process.env.windir;

	const taskkillFailure = Promise.withResolvers();
	childProcess.execFile = (file, arguments_, callback) => {
		t.is(file, path.join('C:\\MissingWindows', 'System32', 'taskkill.exe'));
		t.deepEqual(arguments_, ['/pid', '123', '/T', '/F']);
		queueMicrotask(() => {
			callback(new Error('spawn failed'));
			taskkillFailure.resolve();
		});
	};

	syncBuiltinESMExports();

	const {getKillFunction} = await import(`../../lib/terminate/kill-descendants.js?taskkill-spawn-fallback=${Date.now()}`);
	let killedWith;
	const subprocess = {
		pid: 123,
		kill(signal) {
			killedWith = signal;
			return true;
		},
	};

	const kill = getKillFunction(subprocess, {killDescendants: true});
	t.true(kill('SIGTERM'));
	t.is(killedWith, undefined);

	await taskkillFailure.promise;
	t.is(killedWith, 'SIGTERM');
});

const restoreEnvironment = (name, value) => {
	if (value === undefined) {
		delete process.env[name];
	} else {
		process.env[name] = value;
	}
};
