import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {runVerboseSubprocess} from '../helpers/verbose.js';
import {
	earlyErrorOptions,
	earlyErrorOptionsSync,
	expectedEarlyError,
	expectedEarlyErrorSync,
} from '../helpers/early-error.js';

setFixtureDirectory();

const testVerboseResultEnd = async (t, type, isSync) => {
	const {stderr: parentStderr} = await runVerboseSubprocess({
		isSync,
		type,
		optionsFixture: 'custom-result.js',
	});
	const {failed, exitCode, stdout, stderr, ipcOutput, durationMs} = JSON.parse(parentStderr);
	t.true(failed);
	t.is(exitCode, 2);
	t.is(stdout, '. .');
	t.is(stderr, '');
	t.is(typeof durationMs, 'number');
	t.deepEqual(ipcOutput, isSync ? [] : ['. .']);
};

test('"verbose" function receives verboseObject.result, "error"', testVerboseResultEnd, 'error', false);
test('"verbose" function receives verboseObject.result, "duration"', testVerboseResultEnd, 'duration', false);
test('"verbose" function receives verboseObject.result, "error", sync', testVerboseResultEnd, 'error', true);
test('"verbose" function receives verboseObject.result, "duration", sync', testVerboseResultEnd, 'duration', true);

// eslint-disable-next-line max-params
const testVerboseResultEndSpawn = async (t, type, options, expectedOutput, isSync) => {
	const {stderr: parentStderr} = await runVerboseSubprocess({
		isSync,
		type,
		optionsFixture: 'custom-result.js',
		...options,
	});
	const lastLine = parentStderr.split('\n').at(-1);
	const result = JSON.parse(lastLine);
	t.like(result, expectedOutput);
	t.true(result.failed);
	t.is(result.exitCode, undefined);
	t.is(result.stdout, undefined);
	t.is(result.stderr, undefined);
	t.is(typeof result.durationMs, 'number');
	t.deepEqual(result.ipcOutput, []);
};

test('"verbose" function receives verboseObject.result, "error", spawn error', testVerboseResultEndSpawn, 'error', earlyErrorOptions, expectedEarlyError, false);
test('"verbose" function receives verboseObject.result, "duration", spawn error', testVerboseResultEndSpawn, 'duration', earlyErrorOptions, expectedEarlyError, false);
test('"verbose" function receives verboseObject.result, "error", spawn error, sync', testVerboseResultEndSpawn, 'error', earlyErrorOptionsSync, expectedEarlyErrorSync, true);
test('"verbose" function receives verboseObject.result, "duration", spawn error, sync', testVerboseResultEndSpawn, 'duration', earlyErrorOptionsSync, expectedEarlyErrorSync, true);

const testVerboseResultStart = async (t, type, options, isSync) => {
	const {stderr: parentStderr} = await runVerboseSubprocess({
		isSync,
		type,
		optionsFixture: 'custom-result.js',
		...options,
	});
	t.is(parentStderr, '');
};

test('"verbose" function does not receive verboseObject.result, "command"', testVerboseResultStart, 'command', {}, false);
test('"verbose" function does not receive verboseObject.result, "output"', testVerboseResultStart, 'output', {}, false);
test('"verbose" function does not receive verboseObject.result, "ipc"', testVerboseResultStart, 'ipc', {}, false);
test('"verbose" function does not receive verboseObject.result, "command", spawn error', testVerboseResultStart, 'command', earlyErrorOptions, false);
test('"verbose" function does not receive verboseObject.result, "output", spawn error', testVerboseResultStart, 'output', earlyErrorOptions, false);
test('"verbose" function does not receive verboseObject.result, "ipc", spawn error', testVerboseResultStart, 'ipc', earlyErrorOptions, false);
test('"verbose" function does not receive verboseObject.result, "command", sync', testVerboseResultStart, 'command', {}, true);
test('"verbose" function does not receive verboseObject.result, "output", sync', testVerboseResultStart, 'output', {}, true);
test('"verbose" function does not receive verboseObject.result, "command", spawn error, sync', testVerboseResultStart, 'command', earlyErrorOptionsSync, true);
test('"verbose" function does not receive verboseObject.result, "output", spawn error, sync', testVerboseResultStart, 'output', earlyErrorOptionsSync, true);
