import test from 'ava';
import {red} from 'yoctocolors';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';
import {
	QUOTE,
	nestedExecaAsync,
	nestedExecaSync,
	runErrorProcess,
	runEarlyErrorProcess,
	getCommandLine,
	getCommandLines,
	testTimestamp,
} from '../helpers/verbose.js';

setFixtureDir();

const testPrintCommand = async (t, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose: true});
	t.is(getCommandLine(stderr), `${testTimestamp} $ noop.js ${foobarString}`);
};

test('Prints command', testPrintCommand, nestedExecaAsync);
test('Prints command, sync', testPrintCommand, nestedExecaSync);

const testNoPrintCommand = async (t, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose: false});
	t.is(stderr, '');
};

test('Does not print command', testNoPrintCommand, nestedExecaAsync);
test('Does not print command, sync', testNoPrintCommand, nestedExecaSync);

const testPrintCommandError = async (t, execaMethod) => {
	const stderr = await runErrorProcess(t, true, execaMethod);
	t.is(getCommandLine(stderr), `${testTimestamp} $ noop-fail.js 1 ${foobarString}`);
};

test('Prints command after errors', testPrintCommandError, nestedExecaAsync);
test('Prints command after errors, sync', testPrintCommandError, nestedExecaSync);

const testPrintCommandEarly = async (t, execaMethod) => {
	const stderr = await runEarlyErrorProcess(t, execaMethod);
	t.is(getCommandLine(stderr), `${testTimestamp} $ noop.js ${foobarString}`);
};

test('Prints command before early validation errors', testPrintCommandEarly, nestedExecaAsync);
test('Prints command before early validation errors, sync', testPrintCommandEarly, nestedExecaSync);

const testPipeCommand = async (t, fixtureName, sourceVerbose, destinationVerbose) => {
	const {stderr} = await execa(`nested-pipe-${fixtureName}.js`, [
		JSON.stringify({verbose: sourceVerbose}),
		'noop.js',
		foobarString,
		JSON.stringify({verbose: destinationVerbose}),
		'stdin.js',
	]);
	const pipeSymbol = fixtureName === 'process' ? '$' : '|';
	const lines = getCommandLines(stderr);
	t.is(lines.includes(`${testTimestamp} $ noop.js ${foobarString}`), sourceVerbose);
	t.is(lines.includes(`${testTimestamp} ${pipeSymbol} stdin.js`), destinationVerbose);
};

test('Prints both commands piped with .pipe("file")', testPipeCommand, 'file', true, true);
test('Prints both commands piped with .pipe`command`', testPipeCommand, 'script', true, true);
test('Prints both commands piped with .pipe(childProcess)', testPipeCommand, 'process', true, true);
test('Prints first command piped with .pipe("file")', testPipeCommand, 'file', true, false);
test('Prints first command piped with .pipe`command`', testPipeCommand, 'script', true, false);
test('Prints first command piped with .pipe(childProcess)', testPipeCommand, 'process', true, false);
test('Prints second command piped with .pipe("file")', testPipeCommand, 'file', false, true);
test('Prints second command piped with .pipe`command`', testPipeCommand, 'script', false, true);
test('Prints second command piped with .pipe(childProcess)', testPipeCommand, 'process', false, true);
test('Prints neither commands piped with .pipe("file")', testPipeCommand, 'file', false, false);
test('Prints neither commands piped with .pipe`command`', testPipeCommand, 'script', false, false);
test('Prints neither commands piped with .pipe(childProcess)', testPipeCommand, 'process', false, false);

test('Quotes spaces from command', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', ['foo bar'], {verbose: true});
	t.is(getCommandLine(stderr), `${testTimestamp} $ noop.js ${QUOTE}foo bar${QUOTE}`);
});

test('Quotes special punctuation from command', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', ['%'], {verbose: true});
	t.is(getCommandLine(stderr), `${testTimestamp} $ noop.js ${QUOTE}%${QUOTE}`);
});

test('Does not escape internal characters from command', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', ['ã'], {verbose: true});
	t.is(getCommandLine(stderr), `${testTimestamp} $ noop.js ${QUOTE}ã${QUOTE}`);
});

test('Escapes color sequences from command', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', [red(foobarString)], {verbose: true}, {env: {FORCE_COLOR: '1'}});
	t.true(getCommandLine(stderr).includes(`${QUOTE}\\u001b[31m${foobarString}\\u001b[39m${QUOTE}`));
});

test('Escapes control characters from command', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', ['\u0001'], {verbose: true});
	t.is(getCommandLine(stderr), `${testTimestamp} $ noop.js ${QUOTE}\\u0001${QUOTE}`);
});
