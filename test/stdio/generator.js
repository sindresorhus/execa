import {Buffer} from 'node:buffer';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {getDefaultHighWaterMark, PassThrough} from 'node:stream';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import getStream from 'get-stream';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';

setFixtureDir();

const foobarString = 'foobar';
const foobarUppercase = foobarString.toUpperCase();
const foobarBuffer = Buffer.from(foobarString);
const foobarUint8Array = new TextEncoder().encode(foobarString);

const uppercaseGenerator = async function * (lines) {
	for await (const line of lines) {
		yield line.toUpperCase();
	}
};

const testGeneratorInput = async (t, index) => {
	const {stdout} = await execa('stdin-fd.js', [`${index}`], getStdio(index, [foobarUint8Array, uppercaseGenerator]));
	t.is(stdout, foobarUppercase);
};

test('Can use generators with result.stdin', testGeneratorInput, 0);
test('Can use generators with result.stdio[*] as input', testGeneratorInput, 3);

const testGeneratorInputPipe = async (t, index, useShortcutProperty, encoding) => {
	const childProcess = execa('stdin-fd.js', [`${index}`], getStdio(index, uppercaseGenerator));
	const stream = useShortcutProperty ? childProcess.stdin : childProcess.stdio[index];
	stream.end(encoding === 'buffer' ? foobarBuffer : foobarBuffer.toString(encoding), encoding);
	const {stdout} = await childProcess;
	t.is(stdout, foobarUppercase);
};

test('Can use generators with childProcess.stdio[0] and default encoding', testGeneratorInputPipe, 0, false, 'utf8');
test('Can use generators with childProcess.stdin and default encoding', testGeneratorInputPipe, 0, true, 'utf8');
test('Can use generators with childProcess.stdio[0] and encoding "buffer"', testGeneratorInputPipe, 0, false, 'buffer');
test('Can use generators with childProcess.stdin and encoding "buffer"', testGeneratorInputPipe, 0, true, 'buffer');
test('Can use generators with childProcess.stdio[0] and encoding "hex"', testGeneratorInputPipe, 0, false, 'hex');
test('Can use generators with childProcess.stdin and encoding "hex"', testGeneratorInputPipe, 0, true, 'hex');

test('Can use generators with childProcess.stdio[*] as input', async t => {
	const childProcess = execa('stdin-fd.js', ['3'], getStdio(3, [new Uint8Array(), uppercaseGenerator]));
	childProcess.stdio[3].write(foobarUint8Array);
	const {stdout} = await childProcess;
	t.is(stdout, foobarUppercase);
});

const testGeneratorOutput = async (t, index, reject, useShortcutProperty) => {
	const fixtureName = reject ? 'noop-fd.js' : 'noop-fail.js';
	const {stdout, stderr, stdio} = await execa(fixtureName, [`${index}`, foobarString], {...getStdio(index, uppercaseGenerator), reject});
	const result = useShortcutProperty ? [stdout, stderr][index - 1] : stdio[index];
	t.is(result, foobarUppercase);
};

test('Can use generators with result.stdio[1]', testGeneratorOutput, 1, true, false);
test('Can use generators with result.stdout', testGeneratorOutput, 1, true, true);
test('Can use generators with result.stdio[2]', testGeneratorOutput, 2, true, false);
test('Can use generators with result.stderr', testGeneratorOutput, 2, true, true);
test('Can use generators with result.stdio[*] as output', testGeneratorOutput, 3, true, false);
test('Can use generators with error.stdio[1]', testGeneratorOutput, 1, false, false);
test('Can use generators with error.stdout', testGeneratorOutput, 1, false, true);
test('Can use generators with error.stdio[2]', testGeneratorOutput, 2, false, false);
test('Can use generators with error.stderr', testGeneratorOutput, 2, false, true);
test('Can use generators with error.stdio[*] as output', testGeneratorOutput, 3, false, false);

const testGeneratorOutputPipe = async (t, index, useShortcutProperty) => {
	const childProcess = execa('noop-fd.js', [`${index}`, foobarString], {...getStdio(index, uppercaseGenerator), buffer: false});
	const stream = useShortcutProperty ? [childProcess.stdout, childProcess.stderr][index - 1] : childProcess.stdio[index];
	const [result] = await Promise.all([getStream(stream), childProcess]);
	t.is(result, foobarUppercase);
};

