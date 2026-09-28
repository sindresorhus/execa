import assert from 'node:assert/strict';
import test from 'node:test';
import {assertThrows} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const testInvalidEncoding = (encoding, message, execaMethod) => {
	const error = assertThrows(() => {
		execaMethod('empty.js', {encoding});
	});
	assert.ok(error.message.includes(message));
};

const UNKNOWN_ENCODING_MESSAGE = 'Please rename it to one of';
const getCorrectEncodingMessage = correctEncoding => `Please rename it to "${correctEncoding}"`;

test('cannot pass unknown encodings', () => testInvalidEncoding('unknown', UNKNOWN_ENCODING_MESSAGE, execa));
test('cannot pass unknown encodings, sync', () => testInvalidEncoding('unknown', UNKNOWN_ENCODING_MESSAGE, execaSync));
test('cannot pass empty encodings', () => testInvalidEncoding('', UNKNOWN_ENCODING_MESSAGE, execa));
test('cannot pass encoding: false', () => testInvalidEncoding(false, UNKNOWN_ENCODING_MESSAGE, execa));
test('cannot pass encoding: Symbol', () => testInvalidEncoding(Symbol('test'), UNKNOWN_ENCODING_MESSAGE, execa));
test('cannot pass encoding: null', () => testInvalidEncoding(null, getCorrectEncodingMessage('buffer'), execa));
test('cannot pass encoding: null, sync', () => testInvalidEncoding(null, getCorrectEncodingMessage('buffer'), execaSync));
/* eslint-disable unicorn/text-encoding-identifier-case -- intentionally testing invalid encoding casing */
test('cannot pass encoding: utf-8', () => testInvalidEncoding('utf-8', getCorrectEncodingMessage('utf8'), execa));
test('cannot pass encoding: utf-8, sync', () => testInvalidEncoding('utf-8', getCorrectEncodingMessage('utf8'), execaSync));
test('cannot pass encoding: UTF-8', () => testInvalidEncoding('UTF-8', getCorrectEncodingMessage('utf8'), execa));
test('cannot pass encoding: UTF-8, sync', () => testInvalidEncoding('UTF-8', getCorrectEncodingMessage('utf8'), execaSync));
test('cannot pass encoding: UTF8', () => testInvalidEncoding('UTF8', getCorrectEncodingMessage('utf8'), execa));
test('cannot pass encoding: UTF8, sync', () => testInvalidEncoding('UTF8', getCorrectEncodingMessage('utf8'), execaSync));
/* eslint-enable unicorn/text-encoding-identifier-case */
test('cannot pass encoding: utf-16le', () => testInvalidEncoding('utf-16le', getCorrectEncodingMessage('utf16le'), execa));
test('cannot pass encoding: UTF-16LE', () => testInvalidEncoding('UTF-16LE', getCorrectEncodingMessage('utf16le'), execa));
test('cannot pass encoding: UTF16LE', () => testInvalidEncoding('UTF16LE', getCorrectEncodingMessage('utf16le'), execa));
test('cannot pass encoding: ucs2', () => testInvalidEncoding('ucs2', getCorrectEncodingMessage('utf16le'), execa));
test('cannot pass encoding: UCS2', () => testInvalidEncoding('UCS2', getCorrectEncodingMessage('utf16le'), execa));
test('cannot pass encoding: ucs-2', () => testInvalidEncoding('ucs-2', getCorrectEncodingMessage('utf16le'), execa));
test('cannot pass encoding: UCS-2', () => testInvalidEncoding('UCS-2', getCorrectEncodingMessage('utf16le'), execa));
test('cannot pass encoding: binary', () => testInvalidEncoding('binary', getCorrectEncodingMessage('latin1'), execa));

test('cannot pass encoding: constructor', () => testInvalidEncoding('constructor', UNKNOWN_ENCODING_MESSAGE, execa));
test('cannot pass encoding: constructor, sync', () => testInvalidEncoding('constructor', UNKNOWN_ENCODING_MESSAGE, execaSync));
test('cannot pass encoding: __proto__', () => testInvalidEncoding('__proto__', UNKNOWN_ENCODING_MESSAGE, execa));
test('cannot pass encoding: __proto__, sync', () => testInvalidEncoding('__proto__', UNKNOWN_ENCODING_MESSAGE, execaSync));
test('cannot pass encoding: CONSTRUCTOR', () => testInvalidEncoding('CONSTRUCTOR', UNKNOWN_ENCODING_MESSAGE, execa));
test('cannot pass encoding: toString', () => testInvalidEncoding('toString', UNKNOWN_ENCODING_MESSAGE, execa));
test('cannot pass encoding: valueOf', () => testInvalidEncoding('valueOf', UNKNOWN_ENCODING_MESSAGE, execa));
test('cannot pass encoding: hasOwnProperty', () => testInvalidEncoding('hasOwnProperty', UNKNOWN_ENCODING_MESSAGE, execa));
