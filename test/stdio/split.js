import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {
	getChunksGenerator,
	getOutputsGenerator,
	noopGenerator,
	noopAsyncGenerator,
} from '../helpers/generator.js';
import {foobarString, foobarUint8Array, foobarObject, foobarObjectString} from '../helpers/input.js';
import {
	simpleFull,
	simpleChunks,
	simpleFullUint8Array,
	simpleChunksUint8Array,
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

const resultGenerator = function * (lines, chunk) {
	lines.push(chunk);
	yield chunk;
};

// eslint-disable-next-line max-params
const testLines = async (t, fdNumber, input, expectedLines, expectedOutput, objectMode, preserveNewlines) => {
	const lines = [];
	const {stdio} = await execa('noop-fd.js', [`${fdNumber}`], {
		...getStdio(fdNumber, [
			getChunksGenerator(input, false, true),
			{transform: resultGenerator.bind(undefined, lines), preserveNewlines, objectMode},
		]),
		stripFinalNewline: false,
	});
	t.deepEqual(lines, expectedLines);
	t.deepEqual(stdio[fdNumber], expectedOutput);
};

test('Split stdout - n newlines, 1 chunk', testLines, 1, simpleChunks, simpleLines, simpleFull, false, true);
test('Split stderr - n newlines, 1 chunk', testLines, 2, simpleChunks, simpleLines, simpleFull, false, true);
test('Split stdio[*] - n newlines, 1 chunk', testLines, 3, simpleChunks, simpleLines, simpleFull, false, true);
test('Split stdout - preserveNewlines, n chunks', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesFull, false, true);
test('Split stdout - 0 newlines, 1 chunk', testLines, 1, singleChunks, singleChunks, singleFull, false, true);
test('Split stdout - empty, 1 chunk', testLines, 1, emptyChunks, noLines, emptyFull, false, true);
test('Split stdout - Windows newlines', testLines, 1, windowsChunks, windowsLines, windowsFull, false, true);
test('Split stdout - chunk ends with newline', testLines, 1, simpleFullEndChunks, simpleFullEndLines, simpleFullEnd, false, true);
test('Split stdout - single newline', testLines, 1, newlineChunks, newlineChunks, newlineFull, false, true);
test('Split stdout - only newlines', testLines, 1, newlinesChunks, newlinesLines, newlinesFull, false, true);
test('Split stdout - only Windows newlines', testLines, 1, windowsNewlinesChunks, windowsNewlinesLines, windowsNewlinesFull, false, true);
test('Split stdout - line split over multiple chunks', testLines, 1, runOverChunks, simpleLines, simpleFull, false, true);
test('Split stdout - 0 newlines, big line', testLines, 1, bigChunks, bigChunks, bigFull, false, true);
test('Split stdout - 0 newlines, many chunks', testLines, 1, manyChunks, manyLines, manyFull, false, true);
test('Split stdout - n newlines, 1 chunk, objectMode', testLines, 1, simpleChunks, simpleLines, simpleLines, true, true);
test('Split stderr - n newlines, 1 chunk, objectMode', testLines, 2, simpleChunks, simpleLines, simpleLines, true, true);
test('Split stdio[*] - n newlines, 1 chunk, objectMode', testLines, 3, simpleChunks, simpleLines, simpleLines, true, true);
test('Split stdout - preserveNewlines, n chunks, objectMode', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesLines, true, true);
test('Split stdout - empty, 1 chunk, objectMode', testLines, 1, emptyChunks, noLines, noLines, true, true);
test('Split stdout - 0 newlines, 1 chunk, objectMode', testLines, 1, singleChunks, singleChunks, singleChunks, true, true);
test('Split stdout - Windows newlines, objectMode', testLines, 1, windowsChunks, windowsLines, windowsLines, true, true);
test('Split stdout - chunk ends with newline, objectMode', testLines, 1, simpleFullEndChunks, simpleFullEndLines, simpleFullEndLines, true, true);
test('Split stdout - single newline, objectMode', testLines, 1, newlineChunks, newlineChunks, newlineChunks, true, true);
test('Split stdout - only newlines, objectMode', testLines, 1, newlinesChunks, newlinesLines, newlinesLines, true, true);
test('Split stdout - only Windows newlines, objectMode', testLines, 1, windowsNewlinesChunks, windowsNewlinesLines, windowsNewlinesLines, true, true);
test('Split stdout - line split over multiple chunks, objectMode', testLines, 1, runOverChunks, simpleLines, simpleLines, true, true);
test('Split stdout - 0 newlines, big line, objectMode', testLines, 1, bigChunks, bigChunks, bigChunks, true, true);
test('Split stdout - 0 newlines, many chunks, objectMode', testLines, 1, manyChunks, manyLines, manyLines, true, true);
test('Split stdout - n newlines, 1 chunk, preserveNewlines', testLines, 1, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false);
test('Split stderr - n newlines, 1 chunk, preserveNewlines', testLines, 2, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false);
test('Split stdio[*] - n newlines, 1 chunk, preserveNewlines', testLines, 3, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false);
test('Split stdout - preserveNewlines, n chunks, preserveNewlines', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesFullEnd, false, false);
test('Split stdout - empty, 1 chunk, preserveNewlines', testLines, 1, emptyChunks, noLines, emptyFull, false, false);
test('Split stdout - 0 newlines, 1 chunk, preserveNewlines', testLines, 1, singleChunks, singleChunks, singleFullEnd, false, false);
test('Split stdout - Windows newlines, preserveNewlines', testLines, 1, windowsChunks, noNewlinesChunks, windowsFullEnd, false, false);
test('Split stdout - chunk ends with newline, preserveNewlines', testLines, 1, simpleFullEndChunks, noNewlinesChunks, simpleFullEnd, false, false);
test('Split stdout - single newline, preserveNewlines', testLines, 1, newlineChunks, emptyChunks, newlineFull, false, false);
test('Split stdout - only newlines, preserveNewlines', testLines, 1, newlinesChunks, manyEmptyChunks, newlinesFull, false, false);
test('Split stdout - only Windows newlines, preserveNewlines', testLines, 1, windowsNewlinesChunks, manyEmptyChunks, windowsNewlinesFull, false, false);
test('Split stdout - line split over multiple chunks, preserveNewlines', testLines, 1, runOverChunks, noNewlinesChunks, simpleFullEnd, false, false);
test('Split stdout - 0 newlines, big line, preserveNewlines', testLines, 1, bigChunks, bigChunks, bigFullEnd, false, false);
test('Split stdout - 0 newlines, many chunks, preserveNewlines', testLines, 1, manyChunks, manyLines, manyFullEnd, false, false);
test('Split stdout - n newlines, 1 chunk, objectMode, preserveNewlines', testLines, 1, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false);
test('Split stderr - n newlines, 1 chunk, objectMode, preserveNewlines', testLines, 2, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false);
test('Split stdio[*] - n newlines, 1 chunk, objectMode, preserveNewlines', testLines, 3, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false);
test('Split stdout - preserveNewlines, n chunks, objectMode, preserveNewlines', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesLines, true, false);
test('Split stdout - empty, 1 chunk, objectMode, preserveNewlines', testLines, 1, emptyChunks, noLines, noLines, true, false);
test('Split stdout - 0 newlines, 1 chunk, objectMode, preserveNewlines', testLines, 1, singleChunks, singleChunks, singleChunks, true, false);
test('Split stdout - Windows newlines, objectMode, preserveNewlines', testLines, 1, windowsChunks, noNewlinesChunks, noNewlinesChunks, true, false);
test('Split stdout - chunk ends with newline, objectMode, preserveNewlines', testLines, 1, simpleFullEndChunks, noNewlinesChunks, noNewlinesChunks, true, false);
test('Split stdout - single newline, objectMode, preserveNewlines', testLines, 1, newlineChunks, emptyChunks, emptyChunks, true, false);
test('Split stdout - only newlines, objectMode, preserveNewlines', testLines, 1, newlinesChunks, manyEmptyChunks, manyEmptyChunks, true, false);
test('Split stdout - only Windows newlines, objectMode, preserveNewlines', testLines, 1, windowsNewlinesChunks, manyEmptyChunks, manyEmptyChunks, true, false);
test('Split stdout - line split over multiple chunks, objectMode, preserveNewlines', testLines, 1, runOverChunks, noNewlinesChunks, noNewlinesChunks, true, false);
test('Split stdout - 0 newlines, big line, objectMode, preserveNewlines', testLines, 1, bigChunks, bigChunks, bigChunks, true, false);
test('Split stdout - 0 newlines, many chunks, objectMode, preserveNewlines', testLines, 1, manyChunks, manyLines, manyLines, true, false);

// eslint-disable-next-line max-params
const testBinaryOption = async (t, binary, input, expectedLines, expectedOutput, objectMode, preserveNewlines, encoding) => {
	const lines = [];
	const {stdout} = await execa('noop.js', {
		stdout: [
			getChunksGenerator(input, false, true),
			{transform: resultGenerator.bind(undefined, lines), binary, preserveNewlines, objectMode},
		],
		stripFinalNewline: false,
		encoding,
	});
	t.deepEqual(lines, expectedLines);
	t.deepEqual(stdout, expectedOutput);
};

test('Does not split lines when "binary" is true', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFull, false, true);
test('Splits lines when "binary" is false', testBinaryOption, false, simpleChunks, simpleLines, simpleFull, false, true);
test('Splits lines when "binary" is undefined', testBinaryOption, undefined, simpleChunks, simpleLines, simpleFull, false, true);
test('Does not split lines when "binary" is undefined, encoding "buffer"', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, true, 'buffer');
test('Does not split lines when "binary" is false, encoding "buffer"', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, true, 'buffer');
test('Does not split lines when "binary" is true, objectMode', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleChunksUint8Array, true, true);
test('Splits lines when "binary" is false, objectMode', testBinaryOption, false, simpleChunks, simpleLines, simpleLines, true, true);
test('Splits lines when "binary" is undefined, objectMode', testBinaryOption, undefined, simpleChunks, simpleLines, simpleLines, true, true);
test('Does not split lines when "binary" is true, preserveNewlines', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFull, false, false);
test('Splits lines when "binary" is false, preserveNewlines', testBinaryOption, false, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false);
test('Splits lines when "binary" is undefined, preserveNewlines', testBinaryOption, undefined, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false);
test('Does not split lines when "binary" is undefined, encoding "buffer", preserveNewlines', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, false, 'buffer');
test('Does not split lines when "binary" is false, encoding "buffer", preserveNewlines', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, false, 'buffer');
test('Does not split lines when "binary" is true, objectMode, preserveNewlines', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleChunksUint8Array, true, false);
test('Splits lines when "binary" is false, objectMode, preserveNewlines', testBinaryOption, false, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false);
test('Splits lines when "binary" is undefined, objectMode, preserveNewlines', testBinaryOption, undefined, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false);

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

const testStripNewline = async (t, input, expectedOutput) => {
	const {stdout} = await execa('noop.js', {
		stdout: getChunksGenerator([input]),
		stripFinalNewline: false,
	});
	t.is(stdout, expectedOutput);
};

test('Strips newline when user do not mistakenly yield one at the end', testStripNewline, singleFull, singleFullEnd);
test('Strips newline when user mistakenly yielded one at the end', testStripNewline, singleFullEnd, singleFullEnd);
test('Strips newline when user mistakenly yielded one at the end, Windows newline', testStripNewline, singleFullEndWindows, singleFullEndWindows);

const testMixNewlines = async (t, generator) => {
	const {stdout} = await execa('noop-fd.js', ['1', mixedNewlines], {
		stdout: generator(),
		stripFinalNewline: false,
	});
	t.is(stdout, mixedNewlines);
};

test('Can mix Unix and Windows newlines', testMixNewlines, noopGenerator);
test('Can mix Unix and Windows newlines, async', testMixNewlines, noopAsyncGenerator);

const serializeResultGenerator = function * (lines, chunk) {
	lines.push(chunk);
	yield JSON.stringify(chunk);
};

const testUnsetObjectMode = async (t, expectedOutput, preserveNewlines) => {
	const lines = [];
	const {stdout} = await execa('noop.js', {
		stdout: [
			getChunksGenerator([foobarObject], true),
			{transform: serializeResultGenerator.bind(undefined, lines), preserveNewlines, objectMode: false},
		],
		stripFinalNewline: false,
	});
	t.deepEqual(lines, [foobarObject]);
	t.is(stdout, expectedOutput);
};

test('Can switch from objectMode to non-objectMode', testUnsetObjectMode, `${foobarObjectString}\n`, false);
test('Can switch from objectMode to non-objectMode, preserveNewlines', testUnsetObjectMode, foobarObjectString, true);

const testYieldArray = async (t, input, expectedLines, expectedOutput) => {
	const lines = [];
	const {stdout} = await execa('noop.js', {
		stdout: [
			getOutputsGenerator(input),
			resultGenerator.bind(undefined, lines),
		],
		stripFinalNewline: false,
	});
	t.deepEqual(lines, expectedLines);
	t.deepEqual(stdout, expectedOutput);
};

test('Can use "yield* array" to produce multiple lines', testYieldArray, [foobarString, foobarString], [foobarString, foobarString], `${foobarString}\n${foobarString}\n`);
test('Can use "yield* array" to produce empty lines', testYieldArray, [foobarString, ''], [foobarString, ''], `${foobarString}\n\n`);
