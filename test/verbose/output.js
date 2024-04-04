import {once, on} from 'node:events';
import {rm, readFile} from 'node:fs/promises';
import {inspect} from 'node:util';
import test from 'ava';
import tempfile from 'tempfile';
import {red} from 'yoctocolors';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString, foobarObject, foobarUppercase} from '../helpers/input.js';
import {fullStdio} from '../helpers/stdio.js';
import {
	nestedExeca,
	nestedExecaAsync,
	nestedExecaSync,
	runErrorSubprocess,
	getOutputLine,
	getOutputLines,
	testTimestamp,
	getVerboseOption,
} from '../helpers/verbose.js';

setFixtureDir();

const nestedExecaDouble = nestedExeca.bind(undefined, 'nested-double.js');

const testPrintOutput = async (t, fdNumber, execaMethod) => {
	const {stderr} = await execaMethod('noop-fd.js', [`${fdNumber}`, foobarString], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, verbose "full"', testPrintOutput, 1, nestedExecaAsync);
test('Prints stdout, verbose "full", sync', testPrintOutput, 1, nestedExecaSync);
test('Prints stderr, verbose "full"', testPrintOutput, 2, nestedExecaAsync);
test('Prints stderr, verbose "full", sync', testPrintOutput, 2, nestedExecaSync);

const testNoPrintOutput = async (t, verbose, fdNumber, execaMethod) => {
	const {stderr} = await execaMethod('noop-fd.js', [`${fdNumber}`, foobarString], {verbose, ...fullStdio});
	t.is(getOutputLine(stderr), undefined);
};

test('Does not print stdout, verbose "none"', testNoPrintOutput, 'none', 1, nestedExecaAsync);
test('Does not print stdout, verbose "short"', testNoPrintOutput, 'short', 1, nestedExecaAsync);
test('Does not print stdout, verbose "none", sync', testNoPrintOutput, 'none', 1, nestedExecaSync);
test('Does not print stdout, verbose "short", sync', testNoPrintOutput, 'short', 1, nestedExecaSync);
test('Does not print stderr, verbose "none"', testNoPrintOutput, 'none', 2, nestedExecaAsync);
test('Does not print stderr, verbose "short"', testNoPrintOutput, 'short', 2, nestedExecaAsync);
test('Does not print stderr, verbose "none", sync', testNoPrintOutput, 'none', 2, nestedExecaSync);
test('Does not print stderr, verbose "short", sync', testNoPrintOutput, 'short', 2, nestedExecaSync);
test('Does not print stdio[*], verbose "none"', testNoPrintOutput, 'none', 3, nestedExecaAsync);
test('Does not print stdio[*], verbose "short"', testNoPrintOutput, 'short', 3, nestedExecaAsync);
test('Does not print stdio[*], verbose "full"', testNoPrintOutput, 'full', 3, nestedExecaAsync);
test('Does not print stdio[*], verbose "none", sync', testNoPrintOutput, 'none', 3, nestedExecaSync);
test('Does not print stdio[*], verbose "short", sync', testNoPrintOutput, 'short', 3, nestedExecaSync);
test('Does not print stdio[*], verbose "full", sync', testNoPrintOutput, 'full', 3, nestedExecaSync);

const testPrintError = async (t, execaMethod) => {
	const stderr = await runErrorSubprocess(t, 'full', execaMethod);
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout after errors', testPrintError, nestedExecaAsync);
test('Prints stdout after errors, sync', testPrintError, nestedExecaSync);

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
	const {stderr} = await nestedExecaAsync('noop.js', ['foo bar'], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   foo bar`);
});

test('Does not quote special punctuation from stdout', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', ['%'], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   %`);
});

test('Does not escape internal characters from stdout', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', ['ã'], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ã`);
});

test('Strips color sequences from stdout', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', [red(foobarString)], {verbose: 'full'}, {env: {FORCE_COLOR: '1'}});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
});

test('Escapes control characters from stdout', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', ['\u0001'], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   \\u0001`);
});

const testStdioSame = async (t, fdNumber) => {
	const subprocess = execa('nested-send.js', [JSON.stringify({verbose: true}), 'noop-fd.js', `${fdNumber}`, foobarString], {ipc: true});
	const [[{stdio}]] = await Promise.all([once(subprocess, 'message'), subprocess]);
	t.is(stdio[fdNumber], foobarString);
};

test('Does not change stdout', testStdioSame, 1);
test('Does not change stderr', testStdioSame, 2);

const testOnlyTransforms = async (t, type) => {
	const {stderr} = await nestedExeca('nested-transform.js', 'noop.js', [foobarString], {verbose: 'full', type});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString.toUpperCase()}`);
};

test('Prints stdout with only transforms', testOnlyTransforms, 'generator');
test('Prints stdout with only duplexes', testOnlyTransforms, 'duplex');

test('Prints stdout with object transforms', async t => {
	const {stderr} = await nestedExeca('nested-object.js', 'noop.js', {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${inspect(foobarObject)}`);
});

test('Prints stdout with big object transforms', async t => {
	const {stderr} = await nestedExeca('nested-big-array.js', 'noop.js', {verbose: 'full'});
	const lines = getOutputLines(stderr);
	t.is(lines[0], `${testTimestamp} [0]   [`);
	t.true(lines[1].startsWith(`${testTimestamp} [0]      0,  1,`));
	t.is(lines.at(-1), `${testTimestamp} [0]   ]`);
});

