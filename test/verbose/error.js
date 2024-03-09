import test from 'ava';
import {red} from 'yoctocolors';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';
import {
	QUOTE,
	nestedExeca,
	nestedExecaAsync,
	nestedExecaSync,
	runEarlyErrorSubprocess,
	getErrorLine,
	getErrorLines,
	testTimestamp,
	getVerboseOption,
} from '../helpers/verbose.js';

setFixtureDir();

const nestedExecaFail = nestedExeca.bind(undefined, 'nested-fail.js');

const testPrintError = async (t, verbose, execaMethod) => {
	const {stderr} = await t.throwsAsync(execaMethod('noop-fail.js', ['1', foobarString], {verbose}));
	t.is(getErrorLine(stderr), `${testTimestamp} [0] × Command failed with exit code 2: noop-fail.js 1 ${foobarString}`);
};

test('Prints error, verbose "short"', testPrintError, 'short', nestedExecaAsync);
test('Prints error, verbose "full"', testPrintError, 'full', nestedExecaAsync);
test('Prints error, verbose "short", sync', testPrintError, 'short', nestedExecaSync);
test('Prints error, verbose "full", sync', testPrintError, 'full', nestedExecaSync);

const testNoPrintError = async (t, execaMethod) => {
	const {stderr} = await t.throwsAsync(execaMethod('noop-fail.js', ['1', foobarString], {verbose: 'none'}));
	t.not(stderr, '');
	t.is(getErrorLine(stderr), undefined);
};

test('Does not print error, verbose "none"', testNoPrintError, nestedExecaAsync);
test('Does not print error, verbose "none", sync', testNoPrintError, nestedExecaSync);

const testPrintNoError = async (t, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose: 'short'});
	t.is(getErrorLine(stderr), undefined);
};

test('Does not print error if none', testPrintNoError, nestedExecaAsync);
test('Does not print error if none, sync', testPrintNoError, nestedExecaSync);

const testPrintErrorEarly = async (t, execaMethod) => {
	const stderr = await runEarlyErrorSubprocess(t, execaMethod);
	t.is(getErrorLine(stderr), `${testTimestamp} [0] × TypeError: The "cwd" option must be a string or a file URL: true.`);
};

test('Prints early validation error', testPrintErrorEarly, nestedExecaAsync);
test('Prints early validation error, sync', testPrintErrorEarly, nestedExecaSync);

test('Does not repeat stdout|stderr with error', async t => {
	const {stderr} = await t.throwsAsync(nestedExecaAsync('noop-fail.js', ['1', foobarString], {verbose: 'short'}));
	t.deepEqual(getErrorLines(stderr), [`${testTimestamp} [0] × Command failed with exit code 2: noop-fail.js 1 ${foobarString}`]);
});

test('Prints error differently if "reject" is false', async t => {
	const {stderr} = await nestedExecaAsync('noop-fail.js', ['1', foobarString], {verbose: 'short', reject: false});
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
	const {stderr} = await t.throwsAsync(nestedExecaFail('noop-forever.js', ['foo bar'], {verbose: 'short'}));
	t.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}foo bar${QUOTE}`,
		`${testTimestamp} [0] × foo bar`,
	]);
});

test('Quotes special punctuation from error', async t => {
	const {stderr} = await t.throwsAsync(nestedExecaFail('noop-forever.js', ['%'], {verbose: 'short'}));
	t.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}%${QUOTE}`,
		`${testTimestamp} [0] × %`,
	]);
});

test('Does not escape internal characters from error', async t => {
	const {stderr} = await t.throwsAsync(nestedExecaFail('noop-forever.js', ['ã'], {verbose: 'short'}));
	t.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}ã${QUOTE}`,
		`${testTimestamp} [0] × ã`,
	]);
});

test('Escapes and strips color sequences from error', async t => {
	const {stderr} = await t.throwsAsync(nestedExecaFail('noop-forever.js', [red(foobarString)], {verbose: 'short'}, {env: {FORCE_COLOR: '1'}}));
	t.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}\\u001b[31m${foobarString}\\u001b[39m${QUOTE}`,
		`${testTimestamp} [0] × ${foobarString}`,
	]);
});

test('Escapes control characters from error', async t => {
	const {stderr} = await t.throwsAsync(nestedExecaFail('noop-forever.js', ['\u0001'], {verbose: 'short'}));
	t.deepEqual(getErrorLines(stderr), [
		`${testTimestamp} [0] × Command was killed with SIGTERM (Termination): noop-forever.js ${QUOTE}\\u0001${QUOTE}`,
		`${testTimestamp} [0] × \\u0001`,
	]);
});
