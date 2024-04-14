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
const testStreamLines = async (t, fdNumber, input, expectedOutput, lines, stripFinalNewline, execaMethod) => {
	const {stdio} = await execaMethod('noop-fd.js', [`${fdNumber}`, input], {...fullStdio, lines, stripFinalNewline});
	t.deepEqual(stdio[fdNumber], expectedOutput);
};

test('"lines: true" splits lines, stdout', testStreamLines, 1, simpleFull, simpleLines, true, false, execa);
test('"lines: true" splits lines, stdout, fd-specific', testStreamLines, 1, simpleFull, simpleLines, {stdout: true}, false, execa);
test('"lines: true" splits lines, stderr', testStreamLines, 2, simpleFull, simpleLines, true, false, execa);
test('"lines: true" splits lines, stderr, fd-specific', testStreamLines, 2, simpleFull, simpleLines, {stderr: true}, false, execa);
test('"lines: true" splits lines, stdio[*]', testStreamLines, 3, simpleFull, simpleLines, true, false, execa);
test('"lines: true" splits lines, stdio[*], fd-specific', testStreamLines, 3, simpleFull, simpleLines, {fd3: true}, false, execa);
test('"lines: true" splits lines, stdout, stripFinalNewline', testStreamLines, 1, simpleFull, noNewlinesChunks, true, true, execa);
test('"lines: true" splits lines, stdout, stripFinalNewline, fd-specific', testStreamLines, 1, simpleFull, noNewlinesChunks, true, {stdout: true}, execa);
test('"lines: true" splits lines, stderr, stripFinalNewline', testStreamLines, 2, simpleFull, noNewlinesChunks, true, true, execa);
test('"lines: true" splits lines, stderr, stripFinalNewline, fd-specific', testStreamLines, 2, simpleFull, noNewlinesChunks, true, {stderr: true}, execa);
test('"lines: true" splits lines, stdio[*], stripFinalNewline', testStreamLines, 3, simpleFull, noNewlinesChunks, true, true, execa);
test('"lines: true" splits lines, stdio[*], stripFinalNewline, fd-specific', testStreamLines, 3, simpleFull, noNewlinesChunks, true, {fd3: true}, execa);
test('"lines: true" splits lines, stdout, sync', testStreamLines, 1, simpleFull, simpleLines, true, false, execaSync);
test('"lines: true" splits lines, stdout, fd-specific, sync', testStreamLines, 1, simpleFull, simpleLines, {stdout: true}, false, execaSync);
test('"lines: true" splits lines, stderr, sync', testStreamLines, 2, simpleFull, simpleLines, true, false, execaSync);
test('"lines: true" splits lines, stderr, fd-specific, sync', testStreamLines, 2, simpleFull, simpleLines, {stderr: true}, false, execaSync);
test('"lines: true" splits lines, stdio[*], sync', testStreamLines, 3, simpleFull, simpleLines, true, false, execaSync);
test('"lines: true" splits lines, stdio[*], fd-specific, sync', testStreamLines, 3, simpleFull, simpleLines, {fd3: true}, false, execaSync);
test('"lines: true" splits lines, stdout, stripFinalNewline, sync', testStreamLines, 1, simpleFull, noNewlinesChunks, true, true, execaSync);
test('"lines: true" splits lines, stdout, stripFinalNewline, fd-specific, sync', testStreamLines, 1, simpleFull, noNewlinesChunks, true, {stdout: true}, execaSync);
test('"lines: true" splits lines, stderr, stripFinalNewline, sync', testStreamLines, 2, simpleFull, noNewlinesChunks, true, true, execaSync);
test('"lines: true" splits lines, stderr, stripFinalNewline, fd-specific, sync', testStreamLines, 2, simpleFull, noNewlinesChunks, true, {stderr: true}, execaSync);
test('"lines: true" splits lines, stdio[*], stripFinalNewline, sync', testStreamLines, 3, simpleFull, noNewlinesChunks, true, true, execaSync);
test('"lines: true" splits lines, stdio[*], stripFinalNewline, fd-specific, sync', testStreamLines, 3, simpleFull, noNewlinesChunks, true, {fd3: true}, execaSync);

