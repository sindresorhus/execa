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
	simpleLines,
	simpleFullEndLines,
	noNewlinesChunks,
	getEncoding,
	stringsToUint8Arrays,
	serializeResult,
} from '../helpers/lines.js';

setFixtureDir();

const simpleFullEnd = `${simpleFull}\n`;
const simpleFullEndChunks = [simpleFullEnd];
const windowsFull = 'aaa\r\nbbb\r\nccc';
const windowsFullEnd = `${windowsFull}\r\n`;
const windowsChunks = [windowsFull];
const windowsLines = ['aaa\r\n', 'bbb\r\n', 'ccc'];
const noNewlinesFull = 'aaabbbccc';
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
const testLines = async (t, fdNumber, input, expectedLines, expectedOutput, isUint8Array, objectMode, newline) => {
	const lines = [];
	const {stdio} = await execa('noop-fd.js', [`${fdNumber}`], {
		...getStdio(fdNumber, [
			getChunksGenerator(input, false, true),
			{transform: resultGenerator.bind(undefined, lines), newline, objectMode},
		]),
		encoding: getEncoding(isUint8Array),
		stripFinalNewline: false,
	});
	const output = serializeResult(stdio[fdNumber], isUint8Array);
	t.deepEqual(lines, stringsToUint8Arrays(expectedLines, isUint8Array));
	t.deepEqual(output, expectedOutput);
};

