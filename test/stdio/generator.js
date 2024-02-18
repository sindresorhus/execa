import {readFile, writeFile, rm} from 'node:fs/promises';
import {PassThrough} from 'node:stream';
import test from 'ava';
import getStream, {getStreamAsArray} from 'get-stream';
import tempfile from 'tempfile';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarString, foobarUint8Array, foobarBuffer, foobarObject, foobarObjectString} from '../helpers/input.js';
import {serializeGenerator, outputObjectGenerator} from '../helpers/generator.js';

setFixtureDir();

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const foobarUppercase = foobarString.toUpperCase();
const foobarHex = foobarBuffer.toString('hex');

const uppercaseGenerator = function * (line) {
	yield line.toUpperCase();
};

const uppercaseBufferGenerator = function * (line) {
	yield textDecoder.decode(line).toUpperCase();
};

const getInputObjectMode = objectMode => objectMode
	? {input: [foobarObject], generator: serializeGenerator, output: foobarObjectString}
	: {input: foobarUint8Array, generator: uppercaseGenerator, output: foobarUppercase};

const getOutputObjectMode = objectMode => objectMode
	? {generator: outputObjectGenerator, output: [foobarObject], getStreamMethod: getStreamAsArray}
	: {generator: uppercaseGenerator, output: foobarUppercase, getStreamMethod: getStream};

const testGeneratorInput = async (t, index, objectMode) => {
	const {input, generator, output} = getInputObjectMode(objectMode);
	const {stdout} = await execa('stdin-fd.js', [`${index}`], getStdio(index, [input, generator]));
	t.is(stdout, output);
};

test('Can use generators with result.stdin', testGeneratorInput, 0, false);
test('Can use generators with result.stdio[*] as input', testGeneratorInput, 3, false);
test('Can use generators with result.stdin, objectMode', testGeneratorInput, 0, true);
test('Can use generators with result.stdio[*] as input, objectMode', testGeneratorInput, 3, true);

const testGeneratorInputPipe = async (t, useShortcutProperty, objectMode, input) => {
	const {generator, output} = getInputObjectMode(objectMode);
	const childProcess = execa('stdin-fd.js', ['0'], getStdio(0, generator));
	const stream = useShortcutProperty ? childProcess.stdin : childProcess.stdio[0];
	stream.end(...input);
	const {stdout} = await childProcess;
	t.is(stdout, output);
};

test('Can use generators with childProcess.stdio[0] and default encoding', testGeneratorInputPipe, false, false, [foobarString, 'utf8']);
test('Can use generators with childProcess.stdin and default encoding', testGeneratorInputPipe, true, false, [foobarString, 'utf8']);
test('Can use generators with childProcess.stdio[0] and encoding "buffer"', testGeneratorInputPipe, false, false, [foobarBuffer, 'buffer']);
test('Can use generators with childProcess.stdin and encoding "buffer"', testGeneratorInputPipe, true, false, [foobarBuffer, 'buffer']);
test('Can use generators with childProcess.stdio[0] and encoding "hex"', testGeneratorInputPipe, false, false, [foobarHex, 'hex']);
test('Can use generators with childProcess.stdin and encoding "hex"', testGeneratorInputPipe, true, false, [foobarHex, 'hex']);
test('Can use generators with childProcess.stdio[0], objectMode', testGeneratorInputPipe, false, true, [foobarObject]);
test('Can use generators with childProcess.stdin, objectMode', testGeneratorInputPipe, true, true, [foobarObject]);

const testGeneratorStdioInputPipe = async (t, objectMode) => {
	const {input, generator, output} = getInputObjectMode(objectMode);
	const childProcess = execa('stdin-fd.js', ['3'], getStdio(3, [new Uint8Array(), generator]));
	childProcess.stdio[3].write(Array.isArray(input) ? input[0] : input);
	const {stdout} = await childProcess;
	t.is(stdout, output);
};

test('Can use generators with childProcess.stdio[*] as input', testGeneratorStdioInputPipe, false);
test('Can use generators with childProcess.stdio[*] as input, objectMode', testGeneratorStdioInputPipe, true);

