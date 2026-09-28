import assert from 'node:assert/strict';
import {once, defaultMaxListeners} from 'node:events';
import process from 'node:process';
import {setImmediate} from 'node:timers/promises';
import test from 'node:test';
import {execa} from '../../index.js';
import {STANDARD_STREAMS} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {assertMaxListeners} from '../helpers/listeners.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

const getStandardStreamListeners = stream => Object.fromEntries(stream.eventNames().map(eventName => [eventName, stream.listeners(eventName)]));
const getStandardStreamsListeners = () => STANDARD_STREAMS.map(stream => getStandardStreamListeners(stream));

const getComplexStdio = isMultiple => ({
	stdin: ['pipe', 'inherit', ...(isMultiple ? [0, process.stdin] : [])],
	stdout: ['pipe', 'inherit', ...(isMultiple ? [1, process.stdout] : [])],
	stderr: ['pipe', 'inherit', ...(isMultiple ? [2, process.stderr] : [])],
});

const onStdinRemoveListener = () => once(process.stdin, 'removeListener');

const testListenersCleanup = async isMultiple => {
	const streamsPreviousListeners = getStandardStreamsListeners();
	const subprocess = execa('empty.js', getComplexStdio(isMultiple));
	assert.notDeepEqual(getStandardStreamsListeners(), streamsPreviousListeners);
	await Promise.all([subprocess, onStdinRemoveListener()]);
	if (isMultiple) {
		await onStdinRemoveListener();
	}

	for (const [fdNumber, streamNewListeners] of Object.entries(getStandardStreamsListeners())) {
		const defaultListeners = Object.fromEntries(Reflect.ownKeys(streamNewListeners).map(eventName => [eventName, []]));
		assert.deepEqual(streamNewListeners, {...defaultListeners, ...streamsPreviousListeners[fdNumber]});
	}
};

test('process.std* listeners are cleaned up on success with a single input', () => testListenersCleanup(false));
test('process.std* listeners are cleaned up on success with multiple inputs', () => testListenersCleanup(true));

test('Can spawn many subprocesses in parallel', async () => {
	const results = await Promise.all(Array.from({length: PARALLEL_COUNT}, () => execa('noop.js', [foobarString])));
	assert.ok(results.every(({stdout}) => stdout === foobarString));
});

const testMaxListeners = async (isMultiple, maxListenersCount) => {
	const checkMaxListeners = assertMaxListeners();

	for (const standardStream of STANDARD_STREAMS) {
		standardStream.setMaxListeners(maxListenersCount);
	}

	try {
		const results = await Promise.all(Array.from({length: PARALLEL_COUNT}, () => execa('empty.js', getComplexStdio(isMultiple))));
		assert.ok(results.every(({exitCode}) => exitCode === 0));
	} finally {
		await setImmediate();
		await setImmediate();
		checkMaxListeners();

		for (const standardStream of STANDARD_STREAMS) {
			assert.equal(standardStream.getMaxListeners(), maxListenersCount);
			standardStream.setMaxListeners(defaultMaxListeners);
		}
	}
};

test('No warning with maxListeners 1 and ["pipe", "inherit"]', () => testMaxListeners(false, 1));
test('No warning with maxListeners default and ["pipe", "inherit"]', () => testMaxListeners(false, defaultMaxListeners));
test('No warning with maxListeners 100 and ["pipe", "inherit"]', () => testMaxListeners(false, 100));
test('No warning with maxListeners Infinity and ["pipe", "inherit"]', () => testMaxListeners(false, Infinity));
test('No warning with maxListeners 0 and ["pipe", "inherit"]', () => testMaxListeners(false, 0));
test('No warning with maxListeners 1 and ["pipe", "inherit"], multiple inputs', () => testMaxListeners(true, 1));
test('No warning with maxListeners default and ["pipe", "inherit"], multiple inputs', () => testMaxListeners(true, defaultMaxListeners));
test('No warning with maxListeners 100 and ["pipe", "inherit"], multiple inputs', () => testMaxListeners(true, 100));
test('No warning with maxListeners Infinity and ["pipe", "inherit"], multiple inputs', () => testMaxListeners(true, Infinity));
test('No warning with maxListeners 0 and ["pipe", "inherit"], multiple inputs', () => testMaxListeners(true, 0));
