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

const testPrintErrorCustom = async (t, fdNumber, isSync) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print.js',
		isSync,
		type: 'error',
		fdNumber,
	});
	t.is(getNormalizedLine(stderr), `${testTimestamp} [0] × Command failed with exit code 2: noop-verbose.js ${QUOTE}. .${QUOTE}`);
};

test('Prints error, verbose custom', testPrintErrorCustom, undefined, false);
test('Prints error, verbose custom, fd-specific stdout', testPrintErrorCustom, 'stdout', false);
test('Prints error, verbose custom, fd-specific stderr', testPrintErrorCustom, 'stderr', false);
test('Prints error, verbose custom, fd-specific fd3', testPrintErrorCustom, 'fd3', false);
test('Prints error, verbose custom, fd-specific ipc', testPrintErrorCustom, 'ipc', false);
test('Prints error, verbose custom, sync', testPrintErrorCustom, undefined, true);
test('Prints error, verbose custom, fd-specific stdout, sync', testPrintErrorCustom, 'stdout', true);
test('Prints error, verbose custom, fd-specific stderr, sync', testPrintErrorCustom, 'stderr', true);
test('Prints error, verbose custom, fd-specific fd3, sync', testPrintErrorCustom, 'fd3', true);
test('Prints error, verbose custom, fd-specific ipc, sync', testPrintErrorCustom, 'ipc', true);

const testPrintErrorOrder = async (t, fdNumber, secondFdNumber, hasOutput) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print-multiple.js',
		type: 'error',
		fdNumber,
		secondFdNumber,
		...fullStdio,
	});

	if (hasOutput) {
		t.is(getNormalizedLine(stderr), `${testTimestamp} [0] × Command failed with exit code 2: noop-verbose.js ${QUOTE}. .${QUOTE}`);
	} else {
		t.is(stderr, '');
	}
};

test('Prints error, verbose custom, fd-specific stdout+stderr', testPrintErrorOrder, 'stdout', 'stderr', true);
test('Prints error, verbose custom, fd-specific stderr+stdout', testPrintErrorOrder, 'stderr', 'stdout', false);
test('Prints error, verbose custom, fd-specific stdout+fd3', testPrintErrorOrder, 'stdout', 'fd3', true);
test('Prints error, verbose custom, fd-specific fd3+stdout', testPrintErrorOrder, 'fd3', 'stdout', false);
test('Prints error, verbose custom, fd-specific stdout+ipc', testPrintErrorOrder, 'stdout', 'ipc', true);
test('Prints error, verbose custom, fd-specific ipc+stdout', testPrintErrorOrder, 'ipc', 'stdout', false);
test('Prints error, verbose custom, fd-specific stderr+fd3', testPrintErrorOrder, 'stderr', 'fd3', true);
test('Prints error, verbose custom, fd-specific fd3+stderr', testPrintErrorOrder, 'fd3', 'stderr', false);
test('Prints error, verbose custom, fd-specific stderr+ipc', testPrintErrorOrder, 'stderr', 'ipc', true);
test('Prints error, verbose custom, fd-specific ipc+stderr', testPrintErrorOrder, 'ipc', 'stderr', false);
test('Prints error, verbose custom, fd-specific fd3+ipc', testPrintErrorOrder, 'fd3', 'ipc', true);
test('Prints error, verbose custom, fd-specific ipc+fd3', testPrintErrorOrder, 'ipc', 'fd3', false);

const testPrintErrorFunction = async (t, fdNumber, secondFdNumber) => {
	const {stderr} = await runVerboseSubprocess({
		optionsFixture: 'custom-print-function.js',
		type: 'error',
		fdNumber,
		secondFdNumber,
		...fullStdio,
	});
	t.is(getNormalizedLine(stderr), `${testTimestamp} [0] × Command failed with exit code 2: noop-verbose.js ${QUOTE}. .${QUOTE}`);
};

test('Prints error, verbose custom, fd-specific stdout+stderr, single function', testPrintErrorFunction, 'stdout', 'stderr');
test('Prints error, verbose custom, fd-specific stderr+stdout, single function', testPrintErrorFunction, 'stderr', 'stdout');
test('Prints error, verbose custom, fd-specific stdout+fd3, single function', testPrintErrorFunction, 'stdout', 'fd3');
test('Prints error, verbose custom, fd-specific fd3+stdout, single function', testPrintErrorFunction, 'fd3', 'stdout');
test('Prints error, verbose custom, fd-specific stdout+ipc, single function', testPrintErrorFunction, 'stdout', 'ipc');
test('Prints error, verbose custom, fd-specific ipc+stdout, single function', testPrintErrorFunction, 'ipc', 'stdout');
test('Prints error, verbose custom, fd-specific stderr+fd3, single function', testPrintErrorFunction, 'stderr', 'fd3');
test('Prints error, verbose custom, fd-specific fd3+stderr, single function', testPrintErrorFunction, 'fd3', 'stderr');
test('Prints error, verbose custom, fd-specific stderr+ipc, single function', testPrintErrorFunction, 'stderr', 'ipc');
test('Prints error, verbose custom, fd-specific ipc+stderr, single function', testPrintErrorFunction, 'ipc', 'stderr');
test('Prints error, verbose custom, fd-specific fd3+ipc, single function', testPrintErrorFunction, 'fd3', 'ipc');
test('Prints error, verbose custom, fd-specific ipc+fd3, single function', testPrintErrorFunction, 'ipc', 'fd3');

const testVerboseMessage = async (t, isSync) => {
	const {stderr} = await runVerboseSubprocess({
		isSync,
		type: 'error',
		eventProperty: 'message',
	});
	t.is(stderr, `Command failed with exit code 2: noop-verbose.js ${QUOTE}. .${QUOTE}`);
};

test('"verbose" function receives verboseObject.message', testVerboseMessage, false);
test('"verbose" function receives verboseObject.message, sync', testVerboseMessage, true);
