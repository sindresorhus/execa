import process from 'node:process';
import {once, defaultMaxListeners} from 'node:events';
import {constants} from 'node:os';
import {setTimeout, setImmediate} from 'node:timers/promises';
import test from 'ava';
import {pEvent} from 'p-event';
import isRunning from 'is-running';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {assertMaxListeners} from '../helpers/listeners.js';

setFixtureDir();

const isWindows = process.platform === 'win32';

const spawnNoKillable = async (forceKillAfterDelay, options) => {
	const subprocess = execa('no-killable.js', {
		ipc: true,
		forceKillAfterDelay,
		...options,
	});
	await pEvent(subprocess, 'message');
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
	test('`forceKillAfterDelay` should kill after a timeout with the killSignal number', testForceKill, 50, constants.signals.SIGINT, {killSignal: constants.signals.SIGINT});
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

test('Can call `.kill()` multiple times', async t => {
	const subprocess = execa('forever.js');
	subprocess.kill();
	subprocess.kill();

	const {isTerminated, signal} = await t.throwsAsync(subprocess);
	t.true(isTerminated);
	t.is(signal, 'SIGTERM');
});

test('execa() returns a promise with kill()', async t => {
	const subprocess = execa('noop.js', ['foo']);
	t.is(typeof subprocess.kill, 'function');
	await subprocess;
});

const testInvalidKillArgument = async (t, killArgument, secondKillArgument) => {
	const subprocess = execa('empty.js');
	const message = secondKillArgument instanceof Error || secondKillArgument === undefined
		? /error instance or a signal name/
		: /second argument is optional/;
	t.throws(() => {
		subprocess.kill(killArgument, secondKillArgument);
	}, {message});
	await subprocess;
};

test('Cannot call .kill(null)', testInvalidKillArgument, null);
test('Cannot call .kill(0n)', testInvalidKillArgument, 0n);
test('Cannot call .kill(true)', testInvalidKillArgument, true);
test('Cannot call .kill(errorObject)', testInvalidKillArgument, {name: '', message: '', stack: ''});
test('Cannot call .kill(errorArray)', testInvalidKillArgument, [new Error('test')]);
test('Cannot call .kill(undefined, true)', testInvalidKillArgument, undefined, true);
test('Cannot call .kill("SIGTERM", true)', testInvalidKillArgument, 'SIGTERM', true);
test('Cannot call .kill(true, error)', testInvalidKillArgument, true, new Error('test'));

test('.kill(error) propagates error', async t => {
	const subprocess = execa('forever.js');
	const originalMessage = 'test';
	const cause = new Error(originalMessage);
	t.true(subprocess.kill(cause));
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.true(cause.stack.includes(import.meta.url));
	t.is(error.exitCode, undefined);
	t.is(error.signal, 'SIGTERM');
	t.true(error.isTerminated);
	t.is(error.originalMessage, originalMessage);
	t.true(error.message.includes(originalMessage));
	t.true(error.message.includes('was killed with SIGTERM'));
});

test('.kill(error) uses killSignal', async t => {
	const subprocess = execa('forever.js', {killSignal: 'SIGINT'});
	const cause = new Error('test');
	subprocess.kill(cause);
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.signal, 'SIGINT');
});

test('.kill(signal, error) uses signal', async t => {
	const subprocess = execa('forever.js');
	const cause = new Error('test');
	subprocess.kill('SIGINT', cause);
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.signal, 'SIGINT');
});

test('.kill(error) is a noop if subprocess already exited', async t => {
	const subprocess = execa('empty.js');
	await subprocess;
	t.false(isRunning(subprocess.pid));
	t.false(subprocess.kill(new Error('test')));
});

test('.kill(error) terminates but does not change the error if the subprocess already errored but did not exit yet', async t => {
	const subprocess = execa('forever.js');
	const cause = new Error('first');
	subprocess.stdout.destroy(cause);
	await setImmediate();
	const secondError = new Error('second');
	t.true(subprocess.kill(secondError));
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.exitCode, undefined);
	t.is(error.signal, 'SIGTERM');
	t.true(error.isTerminated);
	t.false(error.message.includes(secondError.message));
});

test('.kill(error) twice in a row', async t => {
	const subprocess = execa('forever.js');
	const cause = new Error('first');
	subprocess.kill(cause);
	const secondCause = new Error('second');
	subprocess.kill(secondCause);
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.false(error.message.includes(secondCause.message));
});

test('.kill(error) does not emit the "error" event', async t => {
	const subprocess = execa('forever.js');
	const cause = new Error('test');
	subprocess.kill(cause);
	const error = await Promise.race([t.throwsAsync(subprocess), once(subprocess, 'error')]);
	t.is(error.cause, cause);
});

test('subprocess errors are handled before spawn', async t => {
	const subprocess = execa('forever.js');
	const cause = new Error('test');
	subprocess.emit('error', cause);
	subprocess.kill();
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.exitCode, undefined);
	t.is(error.signal, undefined);
	t.false(error.isTerminated);
});

test('subprocess errors are handled after spawn', async t => {
	const subprocess = execa('forever.js');
	await once(subprocess, 'spawn');
	const cause = new Error('test');
	subprocess.emit('error', cause);
	subprocess.kill();
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.exitCode, undefined);
	t.is(error.signal, 'SIGTERM');
	t.true(error.isTerminated);
});

test('subprocess double errors are handled after spawn', async t => {
	const abortController = new AbortController();
	const subprocess = execa('forever.js', {cancelSignal: abortController.signal});
	await once(subprocess, 'spawn');
	const cause = new Error('test');
	subprocess.emit('error', cause);
	await setImmediate();
	abortController.abort();
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.exitCode, undefined);
	t.is(error.signal, 'SIGTERM');
	t.true(error.isTerminated);
});

test('subprocess errors use killSignal', async t => {
	const subprocess = execa('forever.js', {killSignal: 'SIGINT'});
	await once(subprocess, 'spawn');
	const cause = new Error('test');
	subprocess.emit('error', cause);
	subprocess.kill();
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.true(error.isTerminated);
	t.is(error.signal, 'SIGINT');
});
