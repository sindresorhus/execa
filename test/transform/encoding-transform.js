import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';
import test from 'node:test';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getStdio} from '../helpers/stdio.js';
import {
	foobarString,
	foobarUint8Array,
	foobarBuffer,
	foobarObject,
} from '../helpers/input.js';
import {noopGenerator, getOutputGenerator, uppercaseGenerator} from '../helpers/generator.js';

setFixtureDirectory();

const getTypeofGenerator = lines => (objectMode, binary) => ({
	* transform(line) {
		lines.push(Object.prototype.toString.call(line));
		yield '';
	},
	objectMode,
	binary,
});

const assertTypeofChunk = (lines, expectedType) => {
	assert.deepEqual(lines, [`[object ${expectedType}]`]);
};

// eslint-disable-next-line max-params
const testGeneratorFirstEncoding = async (input, encoding, expectedType, objectMode, binary) => {
	const lines = [];
	const subprocess = execa('stdin.js', {stdin: getTypeofGenerator(lines)(objectMode, binary), encoding});
	subprocess.stdin.end(input);
	await subprocess;
	assertTypeofChunk(lines, expectedType);
};

test('First generator argument is string with default encoding, with string writes', () => testGeneratorFirstEncoding(foobarString, 'utf8', 'String', false, undefined));
test('First generator argument is string with default encoding, with Buffer writes', () => testGeneratorFirstEncoding(foobarBuffer, 'utf8', 'String', false, undefined));
test('First generator argument is string with default encoding, with Uint8Array writes', () => testGeneratorFirstEncoding(foobarUint8Array, 'utf8', 'String', false, undefined));
test('First generator argument is string with default encoding, with string writes, "binary: false"', () => testGeneratorFirstEncoding(foobarString, 'utf8', 'String', false, false));
test('First generator argument is Uint8Array with default encoding, with string writes, "binary: true"', () => testGeneratorFirstEncoding(foobarString, 'utf8', 'Uint8Array', false, true));
test('First generator argument is string with encoding "utf16le", with string writes', () => testGeneratorFirstEncoding(foobarString, 'utf16le', 'String', false, undefined));
test('First generator argument is string with encoding "utf16le", with Buffer writes', () => testGeneratorFirstEncoding(foobarBuffer, 'utf16le', 'String', false, undefined));
test('First generator argument is string with encoding "utf16le", with Uint8Array writes', () => testGeneratorFirstEncoding(foobarUint8Array, 'utf16le', 'String', false, undefined));
test('First generator argument is string with encoding "utf16le", with string writes, "binary: false"', () => testGeneratorFirstEncoding(foobarString, 'utf16le', 'String', false, false));
test('First generator argument is Uint8Array with encoding "utf16le", with string writes, "binary: true"', () => testGeneratorFirstEncoding(foobarString, 'utf16le', 'Uint8Array', false, true));
test('First generator argument is Uint8Array with encoding "buffer", with string writes', () => testGeneratorFirstEncoding(foobarString, 'buffer', 'Uint8Array', false, undefined));
test('First generator argument is Uint8Array with encoding "buffer", with Buffer writes', () => testGeneratorFirstEncoding(foobarBuffer, 'buffer', 'Uint8Array', false, undefined));
test('First generator argument is Uint8Array with encoding "buffer", with Uint8Array writes', () => testGeneratorFirstEncoding(foobarUint8Array, 'buffer', 'Uint8Array', false, undefined));
test('First generator argument is Uint8Array with encoding "buffer", with string writes, "binary: false"', () => testGeneratorFirstEncoding(foobarString, 'buffer', 'Uint8Array', false, false));
test('First generator argument is Uint8Array with encoding "buffer", with string writes, "binary: true"', () => testGeneratorFirstEncoding(foobarString, 'buffer', 'Uint8Array', false, true));
test('First generator argument is Uint8Array with encoding "hex", with string writes', () => testGeneratorFirstEncoding(foobarString, 'hex', 'Uint8Array', false, undefined));
test('First generator argument is Uint8Array with encoding "hex", with Buffer writes', () => testGeneratorFirstEncoding(foobarBuffer, 'hex', 'Uint8Array', false, undefined));
test('First generator argument is Uint8Array with encoding "hex", with Uint8Array writes', () => testGeneratorFirstEncoding(foobarUint8Array, 'hex', 'Uint8Array', false, undefined));
test('First generator argument is Uint8Array with encoding "hex", with string writes, "binary: false"', () => testGeneratorFirstEncoding(foobarString, 'hex', 'Uint8Array', false, false));
test('First generator argument is Uint8Array with encoding "hex", with string writes, "binary: true"', () => testGeneratorFirstEncoding(foobarString, 'hex', 'Uint8Array', false, true));
test('First generator argument can be string with objectMode', () => testGeneratorFirstEncoding(foobarString, 'utf8', 'String', true, undefined));
test('First generator argument can be string with objectMode, "binary: false"', () => testGeneratorFirstEncoding(foobarString, 'utf8', 'String', true, false));
test('First generator argument can be string with objectMode, "binary: true"', () => testGeneratorFirstEncoding(foobarString, 'utf8', 'String', true, true));
test('First generator argument can be objects with objectMode', () => testGeneratorFirstEncoding(foobarObject, 'utf8', 'Object', true, undefined));
test('First generator argument can be objects with objectMode, "binary: false"', () => testGeneratorFirstEncoding(foobarObject, 'utf8', 'Object', true, false));
test('First generator argument can be objects with objectMode, "binary: true"', () => testGeneratorFirstEncoding(foobarObject, 'utf8', 'Object', true, true));

