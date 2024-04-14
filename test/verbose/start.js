import test from 'ava';
import {red} from 'yoctocolors';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {parentExecaAsync, parentExecaSync, parentWorker} from '../helpers/nested.js';
import {
	QUOTE,
	runErrorSubprocessAsync,
	runErrorSubprocessSync,
	runEarlyErrorSubprocessAsync,
	runEarlyErrorSubprocessSync,
	getCommandLine,
	getCommandLines,
	testTimestamp,
	getVerboseOption,
	fdNoneOption,
	fdShortOption,
	fdFullOption,
} from '../helpers/verbose.js';

setFixtureDirectory();

const testPrintCommand = async (t, verbose, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${foobarString}`);
};

test('Prints command, verbose "short"', testPrintCommand, 'short', parentExecaAsync);
test('Prints command, verbose "full"', testPrintCommand, 'full', parentExecaAsync);
test('Prints command, verbose "short", fd-specific', testPrintCommand, fdShortOption, parentExecaAsync);
test('Prints command, verbose "full", fd-specific', testPrintCommand, fdFullOption, parentExecaAsync);
test('Prints command, verbose "short", sync', testPrintCommand, 'short', parentExecaSync);
test('Prints command, verbose "full", sync', testPrintCommand, 'full', parentExecaSync);
test('Prints command, verbose "short", fd-specific, sync', testPrintCommand, fdShortOption, parentExecaSync);
test('Prints command, verbose "full", fd-specific, sync', testPrintCommand, fdFullOption, parentExecaSync);
test('Prints command, verbose "short", worker', testPrintCommand, 'short', parentWorker);
test('Prints command, verbose "full", work', testPrintCommand, 'full', parentWorker);
test('Prints command, verbose "short", fd-specific, worker', testPrintCommand, fdShortOption, parentWorker);
test('Prints command, verbose "full", fd-specific, work', testPrintCommand, fdFullOption, parentWorker);

const testNoPrintCommand = async (t, verbose, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose});
	t.is(stderr, '');
};

test('Does not print command, verbose "none"', testNoPrintCommand, 'none', parentExecaAsync);
test('Does not print command, verbose default', testNoPrintCommand, undefined, parentExecaAsync);
test('Does not print command, verbose "none", fd-specific', testNoPrintCommand, fdNoneOption, parentExecaAsync);
test('Does not print command, verbose default, fd-specific', testNoPrintCommand, {}, parentExecaAsync);
test('Does not print command, verbose "none", sync', testNoPrintCommand, 'none', parentExecaSync);
test('Does not print command, verbose default, sync', testNoPrintCommand, undefined, parentExecaSync);
test('Does not print command, verbose "none", fd-specific, sync', testNoPrintCommand, fdNoneOption, parentExecaSync);
test('Does not print command, verbose default, fd-specific, sync', testNoPrintCommand, {}, parentExecaSync);

const testPrintCommandError = async (t, execaMethod) => {
	const stderr = await execaMethod(t, 'short');
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop-fail.js 1 ${foobarString}`);
};

test('Prints command after errors', testPrintCommandError, runErrorSubprocessAsync);
test('Prints command after errors, sync', testPrintCommandError, runErrorSubprocessSync);

const testPrintCommandEarly = async (t, execaMethod) => {
	const stderr = await execaMethod(t);
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${foobarString}`);
};

test('Prints command before early validation errors', testPrintCommandEarly, runEarlyErrorSubprocessAsync);
test('Prints command before early validation errors, sync', testPrintCommandEarly, runEarlyErrorSubprocessSync);

const testPipeCommand = async (t, fixtureName, sourceVerbose, destinationVerbose) => {
	const {stderr} = await execa(`nested-pipe-${fixtureName}.js`, [
		JSON.stringify(getVerboseOption(sourceVerbose)),
		'noop.js',
		foobarString,
		JSON.stringify(getVerboseOption(destinationVerbose)),
		'stdin.js',
	]);
	const pipeSymbol = fixtureName === 'subprocesses' ? '$' : '|';
	const lines = getCommandLines(stderr);
	t.is(lines.includes(`${testTimestamp} [0] $ noop.js ${foobarString}`), sourceVerbose);
	t.is(lines.includes(`${testTimestamp} [${sourceVerbose ? 1 : 0}] ${pipeSymbol} stdin.js`), destinationVerbose);
};

test('Prints both commands piped with .pipe("file")', testPipeCommand, 'file', true, true);
test('Prints both commands piped with .pipe`command`', testPipeCommand, 'script', true, true);
test('Prints both commands piped with .pipe(subprocess)', testPipeCommand, 'subprocesses', true, true);
test('Prints first command piped with .pipe("file")', testPipeCommand, 'file', true, false);
test('Prints first command piped with .pipe`command`', testPipeCommand, 'script', true, false);
test('Prints first command piped with .pipe(subprocess)', testPipeCommand, 'subprocesses', true, false);
test('Prints second command piped with .pipe("file")', testPipeCommand, 'file', false, true);
test('Prints second command piped with .pipe`command`', testPipeCommand, 'script', false, true);
test('Prints second command piped with .pipe(subprocess)', testPipeCommand, 'subprocesses', false, true);
test('Prints neither commands piped with .pipe("file")', testPipeCommand, 'file', false, false);
test('Prints neither commands piped with .pipe`command`', testPipeCommand, 'script', false, false);
test('Prints neither commands piped with .pipe(subprocess)', testPipeCommand, 'subprocesses', false, false);

test('Quotes spaces from command', async t => {
	const {stderr} = await parentExecaAsync('noop.js', ['foo bar'], {verbose: 'short'});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${QUOTE}foo bar${QUOTE}`);
});

test('Quotes special punctuation from command', async t => {
	const {stderr} = await parentExecaAsync('noop.js', ['%'], {verbose: 'short'});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${QUOTE}%${QUOTE}`);
});

test('Does not escape internal characters from command', async t => {
	const {stderr} = await parentExecaAsync('noop.js', ['ã'], {verbose: 'short'});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${QUOTE}ã${QUOTE}`);
});

test('Escapes color sequences from command', async t => {
	const {stderr} = await parentExecaAsync('noop.js', [red(foobarString)], {verbose: 'short'}, {env: {FORCE_COLOR: '1'}});
	t.true(getCommandLine(stderr).includes(`${QUOTE}\\u001b[31m${foobarString}\\u001b[39m${QUOTE}`));
});

test('Escapes control characters from command', async t => {
	const {stderr} = await parentExecaAsync('noop.js', ['\u0001'], {verbose: 'short'});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${QUOTE}\\u0001${QUOTE}`);
});