// eslint-disable-next-line max-params
const testGeneratorOutput = async (t, index, reject, useShortcutProperty, objectMode) => {
	const {generator, output} = getOutputObjectMode(objectMode);
	const fixtureName = reject ? 'noop-fd.js' : 'noop-fail.js';
	const {stdout, stderr, stdio} = await execa(fixtureName, [`${index}`, foobarString], {...getStdio(index, generator), reject});
	const result = useShortcutProperty ? [stdout, stderr][index - 1] : stdio[index];
	t.deepEqual(result, output);
};

test('Can use generators with result.stdio[1]', testGeneratorOutput, 1, true, false, false);
test('Can use generators with result.stdout', testGeneratorOutput, 1, true, true, false);
test('Can use generators with result.stdio[2]', testGeneratorOutput, 2, true, false, false);
test('Can use generators with result.stderr', testGeneratorOutput, 2, true, true, false);
test('Can use generators with result.stdio[*] as output', testGeneratorOutput, 3, true, false, false);
test('Can use generators with error.stdio[1]', testGeneratorOutput, 1, false, false, false);
test('Can use generators with error.stdout', testGeneratorOutput, 1, false, true, false);
test('Can use generators with error.stdio[2]', testGeneratorOutput, 2, false, false, false);
test('Can use generators with error.stderr', testGeneratorOutput, 2, false, true, false);
test('Can use generators with error.stdio[*] as output', testGeneratorOutput, 3, false, false, false);
test('Can use generators with result.stdio[1], objectMode', testGeneratorOutput, 1, true, false, true);
test('Can use generators with result.stdout, objectMode', testGeneratorOutput, 1, true, true, true);
test('Can use generators with result.stdio[2], objectMode', testGeneratorOutput, 2, true, false, true);
test('Can use generators with result.stderr, objectMode', testGeneratorOutput, 2, true, true, true);
test('Can use generators with result.stdio[*] as output, objectMode', testGeneratorOutput, 3, true, false, true);
test('Can use generators with error.stdio[1], objectMode', testGeneratorOutput, 1, false, false, true);
test('Can use generators with error.stdout, objectMode', testGeneratorOutput, 1, false, true, true);
test('Can use generators with error.stdio[2], objectMode', testGeneratorOutput, 2, false, false, true);
test('Can use generators with error.stderr, objectMode', testGeneratorOutput, 2, false, true, true);
test('Can use generators with error.stdio[*] as output, objectMode', testGeneratorOutput, 3, false, false, true);

const testGeneratorOutputPipe = async (t, index, useShortcutProperty, objectMode) => {
	const {generator, output, getStreamMethod} = getOutputObjectMode(objectMode);
	const childProcess = execa('noop-fd.js', [`${index}`, foobarString], {...getStdio(index, generator), buffer: false});
	const stream = useShortcutProperty ? [childProcess.stdout, childProcess.stderr][index - 1] : childProcess.stdio[index];
	const [result] = await Promise.all([getStreamMethod(stream), childProcess]);
	t.deepEqual(result, output);
};

test('Can use generators with childProcess.stdio[1]', testGeneratorOutputPipe, 1, false, false);
test('Can use generators with childProcess.stdout', testGeneratorOutputPipe, 1, true, false);
test('Can use generators with childProcess.stdio[2]', testGeneratorOutputPipe, 2, false, false);
test('Can use generators with childProcess.stderr', testGeneratorOutputPipe, 2, true, false);
test('Can use generators with childProcess.stdio[*] as output', testGeneratorOutputPipe, 3, false, false);
test('Can use generators with childProcess.stdio[1], objectMode', testGeneratorOutputPipe, 1, false, true);
test('Can use generators with childProcess.stdout, objectMode', testGeneratorOutputPipe, 1, true, true);
test('Can use generators with childProcess.stdio[2], objectMode', testGeneratorOutputPipe, 2, false, true);
test('Can use generators with childProcess.stderr, objectMode', testGeneratorOutputPipe, 2, true, true);
test('Can use generators with childProcess.stdio[*] as output, objectMode', testGeneratorOutputPipe, 3, false, true);

const getAllStdioOption = (stdioOption, encoding, objectMode) => {
	if (stdioOption) {
		return 'pipe';
	}

	if (objectMode) {
		return outputObjectGenerator;
	}

	return encoding === 'buffer' ? uppercaseBufferGenerator : uppercaseGenerator;
};

