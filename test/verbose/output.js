import {on} from 'node:events';
import {rm, readFile} from 'node:fs/promises';
import {inspect} from 'node:util';
import test from 'ava';
import tempfile from 'tempfile';
import {red} from 'yoctocolors';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString, foobarObject, foobarUppercase} from '../helpers/input.js';
import {simpleFull, noNewlinesChunks} from '../helpers/lines.js';
import {fullStdio} from '../helpers/stdio.js';
import {nestedExecaAsync, parentExeca, parentExecaAsync, parentExecaSync} from '../helpers/nested.js';
import {
	runErrorSubprocessAsync,
	runErrorSubprocessSync,
	getOutputLine,
	getOutputLines,
	testTimestamp,
	getVerboseOption,
} from '../helpers/verbose.js';

setFixtureDir();

const testPrintOutput = async (t, fdNumber, execaMethod) => {
	const {stderr} = await execaMethod('noop-fd.js', [`${fdNumber}`, foobarString], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, verbose "full"', testPrintOutput, 1, parentExecaAsync);
test('Prints stdout, verbose "full", sync', testPrintOutput, 1, parentExecaSync);
test('Prints stderr, verbose "full"', testPrintOutput, 2, parentExecaAsync);
test('Prints stderr, verbose "full", sync', testPrintOutput, 2, parentExecaSync);

const testNoPrintOutput = async (t, verbose, fdNumber, execaMethod) => {
	const {stderr} = await execaMethod('noop-fd.js', [`${fdNumber}`, foobarString], {verbose, ...fullStdio});
	t.is(getOutputLine(stderr), undefined);
};

test('Does not print stdout, verbose "none"', testNoPrintOutput, 'none', 1, parentExecaAsync);
test('Does not print stdout, verbose "short"', testNoPrintOutput, 'short', 1, parentExecaAsync);
test('Does not print stdout, verbose "none", sync', testNoPrintOutput, 'none', 1, parentExecaSync);
test('Does not print stdout, verbose "short", sync', testNoPrintOutput, 'short', 1, parentExecaSync);
test('Does not print stderr, verbose "none"', testNoPrintOutput, 'none', 2, parentExecaAsync);
test('Does not print stderr, verbose "short"', testNoPrintOutput, 'short', 2, parentExecaAsync);
test('Does not print stderr, verbose "none", sync', testNoPrintOutput, 'none', 2, parentExecaSync);
test('Does not print stderr, verbose "short", sync', testNoPrintOutput, 'short', 2, parentExecaSync);
test('Does not print stdio[*], verbose "none"', testNoPrintOutput, 'none', 3, parentExecaAsync);
test('Does not print stdio[*], verbose "short"', testNoPrintOutput, 'short', 3, parentExecaAsync);
test('Does not print stdio[*], verbose "full"', testNoPrintOutput, 'full', 3, parentExecaAsync);
test('Does not print stdio[*], verbose "none", sync', testNoPrintOutput, 'none', 3, parentExecaSync);
test('Does not print stdio[*], verbose "short", sync', testNoPrintOutput, 'short', 3, parentExecaSync);
test('Does not print stdio[*], verbose "full", sync', testNoPrintOutput, 'full', 3, parentExecaSync);

const testPrintError = async (t, execaMethod) => {
	const stderr = await execaMethod(t, 'full');
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout after errors', testPrintError, runErrorSubprocessAsync);
test('Prints stdout after errors, sync', testPrintError, runErrorSubprocessSync);

const testPipeOutput = async (t, fixtureName, sourceVerbose, destinationVerbose) => {
	const {stderr} = await execa(`nested-pipe-${fixtureName}.js`, [
		JSON.stringify(getVerboseOption(sourceVerbose, 'full')),
		'noop.js',
		foobarString,
		JSON.stringify(getVerboseOption(destinationVerbose, 'full')),
		'stdin.js',
	]);

	const lines = getOutputLines(stderr);
	const id = sourceVerbose && destinationVerbose ? 1 : 0;
	t.deepEqual(lines, destinationVerbose
		? [`${testTimestamp} [${id}]   ${foobarString}`]
		: []);
};

test('Prints stdout if both verbose with .pipe("file")', testPipeOutput, 'file', true, true);
test('Prints stdout if both verbose with .pipe`command`', testPipeOutput, 'script', true, true);
test('Prints stdout if both verbose with .pipe(subprocess)', testPipeOutput, 'subprocesses', true, true);
test('Prints stdout if only second verbose with .pipe("file")', testPipeOutput, 'file', false, true);
test('Prints stdout if only second verbose with .pipe`command`', testPipeOutput, 'script', false, true);
test('Prints stdout if only second verbose with .pipe(subprocess)', testPipeOutput, 'subprocesses', false, true);
test('Does not print stdout if only first verbose with .pipe("file")', testPipeOutput, 'file', true, false);
test('Does not print stdout if only first verbose with .pipe`command`', testPipeOutput, 'script', true, false);
test('Does not print stdout if only first verbose with .pipe(subprocess)', testPipeOutput, 'subprocesses', true, false);
test('Does not print stdout if neither verbose with .pipe("file")', testPipeOutput, 'file', false, false);
test('Does not print stdout if neither verbose with .pipe`command`', testPipeOutput, 'script', false, false);
test('Does not print stdout if neither verbose with .pipe(subprocess)', testPipeOutput, 'subprocesses', false, false);

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
	const {stdio} = await nestedExecaAsync('noop-fd.js', [`${fdNumber}`, foobarString], {verbose: true});
	t.is(stdio[fdNumber], foobarString);
};

test('Does not change subprocess.stdout', testStdioSame, 1);
test('Does not change subprocess.stderr', testStdioSame, 2);

const testLines = async (t, stripFinalNewline, execaMethod) => {
	const {stderr} = await execaMethod('noop-fd.js', ['1', simpleFull], {verbose: 'full', lines: true});
	t.deepEqual(getOutputLines(stderr), noNewlinesChunks.map(line => `${testTimestamp} [0]   ${line}`));
};

test('Prints stdout, "lines: true"', testLines, false, parentExecaAsync);
test('Prints stdout, "lines: true", stripFinalNewline', testLines, true, parentExecaAsync);
test('Prints stdout, "lines: true", sync', testLines, false, parentExecaSync);
test('Prints stdout, "lines: true", stripFinalNewline, sync', testLines, true, parentExecaSync);

const testOnlyTransforms = async (t, type, isSync) => {
	const {stderr} = await parentExeca('nested-transform.js', 'noop.js', [foobarString], {verbose: 'full', type, isSync});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString.toUpperCase()}`);
};

test('Prints stdout with only transforms', testOnlyTransforms, 'generator', false);
test('Prints stdout with only transforms, sync', testOnlyTransforms, 'generator', true);
test('Prints stdout with only duplexes', testOnlyTransforms, 'duplex', false);

const testObjectMode = async (t, isSync) => {
	const {stderr} = await parentExeca('nested-transform.js', 'noop.js', {verbose: 'full', transformName: 'object', isSync});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${inspect(foobarObject)}`);
};

