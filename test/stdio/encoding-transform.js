import {Buffer} from 'node:buffer';
import {scheduler} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarString, foobarUint8Array, foobarBuffer, foobarObject} from '../helpers/input.js';
import {noopGenerator, getOutputGenerator, convertTransformToFinal} from '../helpers/generator.js';

setFixtureDir();

const textEncoder = new TextEncoder();

const getTypeofGenerator = (objectMode, binary) => ({
	* transform(line) {
		yield Object.prototype.toString.call(line);
	},
	objectMode,
	binary,
});

// eslint-disable-next-line max-params
const testGeneratorFirstEncoding = async (t, input, encoding, output, objectMode) => {
	const subprocess = execa('stdin.js', {stdin: getTypeofGenerator(objectMode, true), encoding});
	subprocess.stdin.end(input);
	const {stdout} = await subprocess;
	const result = Buffer.from(stdout, encoding).toString();
	t.is(result, output);
};

test('First generator argument is string with default encoding, with string writes', testGeneratorFirstEncoding, foobarString, 'utf8', '[object String]', false);
test('First generator argument is string with default encoding, with Buffer writes', testGeneratorFirstEncoding, foobarBuffer, 'utf8', '[object String]', false);
test('First generator argument is string with default encoding, with Uint8Array writes', testGeneratorFirstEncoding, foobarUint8Array, 'utf8', '[object String]', false);
test('First generator argument is Uint8Array with encoding "buffer", with string writes', testGeneratorFirstEncoding, foobarString, 'buffer', '[object Uint8Array]', false);
test('First generator argument is Uint8Array with encoding "buffer", with Buffer writes', testGeneratorFirstEncoding, foobarBuffer, 'buffer', '[object Uint8Array]', false);
test('First generator argument is Uint8Array with encoding "buffer", with Uint8Array writes', testGeneratorFirstEncoding, foobarUint8Array, 'buffer', '[object Uint8Array]', false);
test('First generator argument is Uint8Array with encoding "hex", with string writes', testGeneratorFirstEncoding, foobarString, 'hex', '[object String]', false);
test('First generator argument is Uint8Array with encoding "hex", with Buffer writes', testGeneratorFirstEncoding, foobarBuffer, 'hex', '[object String]', false);
test('First generator argument is Uint8Array with encoding "hex", with Uint8Array writes', testGeneratorFirstEncoding, foobarUint8Array, 'hex', '[object String]', false);
test('First generator argument can be string with objectMode', testGeneratorFirstEncoding, foobarString, 'utf8', '[object String]', true);
test('First generator argument can be objects with objectMode', testGeneratorFirstEncoding, foobarObject, 'utf8', '[object Object]', true);

const testEncodingIgnored = async (t, encoding) => {
	const input = Buffer.from(foobarString).toString(encoding);
	const subprocess = execa('stdin.js', {stdin: noopGenerator(true)});
	subprocess.stdin.end(input, encoding);
	const {stdout} = await subprocess;
	t.is(stdout, input);
};

test('Write call encoding "utf8" is ignored with objectMode', testEncodingIgnored, 'utf8');
test('Write call encoding "utf16le" is ignored with objectMode', testEncodingIgnored, 'utf16le');
test('Write call encoding "hex" is ignored with objectMode', testEncodingIgnored, 'hex');
test('Write call encoding "base64" is ignored with objectMode', testEncodingIgnored, 'base64');

// eslint-disable-next-line max-params
const testGeneratorNextEncoding = async (t, input, encoding, firstObjectMode, secondObjectMode, expectedType) => {
	const {stdout} = await execa('noop.js', ['other'], {
		stdout: [
			getOutputGenerator(input, firstObjectMode),
			getTypeofGenerator(secondObjectMode, true),
		],
		encoding,
	});
	const typeofChunk = Array.isArray(stdout) ? stdout[0] : stdout;
	const output = Buffer.from(typeofChunk, encoding === 'buffer' ? undefined : encoding).toString();
	t.is(output, `[object ${expectedType}]`);
};