const testStreamLinesNoop = async (t, lines, execaMethod) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', simpleFull], {lines});
	t.is(stdout, simpleFull);
};

test('"lines: false" is a noop', testStreamLinesNoop, false, execa);
test('"lines: false" is a noop, fd-specific', testStreamLinesNoop, {stderr: true}, execa);
test('"lines: false" is a noop, fd-specific none', testStreamLinesNoop, {}, execa);
test('"lines: false" is a noop, sync', testStreamLinesNoop, false, execaSync);
test('"lines: false" is a noop, fd-specific, sync', testStreamLinesNoop, {stderr: true}, execaSync);
test('"lines: false" is a noop, fd-specific none, sync', testStreamLinesNoop, {}, execaSync);

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

const testLinesObjectMode = async (t, lines, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: getOutputsGenerator([foobarObject])(true),
		lines,
	});
	t.deepEqual(stdout, [foobarObject]);
};

test('"lines: true" is a noop with objects generators, objectMode', testLinesObjectMode, true, execa);
test('"lines: true" is a noop with objects generators, fd-specific, objectMode', testLinesObjectMode, {stdout: true}, execa);
test('"lines: true" is a noop with objects generators, objectMode, sync', testLinesObjectMode, true, execaSync);
test('"lines: true" is a noop with objects generators, fd-specific, objectMode, sync', testLinesObjectMode, {stdout: true}, execaSync);

// eslint-disable-next-line max-params
const testEncoding = async (t, input, expectedOutput, encoding, lines, stripFinalNewline, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {lines, stripFinalNewline, encoding, input});
	t.deepEqual(stdout, expectedOutput);
};

