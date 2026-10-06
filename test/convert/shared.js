import assert from 'node:assert/strict';
import {once} from 'node:events';
import {setImmediate} from 'node:timers/promises';
import test from 'node:test';
import {assertRejects, assertThrows} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {
	finishedStream,
	assertWritableAborted,
	assertStreamError,
	assertSubprocessError,
	getReadWriteSubprocess,
} from '../helpers/convert.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const testSubprocessFail = async methodName => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();

	const cause = new Error(foobarString);
	subprocess.kill(cause);

	const error = await assertStreamError(stream, {cause});
	assertWritableAborted(subprocess.stdin);
	assert.equal(subprocess.stdout.readableEnded, true);
	assert.equal(subprocess.stderr.readableEnded, true);

	await assertSubprocessError(subprocess, error);
};

test('subprocess fail -> .readable() error', () => testSubprocessFail('readable'));
test('subprocess fail -> .writable() error', () => testSubprocessFail('writable'));
test('subprocess fail -> .duplex() error', () => testSubprocessFail('duplex'));

const testErrorEvent = async methodName => {
	const subprocess = execa('empty.js');
	const stream = subprocess[methodName]();
	assert.equal(stream.listenerCount('error'), 0);
	stream.destroy();
	await assertRejects(finishedStream(stream));
};

test('.readable() requires listening to "error" event', () => testErrorEvent('readable'));
test('.writable() requires listening to "error" event', () => testErrorEvent('writable'));
test('.duplex() requires listening to "error" event', () => testErrorEvent('duplex'));

const testSubprocessError = async methodName => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();
	const cause = new Error(foobarString);
	subprocess.kill(cause);
	await assertStreamError(stream, {cause});
};

test('Do not need to await subprocess with .readable()', () => testSubprocessError('readable'));
test('Do not need to await subprocess with .writable()', () => testSubprocessError('writable'));
test('Do not need to await subprocess with .duplex()', () => testSubprocessError('duplex'));

// Once the subprocess has ended, the error passed to `stream.destroy(error)` must still be emitted, including when another stream uses the same file descriptor
const testDestroyAfterExit = async (methodName, fixtureName, otherMethodName) => {
	const subprocess = execa(fixtureName, {reject: false});
	const stream = subprocess[methodName]();
	if (otherMethodName !== undefined) {
		subprocess[otherMethodName]().on('error', () => {});
	}

	await subprocess;
	const cause = new Error(foobarString);
	let errorEvent;
	stream.on('error', error => {
		errorEvent = error;
	});
	stream.destroy(cause);
	await assertRejects(finishedStream(stream));
	assert.equal(errorEvent, cause);
};

test('.readable() destroy error after the subprocess ended', () => testDestroyAfterExit('readable', 'empty.js'));
test('.writable() destroy error after the subprocess ended', () => testDestroyAfterExit('writable', 'empty.js'));
test('.duplex() destroy error after the subprocess ended', () => testDestroyAfterExit('duplex', 'empty.js'));
test('.readable() destroy error after the subprocess ended, with .duplex()', () => testDestroyAfterExit('readable', 'empty.js', 'duplex'));
test('.writable() destroy error after the subprocess ended, with .duplex()', () => testDestroyAfterExit('writable', 'empty.js', 'duplex'));
test('.duplex() destroy error after the subprocess ended, with .writable()', () => testDestroyAfterExit('duplex', 'empty.js', 'writable'));
test('.duplex() destroy error after the subprocess ended, with .duplex()', () => testDestroyAfterExit('duplex', 'empty.js', 'duplex'));
test('.readable() destroy error after the subprocess failed, with .duplex()', () => testDestroyAfterExit('readable', 'fail.js', 'duplex'));
test('.writable() destroy error after the subprocess failed, with .duplex()', () => testDestroyAfterExit('writable', 'fail.js', 'duplex'));
test('.duplex() destroy error after the subprocess failed, with .writable()', () => testDestroyAfterExit('duplex', 'fail.js', 'writable'));

// The pending write waits for the `drain` event, so it must fail instead of hanging
test('.writable() write fails when the subprocess fails to spawn', async () => {
	const subprocess = execa('nonexistent-command-for-execa');
	const stream = subprocess.writable();
	const chunk = '.'.repeat(1e5);
	const writeAll = async () => {
		for (let index = 0; index < 1e2; index += 1) {
			if (!stream.write(chunk)) {
				// eslint-disable-next-line no-await-in-loop
				await once(stream, 'drain');
			}
		}

		stream.end();
		await finishedStream(stream);
	};

	const error = await assertRejects(writeAll());
	assert.equal(error, await assertRejects(subprocess));
});

// The subprocess error is more useful than the `EPIPE` error it causes on `stdin`
const testSpawnFailureWrite = async methodName => {
	const subprocess = execa('nonexistent-command-for-execa');
	const stream = subprocess[methodName]();
	stream.end(foobarString);
	const error = await assertRejects(finishedStream(stream));
	assert.equal(error, await assertRejects(subprocess));
	assert.equal(error.code, 'ENOENT');
};

test('.writable() fails with the subprocess error when the subprocess fails to spawn', () => testSpawnFailureWrite('writable'));
test('.duplex() fails with the subprocess error when the subprocess fails to spawn', () => testSpawnFailureWrite('duplex'));

// The pending write waits for the `drain` event of `stdin`, which has been destroyed, so the stream must be destroyed too, even though it is ending
const testWriteAfterExit = async (methodName, isSameTick) => {
	const subprocess = execa('empty.js');
	await subprocess;
	const stream = subprocess[methodName]();
	if (!isSameTick) {
		await setImmediate();
	}

	stream.end(foobarString);
	const error = await assertRejects(finishedStream(stream));
	assert.equal(error.code, 'ERR_STREAM_PREMATURE_CLOSE');
};

test('.writable() fails when ending it after the subprocess ended', () => testWriteAfterExit('writable', true));
test('.duplex() fails when ending it after the subprocess ended', () => testWriteAfterExit('duplex', true));
test('.writable() fails when ending it later after the subprocess ended', () => testWriteAfterExit('writable', false));
test('.duplex() fails when ending it later after the subprocess ended', () => testWriteAfterExit('duplex', false));

test('.writable() fails with the subprocess error when the subprocess fails without reading stdin', async () => {
	const subprocess = execa('fail.js');
	const stream = subprocess.writable();
	stream.end('.'.repeat(1e6));
	const error = await assertRejects(finishedStream(stream));
	assert.equal(error, await assertRejects(subprocess));
	assert.equal(error.exitCode, 2);
});

const testNullOptions = async methodName => {
	const subprocess = getReadWriteSubprocess();
	subprocess.stdin.end();
	assertThrows(() => {
		subprocess[methodName](null);
	}, {message: 'The options must be an object, not `null`.'});
	await subprocess;
};

test('.readable() cannot use null options', () => testNullOptions('readable'));
test('.writable() cannot use null options', () => testNullOptions('writable'));
test('.duplex() cannot use null options', () => testNullOptions('duplex'));
test('.iterable() cannot use null options', () => testNullOptions('iterable'));
