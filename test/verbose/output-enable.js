import test from 'ava';
import {red} from 'yoctocolors';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarUtf16Uint8Array} from '../helpers/input.js';
import {fullStdio} from '../helpers/stdio.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {
	runErrorSubprocess,
	getOutputLine,
	getOutputLines,
	testTimestamp,
	stdoutNoneOption,
	stdoutShortOption,
	stdoutFullOption,
	stderrNoneOption,
	stderrShortOption,
	stderrFullOption,
	fd3NoneOption,
	fd3ShortOption,
	fd3FullOption,
} from '../helpers/verbose.js';

setFixtureDirectory();

const testPrintOutput = async (t, verbose, fdNumber, isSync) => {
	const {stderr} = await nestedSubprocess('noop-fd.js', [`${fdNumber}`, foobarString], {verbose, isSync});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, verbose "full"', testPrintOutput, 'full', 1, false);
test('Prints stderr, verbose "full"', testPrintOutput, 'full', 2, false);
test('Prints stdout, verbose "full", fd-specific', testPrintOutput, stdoutFullOption, 1, false);
test('Prints stderr, verbose "full", fd-specific', testPrintOutput, stderrFullOption, 2, false);
test('Prints stdout, verbose "full", sync', testPrintOutput, 'full', 1, true);
test('Prints stderr, verbose "full", sync', testPrintOutput, 'full', 2, true);
test('Prints stdout, verbose "full", fd-specific, sync', testPrintOutput, stdoutFullOption, 1, true);
test('Prints stderr, verbose "full", fd-specific, sync', testPrintOutput, stderrFullOption, 2, true);

const testNoPrintOutput = async (t, verbose, fdNumber, isSync) => {
	const {stderr} = await nestedSubprocess('noop-fd.js', [`${fdNumber}`, foobarString], {verbose, ...fullStdio, isSync});
	t.is(getOutputLine(stderr), undefined);
};

test('Does not print stdout, verbose default', testNoPrintOutput, undefined, 1, false);
test('Does not print stdout, verbose "none"', testNoPrintOutput, 'none', 1, false);
test('Does not print stdout, verbose "short"', testNoPrintOutput, 'short', 1, false);
test('Does not print stderr, verbose default', testNoPrintOutput, undefined, 2, false);
test('Does not print stderr, verbose "none"', testNoPrintOutput, 'none', 2, false);
test('Does not print stderr, verbose "short"', testNoPrintOutput, 'short', 2, false);
test('Does not print stdio[*], verbose default', testNoPrintOutput, undefined, 3, false);
test('Does not print stdio[*], verbose "none"', testNoPrintOutput, 'none', 3, false);
test('Does not print stdio[*], verbose "short"', testNoPrintOutput, 'short', 3, false);
test('Does not print stdio[*], verbose "full"', testNoPrintOutput, 'full', 3, false);
test('Does not print stdout, verbose default, fd-specific', testNoPrintOutput, {}, 1, false);
test('Does not print stdout, verbose "none", fd-specific', testNoPrintOutput, stdoutNoneOption, 1, false);
test('Does not print stdout, verbose "short", fd-specific', testNoPrintOutput, stdoutShortOption, 1, false);
test('Does not print stderr, verbose default, fd-specific', testNoPrintOutput, {}, 2, false);
test('Does not print stderr, verbose "none", fd-specific', testNoPrintOutput, stderrNoneOption, 2, false);
test('Does not print stderr, verbose "short", fd-specific', testNoPrintOutput, stderrShortOption, 2, false);
test('Does not print stdio[*], verbose default, fd-specific', testNoPrintOutput, {}, 3, false);
test('Does not print stdio[*], verbose "none", fd-specific', testNoPrintOutput, fd3NoneOption, 3, false);
test('Does not print stdio[*], verbose "short", fd-specific', testNoPrintOutput, fd3ShortOption, 3, false);
test('Does not print stdio[*], verbose "full", fd-specific', testNoPrintOutput, fd3FullOption, 3, false);
test('Does not print stdout, verbose default, sync', testNoPrintOutput, undefined, 1, true);
test('Does not print stdout, verbose "none", sync', testNoPrintOutput, 'none', 1, true);
test('Does not print stdout, verbose "short", sync', testNoPrintOutput, 'short', 1, true);
test('Does not print stderr, verbose default, sync', testNoPrintOutput, undefined, 2, true);
test('Does not print stderr, verbose "none", sync', testNoPrintOutput, 'none', 2, true);
test('Does not print stderr, verbose "short", sync', testNoPrintOutput, 'short', 2, true);
test('Does not print stdio[*], verbose default, sync', testNoPrintOutput, undefined, 3, true);
test('Does not print stdio[*], verbose "none", sync', testNoPrintOutput, 'none', 3, true);
test('Does not print stdio[*], verbose "short", sync', testNoPrintOutput, 'short', 3, true);
test('Does not print stdio[*], verbose "full", sync', testNoPrintOutput, 'full', 3, true);
test('Does not print stdout, verbose default, fd-specific, sync', testNoPrintOutput, {}, 1, true);
test('Does not print stdout, verbose "none", fd-specific, sync', testNoPrintOutput, stdoutNoneOption, 1, true);
test('Does not print stdout, verbose "short", fd-specific, sync', testNoPrintOutput, stdoutShortOption, 1, true);
test('Does not print stderr, verbose default, fd-specific, sync', testNoPrintOutput, {}, 2, true);
test('Does not print stderr, verbose "none", fd-specific, sync', testNoPrintOutput, stderrNoneOption, 2, true);
test('Does not print stderr, verbose "short", fd-specific, sync', testNoPrintOutput, stderrShortOption, 2, true);
test('Does not print stdio[*], verbose default, fd-specific, sync', testNoPrintOutput, {}, 3, true);
test('Does not print stdio[*], verbose "none", fd-specific, sync', testNoPrintOutput, fd3NoneOption, 3, true);
test('Does not print stdio[*], verbose "short", fd-specific, sync', testNoPrintOutput, fd3ShortOption, 3, true);
test('Does not print stdio[*], verbose "full", fd-specific, sync', testNoPrintOutput, fd3FullOption, 3, true);

const testPrintError = async (t, isSync) => {
	const stderr = await runErrorSubprocess(t, 'full', isSync);
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout after errors', testPrintError, false);
test('Prints stdout after errors, sync', testPrintError, true);

test('Does not quote spaces from stdout', async t => {
	const {stderr} = await nestedSubprocess('noop.js', ['foo bar'], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   foo bar`);
});

test('Does not quote special punctuation from stdout', async t => {
	const {stderr} = await nestedSubprocess('noop.js', ['%'], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   %`);
});

test('Does not escape internal characters from stdout', async t => {
	const {stderr} = await nestedSubprocess('noop.js', ['ã'], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ã`);
});

test('Strips color sequences from stdout', async t => {
	const {stderr} = await nestedSubprocess('noop.js', [red(foobarString)], {verbose: 'full'}, {env: {FORCE_COLOR: '1'}});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
});

test('Escapes control characters from stdout', async t => {
	const {stderr} = await nestedSubprocess('noop.js', ['\u0001'], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   \\u0001`);
});

const testStdioSame = async (t, fdNumber) => {
	const {nestedResult: {stdio}} = await nestedSubprocess('noop-fd.js', [`${fdNumber}`, foobarString], {verbose: 'full'});
	t.is(stdio[fdNumber], foobarString);
};

test('Does not change subprocess.stdout', testStdioSame, 1);
test('Does not change subprocess.stderr', testStdioSame, 2);

const testSingleNewline = async (t, isSync) => {
	const {stderr} = await nestedSubprocess('noop-fd.js', ['1', '\n'], {verbose: 'full', isSync});
	t.deepEqual(getOutputLines(stderr), [`${testTimestamp} [0]   `]);
};

test('Prints stdout, single newline', testSingleNewline, false);
test('Prints stdout, single newline, sync', testSingleNewline, true);

const testUtf16 = async (t, isSync) => {
	const {stderr} = await nestedSubprocess('stdin.js', {
		verbose: 'full',
		input: foobarUtf16Uint8Array,
		encoding: 'utf16le',
		isSync,
	});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Can use encoding UTF16, verbose "full"', testUtf16, false);
test('Can use encoding UTF16, verbose "full", sync', testUtf16, true);
