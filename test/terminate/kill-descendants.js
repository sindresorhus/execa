import process from 'node:process';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import isRunning from 'is-running';
import {execa, execaSync} from '../../index.js';
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
