import assert from 'node:assert/strict';
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
