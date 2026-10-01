import assert from 'node:assert/strict';
import {readFile, writeFile, rm} from 'node:fs/promises';
import process from 'node:process';
import test from 'node:test';
import tempfile from 'tempfile';
import {assertThrows} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {noopReadable, noopWritable} from '../helpers/stream.js';

setFixtureDirectory();

const testInputOutput = (stdioOption, execaMethod) => {
	assertThrows(() => {
		execaMethod('empty.js', getStdio(3, [new ReadableStream(), stdioOption]));
	}, {message: /readable and writable/});
};

test('Cannot pass both readable and writable values to stdio[*] - WritableStream', () => testInputOutput(new WritableStream(), execa));
test('Cannot pass both readable and writable values to stdio[*] - 1', () => testInputOutput(1, execa));
test('Cannot pass both readable and writable values to stdio[*] - 2', () => testInputOutput(2, execa));
test('Cannot pass both readable and writable values to stdio[*] - process.stdout', () => testInputOutput(process.stdout, execa));
test('Cannot pass both readable and writable values to stdio[*] - process.stderr', () => testInputOutput(process.stderr, execa));
test('Cannot pass both readable and writable values to stdio[*] - WritableStream - sync', () => testInputOutput(new WritableStream(), execaSync));
test('Cannot pass both readable and writable values to stdio[*] - 1 - sync', () => testInputOutput(1, execaSync));
test('Cannot pass both readable and writable values to stdio[*] - 2 - sync', () => testInputOutput(2, execaSync));
test('Cannot pass both readable and writable values to stdio[*] - process.stdout - sync', () => testInputOutput(process.stdout, execaSync));
test('Cannot pass both readable and writable values to stdio[*] - process.stderr - sync', () => testInputOutput(process.stderr, execaSync));

const testAmbiguousDirection = async execaMethod => {
	const [filePathOne, filePathTwo] = [tempfile(), tempfile()];
	await execaMethod('noop-fd.js', ['3', foobarString], getStdio(3, [{file: filePathOne}, {file: filePathTwo}]));
	assert.deepEqual(
		await Promise.all([readFile(filePathOne, 'utf8'), readFile(filePathTwo, 'utf8')]),
		[foobarString, foobarString],
	);
	await Promise.all([rm(filePathOne), rm(filePathTwo)]);
};

test('stdio[*] default direction is output', () => testAmbiguousDirection(execa));
test('stdio[*] default direction is output - sync', () => testAmbiguousDirection(execaSync));

const testAmbiguousMultiple = async fdNumber => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const {stdout} = await execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [{file: filePath}, ['foo', 'bar']]));
	assert.equal(stdout, `${foobarString}${foobarString}`);
	await rm(filePath);
};

test('stdin ambiguous direction is influenced by other values', () => testAmbiguousMultiple(0));
test('stdio[*] ambiguous direction is influenced by other values', () => testAmbiguousMultiple(3));

const testDirectionInputPipe = async stdioOption => {
	const subprocess = execa('stdin-fd.js', ['3'], getStdio(3, stdioOption));
	subprocess.stdio[3].end(foobarString);
	const {stdout} = await subprocess;
	assert.equal(stdout, foobarString);
};

test('stdio[*] { value: "pipe", input: true } sets the direction to input', () => testDirectionInputPipe({value: 'pipe', input: true}));
test('stdio[*] { value: "overlapped", input: true } sets the direction to input', () => testDirectionInputPipe({value: 'overlapped', input: true}));

const uppercaseGenerator = function * (line) {
	yield line.toUpperCase();
};

test('stdio[*] { value: generator, input: true } sets the direction to input', async () => {
	const subprocess = execa('stdin-fd.js', ['3'], getStdio(3, {value: uppercaseGenerator, input: true}));
	subprocess.stdio[3].end(foobarString);
	const {stdout} = await subprocess;
	assert.equal(stdout, foobarString.toUpperCase());
});

test('stdio[*] { value: {file}, input: true } sets the direction to input', async () => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const {stdout} = await execa('stdin-fd.js', ['3'], getStdio(3, {value: {file: filePath}, input: true}));
	assert.equal(stdout, foobarString);
	await rm(filePath);
});

const testInputFixedDirection = (stdioOption, execaMethod) => {
	assertThrows(() => {
		execaMethod('empty.js', getStdio(3, {value: stdioOption, input: true}));
	}, {message: /cannot be used with a writable value/});
};

test('stdio[*] { value: WritableStream, input: true } is invalid', () => testInputFixedDirection(new WritableStream(), execa));
test('stdio[*] { value: WritableStream, input: true } is invalid - sync', () => testInputFixedDirection(new WritableStream(), execaSync));
test('stdio[*] { value: process.stdout, input: true } is invalid', () => testInputFixedDirection(process.stdout, execa));
test('stdio[*] { value: process.stdout, input: true } is invalid - sync', () => testInputFixedDirection(process.stdout, execaSync));