test('Prints stdout one line at a time', async t => {
	const subprocess = nestedExecaAsync('noop-progressive.js', [foobarString], {verbose: 'full'});

	for await (const chunk of on(subprocess.stderr, 'data')) {
		const outputLine = getOutputLine(chunk.toString().trim());
		if (outputLine !== undefined) {
			t.is(outputLine, `${testTimestamp} [0]   ${foobarString}`);
			break;
		}
	}

	await subprocess;
});

test('Prints stdout progressively, interleaved', async t => {
	const subprocess = nestedExecaDouble('noop-repeat.js', ['1', `${foobarString}\n`], {verbose: 'full'});

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

test('Prints stdout, single newline', testSingleNewline, nestedExecaAsync);
test('Prints stdout, single newline, sync', testSingleNewline, nestedExecaSync);

test('Can use encoding UTF16, verbose "full"', async t => {
	const {stderr} = await nestedExeca('nested-input.js', 'stdin.js', {verbose: 'full', encoding: 'utf16le'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
});

const testNoOutputOptions = async (t, options, fixtureName = 'nested.js') => {
	const {stderr} = await nestedExeca(fixtureName, 'noop.js', [foobarString], {verbose: 'full', ...options});
	t.is(getOutputLine(stderr), undefined);
};

test('Does not print stdout, encoding "buffer"', testNoOutputOptions, {encoding: 'buffer'});
test('Does not print stdout, encoding "hex"', testNoOutputOptions, {encoding: 'hex'});
test('Does not print stdout, encoding "base64"', testNoOutputOptions, {encoding: 'base64'});
test('Does not print stdout, stdout "ignore"', testNoOutputOptions, {stdout: 'ignore'});
test('Does not print stdout, stdout "inherit"', testNoOutputOptions, {stdout: 'inherit'});
test('Does not print stdout, stdout 1', testNoOutputOptions, {stdout: 1});
test('Does not print stdout, stdout Writable', testNoOutputOptions, {}, 'nested-writable.js');
test('Does not print stdout, stdout WritableStream', testNoOutputOptions, {}, 'nested-writable-web.js');
test('Does not print stdout, .pipe(stream)', testNoOutputOptions, {}, 'nested-pipe-stream.js');
test('Does not print stdout, .pipe(subprocess)', testNoOutputOptions, {}, 'nested-pipe-subprocess.js');

const testStdoutFile = async (t, fixtureName, getStdout) => {
	const file = tempfile();
	const {stderr} = await nestedExeca(fixtureName, 'noop.js', [foobarString], {verbose: 'full', stdout: getStdout(file)});
	t.is(getOutputLine(stderr), undefined);
	const contents = await readFile(file, 'utf8');
	t.is(contents.trim(), foobarString);
	await rm(file);
};

test('Does not print stdout, stdout { file }', testStdoutFile, 'nested.js', file => ({file}));
test('Does not print stdout, stdout fileUrl', testStdoutFile, 'nested-file-url.js', file => file);

const testPrintOutputOptions = async (t, options, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose: 'full', ...options});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, stdout "pipe"', testPrintOutputOptions, {stdout: 'pipe'}, nestedExecaAsync);
test('Prints stdout, stdout "overlapped"', testPrintOutputOptions, {stdout: 'overlapped'}, nestedExecaAsync);
test('Prints stdout, stdout null', testPrintOutputOptions, {stdout: null}, nestedExecaAsync);
test('Prints stdout, stdout ["pipe"]', testPrintOutputOptions, {stdout: ['pipe']}, nestedExecaAsync);
test('Prints stdout, stdout "pipe", sync', testPrintOutputOptions, {stdout: 'pipe'}, nestedExecaSync);
test('Prints stdout, stdout null, sync', testPrintOutputOptions, {stdout: null}, nestedExecaSync);
test('Prints stdout, stdout ["pipe"], sync', testPrintOutputOptions, {stdout: ['pipe']}, nestedExecaSync);

const testPrintOutputNoBuffer = async (t, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose: 'full', buffer: false});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, buffer: false', testPrintOutputNoBuffer, nestedExecaAsync);
test('Prints stdout, buffer: false, sync', testPrintOutputNoBuffer, nestedExecaSync);

const testPrintOutputNoBufferTransform = async (t, isSync) => {
	const {stderr} = await nestedExeca('nested-transform.js', 'noop.js', [foobarString], {verbose: 'full', buffer: false, type: 'generator', isSync});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarUppercase}`);
};

test('Prints stdout, buffer: false, transform', testPrintOutputNoBufferTransform, false);
test('Prints stdout, buffer: false, transform, sync', testPrintOutputNoBufferTransform, true);

const testPrintOutputFixture = async (t, fixtureName, ...args) => {
	const {stderr} = await nestedExeca(fixtureName, 'noop.js', [foobarString, ...args], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, .pipe(stream) + .unpipe()', testPrintOutputFixture, 'nested-pipe-stream.js', 'true');
test('Prints stdout, .pipe(subprocess) + .unpipe()', testPrintOutputFixture, 'nested-pipe-subprocess.js', 'true');
