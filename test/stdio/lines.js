import {scheduler} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';

setFixtureDir();

const bigLine = '.'.repeat(1e5);
const manyChunks = Array.from({length: 1e3}).fill('.');

const inputGenerator = async function * (input, chunks) {
	// eslint-disable-next-line no-unused-vars
	for await (const chunk of chunks) {
		for (const inputItem of input) {
			yield inputItem;
			// eslint-disable-next-line no-await-in-loop
			await scheduler.yield();
		}
	}
};

const resultGenerator = async function * (lines, chunks) {
	for await (const chunk of chunks) {
		lines.push(chunk);
		yield chunk;
	}
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const stringsToUint8Arrays = (strings, isUint8Array) => isUint8Array
	? strings.map(string => textEncoder.encode(string))
	: strings;

const serializeResult = (result, isUint8Array, objectMode) => objectMode
	? result.map(resultItem => serializeResultItem(resultItem, isUint8Array)).join('')
	: serializeResultItem(result, isUint8Array);

const serializeResultItem = (resultItem, isUint8Array) => isUint8Array
	? textDecoder.decode(resultItem)
	: resultItem;

// eslint-disable-next-line max-params
const testLines = async (t, index, input, expectedLines, isUint8Array, objectMode) => {
	const lines = [];
	const {stdio} = await execa('noop-fd.js', [`${index}`], {
		...getStdio(index, [
			{transform: inputGenerator.bind(undefined, stringsToUint8Arrays(input, isUint8Array)), objectMode},
			{transform: resultGenerator.bind(undefined, lines), objectMode},
		]),
		encoding: isUint8Array ? 'buffer' : 'utf8',
		stripFinalNewline: false,
	});
	t.is(input.join(''), serializeResult(stdio[index], isUint8Array, objectMode));
	t.deepEqual(lines, stringsToUint8Arrays(expectedLines, isUint8Array));
};

test('Split string stdout - n newlines, 1 chunk', testLines, 1, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false, false);
test('Split string stderr - n newlines, 1 chunk', testLines, 2, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false, false);
test('Split string stdio[*] - n newlines, 1 chunk', testLines, 3, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false, false);
test('Split string stdout - no newline, n chunks', testLines, 1, ['aaa', 'bbb', 'ccc'], ['aaabbbccc'], false, false);
test('Split string stdout - 0 newlines, 1 chunk', testLines, 1, ['aaa'], ['aaa'], false, false);
test('Split string stdout - Windows newlines', testLines, 1, ['aaa\r\nbbb\r\nccc'], ['aaa\r\n', 'bbb\r\n', 'ccc'], false, false);
test('Split string stdout - chunk ends with newline', testLines, 1, ['aaa\nbbb\nccc\n'], ['aaa\n', 'bbb\n', 'ccc\n'], false, false);
test('Split string stdout - single newline', testLines, 1, ['\n'], ['\n'], false, false);
test('Split string stdout - only newlines', testLines, 1, ['\n\n\n'], ['\n', '\n', '\n'], false, false);
test('Split string stdout - only Windows newlines', testLines, 1, ['\r\n\r\n\r\n'], ['\r\n', '\r\n', '\r\n'], false, false);
test('Split string stdout - line split over multiple chunks', testLines, 1, ['aaa\nb', 'b', 'b\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false, false);
test('Split string stdout - 0 newlines, big line', testLines, 1, [bigLine], [bigLine], false, false);
test('Split string stdout - 0 newlines, many chunks', testLines, 1, manyChunks, [manyChunks.join('')], false, false);
test('Split Uint8Array stdout - n newlines, 1 chunk', testLines, 1, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true, false);
test('Split Uint8Array stderr - n newlines, 1 chunk', testLines, 2, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true, false);
test('Split Uint8Array stdio[*] - n newlines, 1 chunk', testLines, 3, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true, false);
test('Split Uint8Array stdout - no newline, n chunks', testLines, 1, ['aaa', 'bbb', 'ccc'], ['aaabbbccc'], true, false);
test('Split Uint8Array stdout - 0 newlines, 1 chunk', testLines, 1, ['aaa'], ['aaa'], true, false);
test('Split Uint8Array stdout - Windows newlines', testLines, 1, ['aaa\r\nbbb\r\nccc'], ['aaa\r\n', 'bbb\r\n', 'ccc'], true, false);
test('Split Uint8Array stdout - chunk ends with newline', testLines, 1, ['aaa\nbbb\nccc\n'], ['aaa\n', 'bbb\n', 'ccc\n'], true, false);
test('Split Uint8Array stdout - single newline', testLines, 1, ['\n'], ['\n'], true, false);
test('Split Uint8Array stdout - only newlines', testLines, 1, ['\n\n\n'], ['\n', '\n', '\n'], true, false);
test('Split Uint8Array stdout - only Windows newlines', testLines, 1, ['\r\n\r\n\r\n'], ['\r\n', '\r\n', '\r\n'], true, false);
test('Split Uint8Array stdout - line split over multiple chunks', testLines, 1, ['aaa\nb', 'b', 'b\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true, false);
test('Split Uint8Array stdout - 0 newlines, big line', testLines, 1, [bigLine], [bigLine], true, false);
test('Split Uint8Array stdout - 0 newlines, many chunks', testLines, 1, manyChunks, [manyChunks.join('')], true, false);
test('Split string stdout - n newlines, 1 chunk, objectMode', testLines, 1, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false, true);
test('Split string stderr - n newlines, 1 chunk, objectMode', testLines, 2, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false, true);
test('Split string stdio[*] - n newlines, 1 chunk, objectMode', testLines, 3, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false, true);
test('Split string stdout - no newline, n chunks, objectMode', testLines, 1, ['aaa', 'bbb', 'ccc'], ['aaabbbccc'], false, true);
test('Split string stdout - 0 newlines, 1 chunk, objectMode', testLines, 1, ['aaa'], ['aaa'], false, true);
test('Split string stdout - Windows newlines, objectMode', testLines, 1, ['aaa\r\nbbb\r\nccc'], ['aaa\r\n', 'bbb\r\n', 'ccc'], false, true);
test('Split string stdout - chunk ends with newline, objectMode', testLines, 1, ['aaa\nbbb\nccc\n'], ['aaa\n', 'bbb\n', 'ccc\n'], false, true);
test('Split string stdout - single newline, objectMode', testLines, 1, ['\n'], ['\n'], false, true);
test('Split string stdout - only newlines, objectMode', testLines, 1, ['\n\n\n'], ['\n', '\n', '\n'], false, true);
test('Split string stdout - only Windows newlines, objectMode', testLines, 1, ['\r\n\r\n\r\n'], ['\r\n', '\r\n', '\r\n'], false, true);
test('Split string stdout - line split over multiple chunks, objectMode', testLines, 1, ['aaa\nb', 'b', 'b\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false, true);
test('Split string stdout - 0 newlines, big line, objectMode', testLines, 1, [bigLine], [bigLine], false, true);
test('Split string stdout - 0 newlines, many chunks, objectMode', testLines, 1, manyChunks, [manyChunks.join('')], false, true);
test('Split Uint8Array stdout - n newlines, 1 chunk, objectMode', testLines, 1, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true, true);
test('Split Uint8Array stderr - n newlines, 1 chunk, objectMode', testLines, 2, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true, true);
test('Split Uint8Array stdio[*] - n newlines, 1 chunk, objectMode', testLines, 3, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true, true);
test('Split Uint8Array stdout - no newline, n chunks, objectMode', testLines, 1, ['aaa', 'bbb', 'ccc'], ['aaabbbccc'], true, true);
test('Split Uint8Array stdout - 0 newlines, 1 chunk, objectMode', testLines, 1, ['aaa'], ['aaa'], true, true);
test('Split Uint8Array stdout - Windows newlines, objectMode', testLines, 1, ['aaa\r\nbbb\r\nccc'], ['aaa\r\n', 'bbb\r\n', 'ccc'], true, true);
test('Split Uint8Array stdout - chunk ends with newline, objectMode', testLines, 1, ['aaa\nbbb\nccc\n'], ['aaa\n', 'bbb\n', 'ccc\n'], true, true);
test('Split Uint8Array stdout - single newline, objectMode', testLines, 1, ['\n'], ['\n'], true, true);
test('Split Uint8Array stdout - only newlines, objectMode', testLines, 1, ['\n\n\n'], ['\n', '\n', '\n'], true, true);
test('Split Uint8Array stdout - only Windows newlines, objectMode', testLines, 1, ['\r\n\r\n\r\n'], ['\r\n', '\r\n', '\r\n'], true, true);
test('Split Uint8Array stdout - line split over multiple chunks, objectMode', testLines, 1, ['aaa\nb', 'b', 'b\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true, true);
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

test('Does not split lines when "binary" is true', testBinaryOption, true, ['aaa\nbbb\nccc'], ['aaa\nbbb\nccc'], false);
test('Splits lines when "binary" is false', testBinaryOption, false, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false);
test('Splits lines when "binary" is undefined', testBinaryOption, undefined, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false);
test('Does not split lines when "binary" is true, objectMode', testBinaryOption, true, ['aaa\nbbb\nccc'], ['aaa\nbbb\nccc'], true);
test('Splits lines when "binary" is false, objectMode', testBinaryOption, false, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true);
test('Splits lines when "binary" is undefined, objectMode', testBinaryOption, undefined, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true);
