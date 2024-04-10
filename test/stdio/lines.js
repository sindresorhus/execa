import {Writable} from 'node:stream';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio} from '../helpers/stdio.js';
import {getOutputsGenerator} from '../helpers/generator.js';
import {foobarString, foobarObject} from '../helpers/input.js';
import {assertStreamOutput, assertStreamDataEvents, assertIterableChunks} from '../helpers/convert.js';
import {
	simpleFull,
	simpleChunks,
	simpleFullEndChunks,
	simpleFullUint8Array,
	simpleFullHex,
	simpleFullUtf16Uint8Array,
	simpleLines,
	simpleFullEndLines,
	noNewlinesChunks,
} from '../helpers/lines.js';
import {assertErrorMessage} from '../helpers/max-buffer.js';

setFixtureDir();

const getSimpleChunkSubprocessAsync = options => getSimpleChunkSubprocess(execa, options);
const getSimpleChunkSubprocess = (execaMethod, options) => execaMethod('noop-fd.js', ['1', simpleFull], {lines: true, ...options});

// eslint-disable-next-line max-params
const testStreamLines = async (t, fdNumber, input, expectedOutput, stripFinalNewline, execaMethod) => {
	const {stdio} = await execaMethod('noop-fd.js', [`${fdNumber}`, input], {
		...fullStdio,
		lines: true,
		stripFinalNewline,
	});
	t.deepEqual(stdio[fdNumber], expectedOutput);
};

test('"lines: true" splits lines, stdout, string', testStreamLines, 1, simpleFull, simpleLines, false, execa);
test('"lines: true" splits lines, stderr, string', testStreamLines, 2, simpleFull, simpleLines, false, execa);
test('"lines: true" splits lines, stdio[*], string', testStreamLines, 3, simpleFull, simpleLines, false, execa);
test('"lines: true" splits lines, stdout, string, stripFinalNewline', testStreamLines, 1, simpleFull, noNewlinesChunks, true, execa);
test('"lines: true" splits lines, stdout, string, stripFinalNewline, fd-specific', testStreamLines, 1, simpleFull, noNewlinesChunks, {stdout: true}, execa);
test('"lines: true" splits lines, stderr, string, stripFinalNewline', testStreamLines, 2, simpleFull, noNewlinesChunks, true, execa);
test('"lines: true" splits lines, stderr, string, stripFinalNewline, fd-specific', testStreamLines, 2, simpleFull, noNewlinesChunks, {stderr: true}, execa);
test('"lines: true" splits lines, stdio[*], string, stripFinalNewline', testStreamLines, 3, simpleFull, noNewlinesChunks, true, execa);
test('"lines: true" splits lines, stdio[*], string, stripFinalNewline, fd-specific', testStreamLines, 3, simpleFull, noNewlinesChunks, {fd3: true}, execa);
test('"lines: true" splits lines, stdout, string, sync', testStreamLines, 1, simpleFull, simpleLines, false, execaSync);
test('"lines: true" splits lines, stderr, string, sync', testStreamLines, 2, simpleFull, simpleLines, false, execaSync);
test('"lines: true" splits lines, stdio[*], string, sync', testStreamLines, 3, simpleFull, simpleLines, false, execaSync);
test('"lines: true" splits lines, stdout, string, stripFinalNewline, sync', testStreamLines, 1, simpleFull, noNewlinesChunks, true, execaSync);
test('"lines: true" splits lines, stdout, string, stripFinalNewline, fd-specific, sync', testStreamLines, 1, simpleFull, noNewlinesChunks, {stdout: true}, execaSync);
test('"lines: true" splits lines, stderr, string, stripFinalNewline, sync', testStreamLines, 2, simpleFull, noNewlinesChunks, true, execaSync);
test('"lines: true" splits lines, stderr, string, stripFinalNewline, fd-specific, sync', testStreamLines, 2, simpleFull, noNewlinesChunks, {stderr: true}, execaSync);
test('"lines: true" splits lines, stdio[*], string, stripFinalNewline, sync', testStreamLines, 3, simpleFull, noNewlinesChunks, true, execaSync);
test('"lines: true" splits lines, stdio[*], string, stripFinalNewline, fd-specific, sync', testStreamLines, 3, simpleFull, noNewlinesChunks, {fd3: true}, execaSync);

const testStreamLinesNoop = async (t, lines, execaMethod) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', simpleFull], {lines});
	t.is(stdout, simpleFull);
};

test('"lines: false" is a noop with execa()', testStreamLinesNoop, false, execa);
test('"lines: false" is a noop with execaSync()', testStreamLinesNoop, false, execaSync);

const bigArray = Array.from({length: 1e5}).fill('.\n');
const bigString = bigArray.join('');
const bigStringNoNewlines = '.'.repeat(1e6);
const bigStringNoNewlinesEnd = `${bigStringNoNewlines}\n`;