test('"lines: true" is a noop with "encoding: utf16"', testEncoding, simpleFullUtf16Uint8Array, simpleLines, 'utf16le', true, false, execa);
test('"lines: true" is a noop with "encoding: utf16", fd-specific', testEncoding, simpleFullUtf16Uint8Array, simpleLines, 'utf16le', {stdout: true}, false, execa);
test('"lines: true" is a noop with "encoding: utf16", stripFinalNewline', testEncoding, simpleFullUtf16Uint8Array, noNewlinesChunks, 'utf16le', true, true, execa);
test('"lines: true" is a noop with "encoding: utf16", stripFinalNewline, fd-specific', testEncoding, simpleFullUtf16Uint8Array, noNewlinesChunks, 'utf16le', true, {stdout: true}, execa);
test('"lines: true" is a noop with "encoding: buffer"', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', true, false, execa);
test('"lines: true" is a noop with "encoding: buffer", fd-specific', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', {stdout: true}, false, execa);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', true, false, execa);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline, fd-specific', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', true, {stdout: false}, execa);
test('"lines: true" is a noop with "encoding: hex"', testEncoding, simpleFull, simpleFullHex, 'hex', true, false, execa);
test('"lines: true" is a noop with "encoding: hex", fd-specific', testEncoding, simpleFull, simpleFullHex, 'hex', {stdout: true}, false, execa);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline', testEncoding, simpleFull, simpleFullHex, 'hex', true, true, execa);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline, fd-specific', testEncoding, simpleFull, simpleFullHex, 'hex', true, {stdout: true}, execa);
test('"lines: true" is a noop with "encoding: utf16", sync', testEncoding, simpleFullUtf16Uint8Array, simpleLines, 'utf16le', true, false, execaSync);
test('"lines: true" is a noop with "encoding: utf16", fd-specific, sync', testEncoding, simpleFullUtf16Uint8Array, simpleLines, 'utf16le', {stdout: true}, false, execaSync);
test('"lines: true" is a noop with "encoding: utf16", stripFinalNewline, sync', testEncoding, simpleFullUtf16Uint8Array, noNewlinesChunks, 'utf16le', true, true, execaSync);
test('"lines: true" is a noop with "encoding: utf16", stripFinalNewline, fd-specific, sync', testEncoding, simpleFullUtf16Uint8Array, noNewlinesChunks, 'utf16le', true, {stdout: true}, execaSync);
test('"lines: true" is a noop with "encoding: buffer", sync', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', true, false, execaSync);
test('"lines: true" is a noop with "encoding: buffer", fd-specific, sync', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', {stdout: true}, false, execaSync);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline, sync', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', true, false, execaSync);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline, fd-specific, sync', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', true, {stdout: false}, execaSync);
test('"lines: true" is a noop with "encoding: hex", sync', testEncoding, simpleFull, simpleFullHex, 'hex', true, false, execaSync);
test('"lines: true" is a noop with "encoding: hex", fd-specific, sync', testEncoding, simpleFull, simpleFullHex, 'hex', {stdout: true}, false, execaSync);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline, sync', testEncoding, simpleFull, simpleFullHex, 'hex', true, true, execaSync);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline, fd-specific, sync', testEncoding, simpleFull, simpleFullHex, 'hex', true, {stdout: true}, execaSync);

const testLinesNoBuffer = async (t, lines, execaMethod) => {
	const {stdout} = await getSimpleChunkSubprocess(execaMethod, {lines, buffer: false});
	t.is(stdout, undefined);
};

test('"lines: true" is a noop with "buffer: false"', testLinesNoBuffer, true, execa);
test('"lines: true" is a noop with "buffer: false", fd-specific', testLinesNoBuffer, {stdout: true}, execa);
test('"lines: true" is a noop with "buffer: false", sync', testLinesNoBuffer, true, execaSync);
test('"lines: true" is a noop with "buffer: false", fd-specific, sync', testLinesNoBuffer, {stdout: true}, execaSync);

const maxBuffer = simpleLines.length - 1;

const testBelowMaxBuffer = async (t, lines) => {
	const {isMaxBuffer, stdout} = await getSimpleChunkSubprocessAsync({lines, maxBuffer: maxBuffer + 1});
	t.false(isMaxBuffer);
	t.deepEqual(stdout, noNewlinesChunks);
};

test('"lines: true" can be below "maxBuffer"', testBelowMaxBuffer, true);
test('"lines: true" can be below "maxBuffer", fd-specific', testBelowMaxBuffer, {stdout: true});

const testAboveMaxBuffer = async (t, lines) => {
	const {isMaxBuffer, shortMessage, stdout} = await t.throwsAsync(getSimpleChunkSubprocessAsync({lines, maxBuffer}));
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage, {length: maxBuffer, unit: 'lines'});
	t.deepEqual(stdout, noNewlinesChunks.slice(0, maxBuffer));
};

test('"lines: true" can be above "maxBuffer"', testAboveMaxBuffer, true);
test('"lines: true" can be above "maxBuffer", fd-specific', testAboveMaxBuffer, {stdout: true});

const testMaxBufferUnit = async (t, lines) => {
	const {isMaxBuffer, shortMessage, stdout} = await t.throwsAsync(execa('noop-repeat.js', ['1', '...\n'], {lines, maxBuffer}));
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage, {length: maxBuffer, unit: 'lines'});
	t.deepEqual(stdout, ['...', '...']);
};

test('"maxBuffer" is measured in lines with "lines: true"', testMaxBufferUnit, true);
test('"maxBuffer" is measured in lines with "lines: true", fd-specific', testMaxBufferUnit, {stdout: true});

const testMaxBufferUnitSync = (t, lines) => {
	const {isMaxBuffer, shortMessage, stdout} = t.throws(() => {
		execaSync('noop-repeat.js', ['1', '...\n'], {lines, maxBuffer});
	}, {code: 'ENOBUFS'});
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage, {execaMethod: execaSync, length: maxBuffer});
	t.deepEqual(stdout, ['..']);
};

test('"maxBuffer" is measured in bytes with "lines: true", sync', testMaxBufferUnitSync, true);
test('"maxBuffer" is measured in bytes with "lines: true", fd-specific, sync', testMaxBufferUnitSync, {stdout: true});

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
