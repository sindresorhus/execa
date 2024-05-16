import process from 'node:process';
import {once, defaultMaxListeners} from 'node:events';
import {constants} from 'node:os';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import isRunning from 'is-running';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {assertMaxListeners} from '../helpers/listeners.js';

setFixtureDirectory();

const isWindows = process.platform === 'win32';

const spawnNoKillable = async (forceKillAfterDelay, options) => {
	const subprocess = execa('no-killable.js', {
		ipc: true,
		forceKillAfterDelay,
		...options,
	});
	await subprocess.getOneMessage();
	return {subprocess};
};

const spawnNoKillableSimple = options => execa('forever.js', {killSignal: 'SIGWINCH', forceKillAfterDelay: 1, ...options});

test('kill("SIGKILL") should terminate cleanly', async t => {
	const {subprocess} = await spawnNoKillable();

	subprocess.kill('SIGKILL');

	const {isTerminated, signal} = await t.throwsAsync(subprocess);
	t.true(isTerminated);
	t.is(signal, 'SIGKILL');
});

const testInvalidForceKill = async (t, forceKillAfterDelay) => {
	t.throws(() => {
		execa('empty.js', {forceKillAfterDelay});
	}, {instanceOf: TypeError, message: /non-negative integer/});
};

test('`forceKillAfterDelay` should not be NaN', testInvalidForceKill, Number.NaN);
test('`forceKillAfterDelay` should not be negative', testInvalidForceKill, -1);

// `SIGTERM` cannot be caught on Windows, and it always aborts the subprocess (like `SIGKILL` on Unix).
// Therefore, this feature and those tests must be different on Windows.
if (isWindows) {
	test('Can call `.kill()` with `forceKillAfterDelay` on Windows', async t => {
		const {subprocess} = await spawnNoKillable(1);
		subprocess.kill();

		const {isTerminated, signal} = await t.throwsAsync(subprocess);
		t.true(isTerminated);
		t.is(signal, 'SIGTERM');
	});
} else {
	const testNoForceKill = async (t, forceKillAfterDelay, killArgument, options) => {
		const {subprocess} = await spawnNoKillable(forceKillAfterDelay, options);

		subprocess.kill(killArgument);

		await setTimeout(6e3);
		t.true(isRunning(subprocess.pid));
		subprocess.kill('SIGKILL');

		const {isTerminated, signal} = await t.throwsAsync(subprocess);
		t.true(isTerminated);
		t.is(signal, 'SIGKILL');
	};

	test('`forceKillAfterDelay: false` should not kill after a timeout', testNoForceKill, false);
	test('`forceKillAfterDelay` should not kill after a timeout with other signals', testNoForceKill, true, 'SIGINT');
	test('`forceKillAfterDelay` should not kill after a timeout with wrong killSignal string', testNoForceKill, true, 'SIGTERM', {killSignal: 'SIGINT'});
	test('`forceKillAfterDelay` should not kill after a timeout with wrong killSignal number', testNoForceKill, true, constants.signals.SIGTERM, {killSignal: constants.signals.SIGINT});

	const testForceKill = async (t, forceKillAfterDelay, killArgument, options) => {
		const {subprocess} = await spawnNoKillable(forceKillAfterDelay, options);

		subprocess.kill(killArgument);

		const {isTerminated, signal} = await t.throwsAsync(subprocess);
		t.true(isTerminated);
		t.is(signal, 'SIGKILL');
	};

	test('`forceKillAfterDelay: number` should kill after a timeout', testForceKill, 50);
	test('`forceKillAfterDelay: true` should kill after a timeout', testForceKill, true);
	test('`forceKillAfterDelay: undefined` should kill after a timeout', testForceKill, undefined);
	test('`forceKillAfterDelay` should kill after a timeout with SIGTERM', testForceKill, 50, 'SIGTERM');
	test('`forceKillAfterDelay` should kill after a timeout with the killSignal string', testForceKill, 50, 'SIGINT', {killSignal: 'SIGINT'});
	test('`forceKillAfterDelay` should kill after a timeout with the killSignal string, mixed', testForceKill, 50, 'SIGINT', {killSignal: constants.signals.SIGINT});
	test('`forceKillAfterDelay` should kill after a timeout with the killSignal number', testForceKill, 50, constants.signals.SIGINT, {killSignal: constants.signals.SIGINT});
	test('`forceKillAfterDelay` should kill after a timeout with the killSignal number, mixed', testForceKill, 50, constants.signals.SIGINT, {killSignal: 'SIGINT'});
	test('`forceKillAfterDelay` should kill after a timeout with an error', testForceKill, 50, new Error('test'));
	test('`forceKillAfterDelay` should kill after a timeout with an error and a killSignal', testForceKill, 50, new Error('test'), {killSignal: 'SIGINT'});

	test('`forceKillAfterDelay` works with the "signal" option', async t => {
		const abortController = new AbortController();
		const subprocess = spawnNoKillableSimple({cancelSignal: abortController.signal});
		await once(subprocess, 'spawn');
		abortController.abort();
		const {isTerminated, signal, isCanceled} = await t.throwsAsync(subprocess);
		t.true(isTerminated);
		t.is(signal, 'SIGKILL');
		t.true(isCanceled);
	});

	test('`forceKillAfterDelay` works with the "timeout" option', async t => {
		const subprocess = spawnNoKillableSimple({timeout: 1});
		const {isTerminated, signal, timedOut} = await t.throwsAsync(subprocess);
		t.true(isTerminated);
		t.is(signal, 'SIGKILL');
		t.true(timedOut);
	});

	test.serial('Can call `.kill()` with `forceKillAfterDelay` many times without triggering the maxListeners warning', async t => {
		const checkMaxListeners = assertMaxListeners(t);

		const subprocess = spawnNoKillableSimple();
		for (let index = 0; index < defaultMaxListeners + 1; index += 1) {
			subprocess.kill();
		}

		const {isTerminated, signal} = await t.throwsAsync(subprocess);
		t.true(isTerminated);
		t.is(signal, 'SIGKILL');

		checkMaxListeners();
	});

	test('Can call `.kill()` with `forceKillAfterDelay` multiple times', async t => {
		const subprocess = spawnNoKillableSimple();
		subprocess.kill();
		subprocess.kill();

		const {isTerminated, signal} = await t.throwsAsync(subprocess);
		t.true(isTerminated);
		t.is(signal, 'SIGKILL');
	});
}