// eslint-disable-next-line max-params
const testGeneratorFirstEncodingSync = (input, encoding, expectedType, objectMode, binary) => {
	const lines = [];
	execaSync('stdin.js', {stdin: [[input], getTypeofGenerator(lines)(objectMode, binary)], encoding});
	assertTypeofChunk(lines, expectedType);
};

test('First generator argument is string with default encoding, with string writes, sync', () => testGeneratorFirstEncodingSync(foobarString, 'utf8', 'String', false, undefined));
test('First generator argument is string with default encoding, with Uint8Array writes, sync', () => testGeneratorFirstEncodingSync(foobarUint8Array, 'utf8', 'String', false, undefined));
test('First generator argument is string with default encoding, with string writes, "binary: false", sync', () => testGeneratorFirstEncodingSync(foobarString, 'utf8', 'String', false, false));
test('First generator argument is Uint8Array with default encoding, with string writes, "binary: true", sync', () => testGeneratorFirstEncodingSync(foobarString, 'utf8', 'Uint8Array', false, true));
test('First generator argument is string with encoding "utf16le", with string writes, sync', () => testGeneratorFirstEncodingSync(foobarString, 'utf16le', 'String', false, undefined));
test('First generator argument is string with encoding "utf16le", with Uint8Array writes, sync', () => testGeneratorFirstEncodingSync(foobarUint8Array, 'utf16le', 'String', false, undefined));
test('First generator argument is string with encoding "utf16le", with string writes, "binary: false", sync', () => testGeneratorFirstEncodingSync(foobarString, 'utf16le', 'String', false, false));
test('First generator argument is Uint8Array with encoding "utf16le", with string writes, "binary: true", sync', () => testGeneratorFirstEncodingSync(foobarString, 'utf16le', 'Uint8Array', false, true));
test('First generator argument is Uint8Array with encoding "buffer", with string writes, sync', () => testGeneratorFirstEncodingSync(foobarString, 'buffer', 'Uint8Array', false, undefined));
test('First generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, sync', () => testGeneratorFirstEncodingSync(foobarUint8Array, 'buffer', 'Uint8Array', false, undefined));
test('First generator argument is Uint8Array with encoding "buffer", with string writes, "binary: false", sync', () => testGeneratorFirstEncodingSync(foobarString, 'buffer', 'Uint8Array', false, false));
test('First generator argument is Uint8Array with encoding "buffer", with string writes, "binary: true", sync', () => testGeneratorFirstEncodingSync(foobarString, 'buffer', 'Uint8Array', false, true));
test('First generator argument is Uint8Array with encoding "hex", with string writes, sync', () => testGeneratorFirstEncodingSync(foobarString, 'hex', 'Uint8Array', false, undefined));
test('First generator argument is Uint8Array with encoding "hex", with Uint8Array writes, sync', () => testGeneratorFirstEncodingSync(foobarUint8Array, 'hex', 'Uint8Array', false, undefined));
test('First generator argument is Uint8Array with encoding "hex", with string writes, "binary: false", sync', () => testGeneratorFirstEncodingSync(foobarString, 'hex', 'Uint8Array', false, false));
test('First generator argument is Uint8Array with encoding "hex", with string writes, "binary: true", sync', () => testGeneratorFirstEncodingSync(foobarString, 'hex', 'Uint8Array', false, true));
test('First generator argument can be string with objectMode, sync', () => testGeneratorFirstEncodingSync(foobarString, 'utf8', 'String', true, undefined));
test('First generator argument can be string with objectMode, "binary: false", sync', () => testGeneratorFirstEncodingSync(foobarString, 'utf8', 'String', true, false));
test('First generator argument can be string with objectMode, "binary: true", sync', () => testGeneratorFirstEncodingSync(foobarString, 'utf8', 'String', true, true));
test('First generator argument can be objects with objectMode, sync', () => testGeneratorFirstEncodingSync(foobarObject, 'utf8', 'Object', true, undefined));
test('First generator argument can be objects with objectMode, "binary: false", sync', () => testGeneratorFirstEncodingSync(foobarObject, 'utf8', 'Object', true, false));
test('First generator argument can be objects with objectMode, "binary: true", sync', () => testGeneratorFirstEncodingSync(foobarObject, 'utf8', 'Object', true, true));