const getStdoutStderrOutput = (output, stdioOption, encoding, objectMode) => {
	if (objectMode && !stdioOption) {
		return [foobarObject];
	}

	const stdioOutput = stdioOption ? output : output.toUpperCase();
	return encoding === 'buffer' ? textEncoder.encode(stdioOutput) : stdioOutput;
};

const getAllOutput = (stdoutOutput, stderrOutput, encoding, objectMode) => {
	if (objectMode) {
		return [stdoutOutput, stderrOutput].flat();
	}

	return encoding === 'buffer'
		? new Uint8Array([...stdoutOutput, ...stderrOutput])
		: `${stdoutOutput}${stderrOutput}`;
};

// eslint-disable-next-line max-params
const testGeneratorAll = async (t, reject, encoding, objectMode, stdoutOption, stderrOption) => {
	const fixtureName = reject ? 'all.js' : 'all-fail.js';
	const {stdout, stderr, all} = await execa(fixtureName, {
		all: true,
		reject,
		stdout: getAllStdioOption(stdoutOption, encoding, objectMode),
		stderr: getAllStdioOption(stderrOption, encoding, objectMode),
		encoding,
		stripFinalNewline: false,
	});

	const stdoutOutput = getStdoutStderrOutput('stdout\n', stdoutOption, encoding, objectMode);
	t.deepEqual(stdout, stdoutOutput);
	const stderrOutput = getStdoutStderrOutput('stderr\n', stderrOption, encoding, objectMode);
	t.deepEqual(stderr, stderrOutput);
	const allOutput = getAllOutput(stdoutOutput, stderrOutput, encoding, objectMode);
	t.deepEqual(all, allOutput);
};

test('Can use generators with result.all = transform + transform', testGeneratorAll, true, 'utf8', false, false, false);
test('Can use generators with error.all = transform + transform', testGeneratorAll, false, 'utf8', false, false, false);
test('Can use generators with result.all = transform + transform, encoding "buffer"', testGeneratorAll, true, 'buffer', false, false, false);
test('Can use generators with error.all = transform + transform, encoding "buffer"', testGeneratorAll, false, 'buffer', false, false, false);
test('Can use generators with result.all = transform + pipe', testGeneratorAll, true, 'utf8', false, false, true);
test('Can use generators with error.all = transform + pipe', testGeneratorAll, false, 'utf8', false, false, true);
test('Can use generators with result.all = transform + pipe, encoding "buffer"', testGeneratorAll, true, 'buffer', false, false, true);
test('Can use generators with error.all = transform + pipe, encoding "buffer"', testGeneratorAll, false, 'buffer', false, false, true);
test('Can use generators with result.all = pipe + transform', testGeneratorAll, true, 'utf8', false, true, false);
test('Can use generators with error.all = pipe + transform', testGeneratorAll, false, 'utf8', false, true, false);
test('Can use generators with result.all = pipe + transform, encoding "buffer"', testGeneratorAll, true, 'buffer', false, true, false);
test('Can use generators with error.all = pipe + transform, encoding "buffer"', testGeneratorAll, false, 'buffer', false, true, false);
test('Can use generators with result.all = transform + transform, objectMode', testGeneratorAll, true, 'utf8', true, false, false);
test('Can use generators with error.all = transform + transform, objectMode', testGeneratorAll, false, 'utf8', true, false, false);
test('Can use generators with result.all = transform + transform, objectMode, encoding "buffer"', testGeneratorAll, true, 'buffer', true, false, false);
test('Can use generators with error.all = transform + transform, objectMode, encoding "buffer"', testGeneratorAll, false, 'buffer', true, false, false);
test('Can use generators with result.all = transform + pipe, objectMode', testGeneratorAll, true, 'utf8', true, false, true);
test('Can use generators with error.all = transform + pipe, objectMode', testGeneratorAll, false, 'utf8', true, false, true);
test('Can use generators with result.all = transform + pipe, objectMode, encoding "buffer"', testGeneratorAll, true, 'buffer', true, false, true);
test('Can use generators with error.all = transform + pipe, objectMode, encoding "buffer"', testGeneratorAll, false, 'buffer', true, false, true);
test('Can use generators with result.all = pipe + transform, objectMode', testGeneratorAll, true, 'utf8', true, true, false);
test('Can use generators with error.all = pipe + transform, objectMode', testGeneratorAll, false, 'utf8', true, true, false);
test('Can use generators with result.all = pipe + transform, objectMode, encoding "buffer"', testGeneratorAll, true, 'buffer', true, true, false);
test('Can use generators with error.all = pipe + transform, objectMode, encoding "buffer"', testGeneratorAll, false, 'buffer', true, true, false);

