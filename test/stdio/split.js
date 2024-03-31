import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {
	getOutputsGenerator,
	noopGenerator,
	noopAsyncGenerator,
	resultGenerator,
} from '../helpers/generator.js';
import {foobarString, foobarUint8Array, foobarObject, foobarObjectString} from '../helpers/input.js';
import {
	simpleFull,
	simpleChunks,
	simpleFullUint8Array,
	simpleChunksUint8Array,
	simpleFullHex,
	simpleLines,
	simpleFullEndLines,
	noNewlinesFull,
	noNewlinesChunks,
} from '../helpers/lines.js';

setFixtureDir();

const simpleFullEnd = `${simpleFull}\n`;
const simpleFullEndChunks = [simpleFullEnd];
const windowsFull = 'aaa\r\nbbb\r\nccc';
const windowsFullEnd = `${windowsFull}\r\n`;
const windowsChunks = [windowsFull];
const windowsLines = ['aaa\r\n', 'bbb\r\n', 'ccc'];
const noNewlinesFullEnd = `${noNewlinesFull}\n`;
const noNewlinesLines = ['aaabbbccc'];
const singleFull = 'aaa';
const singleFullEnd = `${singleFull}\n`;
const singleFullEndWindows = `${singleFull}\r\n`;
const singleChunks = [singleFull];
const noLines = [];
const emptyFull = '';
const emptyChunks = [emptyFull];
const manyEmptyChunks = [emptyFull, emptyFull, emptyFull];
const newlineFull = '\n';
const newlineChunks = [newlineFull];
const newlinesFull = '\n\n\n';
const newlinesChunks = [newlinesFull];
const newlinesLines = ['\n', '\n', '\n'];
const windowsNewlinesFull = '\r\n\r\n\r\n';
const windowsNewlinesChunks = [windowsNewlinesFull];
const windowsNewlinesLines = ['\r\n', '\r\n', '\r\n'];
const runOverChunks = ['aaa\nb', 'b', 'b\nccc'];
const bigFull = '.'.repeat(1e5);
const bigFullEnd = `${bigFull}\n`;
const bigChunks = [bigFull];
const manyChunks = Array.from({length: 1e3}).fill('.');
const manyFull = manyChunks.join('');
const manyFullEnd = `${manyFull}\n`;
const manyLines = [manyFull];
const mixedNewlines = '.\n.\r\n.\n.\r\n.\n';

// eslint-disable-next-line max-params
const testLines = async (t, fdNumber, input, expectedLines, expectedOutput, objectMode, preserveNewlines, execaMethod) => {
	const lines = [];
	const {stdio} = await execaMethod('noop-fd.js', [`${fdNumber}`], {
		...getStdio(fdNumber, [
			getOutputsGenerator(input)(false, true),
			resultGenerator(lines)(objectMode, false, preserveNewlines),
		]),
		stripFinalNewline: false,
	});
	t.deepEqual(lines, expectedLines);
	t.deepEqual(stdio[fdNumber], expectedOutput);
};

