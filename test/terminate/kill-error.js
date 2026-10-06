import assert from 'node:assert/strict';
import {once} from 'node:events';
import {setImmediate} from 'node:timers/promises';
import test from 'node:test';
import isRunning from 'is-running';
import {assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

test('.kill(error) propagates error', async () => {
	const subprocess = execa('forever.js');
	const originalMessage = 'test';
	const cause = new Error(originalMessage);
	assert.ok(subprocess.kill(cause));
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.ok(cause.stack.includes(import.meta.url));
	assert.equal(error.exitCode, undefined);
	assert.equal(error.signal, 'SIGTERM');
	assert.equal(error.isTerminated, true);
	assert.equal(error.originalMessage, originalMessage);
	assert.ok(error.message.includes(originalMessage));
	assert.ok(error.message.includes('was killed with SIGTERM'));
});

test('.kill(error) uses killSignal', async () => {
	const subprocess = execa('forever.js', {killSignal: 'SIGINT'});
	const cause = new Error('test');
	subprocess.kill(cause);
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.equal(error.signal, 'SIGINT');
});

test('.kill(signal, error) uses signal', async () => {
	const subprocess = execa('forever.js');
	const cause = new Error('test');
	subprocess.kill('SIGINT', cause);
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.equal(error.signal, 'SIGINT');
});

// Their `Object.prototype.toString()` is not `[object Error]`
class TaggedError extends Error {
	get [Symbol.toStringTag]() {
		return 'TaggedError';
	}
}

const testKillErrorSubclass = async cause => {
	const subprocess = execa('forever.js');
	assert.ok(subprocess.kill(cause));
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.equal(error.signal, 'SIGTERM');
	assert.equal(error.originalMessage, cause.message);
	assert.ok(error.shortMessage.startsWith('Command was killed with SIGTERM'));
	return error;
};

test('.kill(error) works with DOMException', async () => {
	const error = await testKillErrorSubclass(AbortSignal.abort().reason);
	// `DOMException` has a legacy numeric `code`, which is not an error code like `ENOENT`
	assert.equal(error.code, undefined);
});

test('.kill(error) works with Error subclasses with a custom Symbol.toStringTag', () => testKillErrorSubclass(new TaggedError('test')));

test('.kill(error) ignores numeric error codes', async () => {
	const error = await testKillErrorSubclass(Object.assign(new Error('test'), {code: 42}));
	assert.equal(error.code, undefined);
	assert.ok(!error.shortMessage.includes('42'));
});

test('.kill(error) keeps string error codes', async () => {
	const subprocess = execa('forever.js');
	subprocess.kill(Object.assign(new Error('test'), {code: 'ECUSTOM'}));
	const error = await assertRejects(subprocess);
	assert.equal(error.code, 'ECUSTOM');
});

test('.kill(error) is a noop if subprocess already exited', async () => {
	const subprocess = execa('empty.js');
	await subprocess;
	assert.ok(!isRunning(subprocess.pid));
	assert.ok(!subprocess.kill(new Error('test')));
});

test('.kill(error) terminates but does not change the error if the subprocess already errored but did not exit yet', async () => {
	const subprocess = execa('forever.js');
	const cause = new Error('first');
	subprocess.stdout.destroy(cause);
	await setImmediate();
	const secondError = new Error('second');
	assert.ok(subprocess.kill(secondError));
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.equal(error.exitCode, undefined);
	assert.equal(error.signal, 'SIGTERM');
	assert.equal(error.isTerminated, true);
	assert.ok(!error.message.includes(secondError.message));
});

test('.kill(error) twice in a row', async () => {
	const subprocess = execa('forever.js');
	const cause = new Error('first');
	subprocess.kill(cause);
	const secondCause = new Error('second');
	subprocess.kill(secondCause);
	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.ok(!error.message.includes(secondCause.message));
});

test('.kill(error) does not emit the "error" event', async () => {
	const subprocess = execa('forever.js');
	const cause = new Error('test');
	subprocess.kill(cause);
	const error = await Promise.race([assertRejects(subprocess), once(subprocess.nodeChildProcess, 'error')]);
	assert.equal(error.cause, cause);
});

test('.kill(error) returns false once the subprocess has settled', async () => {
	const subprocess = execa('noop.js', [foobarString]);
	await subprocess;
	assert.ok(!subprocess.kill(new Error('test')));
});
