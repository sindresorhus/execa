import {stripVTControlCharacters} from 'node:util';
import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {
	runErrorSubprocess,
	runWarningSubprocess,
	runEarlyErrorSubprocess,
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

const testPrintCompletion = async (t, verbose, isSync) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose, isSync});
	t.is(getCompletionLine(stderr), `${testTimestamp} [0] √ (done in 0ms)`);
};

test('Prints completion, verbose "short"', testPrintCompletion, 'short', false);
test('Prints completion, verbose "full"', testPrintCompletion, 'full', false);
test('Prints completion, verbose "short", fd-specific stdout', testPrintCompletion, stdoutShortOption, false);
test('Prints completion, verbose "full", fd-specific stdout', testPrintCompletion, stdoutFullOption, false);
test('Prints completion, verbose "short", fd-specific stderr', testPrintCompletion, stderrShortOption, false);
test('Prints completion, verbose "full", fd-specific stderr', testPrintCompletion, stderrFullOption, false);
test('Prints completion, verbose "short", fd-specific fd3', testPrintCompletion, fd3ShortOption, false);
test('Prints completion, verbose "full", fd-specific fd3', testPrintCompletion, fd3FullOption, false);
test('Prints completion, verbose "short", fd-specific ipc', testPrintCompletion, ipcShortOption, false);
test('Prints completion, verbose "full", fd-specific ipc', testPrintCompletion, ipcFullOption, false);
test('Prints completion, verbose "short", sync', testPrintCompletion, 'short', true);
test('Prints completion, verbose "full", sync', testPrintCompletion, 'full', true);
test('Prints completion, verbose "short", fd-specific stdout, sync', testPrintCompletion, stdoutShortOption, true);
test('Prints completion, verbose "full", fd-specific stdout, sync', testPrintCompletion, stdoutFullOption, true);
test('Prints completion, verbose "short", fd-specific stderr, sync', testPrintCompletion, stderrShortOption, true);
test('Prints completion, verbose "full", fd-specific stderr, sync', testPrintCompletion, stderrFullOption, true);
test('Prints completion, verbose "short", fd-specific fd3, sync', testPrintCompletion, fd3ShortOption, true);
test('Prints completion, verbose "full", fd-specific fd3, sync', testPrintCompletion, fd3FullOption, true);
test('Prints completion, verbose "short", fd-specific ipc, sync', testPrintCompletion, ipcShortOption, true);
test('Prints completion, verbose "full", fd-specific ipc, sync', testPrintCompletion, ipcFullOption, true);

const testNoPrintCompletion = async (t, verbose, isSync) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose, isSync});
	t.is(stderr, '');
};

test('Does not print completion, verbose "none"', testNoPrintCompletion, 'none', false);
test('Does not print completion, verbose default"', testNoPrintCompletion, undefined, false);
test('Does not print completion, verbose "none", fd-specific stdout', testNoPrintCompletion, stdoutNoneOption, false);
test('Does not print completion, verbose "none", fd-specific stderr', testNoPrintCompletion, stderrNoneOption, false);
test('Does not print completion, verbose "none", fd-specific fd3', testNoPrintCompletion, fd3NoneOption, false);
test('Does not print completion, verbose "none", fd-specific ipc', testNoPrintCompletion, ipcNoneOption, false);
test('Does not print completion, verbose default", fd-specific', testNoPrintCompletion, {}, false);
test('Does not print completion, verbose "none", sync', testNoPrintCompletion, 'none', true);
test('Does not print completion, verbose default", sync', testNoPrintCompletion, undefined, true);
test('Does not print completion, verbose "none", fd-specific stdout, sync', testNoPrintCompletion, stdoutNoneOption, true);
test('Does not print completion, verbose "none", fd-specific stderr, sync', testNoPrintCompletion, stderrNoneOption, true);
test('Does not print completion, verbose "none", fd-specific fd3, sync', testNoPrintCompletion, fd3NoneOption, true);
test('Does not print completion, verbose "none", fd-specific ipc, sync', testNoPrintCompletion, ipcNoneOption, true);
test('Does not print completion, verbose default", fd-specific, sync', testNoPrintCompletion, {}, true);

const testPrintCompletionError = async (t, isSync) => {
	const stderr = await runErrorSubprocess(t, 'short', isSync);
	t.is(getCompletionLine(stderr), `${testTimestamp} [0] × (done in 0ms)`);
};

test('Prints completion after errors', testPrintCompletionError, false);
test('Prints completion after errors, sync', testPrintCompletionError, true);

const testPrintCompletionWarning = async (t, isSync) => {
	const stderr = await runWarningSubprocess(t, isSync);
	t.is(getCompletionLine(stderr), `${testTimestamp} [0] ‼ (done in 0ms)`);
};

test('Prints completion after errors, "reject" false', testPrintCompletionWarning, false);
test('Prints completion after errors, "reject" false, sync', testPrintCompletionWarning, true);

const testPrintCompletionEarly = async (t, isSync) => {
	const stderr = await runEarlyErrorSubprocess(t, isSync);
	t.is(getCompletionLine(stderr), `${testTimestamp} [0] × (done in 0ms)`);
};

test('Prints completion after early validation errors', testPrintCompletionEarly, false);
test('Prints completion after early validation errors, sync', testPrintCompletionEarly, true);

test.serial('Prints duration', async t => {
	const {stderr} = await nestedSubprocess('delay.js', ['1000'], {verbose: 'short'});
	t.regex(stripVTControlCharacters(stderr).split('\n').at(-1), /\(done in [\d.]+s\)/);
});

const testPipeDuration = async (t, parentFixture, sourceVerbose, destinationVerbose) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {
		parentFixture,
		sourceOptions: getVerboseOption(sourceVerbose),
		destinationFile: 'stdin.js',
		destinationOptions: getVerboseOption(destinationVerbose),
	});

	const lines = getCompletionLines(stderr);
	t.is(lines.includes(`${testTimestamp} [0] √ (done in 0ms)`), sourceVerbose || destinationVerbose);
	t.is(lines.includes(`${testTimestamp} [1] √ (done in 0ms)`), sourceVerbose && destinationVerbose);
};

test('Prints both durations piped with .pipe("file")', testPipeDuration, 'nested-pipe-file.js', true, true);
test('Prints both durations piped with .pipe`command`', testPipeDuration, 'nested-pipe-script.js', true, true);
test('Prints both durations piped with .pipe(subprocess)', testPipeDuration, 'nested-pipe-subprocesses.js', true, true);
test('Prints first duration piped with .pipe("file")', testPipeDuration, 'nested-pipe-file.js', true, false);
test('Prints first duration piped with .pipe`command`', testPipeDuration, 'nested-pipe-script.js', true, false);
test('Prints first duration piped with .pipe(subprocess)', testPipeDuration, 'nested-pipe-subprocesses.js', true, false);
test('Prints second duration piped with .pipe("file")', testPipeDuration, 'nested-pipe-file.js', false, true);
test('Prints second duration piped with .pipe`command`', testPipeDuration, 'nested-pipe-script.js', false, true);
test('Prints second duration piped with .pipe(subprocess)', testPipeDuration, 'nested-pipe-subprocesses.js', false, true);
test('Prints neither durations piped with .pipe("file")', testPipeDuration, 'nested-pipe-file.js', false, false);
test('Prints neither durations piped with .pipe`command`', testPipeDuration, 'nested-pipe-script.js', false, false);
test('Prints neither durations piped with .pipe(subprocess)', testPipeDuration, 'nested-pipe-subprocesses.js', false, false);
