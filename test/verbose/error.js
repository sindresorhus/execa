import assert from 'node:assert/strict';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarRed} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {
	QUOTE,
	runErrorSubprocess,
	runEarlyErrorSubprocess,
	getErrorLine,
	getErrorLines,
	testTimestamp,
	getVerboseOption,
	getStdioForFd3Option,
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

const testPrintError = async (verbose, isSync) => {
	const stderr = await runErrorSubprocess(verbose, isSync, getStdioForFd3Option(verbose));
	assert.equal(getErrorLine(stderr), `${testTimestamp} [0] × Command failed with exit code 2: noop-fail.js 1 ${foobarString}`);
};

test('Prints error, verbose "short"', () => testPrintError('short', false));
test('Prints error, verbose "full"', () => testPrintError('full', false));
test('Prints error, verbose "short", fd-specific stdout', () => testPrintError(stdoutShortOption, false));
test('Prints error, verbose "full", fd-specific stdout', () => testPrintError(stdoutFullOption, false));
test('Prints error, verbose "short", fd-specific stderr', () => testPrintError(stderrShortOption, false));
test('Prints error, verbose "full", fd-specific stderr', () => testPrintError(stderrFullOption, false));
test('Prints error, verbose "short", fd-specific fd3', () => testPrintError(fd3ShortOption, false));
test('Prints error, verbose "full", fd-specific fd3', () => testPrintError(fd3FullOption, false));
test('Prints error, verbose "short", fd-specific ipc', () => testPrintError(ipcShortOption, false));
test('Prints error, verbose "full", fd-specific ipc', () => testPrintError(ipcFullOption, false));
test('Prints error, verbose "short", sync', () => testPrintError('short', true));
test('Prints error, verbose "full", sync', () => testPrintError('full', true));
test('Prints error, verbose "short", fd-specific stdout, sync', () => testPrintError(stdoutShortOption, true));
test('Prints error, verbose "full", fd-specific stdout, sync', () => testPrintError(stdoutFullOption, true));
test('Prints error, verbose "short", fd-specific stderr, sync', () => testPrintError(stderrShortOption, true));
test('Prints error, verbose "full", fd-specific stderr, sync', () => testPrintError(stderrFullOption, true));
test('Prints error, verbose "short", fd-specific fd3, sync', () => testPrintError(fd3ShortOption, true));
test('Prints error, verbose "full", fd-specific fd3, sync', () => testPrintError(fd3FullOption, true));
test('Prints error, verbose "short", fd-specific ipc, sync', () => testPrintError(ipcShortOption, true));
test('Prints error, verbose "full", fd-specific ipc, sync', () => testPrintError(ipcFullOption, true));

const testNoPrintError = async (verbose, isSync) => {
	const stderr = await runErrorSubprocess(verbose, isSync, {expectExitCode: false, ...getStdioForFd3Option(verbose)});
	assert.equal(getErrorLine(stderr), undefined);
};

test('Does not print error, verbose "none"', () => testNoPrintError('none', false));
test('Does not print error, verbose default', () => testNoPrintError(undefined, false));
test('Does not print error, verbose "none", fd-specific stdout', () => testNoPrintError(stdoutNoneOption, false));
test('Does not print error, verbose "none", fd-specific stderr', () => testNoPrintError(stderrNoneOption, false));
test('Does not print error, verbose "none", fd-specific fd3', () => testNoPrintError(fd3NoneOption, false));
test('Does not print error, verbose "none", fd-specific ipc', () => testNoPrintError(ipcNoneOption, false));
test('Does not print error, verbose default, fd-specific', () => testNoPrintError({}, false));
test('Does not print error, verbose "none", sync', () => testNoPrintError('none', true));
test('Does not print error, verbose default, sync', () => testNoPrintError(undefined, true));
test('Does not print error, verbose "none", fd-specific stdout, sync', () => testNoPrintError(stdoutNoneOption, true));
test('Does not print error, verbose "none", fd-specific stderr, sync', () => testNoPrintError(stderrNoneOption, true));
test('Does not print error, verbose "none", fd-specific fd3, sync', () => testNoPrintError(fd3NoneOption, true));
test('Does not print error, verbose "none", fd-specific ipc, sync', () => testNoPrintError(ipcNoneOption, true));
test('Does not print error, verbose default, fd-specific, sync', () => testNoPrintError({}, true));

const testPrintNoError = async isSync => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose: 'short', isSync});
	assert.equal(getErrorLine(stderr), undefined);
};

test('Does not print error if none', () => testPrintNoError(false));
test('Does not print error if none, sync', () => testPrintNoError(true));

