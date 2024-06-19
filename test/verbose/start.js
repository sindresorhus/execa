import test from 'ava';
import {red} from 'yoctocolors';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {
	QUOTE,
	runErrorSubprocess,
	runEarlyErrorSubprocess,
	getCommandLine,
	getCommandLines,
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

const testPrintCommand = async (t, verbose, worker, isSync) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose, worker, isSync});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${foobarString}`);
};

test('Prints command, verbose "short"', testPrintCommand, 'short', false, false);
test('Prints command, verbose "full"', testPrintCommand, 'full', false, false);
test('Prints command, verbose "short", fd-specific stdout', testPrintCommand, stdoutShortOption, false, false);
test('Prints command, verbose "full", fd-specific stdout', testPrintCommand, stdoutFullOption, false, false);
test('Prints command, verbose "short", fd-specific stderr', testPrintCommand, stderrShortOption, false, false);
test('Prints command, verbose "full", fd-specific stderr', testPrintCommand, stderrFullOption, false, false);
test('Prints command, verbose "short", fd-specific fd3', testPrintCommand, fd3ShortOption, false, false);
test('Prints command, verbose "full", fd-specific fd3', testPrintCommand, fd3FullOption, false, false);
test('Prints command, verbose "short", fd-specific ipc', testPrintCommand, ipcShortOption, false, false);
test('Prints command, verbose "full", fd-specific ipc', testPrintCommand, ipcFullOption, false, false);
test('Prints command, verbose "short", sync', testPrintCommand, 'short', false, true);
test('Prints command, verbose "full", sync', testPrintCommand, 'full', false, true);
test('Prints command, verbose "short", fd-specific stdout, sync', testPrintCommand, stdoutShortOption, false, true);
test('Prints command, verbose "full", fd-specific stdout, sync', testPrintCommand, stdoutFullOption, false, true);
test('Prints command, verbose "short", fd-specific stderr, sync', testPrintCommand, stderrShortOption, false, true);
test('Prints command, verbose "full", fd-specific stderr, sync', testPrintCommand, stderrFullOption, false, true);
test('Prints command, verbose "short", fd-specific fd3, sync', testPrintCommand, fd3ShortOption, false, true);
test('Prints command, verbose "full", fd-specific fd3, sync', testPrintCommand, fd3FullOption, false, true);
test('Prints command, verbose "short", fd-specific ipc, sync', testPrintCommand, ipcShortOption, false, true);
test('Prints command, verbose "full", fd-specific ipc, sync', testPrintCommand, ipcFullOption, false, true);
test('Prints command, verbose "short", worker', testPrintCommand, 'short', true, false);
test('Prints command, verbose "full", worker', testPrintCommand, 'full', true, false);
test('Prints command, verbose "short", fd-specific stdout, worker', testPrintCommand, stdoutShortOption, true, false);
test('Prints command, verbose "full", fd-specific stdout, worker', testPrintCommand, stdoutFullOption, true, false);
test('Prints command, verbose "short", fd-specific stderr, worker', testPrintCommand, stderrShortOption, true, false);
test('Prints command, verbose "full", fd-specific stderr, worker', testPrintCommand, stderrFullOption, true, false);
test('Prints command, verbose "short", fd-specific fd3, worker', testPrintCommand, fd3ShortOption, true, false);
test('Prints command, verbose "full", fd-specific fd3, worker', testPrintCommand, fd3FullOption, true, false);
test('Prints command, verbose "short", fd-specific ipc, worker', testPrintCommand, ipcShortOption, true, false);
test('Prints command, verbose "full", fd-specific ipc, worker', testPrintCommand, ipcFullOption, true, false);
test('Prints command, verbose "short", worker, sync', testPrintCommand, 'short', true, true);
test('Prints command, verbose "full", worker, sync', testPrintCommand, 'full', true, true);
test('Prints command, verbose "short", fd-specific stdout, worker, sync', testPrintCommand, stdoutShortOption, true, true);
test('Prints command, verbose "full", fd-specific stdout, worker, sync', testPrintCommand, stdoutFullOption, true, true);
test('Prints command, verbose "short", fd-specific stderr, worker, sync', testPrintCommand, stderrShortOption, true, true);
test('Prints command, verbose "full", fd-specific stderr, worker, sync', testPrintCommand, stderrFullOption, true, true);
test('Prints command, verbose "short", fd-specific fd3, worker, sync', testPrintCommand, fd3ShortOption, true, true);
test('Prints command, verbose "full", fd-specific fd3, worker, sync', testPrintCommand, fd3FullOption, true, true);
test('Prints command, verbose "short", fd-specific ipc, worker, sync', testPrintCommand, ipcShortOption, true, true);
test('Prints command, verbose "full", fd-specific ipc, worker, sync', testPrintCommand, ipcFullOption, true, true);

const testNoPrintCommand = async (t, verbose, isSync) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose, isSync});
	t.is(stderr, '');
};

test('Does not print command, verbose "none"', testNoPrintCommand, 'none', false);
test('Does not print command, verbose default', testNoPrintCommand, undefined, false);
test('Does not print command, verbose "none", fd-specific stdout', testNoPrintCommand, stdoutNoneOption, false);
test('Does not print command, verbose "none", fd-specific stderr', testNoPrintCommand, stderrNoneOption, false);
test('Does not print command, verbose "none", fd-specific fd3', testNoPrintCommand, fd3NoneOption, false);
test('Does not print command, verbose "none", fd-specific ipc', testNoPrintCommand, ipcNoneOption, false);
test('Does not print command, verbose default, fd-specific', testNoPrintCommand, {}, false);
test('Does not print command, verbose "none", sync', testNoPrintCommand, 'none', true);
test('Does not print command, verbose default, sync', testNoPrintCommand, undefined, true);
test('Does not print command, verbose "none", fd-specific stdout, sync', testNoPrintCommand, stdoutNoneOption, true);
test('Does not print command, verbose "none", fd-specific stderr, sync', testNoPrintCommand, stderrNoneOption, true);
test('Does not print command, verbose "none", fd-specific fd3, sync', testNoPrintCommand, fd3NoneOption, true);
test('Does not print command, verbose "none", fd-specific ipc, sync', testNoPrintCommand, ipcNoneOption, true);
test('Does not print command, verbose default, fd-specific, sync', testNoPrintCommand, {}, true);

const testPrintCommandError = async (t, isSync) => {
	const stderr = await runErrorSubprocess(t, 'short', isSync);
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop-fail.js 1 ${foobarString}`);
};

