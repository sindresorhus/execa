import {stripVTControlCharacters} from 'node:util';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {parentExecaAsync, parentExecaSync} from '../helpers/nested.js';
import {
	runErrorSubprocessAsync,
	runErrorSubprocessSync,
	runWarningSubprocessAsync,
	runWarningSubprocessSync,
	runEarlyErrorSubprocessAsync,
	runEarlyErrorSubprocessSync,
	getCompletionLine,
	getCompletionLines,
	testTimestamp,
	getVerboseOption,
	stdoutNoneOption,
	stdoutShortOption,
	stdoutFullOption,
	stderrNoneOption,
	stderrShortOption,
	stderrFullOption,
	fd3NoneOption,
	fd3ShortOption,
	fd3FullOption,
	ipcNoneOption,
	ipcShortOption,
	ipcFullOption,
} from '../helpers/verbose.js';

setFixtureDirectory();

const testPrintCompletion = async (t, verbose, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose});
	t.is(getCompletionLine(stderr), `${testTimestamp} [0] √ (done in 0ms)`);
};

test('Prints completion, verbose "short"', testPrintCompletion, 'short', parentExecaAsync);
test('Prints completion, verbose "full"', testPrintCompletion, 'full', parentExecaAsync);
test('Prints completion, verbose "short", fd-specific stdout', testPrintCompletion, stdoutShortOption, parentExecaAsync);
test('Prints completion, verbose "full", fd-specific stdout', testPrintCompletion, stdoutFullOption, parentExecaAsync);
test('Prints completion, verbose "short", fd-specific stderr', testPrintCompletion, stderrShortOption, parentExecaAsync);
test('Prints completion, verbose "full", fd-specific stderr', testPrintCompletion, stderrFullOption, parentExecaAsync);
test('Prints completion, verbose "short", fd-specific fd3', testPrintCompletion, fd3ShortOption, parentExecaAsync);
test('Prints completion, verbose "full", fd-specific fd3', testPrintCompletion, fd3FullOption, parentExecaAsync);
test('Prints completion, verbose "short", fd-specific ipc', testPrintCompletion, ipcShortOption, parentExecaAsync);
test('Prints completion, verbose "full", fd-specific ipc', testPrintCompletion, ipcFullOption, parentExecaAsync);
test('Prints completion, verbose "short", sync', testPrintCompletion, 'short', parentExecaSync);
test('Prints completion, verbose "full", sync', testPrintCompletion, 'full', parentExecaSync);
test('Prints completion, verbose "short", fd-specific stdout, sync', testPrintCompletion, stdoutShortOption, parentExecaSync);
test('Prints completion, verbose "full", fd-specific stdout, sync', testPrintCompletion, stdoutFullOption, parentExecaSync);
test('Prints completion, verbose "short", fd-specific stderr, sync', testPrintCompletion, stderrShortOption, parentExecaSync);
test('Prints completion, verbose "full", fd-specific stderr, sync', testPrintCompletion, stderrFullOption, parentExecaSync);
test('Prints completion, verbose "short", fd-specific fd3, sync', testPrintCompletion, fd3ShortOption, parentExecaSync);
test('Prints completion, verbose "full", fd-specific fd3, sync', testPrintCompletion, fd3FullOption, parentExecaSync);
test('Prints completion, verbose "short", fd-specific ipc, sync', testPrintCompletion, ipcShortOption, parentExecaSync);
test('Prints completion, verbose "full", fd-specific ipc, sync', testPrintCompletion, ipcFullOption, parentExecaSync);

const testNoPrintCompletion = async (t, verbose, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose});
	t.is(stderr, '');
};