test('Split stdout - n newlines, 1 chunk', testLines, 1, simpleChunks, simpleLines, simpleFull, false, true, execa);
test('Split stderr - n newlines, 1 chunk', testLines, 2, simpleChunks, simpleLines, simpleFull, false, true, execa);
test('Split stdio[*] - n newlines, 1 chunk', testLines, 3, simpleChunks, simpleLines, simpleFull, false, true, execa);
test('Split stdout - preserveNewlines, n chunks', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesFull, false, true, execa);
test('Split stdout - 0 newlines, 1 chunk', testLines, 1, singleChunks, singleChunks, singleFull, false, true, execa);
test('Split stdout - empty, 1 chunk', testLines, 1, emptyChunks, noLines, emptyFull, false, true, execa);
test('Split stdout - Windows newlines', testLines, 1, windowsChunks, windowsLines, windowsFull, false, true, execa);
test('Split stdout - chunk ends with newline', testLines, 1, simpleFullEndChunks, simpleFullEndLines, simpleFullEnd, false, true, execa);
test('Split stdout - single newline', testLines, 1, newlineChunks, newlineChunks, newlineFull, false, true, execa);
test('Split stdout - only newlines', testLines, 1, newlinesChunks, newlinesLines, newlinesFull, false, true, execa);
test('Split stdout - only Windows newlines', testLines, 1, windowsNewlinesChunks, windowsNewlinesLines, windowsNewlinesFull, false, true, execa);
test('Split stdout - line split over multiple chunks', testLines, 1, runOverChunks, simpleLines, simpleFull, false, true, execa);
test('Split stdout - 0 newlines, big line', testLines, 1, bigChunks, bigChunks, bigFull, false, true, execa);
test('Split stdout - 0 newlines, many chunks', testLines, 1, manyChunks, manyLines, manyFull, false, true, execa);
test('Split stdout - n newlines, 1 chunk, objectMode', testLines, 1, simpleChunks, simpleLines, simpleLines, true, true, execa);
test('Split stderr - n newlines, 1 chunk, objectMode', testLines, 2, simpleChunks, simpleLines, simpleLines, true, true, execa);
test('Split stdio[*] - n newlines, 1 chunk, objectMode', testLines, 3, simpleChunks, simpleLines, simpleLines, true, true, execa);
test('Split stdout - preserveNewlines, n chunks, objectMode', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesLines, true, true, execa);
test('Split stdout - empty, 1 chunk, objectMode', testLines, 1, emptyChunks, noLines, noLines, true, true, execa);
test('Split stdout - 0 newlines, 1 chunk, objectMode', testLines, 1, singleChunks, singleChunks, singleChunks, true, true, execa);
test('Split stdout - Windows newlines, objectMode', testLines, 1, windowsChunks, windowsLines, windowsLines, true, true, execa);
test('Split stdout - chunk ends with newline, objectMode', testLines, 1, simpleFullEndChunks, simpleFullEndLines, simpleFullEndLines, true, true, execa);
test('Split stdout - single newline, objectMode', testLines, 1, newlineChunks, newlineChunks, newlineChunks, true, true, execa);
test('Split stdout - only newlines, objectMode', testLines, 1, newlinesChunks, newlinesLines, newlinesLines, true, true, execa);
test('Split stdout - only Windows newlines, objectMode', testLines, 1, windowsNewlinesChunks, windowsNewlinesLines, windowsNewlinesLines, true, true, execa);
test('Split stdout - line split over multiple chunks, objectMode', testLines, 1, runOverChunks, simpleLines, simpleLines, true, true, execa);
test('Split stdout - 0 newlines, big line, objectMode', testLines, 1, bigChunks, bigChunks, bigChunks, true, true, execa);
test('Split stdout - 0 newlines, many chunks, objectMode', testLines, 1, manyChunks, manyLines, manyLines, true, true, execa);
test('Split stdout - n newlines, 1 chunk, preserveNewlines', testLines, 1, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, execa);
test('Split stderr - n newlines, 1 chunk, preserveNewlines', testLines, 2, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, execa);
test('Split stdio[*] - n newlines, 1 chunk, preserveNewlines', testLines, 3, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, execa);
test('Split stdout - preserveNewlines, n chunks, preserveNewlines', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesFullEnd, false, false, execa);
test('Split stdout - empty, 1 chunk, preserveNewlines', testLines, 1, emptyChunks, noLines, emptyFull, false, false, execa);
test('Split stdout - 0 newlines, 1 chunk, preserveNewlines', testLines, 1, singleChunks, singleChunks, singleFullEnd, false, false, execa);
test('Split stdout - Windows newlines, preserveNewlines', testLines, 1, windowsChunks, noNewlinesChunks, windowsFullEnd, false, false, execa);
test('Split stdout - chunk ends with newline, preserveNewlines', testLines, 1, simpleFullEndChunks, noNewlinesChunks, simpleFullEnd, false, false, execa);
test('Split stdout - single newline, preserveNewlines', testLines, 1, newlineChunks, emptyChunks, newlineFull, false, false, execa);
test('Split stdout - only newlines, preserveNewlines', testLines, 1, newlinesChunks, manyEmptyChunks, newlinesFull, false, false, execa);
test('Split stdout - only Windows newlines, preserveNewlines', testLines, 1, windowsNewlinesChunks, manyEmptyChunks, windowsNewlinesFull, false, false, execa);
test('Split stdout - line split over multiple chunks, preserveNewlines', testLines, 1, runOverChunks, noNewlinesChunks, simpleFullEnd, false, false, execa);
test('Split stdout - 0 newlines, big line, preserveNewlines', testLines, 1, bigChunks, bigChunks, bigFullEnd, false, false, execa);
test('Split stdout - 0 newlines, many chunks, preserveNewlines', testLines, 1, manyChunks, manyLines, manyFullEnd, false, false, execa);
test('Split stdout - n newlines, 1 chunk, objectMode, preserveNewlines', testLines, 1, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, execa);
test('Split stderr - n newlines, 1 chunk, objectMode, preserveNewlines', testLines, 2, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, execa);
test('Split stdio[*] - n newlines, 1 chunk, objectMode, preserveNewlines', testLines, 3, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, execa);
test('Split stdout - preserveNewlines, n chunks, objectMode, preserveNewlines', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesLines, true, false, execa);
test('Split stdout - empty, 1 chunk, objectMode, preserveNewlines', testLines, 1, emptyChunks, noLines, noLines, true, false, execa);
test('Split stdout - 0 newlines, 1 chunk, objectMode, preserveNewlines', testLines, 1, singleChunks, singleChunks, singleChunks, true, false, execa);
test('Split stdout - Windows newlines, objectMode, preserveNewlines', testLines, 1, windowsChunks, noNewlinesChunks, noNewlinesChunks, true, false, execa);
test('Split stdout - chunk ends with newline, objectMode, preserveNewlines', testLines, 1, simpleFullEndChunks, noNewlinesChunks, noNewlinesChunks, true, false, execa);
test('Split stdout - single newline, objectMode, preserveNewlines', testLines, 1, newlineChunks, emptyChunks, emptyChunks, true, false, execa);
test('Split stdout - only newlines, objectMode, preserveNewlines', testLines, 1, newlinesChunks, manyEmptyChunks, manyEmptyChunks, true, false, execa);
test('Split stdout - only Windows newlines, objectMode, preserveNewlines', testLines, 1, windowsNewlinesChunks, manyEmptyChunks, manyEmptyChunks, true, false, execa);
test('Split stdout - line split over multiple chunks, objectMode, preserveNewlines', testLines, 1, runOverChunks, noNewlinesChunks, noNewlinesChunks, true, false, execa);
test('Split stdout - 0 newlines, big line, objectMode, preserveNewlines', testLines, 1, bigChunks, bigChunks, bigChunks, true, false, execa);
test('Split stdout - 0 newlines, many chunks, objectMode, preserveNewlines', testLines, 1, manyChunks, manyLines, manyLines, true, false, execa);
test('Split stdout - n newlines, 1 chunk, sync', testLines, 1, simpleChunks, simpleLines, simpleFull, false, true, execaSync);
test('Split stderr - n newlines, 1 chunk, sync', testLines, 2, simpleChunks, simpleLines, simpleFull, false, true, execaSync);
test('Split stdio[*] - n newlines, 1 chunk, sync', testLines, 3, simpleChunks, simpleLines, simpleFull, false, true, execaSync);
test('Split stdout - preserveNewlines, n chunks, sync', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesFull, false, true, execaSync);
test('Split stdout - 0 newlines, 1 chunk, sync', testLines, 1, singleChunks, singleChunks, singleFull, false, true, execaSync);
test('Split stdout - empty, 1 chunk, sync', testLines, 1, emptyChunks, noLines, emptyFull, false, true, execaSync);
test('Split stdout - Windows newlines, sync', testLines, 1, windowsChunks, windowsLines, windowsFull, false, true, execaSync);
test('Split stdout - chunk ends with newline, sync', testLines, 1, simpleFullEndChunks, simpleFullEndLines, simpleFullEnd, false, true, execaSync);
test('Split stdout - single newline, sync', testLines, 1, newlineChunks, newlineChunks, newlineFull, false, true, execaSync);
test('Split stdout - only newlines, sync', testLines, 1, newlinesChunks, newlinesLines, newlinesFull, false, true, execaSync);
test('Split stdout - only Windows newlines, sync', testLines, 1, windowsNewlinesChunks, windowsNewlinesLines, windowsNewlinesFull, false, true, execaSync);
test('Split stdout - line split over multiple chunks, sync', testLines, 1, runOverChunks, simpleLines, simpleFull, false, true, execaSync);
test('Split stdout - 0 newlines, big line, sync', testLines, 1, bigChunks, bigChunks, bigFull, false, true, execaSync);
test('Split stdout - 0 newlines, many chunks, sync', testLines, 1, manyChunks, manyLines, manyFull, false, true, execaSync);
test('Split stdout - n newlines, 1 chunk, objectMode, sync', testLines, 1, simpleChunks, simpleLines, simpleLines, true, true, execaSync);
test('Split stderr - n newlines, 1 chunk, objectMode, sync', testLines, 2, simpleChunks, simpleLines, simpleLines, true, true, execaSync);
test('Split stdio[*] - n newlines, 1 chunk, objectMode, sync', testLines, 3, simpleChunks, simpleLines, simpleLines, true, true, execaSync);
test('Split stdout - preserveNewlines, n chunks, objectMode, sync', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesLines, true, true, execaSync);
test('Split stdout - empty, 1 chunk, objectMode, sync', testLines, 1, emptyChunks, noLines, noLines, true, true, execaSync);
test('Split stdout - 0 newlines, 1 chunk, objectMode, sync', testLines, 1, singleChunks, singleChunks, singleChunks, true, true, execaSync);
test('Split stdout - Windows newlines, objectMode, sync', testLines, 1, windowsChunks, windowsLines, windowsLines, true, true, execaSync);
test('Split stdout - chunk ends with newline, objectMode, sync', testLines, 1, simpleFullEndChunks, simpleFullEndLines, simpleFullEndLines, true, true, execaSync);
test('Split stdout - single newline, objectMode, sync', testLines, 1, newlineChunks, newlineChunks, newlineChunks, true, true, execaSync);
test('Split stdout - only newlines, objectMode, sync', testLines, 1, newlinesChunks, newlinesLines, newlinesLines, true, true, execaSync);
test('Split stdout - only Windows newlines, objectMode, sync', testLines, 1, windowsNewlinesChunks, windowsNewlinesLines, windowsNewlinesLines, true, true, execaSync);
test('Split stdout - line split over multiple chunks, objectMode, sync', testLines, 1, runOverChunks, simpleLines, simpleLines, true, true, execaSync);
test('Split stdout - 0 newlines, big line, objectMode, sync', testLines, 1, bigChunks, bigChunks, bigChunks, true, true, execaSync);
test('Split stdout - 0 newlines, many chunks, objectMode, sync', testLines, 1, manyChunks, manyLines, manyLines, true, true, execaSync);
test('Split stdout - n newlines, 1 chunk, preserveNewlines, sync', testLines, 1, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, execaSync);
test('Split stderr - n newlines, 1 chunk, preserveNewlines, sync', testLines, 2, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, execaSync);
test('Split stdio[*] - n newlines, 1 chunk, preserveNewlines, sync', testLines, 3, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, execaSync);
test('Split stdout - preserveNewlines, n chunks, preserveNewlines, sync', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesFullEnd, false, false, execaSync);
test('Split stdout - empty, 1 chunk, preserveNewlines, sync', testLines, 1, emptyChunks, noLines, emptyFull, false, false, execaSync);
test('Split stdout - 0 newlines, 1 chunk, preserveNewlines, sync', testLines, 1, singleChunks, singleChunks, singleFullEnd, false, false, execaSync);
test('Split stdout - Windows newlines, preserveNewlines, sync', testLines, 1, windowsChunks, noNewlinesChunks, windowsFullEnd, false, false, execaSync);
test('Split stdout - chunk ends with newline, preserveNewlines, sync', testLines, 1, simpleFullEndChunks, noNewlinesChunks, simpleFullEnd, false, false, execaSync);
test('Split stdout - single newline, preserveNewlines, sync', testLines, 1, newlineChunks, emptyChunks, newlineFull, false, false, execaSync);
test('Split stdout - only newlines, preserveNewlines, sync', testLines, 1, newlinesChunks, manyEmptyChunks, newlinesFull, false, false, execaSync);
test('Split stdout - only Windows newlines, preserveNewlines, sync', testLines, 1, windowsNewlinesChunks, manyEmptyChunks, windowsNewlinesFull, false, false, execaSync);
test('Split stdout - line split over multiple chunks, preserveNewlines, sync', testLines, 1, runOverChunks, noNewlinesChunks, simpleFullEnd, false, false, execaSync);
test('Split stdout - 0 newlines, big line, preserveNewlines, sync', testLines, 1, bigChunks, bigChunks, bigFullEnd, false, false, execaSync);
test('Split stdout - 0 newlines, many chunks, preserveNewlines, sync', testLines, 1, manyChunks, manyLines, manyFullEnd, false, false, execaSync);
test('Split stdout - n newlines, 1 chunk, objectMode, preserveNewlines, sync', testLines, 1, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, execaSync);
test('Split stderr - n newlines, 1 chunk, objectMode, preserveNewlines, sync', testLines, 2, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, execaSync);
test('Split stdio[*] - n newlines, 1 chunk, objectMode, preserveNewlines, sync', testLines, 3, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, execaSync);
test('Split stdout - preserveNewlines, n chunks, objectMode, preserveNewlines, sync', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesLines, true, false, execaSync);
test('Split stdout - empty, 1 chunk, objectMode, preserveNewlines, sync', testLines, 1, emptyChunks, noLines, noLines, true, false, execaSync);
test('Split stdout - 0 newlines, 1 chunk, objectMode, preserveNewlines, sync', testLines, 1, singleChunks, singleChunks, singleChunks, true, false, execaSync);
test('Split stdout - Windows newlines, objectMode, preserveNewlines, sync', testLines, 1, windowsChunks, noNewlinesChunks, noNewlinesChunks, true, false, execaSync);
test('Split stdout - chunk ends with newline, objectMode, preserveNewlines, sync', testLines, 1, simpleFullEndChunks, noNewlinesChunks, noNewlinesChunks, true, false, execaSync);
test('Split stdout - single newline, objectMode, preserveNewlines, sync', testLines, 1, newlineChunks, emptyChunks, emptyChunks, true, false, execaSync);
test('Split stdout - only newlines, objectMode, preserveNewlines, sync', testLines, 1, newlinesChunks, manyEmptyChunks, manyEmptyChunks, true, false, execaSync);
test('Split stdout - only Windows newlines, objectMode, preserveNewlines, sync', testLines, 1, windowsNewlinesChunks, manyEmptyChunks, manyEmptyChunks, true, false, execaSync);
test('Split stdout - line split over multiple chunks, objectMode, preserveNewlines, sync', testLines, 1, runOverChunks, noNewlinesChunks, noNewlinesChunks, true, false, execaSync);
test('Split stdout - 0 newlines, big line, objectMode, preserveNewlines, sync', testLines, 1, bigChunks, bigChunks, bigChunks, true, false, execaSync);
test('Split stdout - 0 newlines, many chunks, objectMode, preserveNewlines, sync', testLines, 1, manyChunks, manyLines, manyLines, true, false, execaSync);