test('Can use generators with childProcess.stdio[1]', testGeneratorOutputPipe, 1, false);
test('Can use generators with childProcess.stdout', testGeneratorOutputPipe, 1, true);
test('Can use generators with childProcess.stdio[2]', testGeneratorOutputPipe, 2, false);
test('Can use generators with childProcess.stderr', testGeneratorOutputPipe, 2, true);
test('Can use generators with childProcess.stdio[*] as output', testGeneratorOutputPipe, 3, false);

const testGeneratorAll = async (t, reject) => {
	const fixtureName = reject ? 'all.js' : 'all-fail.js';
	const {all} = await execa(fixtureName, {all: true, reject, stdout: uppercaseGenerator, stderr: uppercaseGenerator});
	t.is(all, 'STDOUT\nSTDERR');
};

test('Can use generators with result.all', testGeneratorAll, true);
test('Can use generators with error.all', testGeneratorAll, false);

test('Can use generators with input option', async t => {
	const {stdout} = await execa('stdin-fd.js', ['0'], {stdin: uppercaseGenerator, input: foobarUint8Array});
	t.is(stdout, foobarUppercase);
});

const syncGenerator = function * () {};

const testInvalidGenerator = (t, index, stdioOption) => {
	t.throws(() => {
		execa('empty.js', getStdio(index, stdioOption));
	}, {message: /asynchronous generator/});
};

test('Cannot use sync generators with stdin', testInvalidGenerator, 0, syncGenerator);
test('Cannot use sync generators with stdout', testInvalidGenerator, 1, syncGenerator);
test('Cannot use sync generators with stderr', testInvalidGenerator, 2, syncGenerator);
test('Cannot use sync generators with stdio[*]', testInvalidGenerator, 3, syncGenerator);
test('Cannot use sync generators with stdin, with options', testInvalidGenerator, 0, {transform: syncGenerator});
test('Cannot use sync generators with stdout, with options', testInvalidGenerator, 1, {transform: syncGenerator});
test('Cannot use sync generators with stderr, with options', testInvalidGenerator, 2, {transform: syncGenerator});
test('Cannot use sync generators with stdio[*], with options', testInvalidGenerator, 3, {transform: syncGenerator});
test('Cannot use invalid "transform" with stdin', testInvalidGenerator, 0, {transform: true});
test('Cannot use invalid "transform" with stdout', testInvalidGenerator, 1, {transform: true});
test('Cannot use invalid "transform" with stderr', testInvalidGenerator, 2, {transform: true});
test('Cannot use invalid "transform" with stdio[*]', testInvalidGenerator, 3, {transform: true});

const testInvalidBinary = (t, index) => {
	t.throws(() => {
		execa('empty.js', getStdio(index, {transform: uppercaseGenerator, binary: 'true'}));
	}, {message: /a boolean/});
};

test('Cannot use invalid "binary" with stdin', testInvalidBinary, 0);
test('Cannot use invalid "binary" with stdout', testInvalidBinary, 1);
test('Cannot use invalid "binary" with stderr', testInvalidBinary, 2);
test('Cannot use invalid "binary" with stdio[*]', testInvalidBinary, 3);

const testSyncMethods = (t, index) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(index, uppercaseGenerator));
	}, {message: /cannot be a generator/});
};

test('Cannot use generators with sync methods and stdin', testSyncMethods, 0);
test('Cannot use generators with sync methods and stdout', testSyncMethods, 1);
test('Cannot use generators with sync methods and stderr', testSyncMethods, 2);
test('Cannot use generators with sync methods and stdio[*]', testSyncMethods, 3);

const repeatHighWaterMark = 10;

const writerGenerator = async function * (lines) {
	// eslint-disable-next-line no-unused-vars
	for await (const line of lines) {
		for (let index = 0; index < getDefaultHighWaterMark() * repeatHighWaterMark; index += 1) {
			yield '\n';
		}
	}
};

const passThroughGenerator = async function * (chunks) {
	yield * chunks;
};

const getLengthGenerator = async function * (chunks) {
	for await (const chunk of chunks) {
		yield `${chunk.length}`;
	}
};

const testHighWaterMark = async (t, passThrough) => {
	const index = 1;
	const {stdout} = await execa('noop-fd.js', [`${index}`], getStdio(index, [
		writerGenerator,
		...passThrough,
		{transform: getLengthGenerator, binary: true},
	]));
	t.is(stdout, `${getDefaultHighWaterMark()}`.repeat(repeatHighWaterMark));
};

