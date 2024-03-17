import {Buffer} from 'node:buffer';
import {once} from 'node:events';
import {Writable} from 'node:stream';
import {scheduler} from 'node:timers/promises';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio, getStdio} from '../helpers/stdio.js';
import {getChunksGenerator} from '../helpers/generator.js';
import {foobarObject} from '../helpers/input.js';

setFixtureDir();

const simpleChunk = ['aaa\nbbb\nccc'];
const simpleLines = ['aaa\n', 'bbb\n', 'ccc'];
const windowsChunk = ['aaa\r\nbbb\r\nccc'];
const windowsLines = ['aaa\r\n', 'bbb\r\n', 'ccc'];
const newlineEndChunk = ['aaa\nbbb\nccc\n'];
const newlineEndLines = ['aaa\n', 'bbb\n', 'ccc\n'];
const noNewlinesChunk = ['aaa'];
const noNewlinesChunks = ['aaa', 'bbb', 'ccc'];
const noNewlinesLines = ['aaabbbccc'];
const newlineChunk = ['\n'];
const newlinesChunk = ['\n\n\n'];
const newlinesLines = ['\n', '\n', '\n'];
const windowsNewlinesChunk = ['\r\n\r\n\r\n'];
const windowsNewlinesLines = ['\r\n', '\r\n', '\r\n'];
const runOverChunks = ['aaa\nb', 'b', 'b\nccc'];

const bigLine = '.'.repeat(1e5);
const manyChunks = Array.from({length: 1e3}).fill('.');

const inputGenerator = async function * (input) {
	for (const inputItem of input) {
		yield inputItem;
		// eslint-disable-next-line no-await-in-loop
		await scheduler.yield();
	}
};