test('Next generator argument is string with default encoding, with string writes', testGeneratorNextEncoding, foobarString, 'utf8', false, false, 'String');
test('Next generator argument is string with default encoding, with string writes, objectMode first', testGeneratorNextEncoding, foobarString, 'utf8', true, false, 'String');
test('Next generator argument is string with default encoding, with string writes, objectMode both', testGeneratorNextEncoding, foobarString, 'utf8', true, true, 'String');
test('Next generator argument is string with default encoding, with Uint8Array writes', testGeneratorNextEncoding, foobarUint8Array, 'utf8', false, false, 'String');
test('Next generator argument is Uint8Array with default encoding, with Uint8Array writes, objectMode first', testGeneratorNextEncoding, foobarUint8Array, 'utf8', true, false, 'Uint8Array');
test('Next generator argument is string with default encoding, with Uint8Array writes, objectMode both', testGeneratorNextEncoding, foobarUint8Array, 'utf8', true, true, 'Uint8Array');
test('Next generator argument is Uint8Array with encoding "buffer", with string writes', testGeneratorNextEncoding, foobarString, 'buffer', false, false, 'Uint8Array');
test('Next generator argument is string with encoding "buffer", with string writes, objectMode first', testGeneratorNextEncoding, foobarString, 'buffer', true, false, 'String');
test('Next generator argument is string with encoding "buffer", with string writes, objectMode both', testGeneratorNextEncoding, foobarString, 'buffer', true, true, 'String');
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes', testGeneratorNextEncoding, foobarUint8Array, 'buffer', false, false, 'Uint8Array');
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, objectMode first', testGeneratorNextEncoding, foobarUint8Array, 'buffer', true, false, 'Uint8Array');
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, objectMode both', testGeneratorNextEncoding, foobarUint8Array, 'buffer', true, true, 'Uint8Array');
test('Next generator argument is Uint8Array with encoding "hex", with string writes', testGeneratorNextEncoding, foobarString, 'hex', false, false, 'String');
test('Next generator argument is Uint8Array with encoding "hex", with Uint8Array writes', testGeneratorNextEncoding, foobarUint8Array, 'hex', false, false, 'String');
test('Next generator argument is object with default encoding, with object writes, objectMode first', testGeneratorNextEncoding, foobarObject, 'utf8', true, false, 'Object');
test('Next generator argument is object with default encoding, with object writes, objectMode both', testGeneratorNextEncoding, foobarObject, 'utf8', true, true, 'Object');

const testFirstOutputGeneratorArgument = async (t, fdNumber) => {
	const {stdio} = await execa('noop-fd.js', [`${fdNumber}`], getStdio(fdNumber, getTypeofGenerator(true)));
	t.deepEqual(stdio[fdNumber], ['[object String]']);
};

test('The first generator with result.stdout does not receive an object argument even in objectMode', testFirstOutputGeneratorArgument, 1);
test('The first generator with result.stderr does not receive an object argument even in objectMode', testFirstOutputGeneratorArgument, 2);
test('The first generator with result.stdio[*] does not receive an object argument even in objectMode', testFirstOutputGeneratorArgument, 3);

// eslint-disable-next-line max-params
const testGeneratorReturnType = async (t, input, encoding, reject, objectMode, final) => {
	const fixtureName = reject ? 'noop-fd.js' : 'noop-fail.js';
	const {stdout} = await execa(fixtureName, ['1', foobarString], {
		stdout: convertTransformToFinal(getOutputGenerator(input, objectMode, true), final),
		encoding,
		reject,
	});
	const typeofChunk = Array.isArray(stdout) ? stdout[0] : stdout;
	const output = Buffer.from(typeofChunk, encoding === 'buffer' || objectMode ? undefined : encoding).toString();
	t.is(output, foobarString);
};