/*
The `encoding` option only applies to the output, so binary `stdin` input is decoded with UTF-8 before being passed to a transform, whichever text encoding that option uses.
Unlike the tests above, this checks the chunk's value, not only its type.
This must be the same with both asynchronous and synchronous methods.
*/
const getChunkGenerator = chunks => ({
	* transform(chunk) {
		chunks.push(chunk);
		yield chunk;
	},
});

const testStdinEncodingValue = async encoding => {
	const chunks = [];
	const subprocess = execa('stdin.js', {stdin: getChunkGenerator(chunks), encoding});
	subprocess.stdin.end(foobarUint8Array);
	await subprocess;
	assert.deepEqual(chunks, [foobarString]);
};

test('First generator argument is decoded with UTF-8 with encoding "utf8", stdin', () => testStdinEncodingValue('utf8'));
test('First generator argument is decoded with UTF-8 with encoding "utf16le", stdin', () => testStdinEncodingValue('utf16le'));

const testStdinEncodingValueSync = encoding => {
	const chunks = [];
	execaSync('stdin.js', {stdin: [[foobarUint8Array], getChunkGenerator(chunks)], encoding});
	assert.deepEqual(chunks, [foobarString]);
};

test('First generator argument is decoded with UTF-8 with encoding "utf8", stdin, sync', () => testStdinEncodingValueSync('utf8'));
test('First generator argument is decoded with UTF-8 with encoding "utf16le", stdin, sync', () => testStdinEncodingValueSync('utf16le'));

const testEncodingIgnored = async encoding => {
	const input = Buffer.from(foobarString).toString(encoding);
	const subprocess = execa('stdin.js', {stdin: noopGenerator(true)});
	subprocess.stdin.end(input, encoding);
	const {stdout} = await subprocess;
	assert.equal(stdout, input);
};

