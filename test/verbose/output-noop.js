import {rm, readFile} from 'node:fs/promises';
import test from 'ava';
import tempfile from 'tempfile';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';
import {parentExeca, parentExecaAsync, parentExecaSync} from '../helpers/nested.js';
import {getOutputLine, testTimestamp} from '../helpers/verbose.js';

setFixtureDir();

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