test('Can use generators with input option', async t => {
	const {stdout} = await execa('stdin-fd.js', ['0'], {stdin: uppercaseGenerator, input: foobarUint8Array});
	t.is(stdout, foobarUppercase);
});

const testInputFile = async (t, getOptions, reversed) => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const {stdin, ...options} = getOptions(filePath);
	const reversedStdin = reversed ? stdin.reverse() : stdin;
	const {stdout} = await execa('stdin-fd.js', ['0'], {...options, stdin: reversedStdin});
	t.is(stdout, foobarUppercase);
	await rm(filePath);
};

test('Can use generators with a file as input', testInputFile, filePath => ({stdin: [{file: filePath}, uppercaseGenerator]}), false);
test('Can use generators with a file as input, reversed', testInputFile, filePath => ({stdin: [{file: filePath}, uppercaseGenerator]}), true);
test('Can use generators with inputFile option', testInputFile, filePath => ({inputFile: filePath, stdin: uppercaseGenerator}), false);

const testOutputFile = async (t, reversed) => {
	const filePath = tempfile();
	const stdoutOption = [uppercaseGenerator, {file: filePath}];
	const reversedStdoutOption = reversed ? stdoutOption.reverse() : stdoutOption;
	const {stdout} = await execa('noop-fd.js', ['1'], {stdout: reversedStdoutOption});
	t.is(stdout, foobarUppercase);
	t.is(await readFile(filePath, 'utf8'), foobarUppercase);
	await rm(filePath);
};

test('Can use generators with a file as output', testOutputFile, false);
test('Can use generators with a file as output, reversed', testOutputFile, true);

test('Can use generators to a Writable stream', async t => {
	const passThrough = new PassThrough();
	const [{stdout}, streamOutput] = await Promise.all([
		execa('noop-fd.js', ['1', foobarString], {stdout: [uppercaseGenerator, passThrough]}),
		getStream(passThrough),
	]);
	t.is(stdout, foobarUppercase);
	t.is(streamOutput, foobarUppercase);
});

test('Can use generators from a Readable stream', async t => {
	const passThrough = new PassThrough();
	const childProcess = execa('stdin-fd.js', ['0'], {stdin: [passThrough, uppercaseGenerator]});
	passThrough.end(foobarString);
	const {stdout} = await childProcess;
	t.is(stdout, foobarUppercase);
});

test('Can use generators with "inherit"', async t => {
	const {stdout} = await execa('nested-inherit.js');
	t.is(stdout, foobarUppercase);
});

const casedSuffix = 'k';

const appendGenerator = function * (line) {
	yield `${line}${casedSuffix}`;
};

const testAppendInput = async (t, reversed) => {
	const stdin = [foobarUint8Array, uppercaseGenerator, appendGenerator];
	const reversedStdin = reversed ? stdin.reverse() : stdin;
	const {stdout} = await execa('stdin-fd.js', ['0'], {stdin: reversedStdin});
	const reversedSuffix = reversed ? casedSuffix.toUpperCase() : casedSuffix;
	t.is(stdout, `${foobarUppercase}${reversedSuffix}`);
};

test('Can use multiple generators as input', testAppendInput, false);
test('Can use multiple generators as input, reversed', testAppendInput, true);

const testAppendOutput = async (t, reversed) => {
	const stdoutOption = [uppercaseGenerator, appendGenerator];
	const reversedStdoutOption = reversed ? stdoutOption.reverse() : stdoutOption;
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: reversedStdoutOption});
	const reversedSuffix = reversed ? casedSuffix.toUpperCase() : casedSuffix;
	t.is(stdout, `${foobarUppercase}${reversedSuffix}`);
};

test('Can use multiple generators as output', testAppendOutput, false);
test('Can use multiple generators as output, reversed', testAppendOutput, true);

test('Can use multiple identical generators', async t => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: [appendGenerator, appendGenerator]});
	t.is(stdout, `${foobarString}${casedSuffix}${casedSuffix}`);
});
