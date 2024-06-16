import test from 'ava';
import {red} from 'yoctocolors';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {parentExeca, parentExecaAsync, parentExecaSync} from '../helpers/nested.js';
import {
	QUOTE,
	runErrorSubprocessAsync,
	runErrorSubprocessSync,
	runEarlyErrorSubprocessAsync,
	runEarlyErrorSubprocessSync,
	getErrorLine,
	getErrorLines,
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

const parentExecaFail = parentExeca.bind(undefined, 'nested-fail.js');

const testPrintError = async (t, verbose, execaMethod) => {
	const stderr = await execaMethod(t, verbose);
	t.is(getErrorLine(stderr), `${testTimestamp} [0] × Command failed with exit code 2: noop-fail.js 1 ${foobarString}`);
};

test('Prints error, verbose "short"', testPrintError, 'short', runErrorSubprocessAsync);
test('Prints error, verbose "full"', testPrintError, 'full', runErrorSubprocessAsync);
test('Prints error, verbose "short", fd-specific stdout', testPrintError, stdoutShortOption, runErrorSubprocessAsync);
test('Prints error, verbose "full", fd-specific stdout', testPrintError, stdoutFullOption, runErrorSubprocessAsync);
test('Prints error, verbose "short", fd-specific stderr', testPrintError, stderrShortOption, runErrorSubprocessAsync);
test('Prints error, verbose "full", fd-specific stderr', testPrintError, stderrFullOption, runErrorSubprocessAsync);
test('Prints error, verbose "short", fd-specific fd3', testPrintError, fd3ShortOption, runErrorSubprocessAsync);
test('Prints error, verbose "full", fd-specific fd3', testPrintError, fd3FullOption, runErrorSubprocessAsync);
test('Prints error, verbose "short", fd-specific ipc', testPrintError, ipcShortOption, runErrorSubprocessAsync);
test('Prints error, verbose "full", fd-specific ipc', testPrintError, ipcFullOption, runErrorSubprocessAsync);
test('Prints error, verbose "short", sync', testPrintError, 'short', runErrorSubprocessSync);
test('Prints error, verbose "full", sync', testPrintError, 'full', runErrorSubprocessSync);
test('Prints error, verbose "short", fd-specific stdout, sync', testPrintError, stdoutShortOption, runErrorSubprocessSync);
test('Prints error, verbose "full", fd-specific stdout, sync', testPrintError, stdoutFullOption, runErrorSubprocessSync);
test('Prints error, verbose "short", fd-specific stderr, sync', testPrintError, stderrShortOption, runErrorSubprocessSync);
test('Prints error, verbose "full", fd-specific stderr, sync', testPrintError, stderrFullOption, runErrorSubprocessSync);
test('Prints error, verbose "short", fd-specific fd3, sync', testPrintError, fd3ShortOption, runErrorSubprocessSync);
test('Prints error, verbose "full", fd-specific fd3, sync', testPrintError, fd3FullOption, runErrorSubprocessSync);
test('Prints error, verbose "short", fd-specific ipc, sync', testPrintError, ipcShortOption, runErrorSubprocessSync);
test('Prints error, verbose "full", fd-specific ipc, sync', testPrintError, ipcFullOption, runErrorSubprocessSync);

const testNoPrintError = async (t, verbose, execaMethod) => {
	const stderr = await execaMethod(t, verbose, false);
	t.is(getErrorLine(stderr), undefined);
};

test('Does not print error, verbose "none"', testNoPrintError, 'none', runErrorSubprocessAsync);
test('Does not print error, verbose default', testNoPrintError, undefined, runErrorSubprocessAsync);
test('Does not print error, verbose "none", fd-specific stdout', testNoPrintError, stdoutNoneOption, runErrorSubprocessAsync);
test('Does not print error, verbose "none", fd-specific stderr', testNoPrintError, stderrNoneOption, runErrorSubprocessAsync);
test('Does not print error, verbose "none", fd-specific fd3', testNoPrintError, fd3NoneOption, runErrorSubprocessAsync);
test('Does not print error, verbose "none", fd-specific ipc', testNoPrintError, ipcNoneOption, runErrorSubprocessAsync);
test('Does not print error, verbose default, fd-specific', testNoPrintError, {}, runErrorSubprocessAsync);
test('Does not print error, verbose "none", sync', testNoPrintError, 'none', runErrorSubprocessSync);
test('Does not print error, verbose default, sync', testNoPrintError, undefined, runErrorSubprocessSync);
test('Does not print error, verbose "none", fd-specific stdout, sync', testNoPrintError, stdoutNoneOption, runErrorSubprocessSync);
test('Does not print error, verbose "none", fd-specific stderr, sync', testNoPrintError, stderrNoneOption, runErrorSubprocessSync);
test('Does not print error, verbose "none", fd-specific fd3, sync', testNoPrintError, fd3NoneOption, runErrorSubprocessSync);
test('Does not print error, verbose "none", fd-specific ipc, sync', testNoPrintError, ipcNoneOption, runErrorSubprocessSync);
test('Does not print error, verbose default, fd-specific, sync', testNoPrintError, {}, runErrorSubprocessSync);

const testPrintNoError = async (t, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose: 'short'});
	t.is(getErrorLine(stderr), undefined);
};