// eslint-disable-next-line max-params
const testStreamLinesGenerator = async (t, input, expectedLines, objectMode, binary, stripFinalNewline, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: getOutputsGenerator(input)(objectMode, binary),
		lines: true,
		stripFinalNewline,
	});
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with strings generators', testStreamLinesGenerator, simpleChunks, simpleFullEndLines, false, false, false, execa);
test('"lines: true" works with strings generators, binary', testStreamLinesGenerator, simpleChunks, simpleLines, false, true, false, execa);
test('"lines: true" works with big strings generators', testStreamLinesGenerator, [bigString], bigArray, false, false, false, execa);
test('"lines: true" works with big strings generators without newlines', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlinesEnd], false, false, false, execa);
test('"lines: true" is a noop with strings generators, objectMode', testStreamLinesGenerator, simpleFullEndChunks, simpleFullEndChunks, true, false, false, execa);
test('"lines: true" is a noop with strings generators, stripFinalNewline, objectMode', testStreamLinesGenerator, simpleFullEndChunks, simpleFullEndChunks, true, false, true, execa);
test('"lines: true" is a noop with strings generators, stripFinalNewline, fd-specific, objectMode', testStreamLinesGenerator, simpleFullEndChunks, simpleFullEndChunks, true, false, {stdout: true}, execa);
test('"lines: true" is a noop with strings generators, binary, objectMode', testStreamLinesGenerator, simpleChunks, simpleChunks, true, true, false, execa);
test('"lines: true" is a noop big strings generators, objectMode', testStreamLinesGenerator, [bigString], [bigString], true, false, false, execa);
test('"lines: true" is a noop big strings generators without newlines, objectMode', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlines], true, false, false, execa);
test('"lines: true" works with strings generators, sync', testStreamLinesGenerator, simpleChunks, simpleFullEndLines, false, false, false, execaSync);
test('"lines: true" works with strings generators, binary, sync', testStreamLinesGenerator, simpleChunks, simpleLines, false, true, false, execaSync);
test('"lines: true" works with big strings generators, sync', testStreamLinesGenerator, [bigString], bigArray, false, false, false, execaSync);
test('"lines: true" works with big strings generators without newlines, sync', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlinesEnd], false, false, false, execaSync);
test('"lines: true" is a noop with strings generators, objectMode, sync', testStreamLinesGenerator, simpleFullEndChunks, simpleFullEndChunks, true, false, false, execaSync);
test('"lines: true" is a noop with strings generators, stripFinalNewline, objectMode, sync', testStreamLinesGenerator, simpleFullEndChunks, simpleFullEndChunks, true, false, true, execaSync);
test('"lines: true" is a noop with strings generators, stripFinalNewline, fd-specific, objectMode, sync', testStreamLinesGenerator, simpleFullEndChunks, simpleFullEndChunks, true, false, {stdout: true}, execaSync);
test('"lines: true" is a noop with strings generators, binary, objectMode, sync', testStreamLinesGenerator, simpleChunks, simpleChunks, true, true, false, execaSync);
test('"lines: true" is a noop big strings generators, objectMode, sync', testStreamLinesGenerator, [bigString], [bigString], true, false, false, execaSync);
test('"lines: true" is a noop big strings generators without newlines, objectMode, sync', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlines], true, false, false, execaSync);

const testLinesObjectMode = async (t, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: getOutputsGenerator([foobarObject])(true),
		lines: true,
	});
	t.deepEqual(stdout, [foobarObject]);
};

test('"lines: true" is a noop with objects generators, objectMode', testLinesObjectMode, execa);
test('"lines: true" is a noop with objects generators, objectMode, sync', testLinesObjectMode, execaSync);

// eslint-disable-next-line max-params
const testEncoding = async (t, input, expectedOutput, encoding, stripFinalNewline, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {lines: true, stripFinalNewline, encoding, input});
	t.deepEqual(stdout, expectedOutput);
};

test('"lines: true" is a noop with "encoding: utf16"', testEncoding, simpleFullUtf16Uint8Array, simpleLines, 'utf16le', false, execa);
test('"lines: true" is a noop with "encoding: utf16", stripFinalNewline', testEncoding, simpleFullUtf16Uint8Array, noNewlinesChunks, 'utf16le', true, execa);
test('"lines: true" is a noop with "encoding: utf16", stripFinalNewline, fd-specific', testEncoding, simpleFullUtf16Uint8Array, noNewlinesChunks, 'utf16le', {stdout: true}, execa);
test('"lines: true" is a noop with "encoding: buffer"', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', false, execa);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', false, execa);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline, fd-specific', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', {stdout: false}, execa);
test('"lines: true" is a noop with "encoding: hex"', testEncoding, simpleFull, simpleFullHex, 'hex', false, execa);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline', testEncoding, simpleFull, simpleFullHex, 'hex', true, execa);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline, fd-specific', testEncoding, simpleFull, simpleFullHex, 'hex', {stdout: true}, execa);
test('"lines: true" is a noop with "encoding: utf16", sync', testEncoding, simpleFullUtf16Uint8Array, simpleLines, 'utf16le', false, execaSync);
test('"lines: true" is a noop with "encoding: utf16", stripFinalNewline, sync', testEncoding, simpleFullUtf16Uint8Array, noNewlinesChunks, 'utf16le', true, execaSync);
test('"lines: true" is a noop with "encoding: utf16", stripFinalNewline, fd-specific, sync', testEncoding, simpleFullUtf16Uint8Array, noNewlinesChunks, 'utf16le', {stdout: true}, execaSync);
test('"lines: true" is a noop with "encoding: buffer", sync', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', false, execaSync);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline, sync', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', false, execaSync);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline, fd-specific, sync', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', {stdout: false}, execaSync);
test('"lines: true" is a noop with "encoding: hex", sync', testEncoding, simpleFull, simpleFullHex, 'hex', false, execaSync);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline, sync', testEncoding, simpleFull, simpleFullHex, 'hex', true, execaSync);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline, fd-specific, sync', testEncoding, simpleFull, simpleFullHex, 'hex', {stdout: true}, execaSync);

