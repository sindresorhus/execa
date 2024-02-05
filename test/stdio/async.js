import {once, defaultMaxListeners} from 'node:events';
import process from 'node:process';
import {setImmediate} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {STANDARD_STREAMS} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const getStandardStreamListeners = stream => Object.fromEntries(stream.eventNames().map(eventName => [eventName, stream.listeners(eventName)]));
const getStandardStreamsListeners = () => STANDARD_STREAMS.map(stream => getStandardStreamListeners(stream));

const getComplexStdio = isMultiple => ({
	stdin: ['pipe', 'inherit', ...(isMultiple ? [0, process.stdin] : [])],
	stdout: ['pipe', 'inherit', ...(isMultiple ? [1, process.stdout] : [])],
	stderr: ['pipe', 'inherit', ...(isMultiple ? [2, process.stderr] : [])],
});

const testListenersCleanup = async (t, isMultiple) => {
	const streamsPreviousListeners = getStandardStreamsListeners();
	const childProcess = execa('empty.js', getComplexStdio(isMultiple));
	t.notDeepEqual(getStandardStreamsListeners(), streamsPreviousListeners);
	await Promise.all([
		childProcess,
		once(childProcess.stdin, 'unpipe'),
		once(process.stdout, 'unpipe'),
		once(process.stderr, 'unpipe'),
	]);
	await setImmediate();

	for (const [index, streamNewListeners] of Object.entries(getStandardStreamsListeners())) {
		const defaultListeners = Object.fromEntries(Reflect.ownKeys(streamNewListeners).map(eventName => [eventName, []]));
		t.deepEqual(streamNewListeners, {...defaultListeners, ...streamsPreviousListeners[index]});
	}
};

test.serial('process.std* listeners are cleaned up on success with a single input', testListenersCleanup, false);
test.serial('process.std* listeners are cleaned up on success with multiple inputs', testListenersCleanup, true);

const processesCount = 100;

test.serial('Can spawn many processes in parallel', async t => {
	const results = await Promise.all(
		Array.from({length: processesCount}, () => execa('noop.js', [foobarString])),
	);
	t.true(results.every(({stdout}) => stdout === foobarString));
});

const testMaxListeners = async (t, isMultiple, maxListenersCount) => {
	let warning;
	const captureWarning = warningArgument => {
		warning = warningArgument;
	};

	process.on('warning', captureWarning);

	for (const standardStream of STANDARD_STREAMS) {
		standardStream.setMaxListeners(maxListenersCount);
	}

	try {
		const results = await Promise.all(
			Array.from({length: processesCount}, () => execa('empty.js', getComplexStdio(isMultiple))),
		);
		await setImmediate();
		t.true(results.every(({exitCode}) => exitCode === 0));
		t.is(warning, undefined);
	} finally {
		for (const standardStream of STANDARD_STREAMS) {
			t.is(standardStream.getMaxListeners(), maxListenersCount);
			standardStream.setMaxListeners(defaultMaxListeners);
		}

		process.off('warning', captureWarning);
	}
};

test.serial('No warning with maxListeners 1 and ["pipe", "inherit"]', testMaxListeners, false, 1);
test.serial('No warning with maxListeners default and ["pipe", "inherit"]', testMaxListeners, false, defaultMaxListeners);
test.serial('No warning with maxListeners 100 and ["pipe", "inherit"]', testMaxListeners, false, 100);
test.serial('No warning with maxListeners Infinity and ["pipe", "inherit"]', testMaxListeners, false, Number.POSITIVE_INFINITY);
test.serial('No warning with maxListeners 0 and ["pipe", "inherit"]', testMaxListeners, false, 0);
test.serial('No warning with maxListeners 1 and ["pipe", "inherit"], multiple inputs', testMaxListeners, true, 1);
test.serial('No warning with maxListeners default and ["pipe", "inherit"], multiple inputs', testMaxListeners, true, defaultMaxListeners);
test.serial('No warning with maxListeners 100 and ["pipe", "inherit"], multiple inputs', testMaxListeners, true, 100);
test.serial('No warning with maxListeners Infinity and ["pipe", "inherit"], multiple inputs', testMaxListeners, true, Number.POSITIVE_INFINITY);
test.serial('No warning with maxListeners 0 and ["pipe", "inherit"], multiple inputs', testMaxListeners, true, 0);