test('Does not print error if none', testPrintNoError, parentExecaAsync);
test('Does not print error if none, sync', testPrintNoError, parentExecaSync);

const testPrintErrorEarly = async (t, execaMethod) => {
	const stderr = await execaMethod(t);
	t.is(getErrorLine(stderr), `${testTimestamp} [0] × TypeError: The "cwd" option must be a string or a file URL: true.`);
};

test('Prints early validation error', testPrintErrorEarly, runEarlyErrorSubprocessAsync);
test('Prints early validation error, sync', testPrintErrorEarly, runEarlyErrorSubprocessSync);

test('Does not repeat stdout|stderr with error', async t => {
	const stderr = await runErrorSubprocessAsync(t, 'short');
	t.deepEqual(getErrorLines(stderr), [`${testTimestamp} [0] × Command failed with exit code 2: noop-fail.js 1 ${foobarString}`]);
});

test('Prints error differently if "reject" is false', async t => {
	const {stderr} = await parentExecaAsync('noop-fail.js', ['1', foobarString], {verbose: 'short', reject: false});
	t.deepEqual(getErrorLines(stderr), [`${testTimestamp} [0] ‼ Command failed with exit code 2: noop-fail.js 1 ${foobarString}`]);
});

const testPipeError = async (t, fixtureName, sourceVerbose, destinationVerbose) => {
	const {stderr} = await t.throwsAsync(execa(`nested-pipe-${fixtureName}.js`, [
		JSON.stringify(getVerboseOption(sourceVerbose)),
		'noop-fail.js',
		'1',
		JSON.stringify(getVerboseOption(destinationVerbose)),
		'stdin-fail.js',
	]));

	const lines = getErrorLines(stderr);
	t.is(lines.includes(`${testTimestamp} [0] × Command failed with exit code 2: noop-fail.js 1`), sourceVerbose);
	t.is(lines.includes(`${testTimestamp} [${sourceVerbose ? 1 : 0}] × Command failed with exit code 2: stdin-fail.js`), destinationVerbose);
};

test('Prints both errors piped with .pipe("file")', testPipeError, 'file', true, true);
test('Prints both errors piped with .pipe`command`', testPipeError, 'script', true, true);
test('Prints both errors piped with .pipe(subprocess)', testPipeError, 'subprocesses', true, true);
test('Prints first error piped with .pipe("file")', testPipeError, 'file', true, false);
test('Prints first error piped with .pipe`command`', testPipeError, 'script', true, false);
test('Prints first error piped with .pipe(subprocess)', testPipeError, 'subprocesses', true, false);
test('Prints second error piped with .pipe("file")', testPipeError, 'file', false, true);
test('Prints second error piped with .pipe`command`', testPipeError, 'script', false, true);
test('Prints second error piped with .pipe(subprocess)', testPipeError, 'subprocesses', false, true);
test('Prints neither errors piped with .pipe("file")', testPipeError, 'file', false, false);
test('Prints neither errors piped with .pipe`command`', testPipeError, 'script', false, false);
test('Prints neither errors piped with .pipe(subprocess)', testPipeError, 'subprocesses', false, false);

test('Quotes spaces from error', async t => {
	const {stderr} = await t.throwsAsync(parentExecaFail('noop-forever.js', ['foo bar'], {verbose: 'short'}));
	t.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}foo bar${QUOTE}`,
		`${testTimestamp} [0] × foo bar`,
	]);
});

test('Quotes special punctuation from error', async t => {
	const {stderr} = await t.throwsAsync(parentExecaFail('noop-forever.js', ['%'], {verbose: 'short'}));
	t.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}%${QUOTE}`,
		`${testTimestamp} [0] × %`,
	]);
});

test('Does not escape internal characters from error', async t => {
	const {stderr} = await t.throwsAsync(parentExecaFail('noop-forever.js', ['ã'], {verbose: 'short'}));
	t.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}ã${QUOTE}`,
		`${testTimestamp} [0] × ã`,
	]);
});

test('Escapes and strips color sequences from error', async t => {
	const {stderr} = await t.throwsAsync(parentExecaFail('noop-forever.js', [red(foobarString)], {verbose: 'short'}, {env: {FORCE_COLOR: '1'}}));
	t.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}\\u001b[31m${foobarString}\\u001b[39m${QUOTE}`,
		`${testTimestamp} [0] × ${foobarString}`,
	]);
});

test('Escapes control characters from error', async t => {
	const {stderr} = await t.throwsAsync(parentExecaFail('noop-forever.js', ['\u0001'], {verbose: 'short'}));
	t.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}\\u0001${QUOTE}`,
		`${testTimestamp} [0] × \\u0001`,
	]);
});