test('stdio[*] { value: "pipe", input: true } cannot be used in sync mode', () => {
	assertThrows(() => {
		execaSync('empty.js', getStdio(3, {value: 'pipe', input: true}));
	}, {message: /can be an input pipe with synchronous methods/});
});

test('stdio[*] { value: "pipe", input: true } cannot be used in sync mode with buffer false', () => {
	assertThrows(() => {
		execaSync('empty.js', {...getStdio(3, {value: 'pipe', input: true}), buffer: false});
	}, {message: /can be an input pipe with synchronous methods/});
});

const testDirectionOutputPipe = async (stdioOption, execaMethod) => {
	const {stdio} = await execaMethod('noop-fd.js', ['3', foobarString], getStdio(3, stdioOption));
	assert.equal(stdio[3], foobarString);
};

test('stdio[*] { value: "pipe" } keeps the default output direction', () => testDirectionOutputPipe({value: 'pipe'}, execa));
test('stdio[*] { value: "pipe" } keeps the default output direction - sync', () => testDirectionOutputPipe({value: 'pipe'}, execaSync));
test('stdio[*] { value: "pipe", input: false } keeps the default output direction', () => testDirectionOutputPipe({value: 'pipe', input: false}, execa));
test('stdio[*] { value: "pipe", input: false } keeps the default output direction - sync', () => testDirectionOutputPipe({value: 'pipe', input: false}, execaSync));

const testDirectionConflict = execaMethod => {
	assertThrows(() => {
		execaMethod('empty.js', getStdio(3, [{value: 'pipe', input: true}, 1]));
	}, {message: /readable and writable/});
};

test('Cannot pass { value: "pipe", input: true } with a writable value to stdio[*]', () => testDirectionConflict(execa));
test('Cannot pass { value: "pipe", input: true } with a writable value to stdio[*] - sync', () => testDirectionConflict(execaSync));

const testInputBoolean = execaMethod => {
	assertThrows(() => {
		execaMethod('empty.js', getStdio(3, {value: 'pipe', input: 'yes'}));
	}, {message: /`stdio\[3\]\.input` option must use a boolean/});
};

test('stdio[*].input must be a boolean', () => testInputBoolean(execa));
test('stdio[*].input must be a boolean - sync', () => testInputBoolean(execaSync));

test('stdout.input must be a boolean with buffer false - sync', () => {
	assertThrows(() => {
		execaSync('empty.js', {stdout: {value: 'pipe', input: 'yes'}, buffer: false});
	}, {message: /`stdout\.input` option must use a boolean/});
});

/*
`stdin`/`stdout`/`stderr` have a fixed direction, so values that are intrinsically the other direction
are invalid, like with additional file descriptors.
Otherwise, asynchronous methods pipe in the wrong direction and crash, e.g. with `dest.end is not a function`.
*/
const testFixedDirection = (options, expectedMessage, execaMethod) => {
	assertThrows(() => {
		execaMethod('empty.js', options);
	}, {message: expectedMessage});
};

const readableOutputMessage = /a readable value is always an input, but `std(?:out|err)` is an output/;

test('stdout cannot use a readable Node.js stream', () => testFixedDirection({stdout: [noopReadable(), 'pipe']}, readableOutputMessage, execa));
test('stdout cannot use a readable Node.js stream - sync', () => testFixedDirection({stdout: [noopReadable(), 'pipe']}, readableOutputMessage, execaSync));
test('stderr cannot use a readable Node.js stream', () => testFixedDirection({stderr: [noopReadable(), 'pipe']}, readableOutputMessage, execa));
test('stdout cannot use a readable web stream', () => testFixedDirection({stdout: new ReadableStream()}, readableOutputMessage, execa));
test('stdout cannot use a readable web stream - sync', () => testFixedDirection({stdout: new ReadableStream()}, readableOutputMessage, execaSync));
test('stdout { value: readable, input: true } is invalid', () => testFixedDirection({stdout: {value: noopReadable(), input: true}}, readableOutputMessage, execa));

test('stdin cannot use a writable Node.js stream', () => testFixedDirection({stdin: [noopWritable(), 'pipe']}, /a writable value is always an output/, execa));
test('stdin cannot use a writable Node.js stream - sync', () => testFixedDirection({stdin: [noopWritable(), 'pipe']}, /a writable value is always an output/, execaSync));
test('stdin cannot use a writable web stream', () => testFixedDirection({stdin: new WritableStream()}, /a writable value is always an output/, execa));
test('stdin cannot use a writable web stream - sync', () => testFixedDirection({stdin: new WritableStream()}, /a writable value is always an output/, execaSync));