test('Split string stdout - n newlines, 1 chunk', testLines, 1, simpleChunks, simpleLines, simpleFull, false, false, true);
test('Split string stderr - n newlines, 1 chunk', testLines, 2, simpleChunks, simpleLines, simpleFull, false, false, true);
test('Split string stdio[*] - n newlines, 1 chunk', testLines, 3, simpleChunks, simpleLines, simpleFull, false, false, true);
test('Split string stdout - keep newline, n chunks', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesFull, false, false, true);
test('Split string stdout - 0 newlines, 1 chunk', testLines, 1, singleChunks, singleChunks, singleFull, false, false, true);
test('Split string stdout - empty, 1 chunk', testLines, 1, emptyChunks, noLines, emptyFull, false, false, true);
test('Split string stdout - Windows newlines', testLines, 1, windowsChunks, windowsLines, windowsFull, false, false, true);
test('Split string stdout - chunk ends with newline', testLines, 1, simpleFullEndChunks, simpleFullEndLines, simpleFullEnd, false, false, true);
test('Split string stdout - single newline', testLines, 1, newlineChunks, newlineChunks, newlineFull, false, false, true);
test('Split string stdout - only newlines', testLines, 1, newlinesChunks, newlinesLines, newlinesFull, false, false, true);
test('Split string stdout - only Windows newlines', testLines, 1, windowsNewlinesChunks, windowsNewlinesLines, windowsNewlinesFull, false, false, true);
test('Split string stdout - line split over multiple chunks', testLines, 1, runOverChunks, simpleLines, simpleFull, false, false, true);
test('Split string stdout - 0 newlines, big line', testLines, 1, bigChunks, bigChunks, bigFull, false, false, true);
test('Split string stdout - 0 newlines, many chunks', testLines, 1, manyChunks, manyLines, manyFull, false, false, true);
test('Split Uint8Array stdout - n newlines, 1 chunk', testLines, 1, simpleChunks, simpleLines, simpleFull, true, false, true);
test('Split Uint8Array stderr - n newlines, 1 chunk', testLines, 2, simpleChunks, simpleLines, simpleFull, true, false, true);
test('Split Uint8Array stdio[*] - n newlines, 1 chunk', testLines, 3, simpleChunks, simpleLines, simpleFull, true, false, true);
test('Split Uint8Array stdout - keep newline, n chunks', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesFull, true, false, true);
test('Split Uint8Array stdout - empty, 1 chunk', testLines, 1, emptyChunks, noLines, emptyFull, true, false, true);
test('Split Uint8Array stdout - 0 newlines, 1 chunk', testLines, 1, singleChunks, singleChunks, singleFull, true, false, true);
test('Split Uint8Array stdout - Windows newlines', testLines, 1, windowsChunks, windowsLines, windowsFull, true, false, true);
test('Split Uint8Array stdout - chunk ends with newline', testLines, 1, simpleFullEndChunks, simpleFullEndLines, simpleFullEnd, true, false, true);
test('Split Uint8Array stdout - single newline', testLines, 1, newlineChunks, newlineChunks, newlineFull, true, false, true);
test('Split Uint8Array stdout - only newlines', testLines, 1, newlinesChunks, newlinesLines, newlinesFull, true, false, true);
test('Split Uint8Array stdout - only Windows newlines', testLines, 1, windowsNewlinesChunks, windowsNewlinesLines, windowsNewlinesFull, true, false, true);
test('Split Uint8Array stdout - line split over multiple chunks', testLines, 1, runOverChunks, simpleLines, simpleFull, true, false, true);
test('Split Uint8Array stdout - 0 newlines, big line', testLines, 1, bigChunks, bigChunks, bigFull, true, false, true);
test('Split Uint8Array stdout - 0 newlines, many chunks', testLines, 1, manyChunks, manyLines, manyFull, true, false, true);
test('Split string stdout - n newlines, 1 chunk, objectMode', testLines, 1, simpleChunks, simpleLines, simpleLines, false, true, true);
test('Split string stderr - n newlines, 1 chunk, objectMode', testLines, 2, simpleChunks, simpleLines, simpleLines, false, true, true);
test('Split string stdio[*] - n newlines, 1 chunk, objectMode', testLines, 3, simpleChunks, simpleLines, simpleLines, false, true, true);
test('Split string stdout - keep newline, n chunks, objectMode', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesLines, false, true, true);
test('Split string stdout - empty, 1 chunk, objectMode', testLines, 1, emptyChunks, noLines, noLines, false, true, true);
test('Split string stdout - 0 newlines, 1 chunk, objectMode', testLines, 1, singleChunks, singleChunks, singleChunks, false, true, true);
test('Split string stdout - Windows newlines, objectMode', testLines, 1, windowsChunks, windowsLines, windowsLines, false, true, true);
test('Split string stdout - chunk ends with newline, objectMode', testLines, 1, simpleFullEndChunks, simpleFullEndLines, simpleFullEndLines, false, true, true);
test('Split string stdout - single newline, objectMode', testLines, 1, newlineChunks, newlineChunks, newlineChunks, false, true, true);
test('Split string stdout - only newlines, objectMode', testLines, 1, newlinesChunks, newlinesLines, newlinesLines, false, true, true);
test('Split string stdout - only Windows newlines, objectMode', testLines, 1, windowsNewlinesChunks, windowsNewlinesLines, windowsNewlinesLines, false, true, true);
test('Split string stdout - line split over multiple chunks, objectMode', testLines, 1, runOverChunks, simpleLines, simpleLines, false, true, true);
test('Split string stdout - 0 newlines, big line, objectMode', testLines, 1, bigChunks, bigChunks, bigChunks, false, true, true);
test('Split string stdout - 0 newlines, many chunks, objectMode', testLines, 1, manyChunks, manyLines, manyLines, false, true, true);
test('Split Uint8Array stdout - n newlines, 1 chunk, objectMode', testLines, 1, simpleChunks, simpleLines, simpleLines, true, true, true);
test('Split Uint8Array stderr - n newlines, 1 chunk, objectMode', testLines, 2, simpleChunks, simpleLines, simpleLines, true, true, true);
test('Split Uint8Array stdio[*] - n newlines, 1 chunk, objectMode', testLines, 3, simpleChunks, simpleLines, simpleLines, true, true, true);
test('Split Uint8Array stdout - keep newline, n chunks, objectMode', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesLines, true, true, true);
test('Split Uint8Array stdout - empty, 1 chunk, objectMode', testLines, 1, emptyChunks, noLines, noLines, true, true, true);
test('Split Uint8Array stdout - 0 newlines, 1 chunk, objectMode', testLines, 1, singleChunks, singleChunks, singleChunks, true, true, true);
test('Split Uint8Array stdout - Windows newlines, objectMode', testLines, 1, windowsChunks, windowsLines, windowsLines, true, true, true);
test('Split Uint8Array stdout - chunk ends with newline, objectMode', testLines, 1, simpleFullEndChunks, simpleFullEndLines, simpleFullEndLines, true, true, true);
test('Split Uint8Array stdout - single newline, objectMode', testLines, 1, newlineChunks, newlineChunks, newlineChunks, true, true, true);
test('Split Uint8Array stdout - only newlines, objectMode', testLines, 1, newlinesChunks, newlinesLines, newlinesLines, true, true, true);
test('Split Uint8Array stdout - only Windows newlines, objectMode', testLines, 1, windowsNewlinesChunks, windowsNewlinesLines, windowsNewlinesLines, true, true, true);
test('Split Uint8Array stdout - line split over multiple chunks, objectMode', testLines, 1, runOverChunks, simpleLines, simpleLines, true, true, true);
test('Split Uint8Array stdout - 0 newlines, big line, objectMode', testLines, 1, bigChunks, bigChunks, bigChunks, true, true, true);
test('Split Uint8Array stdout - 0 newlines, many chunks, objectMode', testLines, 1, manyChunks, manyLines, manyLines, true, true, true);
test('Split string stdout - n newlines, 1 chunk, keep newline', testLines, 1, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, false);
test('Split string stderr - n newlines, 1 chunk, keep newline', testLines, 2, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, false);
test('Split string stdio[*] - n newlines, 1 chunk, keep newline', testLines, 3, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, false);
test('Split string stdout - keep newline, n chunks, keep newline', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesFullEnd, false, false, false);
test('Split string stdout - empty, 1 chunk, keep newline', testLines, 1, emptyChunks, noLines, emptyFull, false, false, false);
test('Split string stdout - 0 newlines, 1 chunk, keep newline', testLines, 1, singleChunks, singleChunks, singleFullEnd, false, false, false);
test('Split string stdout - Windows newlines, keep newline', testLines, 1, windowsChunks, noNewlinesChunks, windowsFullEnd, false, false, false);
test('Split string stdout - chunk ends with newline, keep newline', testLines, 1, simpleFullEndChunks, noNewlinesChunks, simpleFullEnd, false, false, false);
test('Split string stdout - single newline, keep newline', testLines, 1, newlineChunks, emptyChunks, newlineFull, false, false, false);
test('Split string stdout - only newlines, keep newline', testLines, 1, newlinesChunks, manyEmptyChunks, newlinesFull, false, false, false);
test('Split string stdout - only Windows newlines, keep newline', testLines, 1, windowsNewlinesChunks, manyEmptyChunks, windowsNewlinesFull, false, false, false);
test('Split string stdout - line split over multiple chunks, keep newline', testLines, 1, runOverChunks, noNewlinesChunks, simpleFullEnd, false, false, false);
test('Split string stdout - 0 newlines, big line, keep newline', testLines, 1, bigChunks, bigChunks, bigFullEnd, false, false, false);
test('Split string stdout - 0 newlines, many chunks, keep newline', testLines, 1, manyChunks, manyLines, manyFullEnd, false, false, false);
test('Split Uint8Array stdout - n newlines, 1 chunk, keep newline', testLines, 1, simpleChunks, noNewlinesChunks, simpleFullEnd, true, false, false);
test('Split Uint8Array stderr - n newlines, 1 chunk, keep newline', testLines, 2, simpleChunks, noNewlinesChunks, simpleFullEnd, true, false, false);
test('Split Uint8Array stdio[*] - n newlines, 1 chunk, keep newline', testLines, 3, simpleChunks, noNewlinesChunks, simpleFullEnd, true, false, false);
test('Split Uint8Array stdout - keep newline, n chunks, keep newline', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesFullEnd, true, false, false);
test('Split Uint8Array stdout - empty, 1 chunk, keep newline', testLines, 1, emptyChunks, noLines, emptyFull, true, false, false);
test('Split Uint8Array stdout - 0 newlines, 1 chunk, keep newline', testLines, 1, singleChunks, singleChunks, singleFullEnd, true, false, false);
test('Split Uint8Array stdout - Windows newlines, keep newline', testLines, 1, windowsChunks, noNewlinesChunks, windowsFullEnd, true, false, false);
test('Split Uint8Array stdout - chunk ends with newline, keep newline', testLines, 1, simpleFullEndChunks, noNewlinesChunks, simpleFullEnd, true, false, false);
test('Split Uint8Array stdout - single newline, keep newline', testLines, 1, newlineChunks, emptyChunks, newlineFull, true, false, false);
test('Split Uint8Array stdout - only newlines, keep newline', testLines, 1, newlinesChunks, manyEmptyChunks, newlinesFull, true, false, false);
test('Split Uint8Array stdout - only Windows newlines, keep newline', testLines, 1, windowsNewlinesChunks, manyEmptyChunks, windowsNewlinesFull, true, false, false);
test('Split Uint8Array stdout - line split over multiple chunks, keep newline', testLines, 1, runOverChunks, noNewlinesChunks, simpleFullEnd, true, false, false);
test('Split Uint8Array stdout - 0 newlines, big line, keep newline', testLines, 1, bigChunks, bigChunks, bigFullEnd, true, false, false);
test('Split Uint8Array stdout - 0 newlines, many chunks, keep newline', testLines, 1, manyChunks, manyLines, manyFullEnd, true, false, false);
test('Split string stdout - n newlines, 1 chunk, objectMode, keep newline', testLines, 1, simpleChunks, noNewlinesChunks, noNewlinesChunks, false, true, false);
test('Split string stderr - n newlines, 1 chunk, objectMode, keep newline', testLines, 2, simpleChunks, noNewlinesChunks, noNewlinesChunks, false, true, false);
test('Split string stdio[*] - n newlines, 1 chunk, objectMode, keep newline', testLines, 3, simpleChunks, noNewlinesChunks, noNewlinesChunks, false, true, false);
test('Split string stdout - keep newline, n chunks, objectMode, keep newline', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesLines, false, true, false);
test('Split string stdout - empty, 1 chunk, objectMode, keep newline', testLines, 1, emptyChunks, noLines, noLines, false, true, false);
test('Split string stdout - 0 newlines, 1 chunk, objectMode, keep newline', testLines, 1, singleChunks, singleChunks, singleChunks, false, true, false);
test('Split string stdout - Windows newlines, objectMode, keep newline', testLines, 1, windowsChunks, noNewlinesChunks, noNewlinesChunks, false, true, false);
test('Split string stdout - chunk ends with newline, objectMode, keep newline', testLines, 1, simpleFullEndChunks, noNewlinesChunks, noNewlinesChunks, false, true, false);
test('Split string stdout - single newline, objectMode, keep newline', testLines, 1, newlineChunks, emptyChunks, emptyChunks, false, true, false);
test('Split string stdout - only newlines, objectMode, keep newline', testLines, 1, newlinesChunks, manyEmptyChunks, manyEmptyChunks, false, true, false);
test('Split string stdout - only Windows newlines, objectMode, keep newline', testLines, 1, windowsNewlinesChunks, manyEmptyChunks, manyEmptyChunks, false, true, false);
test('Split string stdout - line split over multiple chunks, objectMode, keep newline', testLines, 1, runOverChunks, noNewlinesChunks, noNewlinesChunks, false, true, false);
test('Split string stdout - 0 newlines, big line, objectMode, keep newline', testLines, 1, bigChunks, bigChunks, bigChunks, false, true, false);
test('Split string stdout - 0 newlines, many chunks, objectMode, keep newline', testLines, 1, manyChunks, manyLines, manyLines, false, true, false);
test('Split Uint8Array stdout - n newlines, 1 chunk, objectMode, keep newline', testLines, 1, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, true, false);
test('Split Uint8Array stderr - n newlines, 1 chunk, objectMode, keep newline', testLines, 2, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, true, false);
test('Split Uint8Array stdio[*] - n newlines, 1 chunk, objectMode, keep newline', testLines, 3, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, true, false);
test('Split Uint8Array stdout - keep newline, n chunks, objectMode, keep newline', testLines, 1, noNewlinesChunks, noNewlinesLines, noNewlinesLines, true, true, false);
test('Split Uint8Array stdout - empty, 1 chunk, objectMode, keep newline', testLines, 1, emptyChunks, noLines, noLines, true, true, false);
test('Split Uint8Array stdout - 0 newlines, 1 chunk, objectMode, keep newline', testLines, 1, singleChunks, singleChunks, singleChunks, true, true, false);
test('Split Uint8Array stdout - Windows newlines, objectMode, keep newline', testLines, 1, windowsChunks, noNewlinesChunks, noNewlinesChunks, true, true, false);
test('Split Uint8Array stdout - chunk ends with newline, objectMode, keep newline', testLines, 1, simpleFullEndChunks, noNewlinesChunks, noNewlinesChunks, true, true, false);
test('Split Uint8Array stdout - single newline, objectMode, keep newline', testLines, 1, newlineChunks, emptyChunks, emptyChunks, true, true, false);
test('Split Uint8Array stdout - only newlines, objectMode, keep newline', testLines, 1, newlinesChunks, manyEmptyChunks, manyEmptyChunks, true, true, false);
test('Split Uint8Array stdout - only Windows newlines, objectMode, keep newline', testLines, 1, windowsNewlinesChunks, manyEmptyChunks, manyEmptyChunks, true, true, false);
test('Split Uint8Array stdout - line split over multiple chunks, objectMode, keep newline', testLines, 1, runOverChunks, noNewlinesChunks, noNewlinesChunks, true, true, false);
test('Split Uint8Array stdout - 0 newlines, big line, objectMode, keep newline', testLines, 1, bigChunks, bigChunks, bigChunks, true, true, false);
test('Split Uint8Array stdout - 0 newlines, many chunks, objectMode, keep newline', testLines, 1, manyChunks, manyLines, manyLines, true, true, false);