test('Stream respects highWaterMark, no passThrough', testHighWaterMark, []);
test('Stream respects highWaterMark, line-wise passThrough', testHighWaterMark, [passThroughGenerator]);
test('Stream respects highWaterMark, binary passThrough', testHighWaterMark, [{transform: passThroughGenerator, binary: true}]);

const typeofGenerator = async function * (lines) {
	for await (const line of lines) {
		yield Object.prototype.toString.call(line);
	}
};

const testGeneratorFirstEncoding = async (t, input, encoding) => {
	const childProcess = execa('stdin.js', {stdin: typeofGenerator, encoding});
	childProcess.stdin.end(input);
	const {stdout} = await childProcess;
	const output = Buffer.from(stdout, encoding).toString();
	t.is(output, encoding === 'buffer' ? '[object Uint8Array]' : '[object String]');
};

test('First generator argument is string with default encoding, with string writes', testGeneratorFirstEncoding, foobarString, 'utf8');
test('First generator argument is string with default encoding, with Buffer writes', testGeneratorFirstEncoding, foobarBuffer, 'utf8');
test('First generator argument is string with default encoding, with Uint8Array writes', testGeneratorFirstEncoding, foobarUint8Array, 'utf8');
test('First generator argument is Uint8Array with encoding "buffer", with string writes', testGeneratorFirstEncoding, foobarString, 'buffer');
test('First generator argument is Uint8Array with encoding "buffer", with Buffer writes', testGeneratorFirstEncoding, foobarBuffer, 'buffer');
test('First generator argument is Uint8Array with encoding "buffer", with Uint8Array writes', testGeneratorFirstEncoding, foobarUint8Array, 'buffer');
test('First generator argument is Uint8Array with encoding "hex", with string writes', testGeneratorFirstEncoding, foobarString, 'hex');
test('First generator argument is Uint8Array with encoding "hex", with Buffer writes', testGeneratorFirstEncoding, foobarBuffer, 'hex');
test('First generator argument is Uint8Array with encoding "hex", with Uint8Array writes', testGeneratorFirstEncoding, foobarUint8Array, 'hex');

const outputGenerator = async function * (input, lines) {
	// eslint-disable-next-line no-unused-vars
	for await (const line of lines) {
		yield input;
	}
};

const testGeneratorNextEncoding = async (t, input, encoding) => {
	const {stdout} = await execa('noop.js', ['other'], {stdout: [outputGenerator.bind(undefined, input), typeofGenerator], encoding});
	const output = Buffer.from(stdout, encoding).toString();
	t.is(output, encoding === 'buffer' ? '[object Uint8Array]' : '[object String]');
};

test('Next generator argument is string with default encoding, with string writes', testGeneratorNextEncoding, foobarString, 'utf8');
test('Next generator argument is string with default encoding, with Buffer writes', testGeneratorNextEncoding, foobarBuffer, 'utf8');
test('Next generator argument is string with default encoding, with Uint8Array writes', testGeneratorNextEncoding, foobarUint8Array, 'utf8');
test('Next generator argument is Uint8Array with encoding "buffer", with string writes', testGeneratorNextEncoding, foobarString, 'buffer');
test('Next generator argument is Uint8Array with encoding "buffer", with Buffer writes', testGeneratorNextEncoding, foobarBuffer, 'buffer');
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes', testGeneratorNextEncoding, foobarUint8Array, 'buffer');
test('Next generator argument is Uint8Array with encoding "hex", with string writes', testGeneratorNextEncoding, foobarString, 'hex');
test('Next generator argument is Uint8Array with encoding "hex", with Buffer writes', testGeneratorNextEncoding, foobarBuffer, 'hex');
test('Next generator argument is Uint8Array with encoding "hex", with Uint8Array writes', testGeneratorNextEncoding, foobarUint8Array, 'hex');

const testGeneratorReturnType = async (t, input, encoding) => {
	const {stdout} = await execa('noop.js', ['other'], {stdout: outputGenerator.bind(undefined, input), encoding});
	const output = Buffer.from(stdout, encoding).toString();
	t.is(output, foobarString);
};