test('Write call encoding "utf8" is ignored with objectMode', () => testEncodingIgnored('utf8'));
test('Write call encoding "utf16le" is ignored with objectMode', () => testEncodingIgnored('utf16le'));
test('Write call encoding "hex" is ignored with objectMode', () => testEncodingIgnored('hex'));
test('Write call encoding "base64" is ignored with objectMode', () => testEncodingIgnored('base64'));

// eslint-disable-next-line max-params
const testGeneratorNextEncoding = async (input, encoding, firstObjectMode, secondObjectMode, expectedType, execaMethod) => {
	const lines = [];
	await execaMethod('noop.js', ['other'], {
		stdout: [
			getOutputGenerator(input)(firstObjectMode),
			getTypeofGenerator(lines)(secondObjectMode),
		],
		encoding,
	});
	assertTypeofChunk(lines, expectedType);
};

test('Next generator argument is string with default encoding, with string writes', () => testGeneratorNextEncoding(foobarString, 'utf8', false, false, 'String', execa));
test('Next generator argument is string with default encoding, with string writes, objectMode first', () => testGeneratorNextEncoding(foobarString, 'utf8', true, false, 'String', execa));
test('Next generator argument is string with default encoding, with string writes, objectMode both', () => testGeneratorNextEncoding(foobarString, 'utf8', true, true, 'String', execa));
test('Next generator argument is string with default encoding, with Uint8Array writes', () => testGeneratorNextEncoding(foobarUint8Array, 'utf8', false, false, 'String', execa));
test('Next generator argument is Uint8Array with default encoding, with Uint8Array writes, objectMode first', () => testGeneratorNextEncoding(foobarUint8Array, 'utf8', true, false, 'Uint8Array', execa));
test('Next generator argument is string with default encoding, with Uint8Array writes, objectMode both', () => testGeneratorNextEncoding(foobarUint8Array, 'utf8', true, true, 'Uint8Array', execa));
test('Next generator argument is string with encoding "utf16le", with string writes', () => testGeneratorNextEncoding(foobarString, 'utf16le', false, false, 'String', execa));
test('Next generator argument is string with encoding "utf16le",, with string writes, objectMode first', () => testGeneratorNextEncoding(foobarString, 'utf16le', true, false, 'String', execa));
test('Next generator argument is string with encoding "utf16le",, with string writes, objectMode both', () => testGeneratorNextEncoding(foobarString, 'utf16le', true, true, 'String', execa));
test('Next generator argument is string with encoding "utf16le",, with Uint8Array writes', () => testGeneratorNextEncoding(foobarUint8Array, 'utf16le', false, false, 'String', execa));
test('Next generator argument is Uint8Array with encoding "utf16le",, with Uint8Array writes, objectMode first', () => testGeneratorNextEncoding(foobarUint8Array, 'utf16le', true, false, 'Uint8Array', execa));
test('Next generator argument is string with encoding "utf16le",, with Uint8Array writes, objectMode both', () => testGeneratorNextEncoding(foobarUint8Array, 'utf16le', true, true, 'Uint8Array', execa));
test('Next generator argument is Uint8Array with encoding "buffer", with string writes', () => testGeneratorNextEncoding(foobarString, 'buffer', false, false, 'Uint8Array', execa));
test('Next generator argument is string with encoding "buffer", with string writes, objectMode first', () => testGeneratorNextEncoding(foobarString, 'buffer', true, false, 'String', execa));
test('Next generator argument is string with encoding "buffer", with string writes, objectMode both', () => testGeneratorNextEncoding(foobarString, 'buffer', true, true, 'String', execa));
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes', () => testGeneratorNextEncoding(foobarUint8Array, 'buffer', false, false, 'Uint8Array', execa));
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, objectMode first', () => testGeneratorNextEncoding(foobarUint8Array, 'buffer', true, false, 'Uint8Array', execa));
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, objectMode both', () => testGeneratorNextEncoding(foobarUint8Array, 'buffer', true, true, 'Uint8Array', execa));
test('Next generator argument is Uint8Array with encoding "hex", with string writes', () => testGeneratorNextEncoding(foobarString, 'hex', false, false, 'Uint8Array', execa));
test('Next generator argument is Uint8Array with encoding "hex", with Uint8Array writes', () => testGeneratorNextEncoding(foobarUint8Array, 'hex', false, false, 'Uint8Array', execa));
test('Next generator argument is object with default encoding, with object writes, objectMode first', () => testGeneratorNextEncoding(foobarObject, 'utf8', true, false, 'Object', execa));
test('Next generator argument is object with default encoding, with object writes, objectMode both', () => testGeneratorNextEncoding(foobarObject, 'utf8', true, true, 'Object', execa));
test('Next generator argument is string with default encoding, with string writes, sync', () => testGeneratorNextEncoding(foobarString, 'utf8', false, false, 'String', execaSync));
test('Next generator argument is string with default encoding, with string writes, objectMode first, sync', () => testGeneratorNextEncoding(foobarString, 'utf8', true, false, 'String', execaSync));
test('Next generator argument is string with default encoding, with string writes, objectMode both, sync', () => testGeneratorNextEncoding(foobarString, 'utf8', true, true, 'String', execaSync));
test('Next generator argument is string with default encoding, with Uint8Array writes, sync', () => testGeneratorNextEncoding(foobarUint8Array, 'utf8', false, false, 'String', execaSync));
test('Next generator argument is Uint8Array with default encoding, with Uint8Array writes, objectMode first, sync', () => testGeneratorNextEncoding(foobarUint8Array, 'utf8', true, false, 'Uint8Array', execaSync));
test('Next generator argument is string with default encoding, with Uint8Array writes, objectMode both, sync', () => testGeneratorNextEncoding(foobarUint8Array, 'utf8', true, true, 'Uint8Array', execaSync));
test('Next generator argument is string with encoding "utf16le", with string writes, sync', () => testGeneratorNextEncoding(foobarString, 'utf16le', false, false, 'String', execaSync));
test('Next generator argument is string with encoding "utf16le",, with string writes, objectMode first, sync', () => testGeneratorNextEncoding(foobarString, 'utf16le', true, false, 'String', execaSync));
test('Next generator argument is string with encoding "utf16le",, with string writes, objectMode both, sync', () => testGeneratorNextEncoding(foobarString, 'utf16le', true, true, 'String', execaSync));
test('Next generator argument is string with encoding "utf16le",, with Uint8Array writes, sync', () => testGeneratorNextEncoding(foobarUint8Array, 'utf16le', false, false, 'String', execaSync));
test('Next generator argument is Uint8Array with encoding "utf16le",, with Uint8Array writes, objectMode first, sync', () => testGeneratorNextEncoding(foobarUint8Array, 'utf16le', true, false, 'Uint8Array', execaSync));
test('Next generator argument is string with encoding "utf16le",, with Uint8Array writes, objectMode both, sync', () => testGeneratorNextEncoding(foobarUint8Array, 'utf16le', true, true, 'Uint8Array', execaSync));
test('Next generator argument is Uint8Array with encoding "buffer", with string writes, sync', () => testGeneratorNextEncoding(foobarString, 'buffer', false, false, 'Uint8Array', execaSync));
test('Next generator argument is string with encoding "buffer", with string writes, objectMode first, sync', () => testGeneratorNextEncoding(foobarString, 'buffer', true, false, 'String', execaSync));
test('Next generator argument is string with encoding "buffer", with string writes, objectMode both, sync', () => testGeneratorNextEncoding(foobarString, 'buffer', true, true, 'String', execaSync));
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, sync', () => testGeneratorNextEncoding(foobarUint8Array, 'buffer', false, false, 'Uint8Array', execaSync));
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, objectMode first, sync', () => testGeneratorNextEncoding(foobarUint8Array, 'buffer', true, false, 'Uint8Array', execaSync));
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, objectMode both, sync', () => testGeneratorNextEncoding(foobarUint8Array, 'buffer', true, true, 'Uint8Array', execaSync));
test('Next generator argument is Uint8Array with encoding "hex", with string writes, sync', () => testGeneratorNextEncoding(foobarString, 'hex', false, false, 'Uint8Array', execaSync));
test('Next generator argument is Uint8Array with encoding "hex", with Uint8Array writes, sync', () => testGeneratorNextEncoding(foobarUint8Array, 'hex', false, false, 'Uint8Array', execaSync));
test('Next generator argument is object with default encoding, with object writes, objectMode first, sync', () => testGeneratorNextEncoding(foobarObject, 'utf8', true, false, 'Object', execaSync));
test('Next generator argument is object with default encoding, with object writes, objectMode both, sync', () => testGeneratorNextEncoding(foobarObject, 'utf8', true, true, 'Object', execaSync));

