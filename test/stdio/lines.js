import {once} from 'node:events';
import {Writable} from 'node:stream';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio} from '../helpers/stdio.js';
import {getChunksGenerator} from '../helpers/generator.js';
import {foobarObject} from '../helpers/input.js';
import {
	simpleFull,
	simpleChunks,
	simpleLines,
	simpleFullEndLines,
	noNewlinesChunks,
	getEncoding,
	stringsToUint8Arrays,
	stringsToBuffers,
	serializeResult,
} from '../helpers/lines.js';

setFixtureDir();

// eslint-disable-next-line max-params
const testStreamLines = async (t, fdNumber, input, expectedOutput, isUint8Array, stripFinalNewline) => {
	const {stdio} = await execa('noop-fd.js', [`${fdNumber}`, input], {
		...fullStdio,
		lines: true,
		encoding: getEncoding(isUint8Array),
		stripFinalNewline,
	});
	const output = serializeResult(stdio[fdNumber], isUint8Array);
	t.deepEqual(output, expectedOutput);
};

test('"lines: true" splits lines, stdout, string', testStreamLines, 1, simpleFull, simpleLines, false, false);
test('"lines: true" splits lines, stdout, Uint8Array', testStreamLines, 1, simpleFull, simpleLines, true, false);
test('"lines: true" splits lines, stderr, string', testStreamLines, 2, simpleFull, simpleLines, false, false);
test('"lines: true" splits lines, stderr, Uint8Array', testStreamLines, 2, simpleFull, simpleLines, true, false);
test('"lines: true" splits lines, stdio[*], string', testStreamLines, 3, simpleFull, simpleLines, false, false);
test('"lines: true" splits lines, stdio[*], Uint8Array', testStreamLines, 3, simpleFull, simpleLines, true, false);
test('"lines: true" splits lines, stdout, string, stripFinalNewline', testStreamLines, 1, simpleFull, noNewlinesChunks, false, true);
test('"lines: true" splits lines, stdout, Uint8Array, stripFinalNewline', testStreamLines, 1, simpleFull, noNewlinesChunks, true, true);
test('"lines: true" splits lines, stderr, string, stripFinalNewline', testStreamLines, 2, simpleFull, noNewlinesChunks, false, true);
test('"lines: true" splits lines, stderr, Uint8Array, stripFinalNewline', testStreamLines, 2, simpleFull, noNewlinesChunks, true, true);
test('"lines: true" splits lines, stdio[*], string, stripFinalNewline', testStreamLines, 3, simpleFull, noNewlinesChunks, false, true);
test('"lines: true" splits lines, stdio[*], Uint8Array, stripFinalNewline', testStreamLines, 3, simpleFull, noNewlinesChunks, true, true);

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
test('"lines: true" works with strings generators, objectMode', testStreamLinesGenerator, simpleChunks, simpleChunks, true, false);
test('"lines: true" works with strings generators, binary', testStreamLinesGenerator, simpleChunks, simpleLines, false, true);
test('"lines: true" works with strings generators, binary, objectMode', testStreamLinesGenerator, simpleChunks, simpleChunks, true, true);
test('"lines: true" works with big strings generators', testStreamLinesGenerator, [bigString], bigArray, false, false);
test('"lines: true" works with big strings generators, objectMode', testStreamLinesGenerator, [bigString], [bigString], true, false);
test('"lines: true" works with big strings generators without newlines', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlinesEnd], false, false);
test('"lines: true" works with big strings generators without newlines, objectMode', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlines], true, false);

test('"lines: true" is a noop with objects generators, objectMode', async t => {
	const {stdout} = await execa('noop.js', {
		stdout: getChunksGenerator([foobarObject], true),
		lines: true,
	});
	t.deepEqual(stdout, [foobarObject]);
});

const singleLine = 'a\n';
const singleLineStrip = 'a';

const testOtherEncoding = async (t, stripFinalNewline, strippedLine) => {
	const {stdout} = await execa('noop-fd.js', ['1', `${singleLine}${singleLine}`], {
		lines: true,
		encoding: 'base64',
		stripFinalNewline,
	});
	t.deepEqual(stdout, [strippedLine, strippedLine]);
};

test('"lines: true" does not work with other encodings', testOtherEncoding, false, singleLine);
test('"lines: true" does not work with other encodings, stripFinalNewline', testOtherEncoding, true, singleLineStrip);

const getSimpleChunkSubprocess = (isUint8Array, stripFinalNewline, options) => execa('noop-fd.js', ['1', ...simpleChunks], {
	lines: true,
	encoding: getEncoding(isUint8Array),
	stripFinalNewline,
	...options,
});

const testAsyncIteration = async (t, expectedOutput, isUint8Array, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocess(isUint8Array, stripFinalNewline);
	const [stdout] = await Promise.all([subprocess.stdout.toArray(), subprocess]);
	t.deepEqual(stdout, stringsToUint8Arrays(expectedOutput, isUint8Array));
};

test('"lines: true" works with stream async iteration, string', testAsyncIteration, simpleLines, false, false);
test('"lines: true" works with stream async iteration, Uint8Array', testAsyncIteration, simpleLines, true, false);
test('"lines: true" works with stream async iteration, string, stripFinalNewline', testAsyncIteration, noNewlinesChunks, false, true);
test('"lines: true" works with stream async iteration, Uint8Array, stripFinalNewline', testAsyncIteration, noNewlinesChunks, true, true);

const testDataEvents = async (t, expectedOutput, isUint8Array, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocess(isUint8Array, stripFinalNewline);
	const [[firstLine]] = await Promise.all([once(subprocess.stdout, 'data'), subprocess]);
	t.deepEqual(firstLine, stringsToUint8Arrays(expectedOutput, isUint8Array)[0]);
};

test('"lines: true" works with stream "data" events, string', testDataEvents, simpleLines, false, false);
test('"lines: true" works with stream "data" events, Uint8Array', testDataEvents, simpleLines, true, false);
test('"lines: true" works with stream "data" events, string, stripFinalNewline', testDataEvents, noNewlinesChunks, false, true);
test('"lines: true" works with stream "data" events, Uint8Array, stripFinalNewline', testDataEvents, noNewlinesChunks, true, true);

const testWritableStream = async (t, expectedOutput, isUint8Array, stripFinalNewline) => {
	const lines = [];
	const writable = new Writable({
		write(line, encoding, done) {
			lines.push(line);
			done();
		},
		decodeStrings: false,
	});
	await getSimpleChunkSubprocess(isUint8Array, stripFinalNewline, {stdout: ['pipe', writable]});
	t.deepEqual(lines, stringsToBuffers(expectedOutput, isUint8Array));
};

test('"lines: true" works with writable streams targets, string', testWritableStream, simpleLines, false, false);
test('"lines: true" works with writable streams targets, Uint8Array', testWritableStream, simpleLines, true, false);
test('"lines: true" works with writable streams targets, string, stripFinalNewline', testWritableStream, noNewlinesChunks, false, true);
test('"lines: true" works with writable streams targets, Uint8Array, stripFinalNewline', testWritableStream, noNewlinesChunks, true, true);
