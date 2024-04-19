import test from 'ava';
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

const testSubprocessFail = async (t, methodName) => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();

	const cause = new Error(foobarString);
	subprocess.kill(cause);

	const error = await assertStreamError(t, stream, {cause});
	assertWritableAborted(t, subprocess.stdin);
	t.true(subprocess.stdout.readableEnded);
	t.true(subprocess.stderr.readableEnded);

	await assertSubprocessError(t, subprocess, error);
};

test('subprocess fail -> .readable() error', testSubprocessFail, 'readable');
test('subprocess fail -> .writable() error', testSubprocessFail, 'writable');
test('subprocess fail -> .duplex() error', testSubprocessFail, 'duplex');

const testErrorEvent = async (t, methodName) => {
	const subprocess = execa('empty.js');
	const stream = subprocess[methodName]();
	t.is(stream.listenerCount('error'), 0);
	stream.destroy();
	await t.throwsAsync(finishedStream(stream));
};

test('.readable() requires listening to "error" event', testErrorEvent, 'readable');
test('.writable() requires listening to "error" event', testErrorEvent, 'writable');
test('.duplex() requires listening to "error" event', testErrorEvent, 'duplex');

const testSubprocessError = async (t, methodName) => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]();
	const cause = new Error(foobarString);
	subprocess.kill(cause);
	await assertStreamError(t, stream, {cause});
};

test('Do not need to await subprocess with .readable()', testSubprocessError, 'readable');
test('Do not need to await subprocess with .writable()', testSubprocessError, 'writable');
test('Do not need to await subprocess with .duplex()', testSubprocessError, 'duplex');