test('Does not print completion, verbose "none"', testNoPrintCompletion, 'none', parentExecaAsync);
test('Does not print completion, verbose default"', testNoPrintCompletion, undefined, parentExecaAsync);
test('Does not print completion, verbose "none", fd-specific stdout', testNoPrintCompletion, stdoutNoneOption, parentExecaAsync);
test('Does not print completion, verbose "none", fd-specific stderr', testNoPrintCompletion, stderrNoneOption, parentExecaAsync);
test('Does not print completion, verbose "none", fd-specific fd3', testNoPrintCompletion, fd3NoneOption, parentExecaAsync);
test('Does not print completion, verbose "none", fd-specific ipc', testNoPrintCompletion, ipcNoneOption, parentExecaAsync);
test('Does not print completion, verbose default", fd-specific', testNoPrintCompletion, {}, parentExecaAsync);
test('Does not print completion, verbose "none", sync', testNoPrintCompletion, 'none', parentExecaSync);
test('Does not print completion, verbose default", sync', testNoPrintCompletion, undefined, parentExecaSync);
test('Does not print completion, verbose "none", fd-specific stdout, sync', testNoPrintCompletion, stdoutNoneOption, parentExecaSync);
test('Does not print completion, verbose "none", fd-specific stderr, sync', testNoPrintCompletion, stderrNoneOption, parentExecaSync);
test('Does not print completion, verbose "none", fd-specific fd3, sync', testNoPrintCompletion, fd3NoneOption, parentExecaSync);
test('Does not print completion, verbose "none", fd-specific ipc, sync', testNoPrintCompletion, ipcNoneOption, parentExecaSync);
test('Does not print completion, verbose default", fd-specific, sync', testNoPrintCompletion, {}, parentExecaSync);

const testPrintCompletionError = async (t, execaMethod) => {
	const stderr = await execaMethod(t, 'short');
	t.is(getCompletionLine(stderr), `${testTimestamp} [0] × (done in 0ms)`);
};

test('Prints completion after errors', testPrintCompletionError, runErrorSubprocessAsync);
test('Prints completion after errors, sync', testPrintCompletionError, runErrorSubprocessSync);

const testPrintCompletionWarning = async (t, execaMethod) => {
	const stderr = await execaMethod(t);
	t.is(getCompletionLine(stderr), `${testTimestamp} [0] ‼ (done in 0ms)`);
};

test('Prints completion after errors, "reject" false', testPrintCompletionWarning, runWarningSubprocessAsync);
test('Prints completion after errors, "reject" false, sync', testPrintCompletionWarning, runWarningSubprocessSync);

const testPrintCompletionEarly = async (t, execaMethod) => {
	const stderr = await execaMethod(t);
	t.is(getCompletionLine(stderr), `${testTimestamp} [0] × (done in 0ms)`);
};

test('Prints completion after early validation errors', testPrintCompletionEarly, runEarlyErrorSubprocessAsync);
test('Prints completion after early validation errors, sync', testPrintCompletionEarly, runEarlyErrorSubprocessSync);

test.serial('Prints duration', async t => {
	const {stderr} = await parentExecaAsync('delay.js', ['1000'], {verbose: 'short'});
	t.regex(stripVTControlCharacters(stderr).split('\n').at(-1), /\(done in [\d.]+s\)/);
});

const testPipeDuration = async (t, fixtureName, sourceVerbose, destinationVerbose) => {
	const {stderr} = await execa(`nested-pipe-${fixtureName}.js`, [
		JSON.stringify(getVerboseOption(sourceVerbose)),
		'noop.js',
		foobarString,
		JSON.stringify(getVerboseOption(destinationVerbose)),
		'stdin.js',
	]);

	const lines = getCompletionLines(stderr);
	t.is(lines.includes(`${testTimestamp} [0] √ (done in 0ms)`), sourceVerbose || destinationVerbose);
	t.is(lines.includes(`${testTimestamp} [1] √ (done in 0ms)`), sourceVerbose && destinationVerbose);
};

test('Prints both durations piped with .pipe("file")', testPipeDuration, 'file', true, true);
test('Prints both durations piped with .pipe`command`', testPipeDuration, 'script', true, true);
test('Prints both durations piped with .pipe(subprocess)', testPipeDuration, 'subprocesses', true, true);
test('Prints first duration piped with .pipe("file")', testPipeDuration, 'file', true, false);
test('Prints first duration piped with .pipe`command`', testPipeDuration, 'script', true, false);
test('Prints first duration piped with .pipe(subprocess)', testPipeDuration, 'subprocesses', true, false);
test('Prints second duration piped with .pipe("file")', testPipeDuration, 'file', false, true);
test('Prints second duration piped with .pipe`command`', testPipeDuration, 'script', false, true);
test('Prints second duration piped with .pipe(subprocess)', testPipeDuration, 'subprocesses', false, true);
test('Prints neither durations piped with .pipe("file")', testPipeDuration, 'file', false, false);
test('Prints neither durations piped with .pipe`command`', testPipeDuration, 'script', false, false);
test('Prints neither durations piped with .pipe(subprocess)', testPipeDuration, 'subprocesses', false, false);
