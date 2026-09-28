import assert from 'node:assert/strict';
import process from 'node:process';
import {once, defaultMaxListeners} from 'node:events';
import {constants} from 'node:os';
import {setTimeout} from 'node:timers/promises';
import test from 'node:test';
import isRunning from 'is-running';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {assertMaxListeners} from '../helpers/listeners.js';
import {foobarString} from '../helpers/input.js';
import {getEarlyErrorSubprocess} from '../helpers/early-error.js';

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

const noKillableSimpleOptions = {killSignal: 'SIGWINCH', forceKillAfterDelay: 1};
const spawnNoKillableSimple = options => execa('forever.js', {...noKillableSimpleOptions, ...options});

test('kill("SIGKILL") should terminate cleanly', async () => {
	const {subprocess} = await spawnNoKillable();

	subprocess.kill('SIGKILL');

	const {isTerminated, signal, isForcefullyTerminated, shortMessage} = await assertRejects(subprocess);
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGKILL');
	assert.equal(isForcefullyTerminated, false);
	assert.equal(shortMessage, 'Command was killed with SIGKILL (Forced termination): no-killable.js');
});

const testInvalidForceKill = async forceKillAfterDelay => {
	assertThrows(() => {
		execa('empty.js', {forceKillAfterDelay});
	}, {instanceOf: TypeError, message: /non-negative integer/});
};

test('`forceKillAfterDelay` should not be NaN', () => testInvalidForceKill(NaN));
test('`forceKillAfterDelay` should not be negative', () => testInvalidForceKill(-1));

