import {fileURLToPath} from 'node:url';
import process from 'node:process';
import test from 'ava';
import {execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {noopReadable, noopWritable} from '../helpers/stream.js';

setFixtureDir();

const getArrayMessage = singleValueName => `The \`${singleValueName}\` option cannot be set as an array`;
const getInputMessage = (singleValueName, inputName) => `The \`${singleValueName}\` and the \`${inputName}\` options cannot be both set`;
const getFd3InputMessage = type => `not \`stdio[3]\`, can be ${type}`;

const inputOptions = {input: ''};
const inputFileOptions = {inputFile: fileURLToPath(import.meta.url)};

// eslint-disable-next-line max-params
const testInvalidStdioArraySync = (t, fdNumber, stdioOption, options, expectedMessage) => {
	const {message} = t.throws(() => {
		execaSync('empty.js', {...getStdio(fdNumber, stdioOption), ...options});
	});
	t.true(message.includes(expectedMessage));
};

test('Cannot use ["inherit", "pipe"] with stdin, sync', testInvalidStdioArraySync, 0, ['inherit', 'pipe'], {}, getArrayMessage('stdin: "inherit"'));
test('Cannot use [0, "pipe"] with stdin, sync', testInvalidStdioArraySync, 0, [0, 'pipe'], {}, getArrayMessage('stdin: 0'));
test('Cannot use [process.stdin, "pipe"] with stdin, sync', testInvalidStdioArraySync, 0, [process.stdin, 'pipe'], {}, getArrayMessage('stdin: Stream'));
test('Cannot use [Readable, "pipe"] with stdin, sync', testInvalidStdioArraySync, 0, [noopReadable(), 'pipe'], {}, getArrayMessage('stdin: Stream'));
test('Cannot use "inherit" + "input" with stdin, sync', testInvalidStdioArraySync, 0, 'inherit', inputOptions, getInputMessage('stdin: "inherit"', 'input'));
test('Cannot use 0 + "input" with stdin, sync', testInvalidStdioArraySync, 0, 0, inputOptions, getInputMessage('stdin: 0', 'input'));
test('Cannot use process.stdin + "input" with stdin, sync', testInvalidStdioArraySync, 0, process.stdin, inputOptions, getInputMessage('stdin: Stream', 'input'));
test('Cannot use Readable + "input" with stdin, sync', testInvalidStdioArraySync, 0, noopReadable(), inputOptions, getInputMessage('stdin: Stream', 'input'));
test('Cannot use "inherit" + "inputFile" with stdin, sync', testInvalidStdioArraySync, 0, 'inherit', inputFileOptions, getInputMessage('stdin: "inherit"', 'inputFile'));
test('Cannot use 0 + "inputFile" with stdin, sync', testInvalidStdioArraySync, 0, 0, inputFileOptions, getInputMessage('stdin: 0', 'inputFile'));
test('Cannot use process.stdin + "inputFile" with stdin, sync', testInvalidStdioArraySync, 0, process.stdin, inputFileOptions, getInputMessage('stdin: Stream', 'inputFile'));
test('Cannot use Readable + "inputFile" with stdin, sync', testInvalidStdioArraySync, 0, noopReadable(), inputFileOptions, getInputMessage('stdin: Stream', 'inputFile'));
test('Cannot use ["inherit", "pipe"] with stdout, sync', testInvalidStdioArraySync, 1, ['inherit', 'pipe'], {}, getArrayMessage('stdout: "inherit"'));
test('Cannot use [1, "pipe"] with stdout, sync', testInvalidStdioArraySync, 1, [1, 'pipe'], {}, getArrayMessage('stdout: 1'));
test('Cannot use [process.stdout, "pipe"] with stdout, sync', testInvalidStdioArraySync, 1, [process.stdout, 'pipe'], {}, getArrayMessage('stdout: Stream'));
test('Cannot use [Writable, "pipe"] with stdout, sync', testInvalidStdioArraySync, 1, [noopWritable(), 'pipe'], {}, getArrayMessage('stdout: Stream'));
test('Cannot use ["inherit", "pipe"] with stderr, sync', testInvalidStdioArraySync, 2, ['inherit', 'pipe'], {}, getArrayMessage('stderr: "inherit"'));
test('Cannot use [2, "pipe"] with stderr, sync', testInvalidStdioArraySync, 2, [2, 'pipe'], {}, getArrayMessage('stderr: 2'));
test('Cannot use [process.stderr, "pipe"] with stderr, sync', testInvalidStdioArraySync, 2, [process.stderr, 'pipe'], {}, getArrayMessage('stderr: Stream'));
test('Cannot use [Writable, "pipe"] with stderr, sync', testInvalidStdioArraySync, 2, [noopWritable(), 'pipe'], {}, getArrayMessage('stderr: Stream'));
test('Cannot use ["inherit", "pipe"] with stdio[*], sync', testInvalidStdioArraySync, 3, ['inherit', 'pipe'], {}, getArrayMessage('stdio[3]: "inherit"'));
test('Cannot use [3, "pipe"] with stdio[*], sync', testInvalidStdioArraySync, 3, [3, 'pipe'], {}, getArrayMessage('stdio[3]: 3'));
test('Cannot use [Writable, "pipe"] with stdio[*], sync', testInvalidStdioArraySync, 3, [noopWritable(), 'pipe'], {}, getArrayMessage('stdio[3]: Stream'));

const testFd3InputSync = (t, stdioOption, expectedMessage) => {
	const {message} = t.throws(() => {
		execaSync('empty.js', getStdio(3, stdioOption));
	});
	t.true(message.includes(expectedMessage));
};

test('Cannot use Uint8Array with stdio[*], sync', testFd3InputSync, new Uint8Array(), getFd3InputMessage('a Uint8Array'));