test('Prints stdout with object transforms', testObjectMode, false);
test('Prints stdout with object transforms, sync', testObjectMode, true);

const testBigArray = async (t, isSync) => {
	const {stderr} = await parentExeca('nested-transform.js', 'noop.js', {verbose: 'full', transformName: 'bigArray', isSync});
	const lines = getOutputLines(stderr);
	t.is(lines[0], `${testTimestamp} [0]   [`);
	t.true(lines[1].startsWith(`${testTimestamp} [0]      0,  1,`));
	t.is(lines.at(-1), `${testTimestamp} [0]   ]`);
};

test('Prints stdout with big object transforms', testBigArray, false);
test('Prints stdout with big object transforms, sync', testBigArray, true);

const testObjectModeString = async (t, isSync) => {
	const {stderr} = await parentExeca('nested-transform.js', 'noop.js', {verbose: 'full', transformName: 'stringObject', isSync});
	t.deepEqual(getOutputLines(stderr), noNewlinesChunks.map(line => `${testTimestamp} [0]   ${line}`));
};

test('Prints stdout with string transforms in objectMode', testObjectModeString, false);
test('Prints stdout with string transforms in objectMode, sync', testObjectModeString, true);

test('Prints stdout one line at a time', async t => {
	const subprocess = parentExecaAsync('noop-progressive.js', [foobarString], {verbose: 'full'});

	for await (const chunk of on(subprocess.stderr, 'data')) {
		const outputLine = getOutputLine(chunk.toString().trim());
		if (outputLine !== undefined) {
			t.is(outputLine, `${testTimestamp} [0]   ${foobarString}`);
			break;
		}
	}

	await subprocess;
});

test.serial('Prints stdout progressively, interleaved', async t => {
	const subprocess = parentExeca('nested-double.js', 'noop-repeat.js', ['1', `${foobarString}\n`], {verbose: 'full'});

	let firstSubprocessPrinted = false;
	let secondSubprocessPrinted = false;
	for await (const chunk of on(subprocess.stderr, 'data')) {
		const outputLine = getOutputLine(chunk.toString().trim());
		if (outputLine === undefined) {
			continue;
		}

		if (outputLine.includes(foobarString)) {
			t.is(outputLine, `${testTimestamp} [0]   ${foobarString}`);
			firstSubprocessPrinted ||= true;
		} else {
			t.is(outputLine, `${testTimestamp} [1]   ${foobarString.toUpperCase()}`);
			secondSubprocessPrinted ||= true;
		}

		if (firstSubprocessPrinted && secondSubprocessPrinted) {
			break;
		}
	}

	subprocess.kill();
	await t.throwsAsync(subprocess);
});

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

const testNoOutputOptions = async (t, fixtureName, options = {}) => {
	const {stderr} = await parentExeca(fixtureName, 'noop.js', [foobarString], {verbose: 'full', ...options});
	t.is(getOutputLine(stderr), undefined);
};

