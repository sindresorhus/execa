import {inspect} from 'node:util';
import test from 'ava';
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

const testPrintOutputCustom = async (t, fdNumber, isSync, hasOutput) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print.js',
		isSync,
		type: 'output',
		fdNumber,
	});

	if (hasOutput) {
		t.is(getNormalizedLine(stderr), `${testTimestamp} [0]   . .`);
	} else {
		t.is(stderr, '');
	}
};

test('Prints stdout, verbose custom', testPrintOutputCustom, undefined, false, true);
test('Prints stdout, verbose custom, fd-specific stdout', testPrintOutputCustom, 'stdout', false, true);
test('Prints stdout, verbose custom, fd-specific stderr', testPrintOutputCustom, 'stderr', false, false);
test('Prints stdout, verbose custom, fd-specific fd3', testPrintOutputCustom, 'fd3', false, false);
test('Prints stdout, verbose custom, fd-specific ipc', testPrintOutputCustom, 'ipc', false, false);
test('Prints stdout, verbose custom, sync', testPrintOutputCustom, undefined, true, true);
test('Prints stdout, verbose custom, fd-specific stdout, sync', testPrintOutputCustom, 'stdout', true, true);
test('Prints stdout, verbose custom, fd-specific stderr, sync', testPrintOutputCustom, 'stderr', true, false);
test('Prints stdout, verbose custom, fd-specific fd3, sync', testPrintOutputCustom, 'fd3', true, false);
test('Prints stdout, verbose custom, fd-specific ipc, sync', testPrintOutputCustom, 'ipc', true, false);

const testPrintOutputOrder = async (t, fdNumber, secondFdNumber, hasOutput) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print-multiple.js',
		type: 'output',
		fdNumber,
		secondFdNumber,
		...fullStdio,
	});

	if (hasOutput) {
		t.is(getNormalizedLine(stderr), `${testTimestamp} [0]   . .`);
	} else {
		t.is(stderr, '');
	}
};

test('Prints stdout, verbose custom, fd-specific stdout+stderr', testPrintOutputOrder, 'stdout', 'stderr', true);
test('Prints stdout, verbose custom, fd-specific stderr+stdout', testPrintOutputOrder, 'stderr', 'stdout', false);
test('Prints stdout, verbose custom, fd-specific stdout+fd3', testPrintOutputOrder, 'stdout', 'fd3', true);
test('Prints stdout, verbose custom, fd-specific fd3+stdout', testPrintOutputOrder, 'fd3', 'stdout', false);
test('Prints stdout, verbose custom, fd-specific stdout+ipc', testPrintOutputOrder, 'stdout', 'ipc', true);
test('Prints stdout, verbose custom, fd-specific ipc+stdout', testPrintOutputOrder, 'ipc', 'stdout', false);
test('Prints stdout, verbose custom, fd-specific stderr+fd3', testPrintOutputOrder, 'stderr', 'fd3', false);
test('Prints stdout, verbose custom, fd-specific fd3+stderr', testPrintOutputOrder, 'fd3', 'stderr', false);
test('Prints stdout, verbose custom, fd-specific stderr+ipc', testPrintOutputOrder, 'stderr', 'ipc', false);
test('Prints stdout, verbose custom, fd-specific ipc+stderr', testPrintOutputOrder, 'ipc', 'stderr', false);
test('Prints stdout, verbose custom, fd-specific fd3+ipc', testPrintOutputOrder, 'fd3', 'ipc', false);
test('Prints stdout, verbose custom, fd-specific ipc+fd3', testPrintOutputOrder, 'ipc', 'fd3', false);

const testPrintOutputFunction = async (t, fdNumber, secondFdNumber, hasOutput) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print-function.js',
		type: 'output',
		fdNumber,
		secondFdNumber,
		...fullStdio,
	});

	if (hasOutput) {
		t.is(getNormalizedLine(stderr), `${testTimestamp} [0]   . .`);
	} else {
		t.is(stderr, '');
	}
};

test('Prints stdout, verbose custom, fd-specific stdout+stderr, single function', testPrintOutputFunction, 'stdout', 'stderr', true);
test('Prints stdout, verbose custom, fd-specific stderr+stdout, single function', testPrintOutputFunction, 'stderr', 'stdout', false);
test('Prints stdout, verbose custom, fd-specific stdout+fd3, single function', testPrintOutputFunction, 'stdout', 'fd3', true);
test('Prints stdout, verbose custom, fd-specific fd3+stdout, single function', testPrintOutputFunction, 'fd3', 'stdout', false);
test('Prints stdout, verbose custom, fd-specific stdout+ipc, single function', testPrintOutputFunction, 'stdout', 'ipc', true);
test('Prints stdout, verbose custom, fd-specific ipc+stdout, single function', testPrintOutputFunction, 'ipc', 'stdout', false);
test('Prints stdout, verbose custom, fd-specific stderr+fd3, single function', testPrintOutputFunction, 'stderr', 'fd3', false);
test('Prints stdout, verbose custom, fd-specific fd3+stderr, single function', testPrintOutputFunction, 'fd3', 'stderr', false);
test('Prints stdout, verbose custom, fd-specific stderr+ipc, single function', testPrintOutputFunction, 'stderr', 'ipc', false);
test('Prints stdout, verbose custom, fd-specific ipc+stderr, single function', testPrintOutputFunction, 'ipc', 'stderr', false);
test('Prints stdout, verbose custom, fd-specific fd3+ipc, single function', testPrintOutputFunction, 'fd3', 'ipc', false);
test('Prints stdout, verbose custom, fd-specific ipc+fd3, single function', testPrintOutputFunction, 'ipc', 'fd3', false);

const testVerboseMessage = async (t, isSync) => {
	const {stderr} = await runVerboseSubprocess({
		isSync,
		type: 'output',
		eventProperty: 'message',
	});
	t.is(stderr, '. .');
};

test('"verbose" function receives verboseObject.message', testVerboseMessage, false);
test('"verbose" function receives verboseObject.message, sync', testVerboseMessage, true);

const testPrintOutputMultiline = async (t, isSync) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print.js',
		isSync,
		type: 'output',
		output: '.\n.',
	});
	t.deepEqual(getNormalizedLines(stderr), [`${testTimestamp} [0]   .`, `${testTimestamp} [0]   .`]);
};

test('"verbose" function receives verboseObject.message line-wise', testPrintOutputMultiline, false);
test('"verbose" function receives verboseObject.message line-wise, sync', testPrintOutputMultiline, true);

test('"verbose" function receives verboseObject.message serialized', async t => {
	const {stderr} = await nestedSubprocess('noop.js', {optionsFixture: 'custom-object-stdout.js'});
	t.is(getNormalizedLine(stderr), `${testTimestamp} [0]   ${inspect(foobarObject)}`);
});