const resultGenerator = function * (lines, chunk) {
	lines.push(chunk);
	yield chunk;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const getEncoding = isUint8Array => isUint8Array ? 'buffer' : 'utf8';

const stringsToUint8Arrays = (strings, isUint8Array) => isUint8Array
	? strings.map(string => textEncoder.encode(string))
	: strings;

const stringsToBuffers = (strings, isUint8Array) => isUint8Array
	? strings.map(string => Buffer.from(string))
	: strings;

const getSimpleChunkSubprocess = (isUint8Array, options) => execa('noop-fd.js', ['1', ...simpleChunk], {
	lines: true,
	encoding: getEncoding(isUint8Array),
	...options,
});

const serializeResult = (result, isUint8Array, objectMode) => objectMode
	? result.map(resultItem => serializeResultItem(resultItem, isUint8Array)).join('')
	: serializeResultItem(result, isUint8Array);

const serializeResultItem = (resultItem, isUint8Array) => isUint8Array
	? textDecoder.decode(resultItem)
	: resultItem;

// eslint-disable-next-line max-params
const testLines = async (t, fdNumber, input, expectedLines, isUint8Array, objectMode) => {
	const lines = [];
	const {stdio} = await execa('noop-fd.js', [`${fdNumber}`], {
		...getStdio(fdNumber, [
			{transform: inputGenerator.bind(undefined, stringsToUint8Arrays(input, isUint8Array)), objectMode},
			{transform: resultGenerator.bind(undefined, lines), objectMode},
		]),
		encoding: getEncoding(isUint8Array),
		stripFinalNewline: false,
	});
	t.is(input.join(''), serializeResult(stdio[fdNumber], isUint8Array, objectMode));
	t.deepEqual(lines, stringsToUint8Arrays(expectedLines, isUint8Array));
};

test('Split string stdout - n newlines, 1 chunk', testLines, 1, simpleChunk, simpleLines, false, false);
test('Split string stderr - n newlines, 1 chunk', testLines, 2, simpleChunk, simpleLines, false, false);
test('Split string stdio[*] - n newlines, 1 chunk', testLines, 3, simpleChunk, simpleLines, false, false);
test('Split string stdout - no newline, n chunks', testLines, 1, noNewlinesChunks, noNewlinesLines, false, false);
test('Split string stdout - 0 newlines, 1 chunk', testLines, 1, noNewlinesChunk, noNewlinesChunk, false, false);
test('Split string stdout - Windows newlines', testLines, 1, windowsChunk, windowsLines, false, false);
test('Split string stdout - chunk ends with newline', testLines, 1, newlineEndChunk, newlineEndLines, false, false);
test('Split string stdout - single newline', testLines, 1, newlineChunk, newlineChunk, false, false);
test('Split string stdout - only newlines', testLines, 1, newlinesChunk, newlinesLines, false, false);
test('Split string stdout - only Windows newlines', testLines, 1, windowsNewlinesChunk, windowsNewlinesLines, false, false);
test('Split string stdout - line split over multiple chunks', testLines, 1, runOverChunks, simpleLines, false, false);
test('Split string stdout - 0 newlines, big line', testLines, 1, [bigLine], [bigLine], false, false);
test('Split string stdout - 0 newlines, many chunks', testLines, 1, manyChunks, [manyChunks.join('')], false, false);
test('Split Uint8Array stdout - n newlines, 1 chunk', testLines, 1, simpleChunk, simpleLines, true, false);
test('Split Uint8Array stderr - n newlines, 1 chunk', testLines, 2, simpleChunk, simpleLines, true, false);
test('Split Uint8Array stdio[*] - n newlines, 1 chunk', testLines, 3, simpleChunk, simpleLines, true, false);
test('Split Uint8Array stdout - no newline, n chunks', testLines, 1, noNewlinesChunks, noNewlinesLines, true, false);
test('Split Uint8Array stdout - 0 newlines, 1 chunk', testLines, 1, noNewlinesChunk, noNewlinesChunk, true, false);
test('Split Uint8Array stdout - Windows newlines', testLines, 1, windowsChunk, windowsLines, true, false);
test('Split Uint8Array stdout - chunk ends with newline', testLines, 1, newlineEndChunk, newlineEndLines, true, false);
test('Split Uint8Array stdout - single newline', testLines, 1, newlineChunk, newlineChunk, true, false);
test('Split Uint8Array stdout - only newlines', testLines, 1, newlinesChunk, newlinesLines, true, false);
test('Split Uint8Array stdout - only Windows newlines', testLines, 1, windowsNewlinesChunk, windowsNewlinesLines, true, false);
test('Split Uint8Array stdout - line split over multiple chunks', testLines, 1, runOverChunks, simpleLines, true, false);
test('Split Uint8Array stdout - 0 newlines, big line', testLines, 1, [bigLine], [bigLine], true, false);
test('Split Uint8Array stdout - 0 newlines, many chunks', testLines, 1, manyChunks, [manyChunks.join('')], true, false);
test('Split string stdout - n newlines, 1 chunk, objectMode', testLines, 1, simpleChunk, simpleLines, false, true);
test('Split string stderr - n newlines, 1 chunk, objectMode', testLines, 2, simpleChunk, simpleLines, false, true);
test('Split string stdio[*] - n newlines, 1 chunk, objectMode', testLines, 3, simpleChunk, simpleLines, false, true);
test('Split string stdout - no newline, n chunks, objectMode', testLines, 1, noNewlinesChunks, noNewlinesLines, false, true);
test('Split string stdout - 0 newlines, 1 chunk, objectMode', testLines, 1, noNewlinesChunk, noNewlinesChunk, false, true);
test('Split string stdout - Windows newlines, objectMode', testLines, 1, windowsChunk, windowsLines, false, true);
test('Split string stdout - chunk ends with newline, objectMode', testLines, 1, newlineEndChunk, newlineEndLines, false, true);
test('Split string stdout - single newline, objectMode', testLines, 1, newlineChunk, newlineChunk, false, true);
test('Split string stdout - only newlines, objectMode', testLines, 1, newlinesChunk, newlinesLines, false, true);
test('Split string stdout - only Windows newlines, objectMode', testLines, 1, windowsNewlinesChunk, windowsNewlinesLines, false, true);
test('Split string stdout - line split over multiple chunks, objectMode', testLines, 1, runOverChunks, simpleLines, false, true);
test('Split string stdout - 0 newlines, big line, objectMode', testLines, 1, [bigLine], [bigLine], false, true);
test('Split string stdout - 0 newlines, many chunks, objectMode', testLines, 1, manyChunks, [manyChunks.join('')], false, true);
test('Split Uint8Array stdout - n newlines, 1 chunk, objectMode', testLines, 1, simpleChunk, simpleLines, true, true);
test('Split Uint8Array stderr - n newlines, 1 chunk, objectMode', testLines, 2, simpleChunk, simpleLines, true, true);
test('Split Uint8Array stdio[*] - n newlines, 1 chunk, objectMode', testLines, 3, simpleChunk, simpleLines, true, true);
test('Split Uint8Array stdout - no newline, n chunks, objectMode', testLines, 1, noNewlinesChunks, noNewlinesLines, true, true);
test('Split Uint8Array stdout - 0 newlines, 1 chunk, objectMode', testLines, 1, noNewlinesChunk, noNewlinesChunk, true, true);
test('Split Uint8Array stdout - Windows newlines, objectMode', testLines, 1, windowsChunk, windowsLines, true, true);
test('Split Uint8Array stdout - chunk ends with newline, objectMode', testLines, 1, newlineEndChunk, newlineEndLines, true, true);
test('Split Uint8Array stdout - single newline, objectMode', testLines, 1, newlineChunk, newlineChunk, true, true);
test('Split Uint8Array stdout - only newlines, objectMode', testLines, 1, newlinesChunk, newlinesLines, true, true);
test('Split Uint8Array stdout - only Windows newlines, objectMode', testLines, 1, windowsNewlinesChunk, windowsNewlinesLines, true, true);
test('Split Uint8Array stdout - line split over multiple chunks, objectMode', testLines, 1, runOverChunks, simpleLines, true, true);
test('Split Uint8Array stdout - 0 newlines, big line, objectMode', testLines, 1, [bigLine], [bigLine], true, true);
test('Split Uint8Array stdout - 0 newlines, many chunks, objectMode', testLines, 1, manyChunks, [manyChunks.join('')], true, true);

// eslint-disable-next-line max-params
const testBinaryOption = async (t, binary, input, expectedLines, objectMode) => {
	const lines = [];
	const {stdout} = await execa('noop-fd.js', ['1'], {
		stdout: [
			{transform: inputGenerator.bind(undefined, input), objectMode},
			{transform: resultGenerator.bind(undefined, lines), objectMode, binary},
		],
	});
	t.is(input.join(''), objectMode ? stdout.join('') : stdout);
	t.deepEqual(lines, expectedLines);
};

test('Does not split lines when "binary" is true', testBinaryOption, true, simpleChunk, simpleChunk, false);
test('Splits lines when "binary" is false', testBinaryOption, false, simpleChunk, simpleLines, false);
test('Splits lines when "binary" is undefined', testBinaryOption, undefined, simpleChunk, simpleLines, false);
test('Does not split lines when "binary" is true, objectMode', testBinaryOption, true, simpleChunk, simpleChunk, true);
test('Splits lines when "binary" is false, objectMode', testBinaryOption, false, simpleChunk, simpleLines, true);
test('Splits lines when "binary" is undefined, objectMode', testBinaryOption, undefined, simpleChunk, simpleLines, true);

// eslint-disable-next-line max-params
const testStreamLines = async (t, fdNumber, input, expectedLines, isUint8Array) => {
	const {stdio} = await execa('noop-fd.js', [`${fdNumber}`, input], {
		...fullStdio,
		lines: true,
		encoding: getEncoding(isUint8Array),
	});
	t.deepEqual(stdio[fdNumber], stringsToUint8Arrays(expectedLines, isUint8Array));
};

test('"lines: true" splits lines, stdout, string', testStreamLines, 1, simpleChunk[0], simpleLines, false);
test('"lines: true" splits lines, stdout, Uint8Array', testStreamLines, 1, simpleChunk[0], simpleLines, true);
test('"lines: true" splits lines, stderr, string', testStreamLines, 2, simpleChunk[0], simpleLines, false);
test('"lines: true" splits lines, stderr, Uint8Array', testStreamLines, 2, simpleChunk[0], simpleLines, true);
test('"lines: true" splits lines, stdio[*], string', testStreamLines, 3, simpleChunk[0], simpleLines, false);
test('"lines: true" splits lines, stdio[*], Uint8Array', testStreamLines, 3, simpleChunk[0], simpleLines, true);

const testStreamLinesNoop = async (t, lines, execaMethod) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', simpleChunk[0]], {lines});
	t.is(stdout, simpleChunk[0]);
};