test('Generator can return string with default encoding', testGeneratorReturnType, foobarString, 'utf8');
test('Generator can return Uint8Array with default encoding', testGeneratorReturnType, foobarUint8Array, 'utf8');
test('Generator can return string with encoding "buffer"', testGeneratorReturnType, foobarString, 'buffer');
test('Generator can return Uint8Array with encoding "buffer"', testGeneratorReturnType, foobarUint8Array, 'buffer');
test('Generator can return string with encoding "hex"', testGeneratorReturnType, foobarString, 'hex');
test('Generator can return Uint8Array with encoding "hex"', testGeneratorReturnType, foobarUint8Array, 'hex');

const multibyteChar = '\u{1F984}';
const multibyteString = `${multibyteChar}${multibyteChar}`;
const multibyteUint8Array = new TextEncoder().encode(multibyteString);
const breakingLength = multibyteUint8Array.length * 0.75;
const brokenSymbol = '\uFFFD';

const noopGenerator = async function * (lines) {
	yield * lines;
};

test('Generator handles multibyte characters with Uint8Array', async t => {
	const childProcess = execa('stdin.js', {stdin: noopGenerator});
	childProcess.stdin.write(multibyteUint8Array.slice(0, breakingLength));
	await setTimeout(0);
	childProcess.stdin.end(multibyteUint8Array.slice(breakingLength));
	const {stdout} = await childProcess;
	t.is(stdout, multibyteString);
});

test('Generator handles partial multibyte characters with Uint8Array', async t => {
	const {stdout} = await execa('stdin.js', {stdin: [multibyteUint8Array.slice(0, breakingLength), noopGenerator]});
	t.is(stdout, `${multibyteChar}${brokenSymbol}`);
});

// eslint-disable-next-line require-yield
const noYieldGenerator = async function * (lines) {
	// eslint-disable-next-line no-empty, no-unused-vars
	for await (const line of lines) {}
};

test('Generator can filter by not calling yield', async t => {
	const {stdout} = await execa('noop.js', {stdout: noYieldGenerator});
	t.is(stdout, '');
});

const prefix = '> ';
const suffix = ' <';

const multipleYieldGenerator = async function * (lines) {
	for await (const line of lines) {
		yield prefix;
		await setTimeout(0);
		yield line;
		await setTimeout(0);
		yield suffix;
	}
};

test('Generator can yield multiple times at different moments', async t => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: multipleYieldGenerator});
	t.is(stdout, `${prefix}${foobarString}${suffix}`);
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

const appendGenerator = async function * (lines) {
	for await (const line of lines) {
		yield `${line}${casedSuffix}`;
	}
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

const maxBuffer = 10;

test('Generators take "maxBuffer" into account', async t => {
	const bigString = '.'.repeat(maxBuffer);
	const {stdout} = await execa('noop.js', {maxBuffer, stdout: outputGenerator.bind(undefined, bigString)});
	t.is(stdout, bigString);

	await t.throwsAsync(execa('noop.js', {maxBuffer, stdout: outputGenerator.bind(undefined, `${bigString}.`)}));
});

const timeoutGenerator = async function * (timeout, lines) {
	for await (const line of lines) {
		await setTimeout(timeout);
		yield line;
	}
};

test('Generators are awaited on success', async t => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {maxBuffer, stdout: timeoutGenerator.bind(undefined, 1e3)});
	t.is(stdout, foobarString);
});

// eslint-disable-next-line require-yield
const throwingGenerator = async function * (lines) {
	// eslint-disable-next-line no-unreachable-loop
	for await (const line of lines) {
		throw new Error(`Generator error ${line}`);
	}
};

test('Generators errors make process fail', async t => {
	await t.throwsAsync(
		execa('noop-fd.js', ['1', foobarString], {stdout: throwingGenerator}),
		{message: /Generator error foobar/},
	);
});

// eslint-disable-next-line require-yield
const errorHandlerGenerator = async function * (state, lines) {
	try {
		// eslint-disable-next-line no-unused-vars
		for await (const line of lines) {
			await setTimeout(1e8);
		}
	} catch (error) {
		state.error = error;
	}
};

test.serial('Process streams failures make generators throw', async t => {
	const state = {};
	const childProcess = execa('noop-fail.js', ['1'], {stdout: errorHandlerGenerator.bind(undefined, state)});
	const error = new Error('test');
	childProcess.stdout.emit('error', error);
	const thrownError = await t.throwsAsync(childProcess);
	t.is(error, thrownError);
	await setTimeout(0);
	t.is(state.error.code, 'ABORT_ERR');
});