// eslint-disable-next-line max-params
const testBinaryOption = async (t, binary, input, expectedLines, expectedOutput, objectMode, newline) => {
	const lines = [];
	const {stdout} = await execa('noop.js', {
		stdout: [
			getChunksGenerator(input, false, true),
			{transform: resultGenerator.bind(undefined, lines), binary, newline, objectMode},
		],
		stripFinalNewline: false,
	});
	t.deepEqual(lines, expectedLines);
	t.deepEqual(stdout, expectedOutput);
};

test('Does not split lines when "binary" is true', testBinaryOption, true, simpleChunks, simpleChunks, simpleFull, false, true);
test('Splits lines when "binary" is false', testBinaryOption, false, simpleChunks, simpleLines, simpleFull, false, true);
test('Splits lines when "binary" is undefined', testBinaryOption, undefined, simpleChunks, simpleLines, simpleFull, false, true);
test('Does not split lines when "binary" is true, objectMode', testBinaryOption, true, simpleChunks, simpleChunks, simpleChunks, true, true);
test('Splits lines when "binary" is false, objectMode', testBinaryOption, false, simpleChunks, simpleLines, simpleLines, true, true);
test('Splits lines when "binary" is undefined, objectMode', testBinaryOption, undefined, simpleChunks, simpleLines, simpleLines, true, true);
test('Does not split lines when "binary" is true, keep newline', testBinaryOption, true, simpleChunks, simpleChunks, simpleFull, false, false);
test('Splits lines when "binary" is false, keep newline', testBinaryOption, false, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false);
test('Splits lines when "binary" is undefined, keep newline', testBinaryOption, undefined, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false);
test('Does not split lines when "binary" is true, objectMode, keep newline', testBinaryOption, true, simpleChunks, simpleChunks, simpleChunks, true, false);
test('Splits lines when "binary" is false, objectMode, keep newline', testBinaryOption, false, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false);
test('Splits lines when "binary" is undefined, objectMode, keep newline', testBinaryOption, undefined, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false);