// eslint-disable-next-line max-params
const testBinaryOption = async (t, binary, input, expectedLines, expectedOutput, objectMode, preserveNewlines, encoding, execaMethod) => {
	const lines = [];
	const {stdout} = await execaMethod('noop.js', {
		stdout: [
			getOutputsGenerator(input)(false, true),
			resultGenerator(lines)(objectMode, binary, preserveNewlines),
		],
		stripFinalNewline: false,
		encoding,
	});
	t.deepEqual(lines, expectedLines);
	t.deepEqual(stdout, expectedOutput);
};

test('Does not split lines when "binary" is true', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFull, false, true, 'utf8', execa);
test('Splits lines when "binary" is false', testBinaryOption, false, simpleChunks, simpleLines, simpleFull, false, true, 'utf8', execa);
test('Splits lines when "binary" is undefined', testBinaryOption, undefined, simpleChunks, simpleLines, simpleFull, false, true, 'utf8', execa);
test('Does not split lines when "binary" is undefined, encoding "buffer"', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, true, 'buffer', execa);
test('Does not split lines when "binary" is false, encoding "buffer"', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, true, 'buffer', execa);
test('Does not split lines when "binary" is undefined, encoding "hex"', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, true, 'hex', execa);
test('Does not split lines when "binary" is false, encoding "hex"', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, true, 'hex', execa);
test('Does not split lines when "binary" is true, objectMode', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleChunksUint8Array, true, true, 'utf8', execa);
test('Splits lines when "binary" is false, objectMode', testBinaryOption, false, simpleChunks, simpleLines, simpleLines, true, true, 'utf8', execa);
test('Splits lines when "binary" is undefined, objectMode', testBinaryOption, undefined, simpleChunks, simpleLines, simpleLines, true, true, 'utf8', execa);
test('Does not split lines when "binary" is true, preserveNewlines', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFull, false, false, 'utf8', execa);
test('Splits lines when "binary" is false, preserveNewlines', testBinaryOption, false, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, 'utf8', execa);
test('Splits lines when "binary" is undefined, preserveNewlines', testBinaryOption, undefined, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, 'utf8', execa);
test('Does not split lines when "binary" is undefined, encoding "buffer", preserveNewlines', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, false, 'buffer', execa);
test('Does not split lines when "binary" is false, encoding "buffer", preserveNewlines', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, false, 'buffer', execa);
test('Does not split lines when "binary" is true, objectMode, preserveNewlines', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleChunksUint8Array, true, false, 'utf8', execa);
test('Does not split lines when "binary" is undefined, encoding "hex", preserveNewlines', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, false, 'hex', execa);
test('Does not split lines when "binary" is false, encoding "hex", preserveNewlines', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, false, 'hex', execa);
test('Splits lines when "binary" is false, objectMode, preserveNewlines', testBinaryOption, false, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, 'utf8', execa);
test('Splits lines when "binary" is undefined, objectMode, preserveNewlines', testBinaryOption, undefined, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, 'utf8', execa);
test('Does not split lines when "binary" is true, sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFull, false, true, 'utf8', execaSync);
test('Splits lines when "binary" is false, sync', testBinaryOption, false, simpleChunks, simpleLines, simpleFull, false, true, 'utf8', execaSync);
test('Splits lines when "binary" is undefined, sync', testBinaryOption, undefined, simpleChunks, simpleLines, simpleFull, false, true, 'utf8', execaSync);
test('Does not split lines when "binary" is undefined, encoding "buffer", sync', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, true, 'buffer', execaSync);
test('Does not split lines when "binary" is false, encoding "buffer", sync', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, true, 'buffer', execaSync);
test('Does not split lines when "binary" is undefined, encoding "hex", sync', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, true, 'hex', execaSync);
test('Does not split lines when "binary" is false, encoding "hex", sync', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, true, 'hex', execaSync);
test('Does not split lines when "binary" is true, objectMode, sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleChunksUint8Array, true, true, 'utf8', execaSync);
test('Splits lines when "binary" is false, objectMode, sync', testBinaryOption, false, simpleChunks, simpleLines, simpleLines, true, true, 'utf8', execaSync);
test('Splits lines when "binary" is undefined, objectMode, sync', testBinaryOption, undefined, simpleChunks, simpleLines, simpleLines, true, true, 'utf8', execaSync);
test('Does not split lines when "binary" is true, preserveNewlines, sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFull, false, false, 'utf8', execaSync);
test('Splits lines when "binary" is false, preserveNewlines, sync', testBinaryOption, false, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, 'utf8', execaSync);
test('Splits lines when "binary" is undefined, preserveNewlines, sync', testBinaryOption, undefined, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, 'utf8', execaSync);
test('Does not split lines when "binary" is undefined, encoding "buffer", preserveNewlines, sync', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, false, 'buffer', execaSync);
test('Does not split lines when "binary" is false, encoding "buffer", preserveNewlines, sync', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, false, 'buffer', execaSync);
test('Does not split lines when "binary" is true, objectMode, preserveNewlines, sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleChunksUint8Array, true, false, 'utf8', execaSync);
test('Does not split lines when "binary" is undefined, encoding "hex", preserveNewlines, sync', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, false, 'hex', execaSync);
test('Does not split lines when "binary" is false, encoding "hex", preserveNewlines, sync', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, false, 'hex', execaSync);
test('Splits lines when "binary" is false, objectMode, preserveNewlines, sync', testBinaryOption, false, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, 'utf8', execaSync);
test('Splits lines when "binary" is undefined, objectMode, preserveNewlines, sync', testBinaryOption, undefined, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, 'utf8', execaSync);

const resultUint8ArrayGenerator = function * (lines, chunk) {
	lines.push(chunk);
	yield new TextEncoder().encode(chunk);
};

const testStringToUint8Array = async (t, expectedOutput, objectMode, preserveNewlines) => {
	const lines = [];
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {
		stdout: {
			transform: resultUint8ArrayGenerator.bind(undefined, lines),
			objectMode,
			preserveNewlines,
		},
		lines: true,
	});
	t.deepEqual(lines, [foobarString]);
	t.deepEqual(stdout, expectedOutput);
};

test('Line splitting when converting from string to Uint8Array', testStringToUint8Array, [foobarString], false, true);
test('Line splitting when converting from string to Uint8Array, objectMode', testStringToUint8Array, [foobarUint8Array], true, true);
test('Line splitting when converting from string to Uint8Array, preserveNewlines', testStringToUint8Array, [foobarString], false, false);
test('Line splitting when converting from string to Uint8Array, objectMode, preserveNewlines', testStringToUint8Array, [foobarUint8Array], true, false);

const testStripNewline = async (t, input, expectedOutput, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: getOutputsGenerator([input])(),
		stripFinalNewline: false,
	});
	t.is(stdout, expectedOutput);
};

test('Strips newline when user do not mistakenly yield one at the end', testStripNewline, singleFull, singleFullEnd, execa);
test('Strips newline when user mistakenly yielded one at the end', testStripNewline, singleFullEnd, singleFullEnd, execa);
test('Strips newline when user mistakenly yielded one at the end, Windows newline', testStripNewline, singleFullEndWindows, singleFullEndWindows, execa);
test('Strips newline when user do not mistakenly yield one at the end, sync', testStripNewline, singleFull, singleFullEnd, execaSync);
test('Strips newline when user mistakenly yielded one at the end, sync', testStripNewline, singleFullEnd, singleFullEnd, execaSync);
test('Strips newline when user mistakenly yielded one at the end, Windows newline, sync', testStripNewline, singleFullEndWindows, singleFullEndWindows, execaSync);

const testMixNewlines = async (t, generator, execaMethod) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', mixedNewlines], {
		stdout: generator(),
		stripFinalNewline: false,
	});
	t.is(stdout, mixedNewlines);
};