const testFirstOutputGeneratorArgument = async (fdNumber, execaMethod) => {
	const lines = [];
	await execaMethod('noop-fd.js', [`${fdNumber}`], getStdio(fdNumber, getTypeofGenerator(lines)(true)));
	assertTypeofChunk(lines, 'String');
};

test('The first generator with result.stdout does not receive an object argument even in objectMode', () => testFirstOutputGeneratorArgument(1, execa));
test('The first generator with result.stderr does not receive an object argument even in objectMode', () => testFirstOutputGeneratorArgument(2, execa));
test('The first generator with result.stdio[*] does not receive an object argument even in objectMode', () => testFirstOutputGeneratorArgument(3, execa));
test('The first generator with result.stdout does not receive an object argument even in objectMode, sync', () => testFirstOutputGeneratorArgument(1, execaSync));
test('The first generator with result.stderr does not receive an object argument even in objectMode, sync', () => testFirstOutputGeneratorArgument(2, execaSync));
test('The first generator with result.stdio[*] does not receive an object argument even in objectMode, sync', () => testFirstOutputGeneratorArgument(3, execaSync));

// When the `encoding` option is binary, the whole pipeline is byte-oriented: a transform yielding a
// string has it encoded as UTF-8, then those bytes are serialized using the `encoding` option.
// This is the only coherent rule, since a yielded string like 'foobar' is neither valid hex nor valid base64.
// A non-ASCII string is used, so UTF-8 and the binary encoding differ.
const nonAsciiString = 'ré😀';
const nonAsciiBuffer = Buffer.from(nonAsciiString, 'utf8');

