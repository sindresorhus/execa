import test from 'ava';
import {red} from 'yoctocolors';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {fullStdio} from '../helpers/stdio.js';
import {
	nestedExecaAsync,
	parentExeca,
	parentExecaAsync,
	parentExecaSync,
} from '../helpers/nested.js';
import {
	runErrorSubprocessAsync,
	runErrorSubprocessSync,
	getOutputLine,
	getOutputLines,
	testTimestamp,
	fdShortOption,
	fdFullOption,
	fdStdoutNoneOption,
	fdStderrNoneOption,
	fdStderrShortOption,
	fdStderrFullOption,
	fd3NoneOption,
	fd3ShortOption,
	fd3FullOption,
} from '../helpers/verbose.js';

setFixtureDirectory();

const testPrintOutput = async (t, verbose, fdNumber, execaMethod) => {
	const {stderr} = await execaMethod('noop-fd.js', [`${fdNumber}`, foobarString], {verbose});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, verbose "full"', testPrintOutput, 'full', 1, parentExecaAsync);
test('Prints stderr, verbose "full"', testPrintOutput, 'full', 2, parentExecaAsync);
test('Prints stdout, verbose "full", fd-specific', testPrintOutput, fdFullOption, 1, parentExecaAsync);
test('Prints stderr, verbose "full", fd-specific', testPrintOutput, fdStderrFullOption, 2, parentExecaAsync);
test('Prints stdout, verbose "full", sync', testPrintOutput, 'full', 1, parentExecaSync);
test('Prints stderr, verbose "full", sync', testPrintOutput, 'full', 2, parentExecaSync);
test('Prints stdout, verbose "full", fd-specific, sync', testPrintOutput, fdFullOption, 1, parentExecaSync);
test('Prints stderr, verbose "full", fd-specific, sync', testPrintOutput, fdStderrFullOption, 2, parentExecaSync);

const testNoPrintOutput = async (t, verbose, fdNumber, execaMethod) => {
	const {stderr} = await execaMethod('noop-fd.js', [`${fdNumber}`, foobarString], {verbose, ...fullStdio});
	t.is(getOutputLine(stderr), undefined);
};

test('Does not print stdout, verbose default', testNoPrintOutput, undefined, 1, parentExecaAsync);
test('Does not print stdout, verbose "none"', testNoPrintOutput, 'none', 1, parentExecaAsync);
test('Does not print stdout, verbose "short"', testNoPrintOutput, 'short', 1, parentExecaAsync);
test('Does not print stderr, verbose default', testNoPrintOutput, undefined, 2, parentExecaAsync);
test('Does not print stderr, verbose "none"', testNoPrintOutput, 'none', 2, parentExecaAsync);
test('Does not print stderr, verbose "short"', testNoPrintOutput, 'short', 2, parentExecaAsync);
test('Does not print stdio[*], verbose default', testNoPrintOutput, undefined, 3, parentExecaAsync);
test('Does not print stdio[*], verbose "none"', testNoPrintOutput, 'none', 3, parentExecaAsync);
test('Does not print stdio[*], verbose "short"', testNoPrintOutput, 'short', 3, parentExecaAsync);
test('Does not print stdio[*], verbose "full"', testNoPrintOutput, 'full', 3, parentExecaAsync);
test('Does not print stdout, verbose default, fd-specific', testNoPrintOutput, {}, 1, parentExecaAsync);
test('Does not print stdout, verbose "none", fd-specific', testNoPrintOutput, fdStdoutNoneOption, 1, parentExecaAsync);
test('Does not print stdout, verbose "short", fd-specific', testNoPrintOutput, fdShortOption, 1, parentExecaAsync);
test('Does not print stderr, verbose default, fd-specific', testNoPrintOutput, {}, 2, parentExecaAsync);
test('Does not print stderr, verbose "none", fd-specific', testNoPrintOutput, fdStderrNoneOption, 2, parentExecaAsync);
test('Does not print stderr, verbose "short", fd-specific', testNoPrintOutput, fdStderrShortOption, 2, parentExecaAsync);
test('Does not print stdio[*], verbose default, fd-specific', testNoPrintOutput, {}, 3, parentExecaAsync);
test('Does not print stdio[*], verbose "none", fd-specific', testNoPrintOutput, fd3NoneOption, 3, parentExecaAsync);
test('Does not print stdio[*], verbose "short", fd-specific', testNoPrintOutput, fd3ShortOption, 3, parentExecaAsync);
test('Does not print stdio[*], verbose "full", fd-specific', testNoPrintOutput, fd3FullOption, 3, parentExecaAsync);
test('Does not print stdout, verbose default, sync', testNoPrintOutput, undefined, 1, parentExecaSync);
test('Does not print stdout, verbose "none", sync', testNoPrintOutput, 'none', 1, parentExecaSync);
test('Does not print stdout, verbose "short", sync', testNoPrintOutput, 'short', 1, parentExecaSync);
test('Does not print stderr, verbose default, sync', testNoPrintOutput, undefined, 2, parentExecaSync);
test('Does not print stderr, verbose "none", sync', testNoPrintOutput, 'none', 2, parentExecaSync);
test('Does not print stderr, verbose "short", sync', testNoPrintOutput, 'short', 2, parentExecaSync);
test('Does not print stdio[*], verbose default, sync', testNoPrintOutput, undefined, 3, parentExecaSync);
test('Does not print stdio[*], verbose "none", sync', testNoPrintOutput, 'none', 3, parentExecaSync);
test('Does not print stdio[*], verbose "short", sync', testNoPrintOutput, 'short', 3, parentExecaSync);
test('Does not print stdio[*], verbose "full", sync', testNoPrintOutput, 'full', 3, parentExecaSync);
test('Does not print stdout, verbose default, fd-specific, sync', testNoPrintOutput, {}, 1, parentExecaSync);
test('Does not print stdout, verbose "none", fd-specific, sync', testNoPrintOutput, fdStdoutNoneOption, 1, parentExecaSync);
test('Does not print stdout, verbose "short", fd-specific, sync', testNoPrintOutput, fdShortOption, 1, parentExecaSync);
test('Does not print stderr, verbose default, fd-specific, sync', testNoPrintOutput, {}, 2, parentExecaSync);
test('Does not print stderr, verbose "none", fd-specific, sync', testNoPrintOutput, fdStderrNoneOption, 2, parentExecaSync);
test('Does not print stderr, verbose "short", fd-specific, sync', testNoPrintOutput, fdStderrShortOption, 2, parentExecaSync);
test('Does not print stdio[*], verbose default, fd-specific, sync', testNoPrintOutput, {}, 3, parentExecaSync);
test('Does not print stdio[*], verbose "none", fd-specific, sync', testNoPrintOutput, fd3NoneOption, 3, parentExecaSync);
test('Does not print stdio[*], verbose "short", fd-specific, sync', testNoPrintOutput, fd3ShortOption, 3, parentExecaSync);
test('Does not print stdio[*], verbose "full", fd-specific, sync', testNoPrintOutput, fd3FullOption, 3, parentExecaSync);

const testPrintError = async (t, execaMethod) => {
	const stderr = await execaMethod(t, 'full');
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout after errors', testPrintError, runErrorSubprocessAsync);
test('Prints stdout after errors, sync', testPrintError, runErrorSubprocessSync);

test('Does not quote spaces from stdout', async t => {
	const {stderr} = await parentExecaAsync('noop.js', ['foo bar'], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   foo bar`);
});

test('Does not quote special punctuation from stdout', async t => {
	const {stderr} = await parentExecaAsync('noop.js', ['%'], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   %`);
});

test('Does not escape internal characters from stdout', async t => {
	const {stderr} = await parentExecaAsync('noop.js', ['ã'], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ã`);
});

test('Strips color sequences from stdout', async t => {
	const {stderr} = await parentExecaAsync('noop.js', [red(foobarString)], {verbose: 'full'}, {env: {FORCE_COLOR: '1'}});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
});

test('Escapes control characters from stdout', async t => {
	const {stderr} = await parentExecaAsync('noop.js', ['\u0001'], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   \\u0001`);
});

const testStdioSame = async (t, fdNumber) => {
	const {stdio} = await nestedExecaAsync('noop-fd.js', [`${fdNumber}`, foobarString], {verbose: 'full'});
	t.is(stdio[fdNumber], foobarString);
};

test('Does not change subprocess.stdout', testStdioSame, 1);
test('Does not change subprocess.stderr', testStdioSame, 2);

const testSingleNewline = async (t, execaMethod) => {
	const {stderr} = await execaMethod('noop-fd.js', ['1', '\n'], {verbose: 'full'});
	t.deepEqual(getOutputLines(stderr), [`${testTimestamp} [0]   `]);
};

test('Prints stdout, single newline', testSingleNewline, parentExecaAsync);
test('Prints stdout, single newline, sync', testSingleNewline, parentExecaSync);

const testUtf16 = async (t, isSync) => {
	const {stderr} = await parentExeca('nested-input.js', 'stdin.js', [`${isSync}`], {verbose: 'full', encoding: 'utf16le'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Can use encoding UTF16, verbose "full"', testUtf16, false);
test('Can use encoding UTF16, verbose "full", sync', testUtf16, true);
