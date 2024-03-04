import {stripVTControlCharacters} from 'node:util';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';
import {
	nestedExecaAsync,
	nestedExecaSync,
	runErrorProcess,
	runWarningProcess,
	runEarlyErrorProcess,
	getCompletionLine,
	getCompletionLines,
	testTimestamp,
	getVerboseOption,
} from '../helpers/verbose.js';

setFixtureDir();

const testPrintCompletion = async (t, verbose, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose});
	t.is(getCompletionLine(stderr), `${testTimestamp} [0] √ (done in 0ms)`);
};

test('Prints completion, verbose "short"', testPrintCompletion, 'short', nestedExecaAsync);
test('Prints completion, verbose "full"', testPrintCompletion, 'full', nestedExecaAsync);
test('Prints completion, verbose "short", sync', testPrintCompletion, 'short', nestedExecaSync);
test('Prints completion, verbose "full", sync', testPrintCompletion, 'full', nestedExecaSync);

const testNoPrintCompletion = async (t, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose: 'none'});
	t.is(stderr, '');
};

test('Does not print completion, verbose "none"', testNoPrintCompletion, nestedExecaAsync);
test('Does not print completion, verbose "none", sync', testNoPrintCompletion, nestedExecaSync);

const testPrintCompletionError = async (t, execaMethod) => {
	const stderr = await runErrorProcess(t, 'short', execaMethod);
	t.is(getCompletionLine(stderr), `${testTimestamp} [0] × (done in 0ms)`);
};

test('Prints completion after errors', testPrintCompletionError, nestedExecaAsync);
test('Prints completion after errors, sync', testPrintCompletionError, nestedExecaSync);

const testPrintCompletionWarning = async (t, execaMethod) => {
	const stderr = await runWarningProcess(t, execaMethod);
	t.is(getCompletionLine(stderr), `${testTimestamp} [0] ‼ (done in 0ms)`);
};

test('Prints completion after errors, "reject" false', testPrintCompletionWarning, nestedExecaAsync);
test('Prints completion after errors, "reject" false, sync', testPrintCompletionWarning, nestedExecaSync);

const testPrintCompletionEarly = async (t, execaMethod) => {
	const stderr = await runEarlyErrorProcess(t, execaMethod);
	t.is(getCompletionLine(stderr), `${testTimestamp} [0] × (done in 0ms)`);
};

test('Prints completion after early validation errors', testPrintCompletionEarly, nestedExecaAsync);
test('Prints completion after early validation errors, sync', testPrintCompletionEarly, nestedExecaSync);

test.serial('Prints duration', async t => {
	const {stderr} = await nestedExecaAsync('delay.js', ['1000'], {verbose: 'short'});
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
test('Prints both durations piped with .pipe(childProcess)', testPipeDuration, 'process', true, true);
test('Prints first duration piped with .pipe("file")', testPipeDuration, 'file', true, false);
test('Prints first duration piped with .pipe`command`', testPipeDuration, 'script', true, false);
test('Prints first duration piped with .pipe(childProcess)', testPipeDuration, 'process', true, false);
test('Prints second duration piped with .pipe("file")', testPipeDuration, 'file', false, true);
test('Prints second duration piped with .pipe`command`', testPipeDuration, 'script', false, true);
test('Prints second duration piped with .pipe(childProcess)', testPipeDuration, 'process', false, true);
test('Prints neither durations piped with .pipe("file")', testPipeDuration, 'file', false, false);
test('Prints neither durations piped with .pipe`command`', testPipeDuration, 'script', false, false);
test('Prints neither durations piped with .pipe(childProcess)', testPipeDuration, 'process', false, false);
