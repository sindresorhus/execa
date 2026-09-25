import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {runVerboseSubprocess} from '../helpers/verbose.js';
import {earlyErrorOptions, earlyErrorOptionsSync} from '../helpers/early-error.js';

setFixtureDirectory();

const testCommandThrowPropagate = async (t, type, options, isSync) => {
	const {nestedResult} = await runVerboseSubprocess({
		isSync,
		type,
		optionsFixture: 'custom-throw.js',
		errorMessage: foobarString,
		...options,
	});
	t.true(nestedResult instanceof Error);
	t.is(nestedResult.message, foobarString);
};

test('Propagate verbose exception in "verbose" function, "command"', testCommandThrowPropagate, 'command', {}, false);
test('Propagate verbose exception in "verbose" function, "error"', testCommandThrowPropagate, 'error', {}, false);
test('Propagate verbose exception in "verbose" function, "duration"', testCommandThrowPropagate, 'duration', {}, false);
test('Propagate verbose exception in "verbose" function, "command", spawn error', testCommandThrowPropagate, 'command', earlyErrorOptions, false);
test('Propagate verbose exception in "verbose" function, "error", spawn error', testCommandThrowPropagate, 'error', earlyErrorOptions, false);
test('Propagate verbose exception in "verbose" function, "duration", spawn error', testCommandThrowPropagate, 'duration', earlyErrorOptions, false);
test('Propagate verbose exception in "verbose" function, "command", sync', testCommandThrowPropagate, 'command', {}, true);
test('Propagate verbose exception in "verbose" function, "error", sync', testCommandThrowPropagate, 'error', {}, true);
test('Propagate verbose exception in "verbose" function, "duration", sync', testCommandThrowPropagate, 'duration', {}, true);
test('Propagate verbose exception in "verbose" function, "command", spawn error, sync', testCommandThrowPropagate, 'command', earlyErrorOptionsSync, true);
test('Propagate verbose exception in "verbose" function, "error", spawn error, sync', testCommandThrowPropagate, 'error', earlyErrorOptionsSync, true);
test('Propagate verbose exception in "verbose" function, "duration", spawn error, sync', testCommandThrowPropagate, 'duration', earlyErrorOptionsSync, true);

const testCommandThrowHandle = async (t, type, isSync) => {
	const {nestedResult} = await runVerboseSubprocess({
		isSync,
		type,
		optionsFixture: 'custom-throw.js',
		errorMessage: foobarString,
	});
	t.true(nestedResult instanceof Error);
	t.true(nestedResult.stack.startsWith(isSync ? 'ExecaSyncError' : 'ExecaError'));
	t.true(nestedResult.cause instanceof Error);
	t.is(nestedResult.cause.message, foobarString);
};

test('Handle exceptions in "verbose" function, "output"', testCommandThrowHandle, 'output', false);
test('Handle exceptions in "verbose" function, "ipc"', testCommandThrowHandle, 'ipc', false);
test('Handle exceptions in "verbose" function, "output", sync', testCommandThrowHandle, 'output', true);

const testCommandThrowWrap = async (t, type, options, isSync) => {
	const {nestedResult} = await runVerboseSubprocess({
		isSync,
		type,
		optionsFixture: 'custom-throw.js',
		errorMessage: foobarString,
		...options,
	});
	t.true(nestedResult instanceof Error);
	t.true(nestedResult.stack.startsWith(isSync ? 'ExecaSyncError' : 'ExecaError'));
	t.true(nestedResult.cause instanceof Error);
	t.not(nestedResult.cause.message, foobarString);
};

test('Propagate wrapped exception in "verbose" function, "output", spawn error', testCommandThrowWrap, 'output', earlyErrorOptions, false);
test('Propagate wrapped exception in "verbose" function, "ipc", spawn error', testCommandThrowWrap, 'ipc', earlyErrorOptions, false);
test('Propagate wrapped exception in "verbose" function, "output", spawn error, sync', testCommandThrowWrap, 'output', earlyErrorOptionsSync, true);

// A throwing `verbose` function is a logging error: it must not discard IPC messages which have already been buffered
const getThrowingVerbose = (type, thrownValue = new Error(foobarString)) => ({
	verbose: (line, verboseObject) => {
		if (verboseObject.type === type) {
			throw thrownValue;
		}
	},
});

test('IPC output is kept when the "verbose" function throws, "ipc"', async t => {
	const {cause, ipcOutput} = await t.throwsAsync(execa('ipc-send-twice.js', {ipc: true, ...getThrowingVerbose('ipc')}));
	t.is(cause.message, foobarString);
	t.deepEqual(ipcOutput, ['foo', 'bar']);
});

// A `verbose` function might throw a non-Error, or a falsy value. Neither must be mistaken for no error at all
test('A non-Error thrown by the "verbose" function is propagated, "output"', async t => {
	const {cause, stdout} = await t.throwsAsync(execa('noop.js', [foobarString], getThrowingVerbose('output', foobarString)));
	t.is(cause, foobarString);
	t.is(stdout, undefined);
});

test('A null value thrown by the "verbose" function is propagated, "output"', async t => {
	const {cause, stdout} = await t.throwsAsync(execa('noop.js', [foobarString], getThrowingVerbose('output', null)));
	t.is(cause, null);
	t.is(stdout, undefined);
});

test('IPC output is kept when the "verbose" function throws a falsy value, "ipc"', async t => {
	const {cause, ipcOutput} = await t.throwsAsync(execa('ipc-send-twice.js', {ipc: true, ...getThrowingVerbose('ipc', 0)}));
	t.is(cause, 0);
	t.deepEqual(ipcOutput, ['foo', 'bar']);
});
