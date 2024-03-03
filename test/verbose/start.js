import test from 'ava';
import {red} from 'yoctocolors';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';
import {
	QUOTE,
	nestedExecaAsync,
	nestedExecaSync,
	runErrorSubprocess,
	runEarlyErrorSubprocess,
	getCommandLine,
	getCommandLines,
	testTimestamp,
	getVerboseOption,
} from '../helpers/verbose.js';

setFixtureDir();

const testPrintCommand = async (t, verbose, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${foobarString}`);
};

test('Prints command, verbose "short"', testPrintCommand, 'short', nestedExecaAsync);
test('Prints command, verbose "full"', testPrintCommand, 'full', nestedExecaAsync);
test('Prints command, verbose "short", sync', testPrintCommand, 'short', nestedExecaSync);
test('Prints command, verbose "full", sync', testPrintCommand, 'full', nestedExecaSync);

const testNoPrintCommand = async (t, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose: 'none'});
	t.is(stderr, '');
};

test('Does not print command, verbose "none"', testNoPrintCommand, nestedExecaAsync);
test('Does not print command, verbose "none", sync', testNoPrintCommand, nestedExecaSync);

const testPrintCommandError = async (t, execaMethod) => {
	const stderr = await runErrorSubprocess(t, 'short', execaMethod);
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop-fail.js 1 ${foobarString}`);
};

test('Prints command after errors', testPrintCommandError, nestedExecaAsync);
test('Prints command after errors, sync', testPrintCommandError, nestedExecaSync);

const testPrintCommandEarly = async (t, execaMethod) => {
	const stderr = await runEarlyErrorSubprocess(t, execaMethod);
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${foobarString}`);
};

test('Prints command before early validation errors', testPrintCommandEarly, nestedExecaAsync);
test('Prints command before early validation errors, sync', testPrintCommandEarly, nestedExecaSync);

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
	const {stderr} = await nestedExecaAsync('noop.js', ['foo bar'], {verbose: 'short'});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${QUOTE}foo bar${QUOTE}`);
});

test('Quotes special punctuation from command', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', ['%'], {verbose: 'short'});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${QUOTE}%${QUOTE}`);
});

test('Does not escape internal characters from command', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', ['ã'], {verbose: 'short'});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${QUOTE}ã${QUOTE}`);
});

test('Escapes color sequences from command', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', [red(foobarString)], {verbose: 'short'}, {env: {FORCE_COLOR: '1'}});
	t.true(getCommandLine(stderr).includes(`${QUOTE}\\u001b[31m${foobarString}\\u001b[39m${QUOTE}`));
});

test('Escapes control characters from command', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', ['\u0001'], {verbose: 'short'});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${QUOTE}\\u0001${QUOTE}`);
});
