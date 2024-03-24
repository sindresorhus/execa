import {Buffer} from 'node:buffer';
import {once} from 'node:events';
import {Writable} from 'node:stream';
import test from 'ava';
import {MaxBufferError} from 'get-stream';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio} from '../helpers/stdio.js';
import {getChunksGenerator} from '../helpers/generator.js';
import {foobarString, foobarObject} from '../helpers/input.js';
import {assertStreamOutput, assertIterableChunks} from '../helpers/convert.js';
import {
	simpleFull,
	simpleChunks,
	simpleFullUint8Array,
	simpleFullHex,
	simpleFullUtf16Uint8Array,
	simpleLines,
	simpleFullEndLines,
	noNewlinesChunks,
} from '../helpers/lines.js';

setFixtureDir();

const getSimpleChunkSubprocess = options => execa('noop-fd.js', ['1', simpleFull], {lines: true, ...options});

// eslint-disable-next-line max-params
const testStreamLines = async (t, fdNumber, input, expectedOutput, stripFinalNewline) => {
	const {stdio} = await execa('noop-fd.js', [`${fdNumber}`, input], {
		...fullStdio,
		lines: true,
		stripFinalNewline,
	});
	t.deepEqual(stdio[fdNumber], expectedOutput);
};

test('"lines: true" splits lines, stdout, string', testStreamLines, 1, simpleFull, simpleLines, false);
test('"lines: true" splits lines, stderr, string', testStreamLines, 2, simpleFull, simpleLines, false);
test('"lines: true" splits lines, stdio[*], string', testStreamLines, 3, simpleFull, simpleLines, false);
test('"lines: true" splits lines, stdout, string, stripFinalNewline', testStreamLines, 1, simpleFull, noNewlinesChunks, true);
test('"lines: true" splits lines, stderr, string, stripFinalNewline', testStreamLines, 2, simpleFull, noNewlinesChunks, true);
test('"lines: true" splits lines, stdio[*], string, stripFinalNewline', testStreamLines, 3, simpleFull, noNewlinesChunks, true);

const testStreamLinesNoop = async (t, lines, execaMethod) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', simpleFull], {lines});
	t.is(stdout, simpleFull);
};

test('"lines: false" is a noop with execa()', testStreamLinesNoop, false, execa);
test('"lines: false" is a noop with execaSync()', testStreamLinesNoop, false, execaSync);
test('"lines: true" is a noop with execaSync()', testStreamLinesNoop, true, execaSync);

const bigArray = Array.from({length: 1e5}).fill('.\n');
const bigString = bigArray.join('');
const bigStringNoNewlines = '.'.repeat(1e6);
const bigStringNoNewlinesEnd = `${bigStringNoNewlines}\n`;

// eslint-disable-next-line max-params
const testStreamLinesGenerator = async (t, input, expectedLines, objectMode, binary) => {
	const {stdout} = await execa('noop.js', {
		stdout: getChunksGenerator(input, objectMode, binary),
		lines: true,
		stripFinalNewline: false,
	});
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with strings generators', testStreamLinesGenerator, simpleChunks, simpleFullEndLines, false, false);
test('"lines: true" works with strings generators, binary', testStreamLinesGenerator, simpleChunks, simpleLines, false, true);
test('"lines: true" works with big strings generators', testStreamLinesGenerator, [bigString], bigArray, false, false);
test('"lines: true" works with big strings generators without newlines', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlinesEnd], false, false);
test('"lines: true" is a noop with strings generators, objectMode', testStreamLinesGenerator, simpleChunks, simpleChunks, true, false);
test('"lines: true" is a noop with strings generators, binary, objectMode', testStreamLinesGenerator, simpleChunks, simpleChunks, true, true);
test('"lines: true" is a noop big strings generators, objectMode', testStreamLinesGenerator, [bigString], [bigString], true, false);
test('"lines: true" is a noop big strings generators without newlines, objectMode', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlines], true, false);

test('"lines: true" is a noop with objects generators, objectMode', async t => {
	const {stdout} = await execa('noop.js', {
		stdout: getChunksGenerator([foobarObject], true),
		lines: true,
	});
	t.deepEqual(stdout, [foobarObject]);
});

