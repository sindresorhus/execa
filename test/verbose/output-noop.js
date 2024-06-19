import {rm, readFile} from 'node:fs/promises';
import test from 'ava';
import tempfile from 'tempfile';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {getOutputLine, testTimestamp} from '../helpers/verbose.js';

setFixtureDirectory();

const testNoOutputOptions = async (t, isSync, options) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose: 'full', isSync, ...options});
	t.is(getOutputLine(stderr), undefined);
};

test('Does not print stdout, encoding "buffer"', testNoOutputOptions, false, {encoding: 'buffer'});
test('Does not print stdout, encoding "hex"', testNoOutputOptions, false, {encoding: 'hex'});
test('Does not print stdout, encoding "base64"', testNoOutputOptions, false, {encoding: 'base64'});
test('Does not print stdout, stdout "ignore"', testNoOutputOptions, false, {stdout: 'ignore'});
test('Does not print stdout, stdout "inherit"', testNoOutputOptions, false, {stdout: 'inherit'});
test('Does not print stdout, stdout 1', testNoOutputOptions, false, {stdout: 1});
test('Does not print stdout, encoding "buffer", sync', testNoOutputOptions, true, {encoding: 'buffer'});
test('Does not print stdout, encoding "hex", sync', testNoOutputOptions, true, {encoding: 'hex'});
test('Does not print stdout, encoding "base64", sync', testNoOutputOptions, true, {encoding: 'base64'});
test('Does not print stdout, stdout "ignore", sync', testNoOutputOptions, true, {stdout: 'ignore'});
test('Does not print stdout, stdout "inherit", sync', testNoOutputOptions, true, {stdout: 'inherit'});
test('Does not print stdout, stdout 1, sync', testNoOutputOptions, true, {stdout: 1});

const testNoOutputDynamic = async (t, isSync, optionsFixture) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose: 'full', isSync, optionsFixture});
	t.is(getOutputLine(stderr), undefined);
};

test('Does not print stdout, stdout Writable', testNoOutputDynamic, false, 'writable.js');
test('Does not print stdout, stdout WritableStream', testNoOutputDynamic, false, 'writable-web.js');
test('Does not print stdout, stdout Writable, sync', testNoOutputDynamic, true, 'writable.js');
test('Does not print stdout, stdout WritableStream, sync', testNoOutputDynamic, true, 'writable-web.js');

const testNoOutputStream = async (t, parentFixture) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose: 'full', parentFixture});
	t.is(getOutputLine(stderr), undefined);
};

test('Does not print stdout, .pipe(stream)', testNoOutputStream, 'nested-pipe-stream.js');
test('Does not print stdout, .pipe(subprocess)', testNoOutputStream, 'nested-pipe-subprocess.js');

const testStdoutFile = async (t, isSync, optionsFixture) => {
	const file = tempfile();
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {
		verbose: 'full',
		stdout: {file},
		isSync,
		optionsFixture,
	});
	t.is(getOutputLine(stderr), undefined);
	const contents = await readFile(file, 'utf8');
	t.is(contents.trim(), foobarString);
	await rm(file);
};

test('Does not print stdout, stdout { file }', testStdoutFile, false);
test('Does not print stdout, stdout fileUrl', testStdoutFile, false, 'file-url.js');
test('Does not print stdout, stdout { file }, sync', testStdoutFile, true);
test('Does not print stdout, stdout fileUrl, sync', testStdoutFile, true, 'file-url.js');

const testPrintOutputOptions = async (t, options, isSync) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose: 'full', isSync, ...options});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, stdout "pipe"', testPrintOutputOptions, {stdout: 'pipe'}, false);
test('Prints stdout, stdout "overlapped"', testPrintOutputOptions, {stdout: 'overlapped'}, false);
test('Prints stdout, stdout null', testPrintOutputOptions, {stdout: null}, false);
test('Prints stdout, stdout ["pipe"]', testPrintOutputOptions, {stdout: ['pipe']}, false);
test('Prints stdout, stdout "pipe", sync', testPrintOutputOptions, {stdout: 'pipe'}, true);
test('Prints stdout, stdout null, sync', testPrintOutputOptions, {stdout: null}, true);
test('Prints stdout, stdout ["pipe"], sync', testPrintOutputOptions, {stdout: ['pipe']}, true);