test('"lines: false" is a noop with execa()', testStreamLinesNoop, false, execa);
test('"lines: false" is a noop with execaSync()', testStreamLinesNoop, false, execaSync);
test('"lines: true" is a noop with execaSync()', testStreamLinesNoop, true, execaSync);

const bigArray = Array.from({length: 1e5}).fill('.\n');
const bigString = bigArray.join('');
const bigStringNoNewlines = '.'.repeat(1e6);

// eslint-disable-next-line max-params
const testStreamLinesGenerator = async (t, input, expectedLines, objectMode, binary) => {
	const {stdout} = await execa('noop.js', {lines: true, stdout: getChunksGenerator(input, objectMode, binary)});
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with strings generators', testStreamLinesGenerator, simpleChunk, simpleLines, false, false);
test('"lines: true" works with strings generators, objectMode', testStreamLinesGenerator, simpleChunk, simpleLines, true, false);
test('"lines: true" works with strings generators, binary', testStreamLinesGenerator, simpleChunk, simpleLines, false, true);
test('"lines: true" works with strings generators, binary, objectMode', testStreamLinesGenerator, simpleChunk, simpleLines, true, true);
test('"lines: true" works with big strings generators', testStreamLinesGenerator, [bigString], bigArray, false, false);
test('"lines: true" works with big strings generators, objectMode', testStreamLinesGenerator, [bigString], bigArray, true, false);
test('"lines: true" works with big strings generators without newlines', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlines], false, false);
test('"lines: true" works with big strings generators without newlines, objectMode', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlines], true, false);