test('Generator can return string with default encoding', testGeneratorReturnType, foobarString, 'utf8', true, false, false);
test('Generator can return Uint8Array with default encoding', testGeneratorReturnType, foobarUint8Array, 'utf8', true, false, false);
test('Generator can return string with encoding "buffer"', testGeneratorReturnType, foobarString, 'buffer', true, false, false);
test('Generator can return Uint8Array with encoding "buffer"', testGeneratorReturnType, foobarUint8Array, 'buffer', true, false, false);
test('Generator can return string with encoding "hex"', testGeneratorReturnType, foobarString, 'hex', true, false, false);
test('Generator can return Uint8Array with encoding "hex"', testGeneratorReturnType, foobarUint8Array, 'hex', true, false, false);
test('Generator can return string with default encoding, failure', testGeneratorReturnType, foobarString, 'utf8', false, false, false);
test('Generator can return Uint8Array with default encoding, failure', testGeneratorReturnType, foobarUint8Array, 'utf8', false, false, false);
test('Generator can return string with encoding "buffer", failure', testGeneratorReturnType, foobarString, 'buffer', false, false, false);
test('Generator can return Uint8Array with encoding "buffer", failure', testGeneratorReturnType, foobarUint8Array, 'buffer', false, false, false);
test('Generator can return string with encoding "hex", failure', testGeneratorReturnType, foobarString, 'hex', false, false, false);
test('Generator can return Uint8Array with encoding "hex", failure', testGeneratorReturnType, foobarUint8Array, 'hex', false, false, false);
test('Generator can return string with default encoding, objectMode', testGeneratorReturnType, foobarString, 'utf8', true, true, false);
test('Generator can return Uint8Array with default encoding, objectMode', testGeneratorReturnType, foobarUint8Array, 'utf8', true, true, false);
test('Generator can return string with encoding "buffer", objectMode', testGeneratorReturnType, foobarString, 'buffer', true, true, false);
test('Generator can return Uint8Array with encoding "buffer", objectMode', testGeneratorReturnType, foobarUint8Array, 'buffer', true, true, false);
test('Generator can return string with encoding "hex", objectMode', testGeneratorReturnType, foobarString, 'hex', true, true, false);
test('Generator can return Uint8Array with encoding "hex", objectMode', testGeneratorReturnType, foobarUint8Array, 'hex', true, true, false);
test('Generator can return string with default encoding, objectMode, failure', testGeneratorReturnType, foobarString, 'utf8', false, true, false);
test('Generator can return Uint8Array with default encoding, objectMode, failure', testGeneratorReturnType, foobarUint8Array, 'utf8', false, true, false);
test('Generator can return string with encoding "buffer", objectMode, failure', testGeneratorReturnType, foobarString, 'buffer', false, true, false);
test('Generator can return Uint8Array with encoding "buffer", objectMode, failure', testGeneratorReturnType, foobarUint8Array, 'buffer', false, true, false);
test('Generator can return string with encoding "hex", objectMode, failure', testGeneratorReturnType, foobarString, 'hex', false, true, false);
test('Generator can return Uint8Array with encoding "hex", objectMode, failure', testGeneratorReturnType, foobarUint8Array, 'hex', false, true, false);
test('Generator can return final string with default encoding', testGeneratorReturnType, foobarString, 'utf8', true, false, true);
test('Generator can return final Uint8Array with default encoding', testGeneratorReturnType, foobarUint8Array, 'utf8', true, false, true);
test('Generator can return final string with encoding "buffer"', testGeneratorReturnType, foobarString, 'buffer', true, false, true);
test('Generator can return final Uint8Array with encoding "buffer"', testGeneratorReturnType, foobarUint8Array, 'buffer', true, false, true);
test('Generator can return final string with encoding "hex"', testGeneratorReturnType, foobarString, 'hex', true, false, true);
test('Generator can return final Uint8Array with encoding "hex"', testGeneratorReturnType, foobarUint8Array, 'hex', true, false, true);
test('Generator can return final string with default encoding, failure', testGeneratorReturnType, foobarString, 'utf8', false, false, true);
test('Generator can return final Uint8Array with default encoding, failure', testGeneratorReturnType, foobarUint8Array, 'utf8', false, false, true);
test('Generator can return final string with encoding "buffer", failure', testGeneratorReturnType, foobarString, 'buffer', false, false, true);
test('Generator can return final Uint8Array with encoding "buffer", failure', testGeneratorReturnType, foobarUint8Array, 'buffer', false, false, true);
test('Generator can return final string with encoding "hex", failure', testGeneratorReturnType, foobarString, 'hex', false, false, true);
test('Generator can return final Uint8Array with encoding "hex", failure', testGeneratorReturnType, foobarUint8Array, 'hex', false, false, true);
test('Generator can return final string with default encoding, objectMode', testGeneratorReturnType, foobarString, 'utf8', true, true, true);
test('Generator can return final Uint8Array with default encoding, objectMode', testGeneratorReturnType, foobarUint8Array, 'utf8', true, true, true);
test('Generator can return final string with encoding "buffer", objectMode', testGeneratorReturnType, foobarString, 'buffer', true, true, true);
test('Generator can return final Uint8Array with encoding "buffer", objectMode', testGeneratorReturnType, foobarUint8Array, 'buffer', true, true, true);
test('Generator can return final string with encoding "hex", objectMode', testGeneratorReturnType, foobarString, 'hex', true, true, true);
test('Generator can return final Uint8Array with encoding "hex", objectMode', testGeneratorReturnType, foobarUint8Array, 'hex', true, true, true);
test('Generator can return final string with default encoding, objectMode, failure', testGeneratorReturnType, foobarString, 'utf8', false, true, true);
test('Generator can return final Uint8Array with default encoding, objectMode, failure', testGeneratorReturnType, foobarUint8Array, 'utf8', false, true, true);
test('Generator can return final string with encoding "buffer", objectMode, failure', testGeneratorReturnType, foobarString, 'buffer', false, true, true);
test('Generator can return final Uint8Array with encoding "buffer", objectMode, failure', testGeneratorReturnType, foobarUint8Array, 'buffer', false, true, true);
test('Generator can return final string with encoding "hex", objectMode, failure', testGeneratorReturnType, foobarString, 'hex', false, true, true);
test('Generator can return final Uint8Array with encoding "hex", objectMode, failure', testGeneratorReturnType, foobarUint8Array, 'hex', false, true, true);

