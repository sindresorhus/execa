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

const testPrintCommandCustom = async (t, fdNumber, worker, isSync) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print.js',
		worker,
		isSync,
		type: 'command',
		fdNumber,
	});
	t.is(getNormalizedLine(stderr), `${testTimestamp} [0] $ noop-verbose.js ${QUOTE}. .${QUOTE}`);
};

test('Prints command, verbose custom', testPrintCommandCustom, undefined, false, false);
test('Prints command, verbose custom, fd-specific stdout', testPrintCommandCustom, 'stdout', false, false);
test('Prints command, verbose custom, fd-specific stderr', testPrintCommandCustom, 'stderr', false, false);
test('Prints command, verbose custom, fd-specific fd3', testPrintCommandCustom, 'fd3', false, false);
test('Prints command, verbose custom, fd-specific ipc', testPrintCommandCustom, 'ipc', false, false);
test('Prints command, verbose custom, sync', testPrintCommandCustom, undefined, false, true);
test('Prints command, verbose custom, fd-specific stdout, sync', testPrintCommandCustom, 'stdout', false, true);
test('Prints command, verbose custom, fd-specific stderr, sync', testPrintCommandCustom, 'stderr', false, true);
test('Prints command, verbose custom, fd-specific fd3, sync', testPrintCommandCustom, 'fd3', false, true);
test('Prints command, verbose custom, fd-specific ipc, sync', testPrintCommandCustom, 'ipc', false, true);
test('Prints command, verbose custom, worker', testPrintCommandCustom, undefined, true, false);
test('Prints command, verbose custom, fd-specific stdout, worker', testPrintCommandCustom, 'stdout', true, false);
test('Prints command, verbose custom, fd-specific stderr, worker', testPrintCommandCustom, 'stderr', true, false);
test('Prints command, verbose custom, fd-specific fd3, worker', testPrintCommandCustom, 'fd3', true, false);
test('Prints command, verbose custom, fd-specific ipc, worker', testPrintCommandCustom, 'ipc', true, false);
test('Prints command, verbose custom, worker, sync', testPrintCommandCustom, undefined, true, true);
test('Prints command, verbose custom, fd-specific stdout, worker, sync', testPrintCommandCustom, 'stdout', true, true);
test('Prints command, verbose custom, fd-specific stderr, worker, sync', testPrintCommandCustom, 'stderr', true, true);
test('Prints command, verbose custom, fd-specific fd3, worker, sync', testPrintCommandCustom, 'fd3', true, true);
test('Prints command, verbose custom, fd-specific ipc, worker, sync', testPrintCommandCustom, 'ipc', true, true);

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

const testVerboseMessage = async (t, isSync) => {
	const {stderr} = await runVerboseSubprocess({
		isSync,
		type: 'command',
		eventProperty: 'message',
	});
	t.is(stderr, `noop-verbose.js ${QUOTE}. .${QUOTE}`);
};

test('"verbose" function receives verboseObject.message', testVerboseMessage, false);
test('"verbose" function receives verboseObject.message, sync', testVerboseMessage, true);