const testLinesNoBuffer = async (t, execaMethod) => {
	const {stdout} = await getSimpleChunkSubprocess(execaMethod, {buffer: false});
	t.is(stdout, undefined);
};

test('"lines: true" is a noop with "buffer: false"', testLinesNoBuffer, execa);
test('"lines: true" is a noop with "buffer: false", sync', testLinesNoBuffer, execaSync);

const maxBuffer = simpleLines.length - 1;

test('"lines: true" can be below "maxBuffer"', async t => {
	const {isMaxBuffer, stdout} = await getSimpleChunkSubprocessAsync({maxBuffer: maxBuffer + 1});
	t.false(isMaxBuffer);
	t.deepEqual(stdout, noNewlinesChunks);
});

test('"lines: true" can be above "maxBuffer"', async t => {
	const {isMaxBuffer, shortMessage, stdout} = await t.throwsAsync(getSimpleChunkSubprocessAsync({maxBuffer}));
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage, {length: maxBuffer, unit: 'lines'});
	t.deepEqual(stdout, noNewlinesChunks.slice(0, maxBuffer));
});

test('"maxBuffer" is measured in lines with "lines: true"', async t => {
	const {isMaxBuffer, shortMessage, stdout} = await t.throwsAsync(execa('noop-repeat.js', ['1', '...\n'], {lines: true, maxBuffer}));
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage, {length: maxBuffer, unit: 'lines'});
	t.deepEqual(stdout, ['...', '...']);
});

test('"maxBuffer" is measured in bytes with "lines: true", sync', t => {
	const {isMaxBuffer, shortMessage, stdout} = t.throws(() => {
		execaSync('noop-repeat.js', ['1', '...\n'], {lines: true, maxBuffer});
	}, {code: 'ENOBUFS'});
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage, {execaMethod: execaSync, length: maxBuffer});
	t.deepEqual(stdout, ['..']);
});

test('"lines: true" stops on stream error', async t => {
	const cause = new Error(foobarString);
	const error = await t.throwsAsync(getSimpleChunkSubprocessAsync({
		* stdout(line) {
			if (line === noNewlinesChunks[2]) {
				throw cause;
			}

			yield line;
		},
	}));
	t.is(error.cause, cause);
	t.deepEqual(error.stdout, noNewlinesChunks.slice(0, 2));
});

test('"lines: true" stops on stream error event', async t => {
	const cause = new Error(foobarString);
	const subprocess = getSimpleChunkSubprocessAsync();
	subprocess.stdout.emit('error', cause);
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.deepEqual(error.stdout, []);
});

const testAsyncIteration = async (t, expectedLines, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocessAsync({stripFinalNewline});
	t.false(subprocess.stdout.readableObjectMode);
	await assertStreamOutput(t, subprocess.stdout, simpleFull);
	const {stdout} = await subprocess;
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with stream async iteration', testAsyncIteration, simpleLines, false);
test('"lines: true" works with stream async iteration, stripFinalNewline', testAsyncIteration, noNewlinesChunks, true);

const testDataEvents = async (t, expectedLines, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocessAsync({stripFinalNewline});
	await assertStreamDataEvents(t, subprocess.stdout, simpleFull);
	const {stdout} = await subprocess;
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with stream "data" events', testDataEvents, simpleLines, false);
test('"lines: true" works with stream "data" events, stripFinalNewline', testDataEvents, noNewlinesChunks, true);

const testWritableStream = async (t, expectedLines, stripFinalNewline) => {
	let output = '';
	const writable = new Writable({
		write(line, encoding, done) {
			output += line.toString();
			done();
		},
		decodeStrings: false,
	});
	const {stdout} = await getSimpleChunkSubprocessAsync({stripFinalNewline, stdout: ['pipe', writable]});
	t.deepEqual(output, simpleFull);
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with writable streams targets', testWritableStream, simpleLines, false);
test('"lines: true" works with writable streams targets, stripFinalNewline', testWritableStream, noNewlinesChunks, true);

const testIterable = async (t, expectedLines, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocessAsync({stripFinalNewline});
	await assertIterableChunks(t, subprocess, noNewlinesChunks);
	const {stdout} = await subprocess;
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with subprocess.iterable()', testIterable, simpleLines, false);
test('"lines: true" works with subprocess.iterable(), stripFinalNewline', testIterable, noNewlinesChunks, true);