const multibyteChar = '\u{1F984}';
const multibyteString = `${multibyteChar}${multibyteChar}`;
const multibyteUint8Array = textEncoder.encode(multibyteString);
const breakingLength = multibyteUint8Array.length * 0.75;
const brokenSymbol = '\uFFFD';

const testMultibyte = async (t, objectMode) => {
	const subprocess = execa('stdin.js', {stdin: noopGenerator(objectMode, true)});
	subprocess.stdin.write(multibyteUint8Array.slice(0, breakingLength));
	await scheduler.yield();
	subprocess.stdin.end(multibyteUint8Array.slice(breakingLength));
	const {stdout} = await subprocess;
	t.is(stdout, multibyteString);
};

test('Generator handles multibyte characters with Uint8Array', testMultibyte, false);
test('Generator handles multibyte characters with Uint8Array, objectMode', testMultibyte, true);

const testMultibytePartial = async (t, objectMode) => {
	const {stdout} = await execa('stdin.js', {
		stdin: [
			[multibyteUint8Array.slice(0, breakingLength)],
			noopGenerator(objectMode, true),
		],
	});
	t.is(stdout, `${multibyteChar}${brokenSymbol}`);
};

test('Generator handles partial multibyte characters with Uint8Array', testMultibytePartial, false);
test('Generator handles partial multibyte characters with Uint8Array, objectMode', testMultibytePartial, true);