const testYieldStringBinaryEncoding = async (encoding, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: getOutputGenerator(nonAsciiString)(false, true),
		encoding,
	});
	assert.equal(stdout, nonAsciiBuffer.toString(encoding));
};

test('Transforms yielding a string are UTF-8 encoded, latin1', () => testYieldStringBinaryEncoding('latin1', execa));
test('Transforms yielding a string are UTF-8 encoded, latin1, sync', () => testYieldStringBinaryEncoding('latin1', execaSync));
test('Transforms yielding a string are UTF-8 encoded, hex', () => testYieldStringBinaryEncoding('hex', execa));
test('Transforms yielding a string are UTF-8 encoded, hex, sync', () => testYieldStringBinaryEncoding('hex', execaSync));
test('Transforms yielding a string are UTF-8 encoded, base64', () => testYieldStringBinaryEncoding('base64', execa));
test('Transforms yielding a string are UTF-8 encoded, base64, sync', () => testYieldStringBinaryEncoding('base64', execaSync));

// A transform yielding the bytes it received must round-trip them unchanged
const testYieldBytesBinaryEncoding = async execaMethod => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', nonAsciiString], {
		stdout: noopGenerator(false, true),
		encoding: 'latin1',
	});
	assert.equal(stdout, nonAsciiBuffer.toString('latin1'));
};

