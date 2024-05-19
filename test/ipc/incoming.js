import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {alwaysPass} from '../helpers/ipc.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

const testSeriesParent = async (t, buffer, filter) => {
	const subprocess = execa('ipc-send-many.js', [`${PARALLEL_COUNT}`], {ipc: true, buffer});

	for (let index = 0; index < PARALLEL_COUNT; index += 1) {
		// eslint-disable-next-line no-await-in-loop
		t.is(await subprocess.getOneMessage({filter}), index);
	}

	const {ipcOutput} = await subprocess;
	if (buffer) {
		t.deepEqual(ipcOutput, Array.from({length: PARALLEL_COUNT}, (_, index) => index));
	}
};

test('subprocess.getOneMessage() can be called multiple times in a row, buffer false', testSeriesParent, false, undefined);
test('subprocess.getOneMessage() can be called multiple times in a row, buffer true', testSeriesParent, true, undefined);
test('subprocess.getOneMessage() can be called multiple times in a row, buffer false, filter', testSeriesParent, false, alwaysPass);
test('subprocess.getOneMessage() can be called multiple times in a row, buffer true, filter', testSeriesParent, true, alwaysPass);

const testSeriesSubprocess = async (t, filter) => {
	const subprocess = execa('ipc-print-many.js', [`${PARALLEL_COUNT}`, `${filter}`], {ipc: true});
	const indexes = Array.from({length: PARALLEL_COUNT}, (_, index) => `${index}`);
	await Promise.all(indexes.map(index => subprocess.sendMessage(index)));

	const {stdout} = await subprocess;
	const expectedOutput = indexes.join('\n');
	t.is(stdout, expectedOutput);
};

test('exports.getOneMessage() can be called multiple times in a row', testSeriesSubprocess, false);
test('exports.getOneMessage() can be called multiple times in a row, filter', testSeriesSubprocess, true);

test('Can iterate multiple times over IPC messages in subprocess', async t => {
	const subprocess = execa('ipc-iterate-twice.js', {ipc: true});

	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage('.');
	t.is(await subprocess.getOneMessage(), '0.');
	await subprocess.sendMessage(foobarString);
	t.is(await subprocess.getOneMessage(), foobarString);
	await subprocess.sendMessage('.');
	t.is(await subprocess.getOneMessage(), '1.');
	await subprocess.sendMessage(foobarString);

	const {ipcOutput} = await subprocess;
	t.deepEqual(ipcOutput, [foobarString, '0.', foobarString, '1.']);
});
