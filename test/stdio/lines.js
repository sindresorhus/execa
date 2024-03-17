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
	simpleFullUint8Array,
	simpleFullHex,
	simpleLines,
	simpleFullEndLines,
	noNewlinesChunks,
} from '../helpers/lines.js';

setFixtureDir();

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

const testOtherEncoding = async (t, expectedOutput, encoding, stripFinalNewline) => {
	const {stdout} = await execa('noop-fd.js', ['1', simpleFull], {lines: true, encoding, stripFinalNewline});
	t.deepEqual(stdout, expectedOutput);
};

test('"lines: true" is a noop with "encoding: buffer"', testOtherEncoding, simpleFullUint8Array, 'buffer', false);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline', testOtherEncoding, simpleFullUint8Array, 'buffer', false);
test('"lines: true" is a noop with "encoding: hex"', testOtherEncoding, simpleFullHex, 'hex', false);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline', testOtherEncoding, simpleFullHex, 'hex', true);

const getSimpleChunkSubprocess = (stripFinalNewline, options) => execa('noop-fd.js', ['1', ...simpleChunks], {
	lines: true,
	stripFinalNewline,
	...options,
});

const testAsyncIteration = async (t, expectedOutput, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocess(stripFinalNewline);
	const [stdout] = await Promise.all([subprocess.stdout.toArray(), subprocess]);
	t.deepEqual(stdout, expectedOutput);
};

test('"lines: true" works with stream async iteration, string', testAsyncIteration, simpleLines, false);
test('"lines: true" works with stream async iteration, string, stripFinalNewline', testAsyncIteration, noNewlinesChunks, true);

const testDataEvents = async (t, [expectedFirstLine], stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocess(stripFinalNewline);
	const [[firstLine]] = await Promise.all([once(subprocess.stdout, 'data'), subprocess]);
	t.deepEqual(firstLine, expectedFirstLine);
};

test('"lines: true" works with stream "data" events, string', testDataEvents, simpleLines, false);
test('"lines: true" works with stream "data" events, string, stripFinalNewline', testDataEvents, noNewlinesChunks, true);

const testWritableStream = async (t, expectedOutput, stripFinalNewline) => {
	const lines = [];
	const writable = new Writable({
		write(line, encoding, done) {
			lines.push(line);
			done();
		},
		decodeStrings: false,
	});
	await getSimpleChunkSubprocess(stripFinalNewline, {stdout: ['pipe', writable]});
	t.deepEqual(lines, expectedOutput);
};

test('"lines: true" works with writable streams targets, string', testWritableStream, simpleLines, false);
test('"lines: true" works with writable streams targets, string, stripFinalNewline', testWritableStream, noNewlinesChunks, true);
