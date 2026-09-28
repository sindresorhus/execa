import assert from 'node:assert/strict';
import {inspect} from 'node:util';
import test from 'node:test';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {fullStdio} from '../helpers/stdio.js';
import {
	getNormalizedLine,
	getNormalizedLines,
	testTimestamp,
	runVerboseSubprocess,
} from '../helpers/verbose.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {foobarObject} from '../helpers/input.js';

setFixtureDirectory();

const testPrintIpcCustom = async (fdNumber, hasOutput) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print.js',
		type: 'ipc',
		fdNumber,
		...fullStdio,
	});

	if (hasOutput) {
		assert.equal(getNormalizedLine(stderr), `${testTimestamp} [0] * . .`);
	} else {
		assert.equal(stderr, '');
	}
};

test('Prints IPC, verbose custom', () => testPrintIpcCustom(undefined, true));
test('Prints IPC, verbose custom, fd-specific stdout', () => testPrintIpcCustom('stdout', false));
test('Prints IPC, verbose custom, fd-specific stderr', () => testPrintIpcCustom('stderr', false));
test('Prints IPC, verbose custom, fd-specific fd3', () => testPrintIpcCustom('fd3', false));
test('Prints IPC, verbose custom, fd-specific ipc', () => testPrintIpcCustom('ipc', true));

const testPrintIpcOrder = async (fdNumber, secondFdNumber, hasOutput) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print-multiple.js',
		type: 'ipc',
		fdNumber,
		secondFdNumber,
		...fullStdio,
	});

	if (hasOutput) {
		assert.equal(getNormalizedLine(stderr), `${testTimestamp} [0] * . .`);
	} else {
		assert.equal(stderr, '');
	}
};

test('Prints IPC, verbose custom, fd-specific stdout+stderr', () => testPrintIpcOrder('stdout', 'stderr', false));
test('Prints IPC, verbose custom, fd-specific stderr+stdout', () => testPrintIpcOrder('stderr', 'stdout', false));
test('Prints IPC, verbose custom, fd-specific stdout+fd3', () => testPrintIpcOrder('stdout', 'fd3', false));
test('Prints IPC, verbose custom, fd-specific fd3+stdout', () => testPrintIpcOrder('fd3', 'stdout', false));
test('Prints IPC, verbose custom, fd-specific stdout+ipc', () => testPrintIpcOrder('stdout', 'ipc', false));
test('Prints IPC, verbose custom, fd-specific ipc+stdout', () => testPrintIpcOrder('ipc', 'stdout', true));
test('Prints IPC, verbose custom, fd-specific stderr+fd3', () => testPrintIpcOrder('stderr', 'fd3', false));
test('Prints IPC, verbose custom, fd-specific fd3+stderr', () => testPrintIpcOrder('fd3', 'stderr', false));
test('Prints IPC, verbose custom, fd-specific stderr+ipc', () => testPrintIpcOrder('stderr', 'ipc', false));
test('Prints IPC, verbose custom, fd-specific ipc+stderr', () => testPrintIpcOrder('ipc', 'stderr', true));
test('Prints IPC, verbose custom, fd-specific fd3+ipc', () => testPrintIpcOrder('fd3', 'ipc', false));
test('Prints IPC, verbose custom, fd-specific ipc+fd3', () => testPrintIpcOrder('ipc', 'fd3', true));

const testPrintIpcFunction = async (fdNumber, secondFdNumber, hasOutput) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print-function.js',
		type: 'ipc',
		fdNumber,
		secondFdNumber,
		...fullStdio,
	});

	if (hasOutput) {
		assert.equal(getNormalizedLine(stderr), `${testTimestamp} [0] * . .`);
	} else {
		assert.equal(stderr, '');
	}
};

test('Prints IPC, verbose custom, fd-specific stdout+stderr, single function', () => testPrintIpcFunction('stdout', 'stderr', false));
test('Prints IPC, verbose custom, fd-specific stderr+stdout, single function', () => testPrintIpcFunction('stderr', 'stdout', false));
test('Prints IPC, verbose custom, fd-specific stdout+fd3, single function', () => testPrintIpcFunction('stdout', 'fd3', false));
test('Prints IPC, verbose custom, fd-specific fd3+stdout, single function', () => testPrintIpcFunction('fd3', 'stdout', false));
test('Prints IPC, verbose custom, fd-specific stdout+ipc, single function', () => testPrintIpcFunction('stdout', 'ipc', false));
test('Prints IPC, verbose custom, fd-specific ipc+stdout, single function', () => testPrintIpcFunction('ipc', 'stdout', true));
test('Prints IPC, verbose custom, fd-specific stderr+fd3, single function', () => testPrintIpcFunction('stderr', 'fd3', false));
test('Prints IPC, verbose custom, fd-specific fd3+stderr, single function', () => testPrintIpcFunction('fd3', 'stderr', false));
test('Prints IPC, verbose custom, fd-specific stderr+ipc, single function', () => testPrintIpcFunction('stderr', 'ipc', false));
test('Prints IPC, verbose custom, fd-specific ipc+stderr, single function', () => testPrintIpcFunction('ipc', 'stderr', true));
test('Prints IPC, verbose custom, fd-specific fd3+ipc, single function', () => testPrintIpcFunction('fd3', 'ipc', false));
test('Prints IPC, verbose custom, fd-specific ipc+fd3, single function', () => testPrintIpcFunction('ipc', 'fd3', true));

test('"verbose" function receives verboseObject.message', async () => {
	const {stderr} = await runVerboseSubprocess({
		type: 'ipc',
		eventProperty: 'message',
	});
	assert.equal(stderr, '. .');
});

test('"verbose" function receives verboseObject.message line-wise', async () => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print.js',
		type: 'ipc',
		output: '.\n.',
	});
	assert.deepEqual(getNormalizedLines(stderr), [`${testTimestamp} [0] * .`, `${testTimestamp} [0] * .`]);
});

test('"verbose" function receives verboseObject.message serialized', async () => {
	const {stderr} = await nestedSubprocess('ipc-echo.js', {
		ipcInput: foobarObject,
		optionsFixture: 'custom-print.js',
		optionsInput: {type: 'ipc'},
	});
	assert.equal(getNormalizedLine(stderr), `${testTimestamp} [0] * ${inspect(foobarObject)}`);
});
