import assert from 'node:assert/strict';
import test from 'node:test';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {runVerboseSubprocess} from '../helpers/verbose.js';
import {assertLike} from '../helpers/assert.js';
import {
	earlyErrorOptions,
	earlyErrorOptionsSync,
	expectedEarlyError,
	expectedEarlyErrorSync,
} from '../helpers/early-error.js';

setFixtureDirectory();

const testVerboseResultEnd = async (type, isSync) => {
	const {stderr: parentStderr} = await runVerboseSubprocess({
		isSync,
		type,
		optionsFixture: 'custom-result.js',
	});
	const {failed, exitCode, stdout, stderr, ipcOutput, durationMs} = JSON.parse(parentStderr);
	assert.equal(failed, true);
	assert.equal(exitCode, 2);
	assert.equal(stdout, '. .');
	assert.equal(stderr, '');
	assert.equal(typeof durationMs, 'number');
	assert.deepEqual(ipcOutput, isSync ? [] : ['. .']);
};

test('"verbose" function receives verboseObject.result, "error"', () => testVerboseResultEnd('error', false));
test('"verbose" function receives verboseObject.result, "duration"', () => testVerboseResultEnd('duration', false));
test('"verbose" function receives verboseObject.result, "error", sync', () => testVerboseResultEnd('error', true));
test('"verbose" function receives verboseObject.result, "duration", sync', () => testVerboseResultEnd('duration', true));

const testVerboseResultEndSpawn = async (type, options, expectedOutput, isSync) => {
	const {stderr: parentStderr} = await runVerboseSubprocess({
		isSync,
		type,
		optionsFixture: 'custom-result.js',
		...options,
	});
	const lastLine = parentStderr.split('\n').at(-1);
	const result = JSON.parse(lastLine);
	assertLike(result, expectedOutput);
	assert.equal(result.failed, true);
	assert.equal(result.exitCode, undefined);
	assert.equal(result.stdout, undefined);
	assert.equal(result.stderr, undefined);
	assert.equal(typeof result.durationMs, 'number');
	assert.deepEqual(result.ipcOutput, []);
};

test('"verbose" function receives verboseObject.result, "error", spawn error', () => testVerboseResultEndSpawn('error', earlyErrorOptions, expectedEarlyError, false));
test('"verbose" function receives verboseObject.result, "duration", spawn error', () => testVerboseResultEndSpawn('duration', earlyErrorOptions, expectedEarlyError, false));
test('"verbose" function receives verboseObject.result, "error", spawn error, sync', () => testVerboseResultEndSpawn('error', earlyErrorOptionsSync, expectedEarlyErrorSync, true));
test('"verbose" function receives verboseObject.result, "duration", spawn error, sync', () => testVerboseResultEndSpawn('duration', earlyErrorOptionsSync, expectedEarlyErrorSync, true));

const testVerboseResultStart = async (type, options, isSync) => {
	const {stderr: parentStderr} = await runVerboseSubprocess({
		isSync,
		type,
		optionsFixture: 'custom-result.js',
		...options,
	});
	assert.equal(parentStderr, '');
};

test('"verbose" function does not receive verboseObject.result, "command"', () => testVerboseResultStart('command', {}, false));
test('"verbose" function does not receive verboseObject.result, "output"', () => testVerboseResultStart('output', {}, false));
test('"verbose" function does not receive verboseObject.result, "ipc"', () => testVerboseResultStart('ipc', {}, false));
test('"verbose" function does not receive verboseObject.result, "command", spawn error', () => testVerboseResultStart('command', earlyErrorOptions, false));
test('"verbose" function does not receive verboseObject.result, "output", spawn error', () => testVerboseResultStart('output', earlyErrorOptions, false));
test('"verbose" function does not receive verboseObject.result, "ipc", spawn error', () => testVerboseResultStart('ipc', earlyErrorOptions, false));
test('"verbose" function does not receive verboseObject.result, "command", sync', () => testVerboseResultStart('command', {}, true));
test('"verbose" function does not receive verboseObject.result, "output", sync', () => testVerboseResultStart('output', {}, true));
test('"verbose" function does not receive verboseObject.result, "command", spawn error, sync', () => testVerboseResultStart('command', earlyErrorOptionsSync, true));
test('"verbose" function does not receive verboseObject.result, "output", spawn error, sync', () => testVerboseResultStart('output', earlyErrorOptionsSync, true));