const resultStringGenerator = function * (lines, chunk) {
	lines.push(chunk);
	yield new TextDecoder().decode(chunk);
};

const testUint8ArrayToString = async (t, expectedOutput, objectMode, newline) => {
	const lines = [];
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {
		stdout: {
			transform: resultStringGenerator.bind(undefined, lines),
			objectMode,
			newline,
		},
		encoding: 'buffer',
		lines: true,
	});
	t.deepEqual(lines, [foobarUint8Array]);
	t.deepEqual(stdout, expectedOutput);
};

test('Line splitting when converting from Uint8Array to string', testUint8ArrayToString, [foobarUint8Array], false, true);
test('Line splitting when converting from Uint8Array to string, objectMode', testUint8ArrayToString, [foobarString], true, true);
test('Line splitting when converting from Uint8Array to string, keep newline', testUint8ArrayToString, [foobarUint8Array], false, false);
test('Line splitting when converting from Uint8Array to string, objectMode, keep newline', testUint8ArrayToString, [foobarString], true, false);

const resultUint8ArrayGenerator = function * (lines, chunk) {
	lines.push(chunk);
	yield new TextEncoder().encode(chunk);
};

const testStringToUint8Array = async (t, expectedOutput, objectMode, newline) => {
	const lines = [];
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {
		stdout: {
			transform: resultUint8ArrayGenerator.bind(undefined, lines),
			objectMode,
			newline,
		},
		lines: true,
	});
	t.deepEqual(lines, [foobarString]);
	t.deepEqual(stdout, expectedOutput);
};

test('Line splitting when converting from string to Uint8Array', testStringToUint8Array, [foobarString], false, true);
test('Line splitting when converting from string to Uint8Array, objectMode', testStringToUint8Array, [foobarUint8Array], true, true);
test('Line splitting when converting from string to Uint8Array, keep newline', testStringToUint8Array, [foobarString], false, false);
test('Line splitting when converting from string to Uint8Array, objectMode, keep newline', testStringToUint8Array, [foobarUint8Array], true, false);

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

const testUnsetObjectMode = async (t, expectedOutput, newline) => {
	const lines = [];
	const {stdout} = await execa('noop.js', {
		stdout: [
			getChunksGenerator([foobarObject], true),
			{transform: serializeResultGenerator.bind(undefined, lines), newline, objectMode: false},
		],
		stripFinalNewline: false,
	});
	t.deepEqual(lines, [foobarObject]);
	t.is(stdout, expectedOutput);
};

test('Can switch from objectMode to non-objectMode', testUnsetObjectMode, `${foobarObjectString}\n`, false);
test('Can switch from objectMode to non-objectMode, keep newline', testUnsetObjectMode, foobarObjectString, true);

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
