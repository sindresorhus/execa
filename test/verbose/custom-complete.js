import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {fullStdio} from '../helpers/stdio.js';
import {getNormalizedLine, testTimestamp, runVerboseSubprocess} from '../helpers/verbose.js';

setFixtureDirectory();

const testPrintCompletionCustom = async (t, fdNumber, isSync) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print.js',
		isSync,
		type: 'duration',
		fdNumber,
	});
	t.is(getNormalizedLine(stderr), `${testTimestamp} [0] × (done in 0ms)`);
};

test('Prints completion, verbose custom', testPrintCompletionCustom, undefined, false);
test('Prints completion, verbose custom, fd-specific stdout', testPrintCompletionCustom, 'stdout', false);
test('Prints completion, verbose custom, fd-specific stderr', testPrintCompletionCustom, 'stderr', false);
test('Prints completion, verbose custom, fd-specific fd3', testPrintCompletionCustom, 'fd3', false);
test('Prints completion, verbose custom, fd-specific ipc', testPrintCompletionCustom, 'ipc', false);
test('Prints completion, verbose custom, sync', testPrintCompletionCustom, undefined, true);
test('Prints completion, verbose custom, fd-specific stdout, sync', testPrintCompletionCustom, 'stdout', true);
test('Prints completion, verbose custom, fd-specific stderr, sync', testPrintCompletionCustom, 'stderr', true);
test('Prints completion, verbose custom, fd-specific fd3, sync', testPrintCompletionCustom, 'fd3', true);
test('Prints completion, verbose custom, fd-specific ipc, sync', testPrintCompletionCustom, 'ipc', true);

const testPrintCompletionOrder = async (t, fdNumber, secondFdNumber, hasOutput) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print-multiple.js',
		type: 'duration',
		fdNumber,
		secondFdNumber,
		...fullStdio,
	});

	if (hasOutput) {
		t.is(getNormalizedLine(stderr), `${testTimestamp} [0] × (done in 0ms)`);
	} else {
		t.is(stderr, '');
	}
};

test('Prints completion, verbose custom, fd-specific stdout+stderr', testPrintCompletionOrder, 'stdout', 'stderr', true);
test('Prints completion, verbose custom, fd-specific stderr+stdout', testPrintCompletionOrder, 'stderr', 'stdout', false);
test('Prints completion, verbose custom, fd-specific stdout+fd3', testPrintCompletionOrder, 'stdout', 'fd3', true);
test('Prints completion, verbose custom, fd-specific fd3+stdout', testPrintCompletionOrder, 'fd3', 'stdout', false);
test('Prints completion, verbose custom, fd-specific stdout+ipc', testPrintCompletionOrder, 'stdout', 'ipc', true);
test('Prints completion, verbose custom, fd-specific ipc+stdout', testPrintCompletionOrder, 'ipc', 'stdout', false);
test('Prints completion, verbose custom, fd-specific stderr+fd3', testPrintCompletionOrder, 'stderr', 'fd3', true);
test('Prints completion, verbose custom, fd-specific fd3+stderr', testPrintCompletionOrder, 'fd3', 'stderr', false);
test('Prints completion, verbose custom, fd-specific stderr+ipc', testPrintCompletionOrder, 'stderr', 'ipc', true);
test('Prints completion, verbose custom, fd-specific ipc+stderr', testPrintCompletionOrder, 'ipc', 'stderr', false);
test('Prints completion, verbose custom, fd-specific fd3+ipc', testPrintCompletionOrder, 'fd3', 'ipc', true);
test('Prints completion, verbose custom, fd-specific ipc+fd3', testPrintCompletionOrder, 'ipc', 'fd3', false);

const testPrintCompletionFunction = async (t, fdNumber, secondFdNumber) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print-function.js',
		type: 'duration',
		fdNumber,
		secondFdNumber,
		...fullStdio,
	});
	t.is(getNormalizedLine(stderr), `${testTimestamp} [0] × (done in 0ms)`);
};

test('Prints completion, verbose custom, fd-specific stdout+stderr, single function', testPrintCompletionFunction, 'stdout', 'stderr');
test('Prints completion, verbose custom, fd-specific stderr+stdout, single function', testPrintCompletionFunction, 'stderr', 'stdout');
test('Prints completion, verbose custom, fd-specific stdout+fd3, single function', testPrintCompletionFunction, 'stdout', 'fd3');
test('Prints completion, verbose custom, fd-specific fd3+stdout, single function', testPrintCompletionFunction, 'fd3', 'stdout');
test('Prints completion, verbose custom, fd-specific stdout+ipc, single function', testPrintCompletionFunction, 'stdout', 'ipc');
test('Prints completion, verbose custom, fd-specific ipc+stdout, single function', testPrintCompletionFunction, 'ipc', 'stdout');
test('Prints completion, verbose custom, fd-specific stderr+fd3, single function', testPrintCompletionFunction, 'stderr', 'fd3');
test('Prints completion, verbose custom, fd-specific fd3+stderr, single function', testPrintCompletionFunction, 'fd3', 'stderr');
test('Prints completion, verbose custom, fd-specific stderr+ipc, single function', testPrintCompletionFunction, 'stderr', 'ipc');
test('Prints completion, verbose custom, fd-specific ipc+stderr, single function', testPrintCompletionFunction, 'ipc', 'stderr');
test('Prints completion, verbose custom, fd-specific fd3+ipc, single function', testPrintCompletionFunction, 'fd3', 'ipc');
test('Prints completion, verbose custom, fd-specific ipc+fd3, single function', testPrintCompletionFunction, 'ipc', 'fd3');

const testVerboseMessage = async (t, isSync) => {
	const {stderr} = await runVerboseSubprocess({
		isSync,
		type: 'duration',
		eventProperty: 'message',
	});
	t.is(getNormalizedLine(stderr), '(done in 0ms)');
};

test('"verbose" function receives verboseObject.message', testVerboseMessage, false);
test('"verbose" function receives verboseObject.message, sync', testVerboseMessage, true);