test('Does not print stdout, encoding "buffer"', testNoOutputOptions, 'nested.js', {encoding: 'buffer'});
test('Does not print stdout, encoding "hex"', testNoOutputOptions, 'nested.js', {encoding: 'hex'});
test('Does not print stdout, encoding "base64"', testNoOutputOptions, 'nested.js', {encoding: 'base64'});
test('Does not print stdout, stdout "ignore"', testNoOutputOptions, 'nested.js', {stdout: 'ignore'});
test('Does not print stdout, stdout "inherit"', testNoOutputOptions, 'nested.js', {stdout: 'inherit'});
test('Does not print stdout, stdout 1', testNoOutputOptions, 'nested.js', {stdout: 1});
test('Does not print stdout, stdout Writable', testNoOutputOptions, 'nested-writable.js');
test('Does not print stdout, stdout WritableStream', testNoOutputOptions, 'nested-writable-web.js');
test('Does not print stdout, .pipe(stream)', testNoOutputOptions, 'nested-pipe-stream.js');
test('Does not print stdout, .pipe(subprocess)', testNoOutputOptions, 'nested-pipe-subprocess.js');
test('Does not print stdout, encoding "buffer", sync', testNoOutputOptions, 'nested-sync.js', {encoding: 'buffer'});
test('Does not print stdout, encoding "hex", sync', testNoOutputOptions, 'nested-sync.js', {encoding: 'hex'});
test('Does not print stdout, encoding "base64", sync', testNoOutputOptions, 'nested-sync.js', {encoding: 'base64'});
test('Does not print stdout, stdout "ignore", sync', testNoOutputOptions, 'nested-sync.js', {stdout: 'ignore'});
test('Does not print stdout, stdout "inherit", sync', testNoOutputOptions, 'nested-sync.js', {stdout: 'inherit'});
test('Does not print stdout, stdout 1, sync', testNoOutputOptions, 'nested-sync.js', {stdout: 1});

const testStdoutFile = async (t, fixtureName, getStdout) => {
	const file = tempfile();
	const {stderr} = await parentExeca(fixtureName, 'noop.js', [foobarString], {verbose: 'full', stdout: getStdout(file)});
	t.is(getOutputLine(stderr), undefined);
	const contents = await readFile(file, 'utf8');
	t.is(contents.trim(), foobarString);
	await rm(file);
};

test('Does not print stdout, stdout { file }', testStdoutFile, 'nested.js', file => ({file}));
test('Does not print stdout, stdout fileUrl', testStdoutFile, 'nested-file-url.js', file => file);
test('Does not print stdout, stdout { file }, sync', testStdoutFile, 'nested-sync.js', file => ({file}));

const testPrintOutputOptions = async (t, options, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose: 'full', ...options});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, stdout "pipe"', testPrintOutputOptions, {stdout: 'pipe'}, parentExecaAsync);
test('Prints stdout, stdout "overlapped"', testPrintOutputOptions, {stdout: 'overlapped'}, parentExecaAsync);
test('Prints stdout, stdout null', testPrintOutputOptions, {stdout: null}, parentExecaAsync);
test('Prints stdout, stdout ["pipe"]', testPrintOutputOptions, {stdout: ['pipe']}, parentExecaAsync);
test('Prints stdout, stdout "pipe", sync', testPrintOutputOptions, {stdout: 'pipe'}, parentExecaSync);
test('Prints stdout, stdout null, sync', testPrintOutputOptions, {stdout: null}, parentExecaSync);
test('Prints stdout, stdout ["pipe"], sync', testPrintOutputOptions, {stdout: ['pipe']}, parentExecaSync);

const testPrintOutputNoBuffer = async (t, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose: 'full', buffer: false});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, buffer: false', testPrintOutputNoBuffer, parentExecaAsync);
test('Prints stdout, buffer: false, sync', testPrintOutputNoBuffer, parentExecaSync);

const testPrintOutputNoBufferTransform = async (t, isSync) => {
	const {stderr} = await parentExeca('nested-transform.js', 'noop.js', [foobarString], {verbose: 'full', buffer: false, type: 'generator', isSync});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarUppercase}`);
};

test('Prints stdout, buffer: false, transform', testPrintOutputNoBufferTransform, false);
test('Prints stdout, buffer: false, transform, sync', testPrintOutputNoBufferTransform, true);

const testPrintOutputFixture = async (t, fixtureName, ...args) => {
	const {stderr} = await parentExeca(fixtureName, 'noop.js', [foobarString, ...args], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, .pipe(stream) + .unpipe()', testPrintOutputFixture, 'nested-pipe-stream.js', 'true');
test('Prints stdout, .pipe(subprocess) + .unpipe()', testPrintOutputFixture, 'nested-pipe-subprocess.js', 'true');

const testInterleaved = async (t, expectedLines, execaMethod) => {
	const {stderr} = await execaMethod('noop-132.js', {verbose: 'full'});
	t.deepEqual(getOutputLines(stderr), expectedLines.map(line => `${testTimestamp} [0]   ${line}`));
};

test('Prints stdout + stderr interleaved', testInterleaved, [1, 2, 3], parentExecaAsync);
test('Prints stdout + stderr not interleaved, sync', testInterleaved, [1, 3, 2], parentExecaSync);