test('Can mix Unix and Windows newlines', testMixNewlines, noopGenerator, execa);
test('Can mix Unix and Windows newlines, sync', testMixNewlines, noopGenerator, execaSync);
test('Can mix Unix and Windows newlines, async', testMixNewlines, noopAsyncGenerator, execa);

const serializeResultGenerator = function * (lines, chunk) {
	lines.push(chunk);
	yield JSON.stringify(chunk);
};

const testUnsetObjectMode = async (t, expectedOutput, preserveNewlines, execaMethod) => {
	const lines = [];
	const {stdout} = await execaMethod('noop.js', {
		stdout: [
			getOutputsGenerator([foobarObject])(true),
			{transform: serializeResultGenerator.bind(undefined, lines), preserveNewlines, objectMode: false},
		],
		stripFinalNewline: false,
	});
	t.deepEqual(lines, [foobarObject]);
	t.is(stdout, expectedOutput);
};

test('Can switch from objectMode to non-objectMode', testUnsetObjectMode, `${foobarObjectString}\n`, false, execa);
test('Can switch from objectMode to non-objectMode, preserveNewlines', testUnsetObjectMode, foobarObjectString, true, execa);
test('Can switch from objectMode to non-objectMode, sync', testUnsetObjectMode, `${foobarObjectString}\n`, false, execaSync);
test('Can switch from objectMode to non-objectMode, preserveNewlines, sync', testUnsetObjectMode, foobarObjectString, true, execaSync);

// eslint-disable-next-line max-params
const testYieldArray = async (t, input, expectedLines, expectedOutput, execaMethod) => {
	const lines = [];
	const {stdout} = await execaMethod('noop.js', {
		stdout: [
			getOutputsGenerator(input)(),
			resultGenerator(lines)(),
		],
		stripFinalNewline: false,
	});
	t.deepEqual(lines, expectedLines);
	t.deepEqual(stdout, expectedOutput);
};

test('Can use "yield* array" to produce multiple lines', testYieldArray, [foobarString, foobarString], [foobarString, foobarString], `${foobarString}\n${foobarString}\n`, execa);
test('Can use "yield* array" to produce empty lines', testYieldArray, [foobarString, ''], [foobarString, ''], `${foobarString}\n\n`, execa);
test('Can use "yield* array" to produce multiple lines, sync', testYieldArray, [foobarString, foobarString], [foobarString, foobarString], `${foobarString}\n${foobarString}\n`, execaSync);
test('Can use "yield* array" to produce empty lines, sync', testYieldArray, [foobarString, ''], [foobarString, ''], `${foobarString}\n\n`, execaSync);