test('"lines: true" is a noop with objects generators, objectMode', async t => {
	const {stdout} = await execa('noop.js', {lines: true, stdout: getChunksGenerator([foobarObject], true)});
	t.deepEqual(stdout, [foobarObject]);
});

const singleLine = 'a\n';

test('"lines: true" works with other encodings', async t => {
	const {stdout} = await execa('noop-fd.js', ['1', `${singleLine}${singleLine}`], {lines: true, encoding: 'base64'});
	const expectedLines = [singleLine, singleLine].map(line => btoa(line));
	t.not(btoa(`${singleLine}${singleLine}`), expectedLines.join(''));
	t.deepEqual(stdout, expectedLines);
});

const testAsyncIteration = async (t, isUint8Array) => {
	const subprocess = getSimpleChunkSubprocess(isUint8Array);
	const [stdout] = await Promise.all([subprocess.stdout.toArray(), subprocess]);
	t.deepEqual(stdout, stringsToUint8Arrays(simpleLines, isUint8Array));
};

test('"lines: true" works with stream async iteration, string', testAsyncIteration, false);
test('"lines: true" works with stream async iteration, Uint8Array', testAsyncIteration, true);

const testDataEvents = async (t, isUint8Array) => {
	const subprocess = getSimpleChunkSubprocess(isUint8Array);
	const [[firstLine]] = await Promise.all([once(subprocess.stdout, 'data'), subprocess]);
	t.deepEqual(firstLine, stringsToUint8Arrays(simpleLines, isUint8Array)[0]);
};

test('"lines: true" works with stream "data" events, string', testDataEvents, false);
test('"lines: true" works with stream "data" events, Uint8Array', testDataEvents, true);

const testWritableStream = async (t, isUint8Array) => {
	const lines = [];
	const writable = new Writable({
		write(line, encoding, done) {
			lines.push(line);
			done();
		},
		decodeStrings: false,
	});
	await getSimpleChunkSubprocess(isUint8Array, {stdout: ['pipe', writable]});
	t.deepEqual(lines, stringsToBuffers(simpleLines, isUint8Array));
};

test('"lines: true" works with writable streams targets, string', testWritableStream, false);
test('"lines: true" works with writable streams targets, Uint8Array', testWritableStream, true);