const testBinaryEncoding = async (t, expectedOutput, encoding, stripFinalNewline) => {
	const {stdout} = await getSimpleChunkSubprocess({encoding, stripFinalNewline});
	t.deepEqual(stdout, expectedOutput);
};

test('"lines: true" is a noop with "encoding: buffer"', testBinaryEncoding, simpleFullUint8Array, 'buffer', false);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline', testBinaryEncoding, simpleFullUint8Array, 'buffer', false);
test('"lines: true" is a noop with "encoding: hex"', testBinaryEncoding, simpleFullHex, 'hex', false);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline', testBinaryEncoding, simpleFullHex, 'hex', true);

const testTextEncoding = async (t, expectedLines, stripFinalNewline) => {
	const {stdout} = await execa('stdin.js', {
		lines: true,
		stripFinalNewline,
		encoding: 'utf16le',
		input: simpleFullUtf16Uint8Array,
	});
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" is a noop with "encoding: utf16"', testTextEncoding, simpleLines, false);
test('"lines: true" is a noop with "encoding: utf16", stripFinalNewline', testTextEncoding, noNewlinesChunks, true);

test('"lines: true" is a noop with "buffer: false"', async t => {
	const {stdout} = await getSimpleChunkSubprocess({buffer: false});
	t.is(stdout, undefined);
});

test('"lines: true" can be below "maxBuffer"', async t => {
	const maxBuffer = simpleLines.length;
	const {stdout} = await getSimpleChunkSubprocess({maxBuffer});
	t.deepEqual(stdout, noNewlinesChunks);
});

test('"lines: true" can be above "maxBuffer"', async t => {
	const maxBuffer = simpleLines.length - 1;
	const {cause, stdout} = await t.throwsAsync(getSimpleChunkSubprocess({maxBuffer}));
	t.true(cause instanceof MaxBufferError);
	t.deepEqual(stdout, noNewlinesChunks.slice(0, maxBuffer));
});

test('"lines: true" stops on stream error', async t => {
	const cause = new Error(foobarString);
	const error = await t.throwsAsync(getSimpleChunkSubprocess({
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

const testAsyncIteration = async (t, expectedLines, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocess({stripFinalNewline});
	t.false(subprocess.stdout.readableObjectMode);
	await assertStreamOutput(t, subprocess.stdout, simpleFull);
	const {stdout} = await subprocess;
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with stream async iteration', testAsyncIteration, simpleLines, false);
test('"lines: true" works with stream async iteration, stripFinalNewline', testAsyncIteration, noNewlinesChunks, true);

const testDataEvents = async (t, expectedLines, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocess({stripFinalNewline});
	const [firstLine] = await once(subprocess.stdout, 'data');
	t.deepEqual(firstLine, Buffer.from(simpleLines[0]));
	const {stdout} = await subprocess;
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with stream "data" events', testDataEvents, simpleLines, false);
test('"lines: true" works with stream "data" events, stripFinalNewline', testDataEvents, noNewlinesChunks, true);

const testWritableStream = async (t, expectedLines, stripFinalNewline) => {
	const lines = [];
	const writable = new Writable({
		write(line, encoding, done) {
			lines.push(line.toString());
			done();
		},
		decodeStrings: false,
	});
	const {stdout} = await getSimpleChunkSubprocess({stripFinalNewline, stdout: ['pipe', writable]});
	t.deepEqual(lines, simpleLines);
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with writable streams targets', testWritableStream, simpleLines, false);
test('"lines: true" works with writable streams targets, stripFinalNewline', testWritableStream, noNewlinesChunks, true);

const testIterable = async (t, expectedLines, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocess({stripFinalNewline});
	await assertIterableChunks(t, subprocess, noNewlinesChunks);
	const {stdout} = await subprocess;
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with subprocess.iterable()', testIterable, simpleLines, false);
test('"lines: true" works with subprocess.iterable(), stripFinalNewline', testIterable, noNewlinesChunks, true);
