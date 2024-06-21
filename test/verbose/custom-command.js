import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {fullStdio} from '../helpers/stdio.js';
import {
	QUOTE,
	getNormalizedLine,
	testTimestamp,
	runVerboseSubprocess,
} from '../helpers/verbose.js';

setFixtureDirectory();

const testPrintCommandCustom = async (t, fdNumber, isSync) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print.js',
		isSync,
		type: 'command',
		fdNumber,
	});
	t.is(getNormalizedLine(stderr), `${testTimestamp} [0] $ noop-verbose.js ${QUOTE}. .${QUOTE}`);
};

test('Prints command, verbose custom', testPrintCommandCustom, undefined, false);
test('Prints command, verbose custom, fd-specific stdout', testPrintCommandCustom, 'stdout', false);
test('Prints command, verbose custom, fd-specific stderr', testPrintCommandCustom, 'stderr', false);
test('Prints command, verbose custom, fd-specific fd3', testPrintCommandCustom, 'fd3', false);
test('Prints command, verbose custom, fd-specific ipc', testPrintCommandCustom, 'ipc', false);
test('Prints command, verbose custom, sync', testPrintCommandCustom, undefined, true);
test('Prints command, verbose custom, fd-specific stdout, sync', testPrintCommandCustom, 'stdout', true);
test('Prints command, verbose custom, fd-specific stderr, sync', testPrintCommandCustom, 'stderr', true);
test('Prints command, verbose custom, fd-specific fd3, sync', testPrintCommandCustom, 'fd3', true);
test('Prints command, verbose custom, fd-specific ipc, sync', testPrintCommandCustom, 'ipc', true);

const testPrintCommandOrder = async (t, fdNumber, secondFdNumber, hasOutput) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print-multiple.js',
		type: 'command',
		fdNumber,
		secondFdNumber,
		...fullStdio,
	});

	if (hasOutput) {
		t.is(getNormalizedLine(stderr), `${testTimestamp} [0] $ noop-verbose.js ${QUOTE}. .${QUOTE}`);
	} else {
		t.is(stderr, '');
	}
};

test('Prints command, verbose custom, fd-specific stdout+stderr', testPrintCommandOrder, 'stdout', 'stderr', true);
test('Prints command, verbose custom, fd-specific stderr+stdout', testPrintCommandOrder, 'stderr', 'stdout', false);
test('Prints command, verbose custom, fd-specific stdout+fd3', testPrintCommandOrder, 'stdout', 'fd3', true);
test('Prints command, verbose custom, fd-specific fd3+stdout', testPrintCommandOrder, 'fd3', 'stdout', false);
test('Prints command, verbose custom, fd-specific stdout+ipc', testPrintCommandOrder, 'stdout', 'ipc', true);
test('Prints command, verbose custom, fd-specific ipc+stdout', testPrintCommandOrder, 'ipc', 'stdout', false);
test('Prints command, verbose custom, fd-specific stderr+fd3', testPrintCommandOrder, 'stderr', 'fd3', true);
test('Prints command, verbose custom, fd-specific fd3+stderr', testPrintCommandOrder, 'fd3', 'stderr', false);
test('Prints command, verbose custom, fd-specific stderr+ipc', testPrintCommandOrder, 'stderr', 'ipc', true);
test('Prints command, verbose custom, fd-specific ipc+stderr', testPrintCommandOrder, 'ipc', 'stderr', false);
test('Prints command, verbose custom, fd-specific fd3+ipc', testPrintCommandOrder, 'fd3', 'ipc', true);
test('Prints command, verbose custom, fd-specific ipc+fd3', testPrintCommandOrder, 'ipc', 'fd3', false);

const testPrintCommandFunction = async (t, fdNumber, secondFdNumber) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print-function.js',
		type: 'command',
		fdNumber,
		secondFdNumber,
		...fullStdio,
	});
	t.is(getNormalizedLine(stderr), `${testTimestamp} [0] $ noop-verbose.js ${QUOTE}. .${QUOTE}`);
};

test('Prints command, verbose custom, fd-specific stdout+stderr, single function', testPrintCommandFunction, 'stdout', 'stderr');
test('Prints command, verbose custom, fd-specific stderr+stdout, single function', testPrintCommandFunction, 'stderr', 'stdout');
test('Prints command, verbose custom, fd-specific stdout+fd3, single function', testPrintCommandFunction, 'stdout', 'fd3');
test('Prints command, verbose custom, fd-specific fd3+stdout, single function', testPrintCommandFunction, 'fd3', 'stdout');
test('Prints command, verbose custom, fd-specific stdout+ipc, single function', testPrintCommandFunction, 'stdout', 'ipc');
test('Prints command, verbose custom, fd-specific ipc+stdout, single function', testPrintCommandFunction, 'ipc', 'stdout');
test('Prints command, verbose custom, fd-specific stderr+fd3, single function', testPrintCommandFunction, 'stderr', 'fd3');
test('Prints command, verbose custom, fd-specific fd3+stderr, single function', testPrintCommandFunction, 'fd3', 'stderr');
test('Prints command, verbose custom, fd-specific stderr+ipc, single function', testPrintCommandFunction, 'stderr', 'ipc');
test('Prints command, verbose custom, fd-specific ipc+stderr, single function', testPrintCommandFunction, 'ipc', 'stderr');
test('Prints command, verbose custom, fd-specific fd3+ipc, single function', testPrintCommandFunction, 'fd3', 'ipc');
test('Prints command, verbose custom, fd-specific ipc+fd3, single function', testPrintCommandFunction, 'ipc', 'fd3');

const testVerboseMessage = async (t, isSync) => {
	const {stderr} = await runVerboseSubprocess({
		isSync,
		type: 'command',
		eventProperty: 'message',
	});
	t.is(getNormalizedLine(stderr), `noop-verbose.js ${QUOTE}. .${QUOTE}`);
};

test('"verbose" function receives verboseObject.message', testVerboseMessage, false);
test('"verbose" function receives verboseObject.message, sync', testVerboseMessage, true);