const testPrintErrorEarly = async isSync => {
	const stderr = await runEarlyErrorSubprocess(isSync);
	assert.equal(getErrorLine(stderr), undefined);
};

test('Prints early validation error', () => testPrintErrorEarly(false));
test('Prints early validation error, sync', () => testPrintErrorEarly(true));

test('Does not repeat stdout|stderr with error', async () => {
	const stderr = await runErrorSubprocess('short');
	assert.deepEqual(getErrorLines(stderr), [`${testTimestamp} [0] × Command failed with exit code 2: noop-fail.js 1 ${foobarString}`]);
});

test('Prints error differently if "reject" is false', async () => {
	const {stderr} = await nestedSubprocess('noop-fail.js', ['1', foobarString], {verbose: 'short', reject: false});
	assert.deepEqual(getErrorLines(stderr), [`${testTimestamp} [0] ‼ Command failed with exit code 2: noop-fail.js 1 ${foobarString}`]);
});

const testPipeError = async (parentFixture, sourceVerbose, destinationVerbose) => {
	const {stderr} = await assertRejects(nestedSubprocess('noop-fail.js', ['1'], {
		parentFixture,
		sourceOptions: getVerboseOption(sourceVerbose),
		destinationFile: 'stdin-fail.js',
		destinationOptions: getVerboseOption(destinationVerbose),
	}));

	const lines = getErrorLines(stderr);
	assert.equal(lines.includes(`${testTimestamp} [0] × Command failed with exit code 2: noop-fail.js 1`), sourceVerbose);
	assert.equal(lines.includes(`${testTimestamp} [${sourceVerbose ? 1 : 0}] × Command failed with exit code 2: stdin-fail.js`), destinationVerbose);
};

test('Prints both errors piped with .pipe("file")', () => testPipeError('nested-pipe-file.js', true, true));
test('Prints both errors piped with .pipe`command`', () => testPipeError('nested-pipe-script.js', true, true));
test('Prints both errors piped with .pipe(subprocess)', () => testPipeError('nested-pipe-subprocesses.js', true, true));
test('Prints first error piped with .pipe("file")', () => testPipeError('nested-pipe-file.js', true, false));
test('Prints first error piped with .pipe`command`', () => testPipeError('nested-pipe-script.js', true, false));
test('Prints first error piped with .pipe(subprocess)', () => testPipeError('nested-pipe-subprocesses.js', true, false));
test('Prints second error piped with .pipe("file")', () => testPipeError('nested-pipe-file.js', false, true));
test('Prints second error piped with .pipe`command`', () => testPipeError('nested-pipe-script.js', false, true));
test('Prints second error piped with .pipe(subprocess)', () => testPipeError('nested-pipe-subprocesses.js', false, true));
test('Prints neither errors piped with .pipe("file")', () => testPipeError('nested-pipe-file.js', false, false));
test('Prints neither errors piped with .pipe`command`', () => testPipeError('nested-pipe-script.js', false, false));
test('Prints neither errors piped with .pipe(subprocess)', () => testPipeError('nested-pipe-subprocesses.js', false, false));

test('Quotes spaces from error', async () => {
	const {stderr} = await assertRejects(nestedSubprocess('noop-forever.js', ['foo bar'], {parentFixture: 'nested-fail.js', verbose: 'short'}));
	assert.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}foo bar${QUOTE}`,
		`${testTimestamp} [0] × foo bar`,
	]);
});

test('Quotes special punctuation from error', async () => {
	const {stderr} = await assertRejects(nestedSubprocess('noop-forever.js', ['%'], {parentFixture: 'nested-fail.js', verbose: 'short'}));
	assert.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}%${QUOTE}`,
		`${testTimestamp} [0] × %`,
	]);
});

test('Does not escape internal characters from error', async () => {
	const {stderr} = await assertRejects(nestedSubprocess('noop-forever.js', ['ã'], {parentFixture: 'nested-fail.js', verbose: 'short'}));
	assert.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}ã${QUOTE}`,
		`${testTimestamp} [0] × ã`,
	]);
});

test('Escapes and strips color sequences from error', async () => {
	const {stderr} = await assertRejects(nestedSubprocess('noop-forever.js', [foobarRed], {parentFixture: 'nested-fail.js', verbose: 'short'}));
	assert.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}\\u001b[31m${foobarString}\\u001b[39m${QUOTE}`,
		`${testTimestamp} [0] × ${foobarString}`,
	]);
});

test('Escapes control characters from error', async () => {
	const {stderr} = await assertRejects(nestedSubprocess('noop-forever.js', ['\u{1}'], {parentFixture: 'nested-fail.js', verbose: 'short'}));
	assert.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}\\u0001${QUOTE}`,
		`${testTimestamp} [0] × \\u0001`,
	]);
});