// `SIGTERM` cannot be caught on Windows, and it always aborts the subprocess (like `SIGKILL` on Unix).
// Therefore, this feature and those tests must be different on Windows.
if (isWindows) {
	test('Can call `.kill()` with `forceKillAfterDelay` on Windows', async () => {
		const {subprocess} = await spawnNoKillable();
		subprocess.kill();

		const {isTerminated, signal, isForcefullyTerminated, shortMessage} = await assertRejects(subprocess);
		assert.equal(isTerminated, true);
		assert.equal(signal, 'SIGTERM');
		assert.equal(isForcefullyTerminated, false);
		assert.equal(shortMessage, 'Command was killed with SIGTERM (Termination): no-killable.js');
	});
} else {
	const testNoForceKill = async (forceKillAfterDelay, killArgument, options) => {
		const {subprocess} = await spawnNoKillable(forceKillAfterDelay, options);

		subprocess.kill(killArgument);

		await setTimeout(6e3);
		assert.ok(isRunning(subprocess.pid));
		subprocess.kill('SIGKILL');

		const {isTerminated, signal, isForcefullyTerminated} = await assertRejects(subprocess);
		assert.equal(isTerminated, true);
		assert.equal(signal, 'SIGKILL');
		assert.equal(isForcefullyTerminated, false);
	};

	test('`forceKillAfterDelay: false` should not kill after a timeout', () => testNoForceKill(false));
	test('`forceKillAfterDelay` should not kill after a timeout with other signals', () => testNoForceKill(true, 'SIGINT'));
	test('`forceKillAfterDelay` should not kill after a timeout with wrong killSignal string', () => testNoForceKill(true, 'SIGTERM', {killSignal: 'SIGINT'}));
	test('`forceKillAfterDelay` should not kill after a timeout with wrong killSignal number', () => testNoForceKill(true, constants.signals.SIGTERM, {killSignal: constants.signals.SIGINT}));

	// eslint-disable-next-line max-params
	const testForceKill = async (forceKillAfterDelay, killSignal, expectedDelay, expectedKillSignal, options) => {
		const {subprocess} = await spawnNoKillable(forceKillAfterDelay, options);

		subprocess.kill(killSignal);

		const {isTerminated, signal, isForcefullyTerminated, shortMessage} = await assertRejects(subprocess);
		assert.equal(isTerminated, true);
		assert.equal(signal, 'SIGKILL');
		assert.equal(isForcefullyTerminated, true);
		const messageSuffix = killSignal instanceof Error ? `\n${killSignal.message}` : '';
		const signalDescription = expectedKillSignal === 'SIGINT' ? 'User interruption with CTRL-C' : 'Termination';
		assert.equal(shortMessage, `Command was killed with ${expectedKillSignal} (${signalDescription}) and was forcefully terminated after ${expectedDelay} milliseconds: no-killable.js${messageSuffix}`);
	};

	test('`forceKillAfterDelay: number` should kill after a timeout', () => testForceKill(50, undefined, 50, 'SIGTERM'));
	test('`forceKillAfterDelay: true` should kill after a timeout', () => testForceKill(true, undefined, 5e3, 'SIGTERM'));
	test('`forceKillAfterDelay: undefined` should kill after a timeout', () => testForceKill(undefined, undefined, 5e3, 'SIGTERM'));
	test('`forceKillAfterDelay` should kill after a timeout with SIGTERM', () => testForceKill(50, 'SIGTERM', 50, 'SIGTERM'));
	test('`forceKillAfterDelay` should kill after a timeout with the killSignal string', () => testForceKill(50, 'SIGINT', 50, 'SIGINT', {killSignal: 'SIGINT'}));
	test('`forceKillAfterDelay` should kill after a timeout with the killSignal string, mixed', () => testForceKill(50, 'SIGINT', 50, 'SIGINT', {killSignal: constants.signals.SIGINT}));
	test('`forceKillAfterDelay` should kill after a timeout with the killSignal number', () => testForceKill(50, constants.signals.SIGINT, 50, 'SIGINT', {killSignal: constants.signals.SIGINT}));
	test('`forceKillAfterDelay` should kill after a timeout with the killSignal number, mixed', () => testForceKill(50, constants.signals.SIGINT, 50, 'SIGINT', {killSignal: 'SIGINT'}));
	test('`forceKillAfterDelay` should kill after a timeout with an error', () => testForceKill(50, new Error('test'), 50, 'SIGTERM'));
	test('`forceKillAfterDelay` should kill after a timeout with an error and a killSignal', () => testForceKill(50, new Error('test'), 50, 'SIGINT', {killSignal: 'SIGINT'}));

	test('`forceKillAfterDelay` works with the "cancelSignal" option', async () => {
		const abortController = new AbortController();
		const subprocess = spawnNoKillableSimple({cancelSignal: abortController.signal});
		await once(subprocess.nodeChildProcess, 'spawn');
		abortController.abort('');
		const {isTerminated, signal, isCanceled, isGracefullyCanceled, isForcefullyTerminated, shortMessage} = await assertRejects(subprocess);
		assert.equal(isTerminated, true);
		assert.equal(signal, 'SIGKILL');
		assert.equal(isCanceled, true);
		assert.equal(isGracefullyCanceled, false);
		assert.equal(isForcefullyTerminated, true);
		assert.equal(shortMessage, 'Command was canceled and was forcefully terminated after 1 milliseconds: forever.js');
	});

	test('`forceKillAfterDelay` works with the "timeout" option', async () => {
		const {isTerminated, signal, timedOut, isForcefullyTerminated, shortMessage} = await assertRejects(spawnNoKillableSimple({timeout: 1}));
		assert.equal(isTerminated, true);
		assert.equal(signal, 'SIGKILL');
		assert.equal(timedOut, true);
		assert.equal(isForcefullyTerminated, true);
		assert.equal(shortMessage, 'Command timed out after 1 milliseconds and was forcefully terminated after 1 milliseconds: forever.js');
	});

	test('`forceKillAfterDelay` works with the "maxBuffer" option', async () => {
		const subprocess = execa('noop-forever.js', ['.'], {...noKillableSimpleOptions, maxBuffer: 1});
		const [chunk] = await once(subprocess.stdout, 'data');
		assert.equal(chunk.toString(), '.\n');
		subprocess.kill();
		const {isTerminated, signal, isForcefullyTerminated, shortMessage} = await assertRejects(subprocess);
		assert.equal(isTerminated, true);
		assert.equal(signal, 'SIGKILL');
		assert.equal(isForcefullyTerminated, true);
		assert.equal(shortMessage, 'Command\'s stdout was larger than 1 characters and was forcefully terminated after 1 milliseconds: noop-forever.js .\nmaxBuffer exceeded');
	});

	test('`forceKillAfterDelay` works with the "error" event', async () => {
		const subprocess = spawnNoKillableSimple();
		await once(subprocess.nodeChildProcess, 'spawn');
		const error = new Error(foobarString);
		error.code = 'ECODE';
		subprocess.nodeChildProcess.emit('error', error);
		subprocess.kill();
		const {isTerminated, signal, isForcefullyTerminated, shortMessage, originalMessage, cause} = await assertRejects(subprocess);
		assert.equal(isTerminated, true);
		assert.equal(signal, 'SIGKILL');
		assert.equal(isForcefullyTerminated, true);
		assert.equal(cause, error);
		assert.equal(originalMessage, error.message);
		assert.equal(shortMessage, `Command failed with ${error.code} and was forcefully terminated after 1 milliseconds: forever.js\n${error.message}`);
	});

	test('Can call `.kill()` with `forceKillAfterDelay` many times without triggering the maxListeners warning', async () => {
		const checkMaxListeners = assertMaxListeners();

		const subprocess = spawnNoKillableSimple();
		for (let index = 0; index < defaultMaxListeners + 1; index += 1) {
			subprocess.kill();
		}

		const {isTerminated, signal, isForcefullyTerminated} = await assertRejects(subprocess);
		assert.equal(isTerminated, true);
		assert.equal(signal, 'SIGKILL');
		assert.equal(isForcefullyTerminated, true);

		checkMaxListeners();
	});

	test('Can call `.kill()` with `forceKillAfterDelay` multiple times', async () => {
		const subprocess = spawnNoKillableSimple();
		subprocess.kill();
		subprocess.kill();

		const {isTerminated, signal, isForcefullyTerminated} = await assertRejects(subprocess);
		assert.equal(isTerminated, true);
		assert.equal(signal, 'SIGKILL');
		assert.equal(isForcefullyTerminated, true);
	});
}

test('result.isForcefullyTerminated is false on success', async () => {
	const {isForcefullyTerminated} = await execa('empty.js');
	assert.equal(isForcefullyTerminated, false);
});

test('error.isForcefullyTerminated is false on spawn errors', async () => {
	const {isForcefullyTerminated} = await assertRejects(getEarlyErrorSubprocess());
	assert.equal(isForcefullyTerminated, false);
});

test('error.isForcefullyTerminated is false when already terminated', async () => {
	const abortController = new AbortController();
	const final = async function * () {
		try {
			await setTimeout(1e6, undefined, {signal: abortController.signal});
		} catch {}

		yield * [];
	};

	const subprocess = execa('forever.js', {stdout: {final}});
	subprocess.kill();
	await setTimeout(6e3);
	abortController.abort();
	const {isForcefullyTerminated, isTerminated, signal} = await assertRejects(subprocess);
	assert.equal(isForcefullyTerminated, false);
	assert.equal(isTerminated, true);
	assert.equal(signal, 'SIGTERM');
});