test('Transforms yielding Uint8Array keep the bytes unchanged', () => testYieldBytesBinaryEncoding(execa));
test('Transforms yielding Uint8Array keep the bytes unchanged, sync', () => testYieldBytesBinaryEncoding(execaSync));

/*
With a text encoding, a transform receives text decoded with it, so a string it yields must be encoded back with it.
Otherwise that string would be encoded as UTF-8, then decoded with the `encoding` option, which corrupts it.
*/
const nonAsciiUtf16Uint8Array = new Uint8Array(Buffer.from(nonAsciiString, 'utf16le'));

const testYieldStringTextEncoding = async (transform, expectedOutput, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: [getOutputGenerator(nonAsciiUtf16Uint8Array)(false, true), transform],
		encoding: 'utf16le',
	});
	assert.equal(stdout, expectedOutput);
};

test('Transforms yielding a string are encoded with encoding "utf16le"', () => testYieldStringTextEncoding(noopGenerator(), nonAsciiString, execa));
test('Transforms yielding a string are encoded with encoding "utf16le", sync', () => testYieldStringTextEncoding(noopGenerator(), nonAsciiString, execaSync));
test('Transforms modifying a string are encoded with encoding "utf16le"', () => testYieldStringTextEncoding(uppercaseGenerator(), nonAsciiString.toUpperCase(), execa));
test('Transforms modifying a string are encoded with encoding "utf16le", sync', () => testYieldStringTextEncoding(uppercaseGenerator(), nonAsciiString.toUpperCase(), execaSync));
test('Transforms yielding a Uint8Array keep the bytes unchanged with encoding "utf16le"', () => testYieldStringTextEncoding(getOutputGenerator(nonAsciiUtf16Uint8Array)(false, true), nonAsciiString, execa));
test('Transforms yielding a Uint8Array keep the bytes unchanged with encoding "utf16le", sync', () => testYieldStringTextEncoding(getOutputGenerator(nonAsciiUtf16Uint8Array)(false, true), nonAsciiString, execaSync));

// With the `binary` transform option, a string is encoded with UTF-8, including when it is passed to the next transform
const testYieldStringBinaryNextTransform = async execaMethod => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {
		stdout: [getOutputGenerator(foobarString)(false, true), noopGenerator()],
		encoding: 'utf16le',
	});
	assert.equal(stdout, Buffer.from(foobarString).toString('utf16le'));
};

test('Transforms with "binary: true" yielding a string to the next transform are encoded with UTF-8 with encoding "utf16le"', () => testYieldStringBinaryNextTransform(execa));
test('Transforms with "binary: true" yielding a string to the next transform are encoded with UTF-8 with encoding "utf16le", sync', () => testYieldStringBinaryNextTransform(execaSync));

/*
A `stdin` transform receives and yields text encoded with UTF-8, since the `encoding` option only applies to the output.
Since the subprocess echoes its input, its output is those UTF-8 bytes decoded as UTF-16.
*/
const unicornsString = '🦄🦄.';

const testStdinTransformUtf8 = async (input, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [[input], noopGenerator()],
		encoding: 'utf16le',
		stripFinalNewline: false,
	});
	assert.equal(stdout, Buffer.from(`${Buffer.from(input).toString()}\n`).toString('utf16le'));
};

test('Transforms yielding a string are encoded with UTF-8 with encoding "utf16le", stdin', () => testStdinTransformUtf8(new Uint8Array(Buffer.from(unicornsString)), execa));
test('Transforms yielding a string are encoded with UTF-8 with encoding "utf16le", stdin, sync', () => testStdinTransformUtf8(new Uint8Array(Buffer.from(unicornsString)), execaSync));
test('String input is encoded with UTF-8 with encoding "utf16le", stdin', () => testStdinTransformUtf8(unicornsString, execa));
test('String input is encoded with UTF-8 with encoding "utf16le", stdin, sync', () => testStdinTransformUtf8(unicornsString, execaSync));