test('Prints command after errors', testPrintCommandError, false);
test('Prints command after errors, sync', testPrintCommandError, true);

const testPrintCommandEarly = async (t, isSync) => {
	const stderr = await runEarlyErrorSubprocess(t, isSync);
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${foobarString}`);
};

test('Prints command before early validation errors', testPrintCommandEarly, false);
test('Prints command before early validation errors, sync', testPrintCommandEarly, true);

const testPipeCommand = async (t, parentFixture, sourceVerbose, destinationVerbose) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {
		parentFixture,
		sourceOptions: getVerboseOption(sourceVerbose),
		destinationFile: 'stdin.js',
		destinationOptions: getVerboseOption(destinationVerbose),
	});

	const pipeSymbol = parentFixture === 'nested-pipe-subprocesses.js' ? '$' : '|';
	const lines = getCommandLines(stderr);
	t.is(lines.includes(`${testTimestamp} [0] $ noop.js ${foobarString}`), sourceVerbose);
	t.is(lines.includes(`${testTimestamp} [${sourceVerbose ? 1 : 0}] ${pipeSymbol} stdin.js`), destinationVerbose);
};

test('Prints both commands piped with .pipe("file")', testPipeCommand, 'nested-pipe-file.js', true, true);
test('Prints both commands piped with .pipe`command`', testPipeCommand, 'nested-pipe-script.js', true, true);
test('Prints both commands piped with .pipe(subprocess)', testPipeCommand, 'nested-pipe-subprocesses.js', true, true);
test('Prints first command piped with .pipe("file")', testPipeCommand, 'nested-pipe-file.js', true, false);
test('Prints first command piped with .pipe`command`', testPipeCommand, 'nested-pipe-script.js', true, false);
test('Prints first command piped with .pipe(subprocess)', testPipeCommand, 'nested-pipe-subprocesses.js', true, false);
test('Prints second command piped with .pipe("file")', testPipeCommand, 'nested-pipe-file.js', false, true);
test('Prints second command piped with .pipe`command`', testPipeCommand, 'nested-pipe-script.js', false, true);
test('Prints second command piped with .pipe(subprocess)', testPipeCommand, 'nested-pipe-subprocesses.js', false, true);
test('Prints neither commands piped with .pipe("file")', testPipeCommand, 'nested-pipe-file.js', false, false);
test('Prints neither commands piped with .pipe`command`', testPipeCommand, 'nested-pipe-script.js', false, false);
test('Prints neither commands piped with .pipe(subprocess)', testPipeCommand, 'nested-pipe-subprocesses.js', false, false);

test('Quotes spaces from command', async t => {
	const {stderr} = await nestedSubprocess('noop.js', ['foo bar'], {verbose: 'short'});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${QUOTE}foo bar${QUOTE}`);
});

test('Quotes special punctuation from command', async t => {
	const {stderr} = await nestedSubprocess('noop.js', ['%'], {verbose: 'short'});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${QUOTE}%${QUOTE}`);
});

test('Does not escape internal characters from command', async t => {
	const {stderr} = await nestedSubprocess('noop.js', ['ã'], {verbose: 'short'});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${QUOTE}ã${QUOTE}`);
});

test('Escapes color sequences from command', async t => {
	const {stderr} = await nestedSubprocess('noop.js', [red(foobarString)], {verbose: 'short'}, {env: {FORCE_COLOR: '1'}});
	t.true(getCommandLine(stderr).includes(`${QUOTE}\\u001b[31m${foobarString}\\u001b[39m${QUOTE}`));
});

test('Escapes control characters from command', async t => {
	const {stderr} = await nestedSubprocess('noop.js', ['\u0001'], {verbose: 'short'});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${QUOTE}\\u0001${QUOTE}`);
});
