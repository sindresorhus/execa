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
const uint8ArrayToString = (result, isUint8Array) => isUint8Array ? textDecoder.decode(result) : result;

// eslint-disable-next-line max-params
const testLines = async (t, index, input, expectedLines, isUint8Array) => {
	const lines = [];
	const {stdio} = await execa('noop-fd.js', [`${index}`], {
		...getStdio(index, [
			inputGenerator.bind(undefined, stringsToUint8Arrays(input, isUint8Array)),
			resultGenerator.bind(undefined, lines),
		]),
		encoding: isUint8Array ? 'buffer' : 'utf8',
		stripFinalNewline: false,
	});
	t.is(uint8ArrayToString(stdio[index], isUint8Array), input.join(''));
	t.deepEqual(lines, stringsToUint8Arrays(expectedLines, isUint8Array));
};

test('Split string stdout - n newlines, 1 chunk', testLines, 1, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false);
test('Split string stderr - n newlines, 1 chunk', testLines, 2, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false);
test('Split string stdio[*] - n newlines, 1 chunk', testLines, 3, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false);
test('Split string stdout - no newline, n chunks', testLines, 1, ['aaa', 'bbb', 'ccc'], ['aaabbbccc'], false);
test('Split string stdout - 0 newlines, 1 chunk', testLines, 1, ['aaa'], ['aaa'], false);
test('Split string stdout - Windows newlines', testLines, 1, ['aaa\r\nbbb\r\nccc'], ['aaa\r\n', 'bbb\r\n', 'ccc'], false);
test('Split string stdout - chunk ends with newline', testLines, 1, ['aaa\nbbb\nccc\n'], ['aaa\n', 'bbb\n', 'ccc\n'], false);
test('Split string stdout - single newline', testLines, 1, ['\n'], ['\n'], false);
test('Split string stdout - only newlines', testLines, 1, ['\n\n\n'], ['\n', '\n', '\n'], false);
test('Split string stdout - only Windows newlines', testLines, 1, ['\r\n\r\n\r\n'], ['\r\n', '\r\n', '\r\n'], false);
test('Split string stdout - line split over multiple chunks', testLines, 1, ['aaa\nb', 'b', 'b\nccc'], ['aaa\n', 'bbb\n', 'ccc'], false);
test('Split string stdout - 0 newlines, big line', testLines, 1, [bigLine], [bigLine], false);
test('Split string stdout - 0 newlines, many chunks', testLines, 1, manyChunks, [manyChunks.join('')], false);
test('Split Uint8Array stdout - n newlines, 1 chunk', testLines, 1, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true);
test('Split Uint8Array stderr - n newlines, 1 chunk', testLines, 2, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true);
test('Split Uint8Array stdio[*] - n newlines, 1 chunk', testLines, 3, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true);
test('Split Uint8Array stdout - no newline, n chunks', testLines, 1, ['aaa', 'bbb', 'ccc'], ['aaabbbccc'], true);
test('Split Uint8Array stdout - 0 newlines, 1 chunk', testLines, 1, ['aaa'], ['aaa'], true);
test('Split Uint8Array stdout - Windows newlines', testLines, 1, ['aaa\r\nbbb\r\nccc'], ['aaa\r\n', 'bbb\r\n', 'ccc'], true);
test('Split Uint8Array stdout - chunk ends with newline', testLines, 1, ['aaa\nbbb\nccc\n'], ['aaa\n', 'bbb\n', 'ccc\n'], true);
test('Split Uint8Array stdout - single newline', testLines, 1, ['\n'], ['\n'], true);
test('Split Uint8Array stdout - only newlines', testLines, 1, ['\n\n\n'], ['\n', '\n', '\n'], true);
test('Split Uint8Array stdout - only Windows newlines', testLines, 1, ['\r\n\r\n\r\n'], ['\r\n', '\r\n', '\r\n'], true);
test('Split Uint8Array stdout - line split over multiple chunks', testLines, 1, ['aaa\nb', 'b', 'b\nccc'], ['aaa\n', 'bbb\n', 'ccc'], true);
test('Split Uint8Array stdout - 0 newlines, big line', testLines, 1, [bigLine], [bigLine], true);
test('Split Uint8Array stdout - 0 newlines, many chunks', testLines, 1, manyChunks, [manyChunks.join('')], true);

const testBinaryOption = async (t, binary, input, expectedLines) => {
	const lines = [];
	const {stdout} = await execa('noop-fd.js', ['1'], {
		stdout: [
			inputGenerator.bind(undefined, input),
			{transform: resultGenerator.bind(undefined, lines), binary},
		],
	});
	t.is(stdout, input.join(''));
	t.deepEqual(lines, expectedLines);
};

test('Does not split lines when "binary" is true', testBinaryOption, true, ['aaa\nbbb\nccc'], ['aaa\nbbb\nccc']);
test('Splits lines when "binary" is false', testBinaryOption, false, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc']);
test('Splits lines when "binary" is undefined', testBinaryOption, undefined, ['aaa\nbbb\nccc'], ['aaa\n', 'bbb\n', 'ccc']);