test('stdout { value: writable, input: true } is invalid', () => testFixedDirection({stdout: {value: noopWritable(), input: true}}, /cannot be used with a writable value/, execa));
test('stdout { value: writable, input: true } is invalid - sync', () => testFixedDirection({stdout: {value: noopWritable(), input: true}}, /cannot be used with a writable value/, execaSync));
test('stdout { value: readable, input: true } is invalid - sync', () => testFixedDirection({stdout: {value: noopReadable(), input: true}}, readableOutputMessage, execaSync));
test('stderr cannot use a readable Node.js stream - sync', () => testFixedDirection({stderr: [noopReadable(), 'pipe']}, readableOutputMessage, execaSync));
test('stderr cannot use a readable web stream', () => testFixedDirection({stderr: new ReadableStream()}, readableOutputMessage, execa));
test('stderr cannot use a readable web stream - sync', () => testFixedDirection({stderr: new ReadableStream()}, readableOutputMessage, execaSync));
test('stderr { value: readable, input: true } is invalid', () => testFixedDirection({stderr: {value: noopReadable(), input: true}}, readableOutputMessage, execa));
test('stderr { value: readable, input: true } is invalid - sync', () => testFixedDirection({stderr: {value: noopReadable(), input: true}}, readableOutputMessage, execaSync));
test('stderr { value: web readable, input: true } is invalid', () => testFixedDirection({stderr: {value: new ReadableStream(), input: true}}, readableOutputMessage, execa));
test('stderr { value: web readable, input: true } is invalid - sync', () => testFixedDirection({stderr: {value: new ReadableStream(), input: true}}, readableOutputMessage, execaSync));

test('stdin { value: writable, input: true } is invalid', () => testFixedDirection({stdin: {value: noopWritable(), input: true}}, /cannot be used with a writable value/, execa));
test('stdin { value: writable, input: true } is invalid - sync', () => testFixedDirection({stdin: {value: noopWritable(), input: true}}, /cannot be used with a writable value/, execaSync));
test('stdin { value: writable web stream, input: true } is invalid', () => testFixedDirection({stdin: {value: new WritableStream(), input: true}}, /cannot be used with a writable value/, execa));
test('stdin { value: writable web stream, input: true } is invalid - sync', () => testFixedDirection({stdin: {value: new WritableStream(), input: true}}, /cannot be used with a writable value/, execaSync));

const writableStdinMessage = /a writable value is always an output/;

test('stdin cannot use a writable Node.js stream after another value', () => testFixedDirection({stdin: ['pipe', noopWritable()]}, writableStdinMessage, execa));
test('stdin cannot use a writable Node.js stream after another value - sync', () => testFixedDirection({stdin: ['pipe', noopWritable()]}, writableStdinMessage, execaSync));
test('stdin cannot use a writable web stream in an array', () => testFixedDirection({stdin: [new WritableStream(), 'pipe']}, writableStdinMessage, execa));
test('stdin cannot use a writable web stream in an array - sync', () => testFixedDirection({stdin: [new WritableStream(), 'pipe']}, writableStdinMessage, execaSync));
test('stdin cannot use both readable and writable values', () => testFixedDirection({stdin: [noopReadable(), noopWritable()]}, writableStdinMessage, execa));
test('stdin cannot use both readable and writable values - sync', () => testFixedDirection({stdin: [noopReadable(), noopWritable()]}, writableStdinMessage, execaSync));

test('stdout cannot use a readable Node.js stream after another value', () => testFixedDirection({stdout: ['pipe', noopReadable()]}, readableOutputMessage, execa));
test('stdout cannot use a readable Node.js stream after another value - sync', () => testFixedDirection({stdout: ['pipe', noopReadable()]}, readableOutputMessage, execaSync));
test('stdout cannot use a readable web stream in an array', () => testFixedDirection({stdout: [new ReadableStream(), 'pipe']}, readableOutputMessage, execa));
test('stdout cannot use a readable web stream in an array - sync', () => testFixedDirection({stdout: [new ReadableStream(), 'pipe']}, readableOutputMessage, execaSync));

// A single standard file descriptor or stream is passed as is to `child_process.spawn()`, which handles it, so its direction is not checked
const testSingleNativeOtherDirection = async (options, execaMethod) => {
	const {exitCode} = await execaMethod('empty.js', options);
	assert.equal(exitCode, 0);
};

test('stdin can be a single output file descriptor', () => testSingleNativeOtherDirection({stdin: 1}, execa));
test('stdin can be a single output file descriptor - sync', () => testSingleNativeOtherDirection({stdin: 1}, execaSync));
test('stdout can be a single input file descriptor', () => testSingleNativeOtherDirection({stdout: 0}, execa));
test('stdout can be a single input file descriptor - sync', () => testSingleNativeOtherDirection({stdout: 0}, execaSync));
test('stdout can be process.stdin', () => testSingleNativeOtherDirection({stdout: process.stdin}, execa));
