import {Buffer} from 'node:buffer';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarString, foobarUint8Array, foobarBuffer, foobarObject} from '../helpers/input.js';
import {noopGenerator, getOutputGenerator} from '../helpers/generator.js';

setFixtureDir();

const getTypeofGenerator = lines => (objectMode, binary) => ({
	* transform(line) {
		lines.push(Object.prototype.toString.call(line));
		yield '';
	},
	objectMode,
	binary,
});

const assertTypeofChunk = (t, lines, expectedType) => {
	t.deepEqual(lines, [`[object ${expectedType}]`]);
};

// eslint-disable-next-line max-params
const testGeneratorFirstEncoding = async (t, input, encoding, expectedType, objectMode, binary) => {
	const lines = [];
	const subprocess = execa('stdin.js', {stdin: getTypeofGenerator(lines)(objectMode, binary), encoding});
	subprocess.stdin.end(input);
	await subprocess;
	assertTypeofChunk(t, lines, expectedType);
};

test('First generator argument is string with default encoding, with string writes', testGeneratorFirstEncoding, foobarString, 'utf8', 'String', false, undefined);
test('First generator argument is string with default encoding, with Buffer writes', testGeneratorFirstEncoding, foobarBuffer, 'utf8', 'String', false, undefined);
test('First generator argument is string with default encoding, with Uint8Array writes', testGeneratorFirstEncoding, foobarUint8Array, 'utf8', 'String', false, undefined);
test('First generator argument is string with default encoding, with string writes, "binary: false"', testGeneratorFirstEncoding, foobarString, 'utf8', 'String', false, false);
test('First generator argument is Uint8Array with default encoding, with string writes, "binary: true"', testGeneratorFirstEncoding, foobarString, 'utf8', 'Uint8Array', false, true);
test('First generator argument is string with encoding "utf16le", with string writes', testGeneratorFirstEncoding, foobarString, 'utf16le', 'String', false, undefined);
test('First generator argument is string with encoding "utf16le", with Buffer writes', testGeneratorFirstEncoding, foobarBuffer, 'utf16le', 'String', false, undefined);
test('First generator argument is string with encoding "utf16le", with Uint8Array writes', testGeneratorFirstEncoding, foobarUint8Array, 'utf16le', 'String', false, undefined);
test('First generator argument is string with encoding "utf16le", with string writes, "binary: false"', testGeneratorFirstEncoding, foobarString, 'utf16le', 'String', false, false);
test('First generator argument is Uint8Array with encoding "utf16le", with string writes, "binary: true"', testGeneratorFirstEncoding, foobarString, 'utf16le', 'Uint8Array', false, true);
test('First generator argument is Uint8Array with encoding "buffer", with string writes', testGeneratorFirstEncoding, foobarString, 'buffer', 'Uint8Array', false, undefined);
test('First generator argument is Uint8Array with encoding "buffer", with Buffer writes', testGeneratorFirstEncoding, foobarBuffer, 'buffer', 'Uint8Array', false, undefined);
test('First generator argument is Uint8Array with encoding "buffer", with Uint8Array writes', testGeneratorFirstEncoding, foobarUint8Array, 'buffer', 'Uint8Array', false, undefined);
test('First generator argument is Uint8Array with encoding "buffer", with string writes, "binary: false"', testGeneratorFirstEncoding, foobarString, 'buffer', 'Uint8Array', false, false);
test('First generator argument is Uint8Array with encoding "buffer", with string writes, "binary: true"', testGeneratorFirstEncoding, foobarString, 'buffer', 'Uint8Array', false, true);
test('First generator argument is Uint8Array with encoding "hex", with string writes', testGeneratorFirstEncoding, foobarString, 'hex', 'Uint8Array', false, undefined);
test('First generator argument is Uint8Array with encoding "hex", with Buffer writes', testGeneratorFirstEncoding, foobarBuffer, 'hex', 'Uint8Array', false, undefined);
test('First generator argument is Uint8Array with encoding "hex", with Uint8Array writes', testGeneratorFirstEncoding, foobarUint8Array, 'hex', 'Uint8Array', false, undefined);
test('First generator argument is Uint8Array with encoding "hex", with string writes, "binary: false"', testGeneratorFirstEncoding, foobarString, 'hex', 'Uint8Array', false, false);
test('First generator argument is Uint8Array with encoding "hex", with string writes, "binary: true"', testGeneratorFirstEncoding, foobarString, 'hex', 'Uint8Array', false, true);
test('First generator argument can be string with objectMode', testGeneratorFirstEncoding, foobarString, 'utf8', 'String', true, undefined);
test('First generator argument can be string with objectMode, "binary: false"', testGeneratorFirstEncoding, foobarString, 'utf8', 'String', true, false);
test('First generator argument can be string with objectMode, "binary: true"', testGeneratorFirstEncoding, foobarString, 'utf8', 'String', true, true);
test('First generator argument can be objects with objectMode', testGeneratorFirstEncoding, foobarObject, 'utf8', 'Object', true, undefined);
test('First generator argument can be objects with objectMode, "binary: false"', testGeneratorFirstEncoding, foobarObject, 'utf8', 'Object', true, false);
test('First generator argument can be objects with objectMode, "binary: true"', testGeneratorFirstEncoding, foobarObject, 'utf8', 'Object', true, true);

// eslint-disable-next-line max-params
const testGeneratorFirstEncodingSync = (t, input, encoding, expectedType, objectMode, binary) => {
	const lines = [];
	execaSync('stdin.js', {stdin: [[input], getTypeofGenerator(lines)(objectMode, binary)], encoding});
	assertTypeofChunk(t, lines, expectedType);
};

test('First generator argument is string with default encoding, with string writes, sync', testGeneratorFirstEncodingSync, foobarString, 'utf8', 'String', false, undefined);
test('First generator argument is string with default encoding, with Uint8Array writes, sync', testGeneratorFirstEncodingSync, foobarUint8Array, 'utf8', 'String', false, undefined);
test('First generator argument is string with default encoding, with string writes, "binary: false", sync', testGeneratorFirstEncodingSync, foobarString, 'utf8', 'String', false, false);
test('First generator argument is Uint8Array with default encoding, with string writes, "binary: true", sync', testGeneratorFirstEncodingSync, foobarString, 'utf8', 'Uint8Array', false, true);
test('First generator argument is string with encoding "utf16le", with string writes, sync', testGeneratorFirstEncodingSync, foobarString, 'utf16le', 'String', false, undefined);
test('First generator argument is string with encoding "utf16le", with Uint8Array writes, sync', testGeneratorFirstEncodingSync, foobarUint8Array, 'utf16le', 'String', false, undefined);
test('First generator argument is string with encoding "utf16le", with string writes, "binary: false", sync', testGeneratorFirstEncodingSync, foobarString, 'utf16le', 'String', false, false);
test('First generator argument is Uint8Array with encoding "utf16le", with string writes, "binary: true", sync', testGeneratorFirstEncodingSync, foobarString, 'utf16le', 'Uint8Array', false, true);
test('First generator argument is Uint8Array with encoding "buffer", with string writes, sync', testGeneratorFirstEncodingSync, foobarString, 'buffer', 'Uint8Array', false, undefined);
test('First generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, sync', testGeneratorFirstEncodingSync, foobarUint8Array, 'buffer', 'Uint8Array', false, undefined);
test('First generator argument is Uint8Array with encoding "buffer", with string writes, "binary: false", sync', testGeneratorFirstEncodingSync, foobarString, 'buffer', 'Uint8Array', false, false);
test('First generator argument is Uint8Array with encoding "buffer", with string writes, "binary: true", sync', testGeneratorFirstEncodingSync, foobarString, 'buffer', 'Uint8Array', false, true);
test('First generator argument is Uint8Array with encoding "hex", with string writes, sync', testGeneratorFirstEncodingSync, foobarString, 'hex', 'Uint8Array', false, undefined);
test('First generator argument is Uint8Array with encoding "hex", with Uint8Array writes, sync', testGeneratorFirstEncodingSync, foobarUint8Array, 'hex', 'Uint8Array', false, undefined);
test('First generator argument is Uint8Array with encoding "hex", with string writes, "binary: false", sync', testGeneratorFirstEncodingSync, foobarString, 'hex', 'Uint8Array', false, false);
test('First generator argument is Uint8Array with encoding "hex", with string writes, "binary: true", sync', testGeneratorFirstEncodingSync, foobarString, 'hex', 'Uint8Array', false, true);
test('First generator argument can be string with objectMode, sync', testGeneratorFirstEncodingSync, foobarString, 'utf8', 'String', true, undefined);
test('First generator argument can be string with objectMode, "binary: false", sync', testGeneratorFirstEncodingSync, foobarString, 'utf8', 'String', true, false);
test('First generator argument can be string with objectMode, "binary: true", sync', testGeneratorFirstEncodingSync, foobarString, 'utf8', 'String', true, true);
test('First generator argument can be objects with objectMode, sync', testGeneratorFirstEncodingSync, foobarObject, 'utf8', 'Object', true, undefined);
test('First generator argument can be objects with objectMode, "binary: false", sync', testGeneratorFirstEncodingSync, foobarObject, 'utf8', 'Object', true, false);
test('First generator argument can be objects with objectMode, "binary: true", sync', testGeneratorFirstEncodingSync, foobarObject, 'utf8', 'Object', true, true);

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
const testGeneratorNextEncoding = async (t, input, encoding, firstObjectMode, secondObjectMode, expectedType, execaMethod) => {
	const lines = [];
	await execaMethod('noop.js', ['other'], {
		stdout: [
			getOutputGenerator(input)(firstObjectMode),
			getTypeofGenerator(lines)(secondObjectMode),
		],
		encoding,
	});
	assertTypeofChunk(t, lines, expectedType);
};

test('Next generator argument is string with default encoding, with string writes', testGeneratorNextEncoding, foobarString, 'utf8', false, false, 'String', execa);
test('Next generator argument is string with default encoding, with string writes, objectMode first', testGeneratorNextEncoding, foobarString, 'utf8', true, false, 'String', execa);
test('Next generator argument is string with default encoding, with string writes, objectMode both', testGeneratorNextEncoding, foobarString, 'utf8', true, true, 'String', execa);
test('Next generator argument is string with default encoding, with Uint8Array writes', testGeneratorNextEncoding, foobarUint8Array, 'utf8', false, false, 'String', execa);
test('Next generator argument is Uint8Array with default encoding, with Uint8Array writes, objectMode first', testGeneratorNextEncoding, foobarUint8Array, 'utf8', true, false, 'Uint8Array', execa);
test('Next generator argument is string with default encoding, with Uint8Array writes, objectMode both', testGeneratorNextEncoding, foobarUint8Array, 'utf8', true, true, 'Uint8Array', execa);
test('Next generator argument is string with encoding "utf16le", with string writes', testGeneratorNextEncoding, foobarString, 'utf16le', false, false, 'String', execa);
test('Next generator argument is string with encoding "utf16le",, with string writes, objectMode first', testGeneratorNextEncoding, foobarString, 'utf16le', true, false, 'String', execa);
test('Next generator argument is string with encoding "utf16le",, with string writes, objectMode both', testGeneratorNextEncoding, foobarString, 'utf16le', true, true, 'String', execa);
test('Next generator argument is string with encoding "utf16le",, with Uint8Array writes', testGeneratorNextEncoding, foobarUint8Array, 'utf16le', false, false, 'String', execa);
test('Next generator argument is Uint8Array with encoding "utf16le",, with Uint8Array writes, objectMode first', testGeneratorNextEncoding, foobarUint8Array, 'utf16le', true, false, 'Uint8Array', execa);
test('Next generator argument is string with encoding "utf16le",, with Uint8Array writes, objectMode both', testGeneratorNextEncoding, foobarUint8Array, 'utf16le', true, true, 'Uint8Array', execa);
test('Next generator argument is Uint8Array with encoding "buffer", with string writes', testGeneratorNextEncoding, foobarString, 'buffer', false, false, 'Uint8Array', execa);
test('Next generator argument is string with encoding "buffer", with string writes, objectMode first', testGeneratorNextEncoding, foobarString, 'buffer', true, false, 'String', execa);
test('Next generator argument is string with encoding "buffer", with string writes, objectMode both', testGeneratorNextEncoding, foobarString, 'buffer', true, true, 'String', execa);
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes', testGeneratorNextEncoding, foobarUint8Array, 'buffer', false, false, 'Uint8Array', execa);
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, objectMode first', testGeneratorNextEncoding, foobarUint8Array, 'buffer', true, false, 'Uint8Array', execa);
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, objectMode both', testGeneratorNextEncoding, foobarUint8Array, 'buffer', true, true, 'Uint8Array', execa);
test('Next generator argument is Uint8Array with encoding "hex", with string writes', testGeneratorNextEncoding, foobarString, 'hex', false, false, 'Uint8Array', execa);
test('Next generator argument is Uint8Array with encoding "hex", with Uint8Array writes', testGeneratorNextEncoding, foobarUint8Array, 'hex', false, false, 'Uint8Array', execa);
test('Next generator argument is object with default encoding, with object writes, objectMode first', testGeneratorNextEncoding, foobarObject, 'utf8', true, false, 'Object', execa);
test('Next generator argument is object with default encoding, with object writes, objectMode both', testGeneratorNextEncoding, foobarObject, 'utf8', true, true, 'Object', execa);
test('Next generator argument is string with default encoding, with string writes, sync', testGeneratorNextEncoding, foobarString, 'utf8', false, false, 'String', execaSync);
test('Next generator argument is string with default encoding, with string writes, objectMode first, sync', testGeneratorNextEncoding, foobarString, 'utf8', true, false, 'String', execaSync);
test('Next generator argument is string with default encoding, with string writes, objectMode both, sync', testGeneratorNextEncoding, foobarString, 'utf8', true, true, 'String', execaSync);
test('Next generator argument is string with default encoding, with Uint8Array writes, sync', testGeneratorNextEncoding, foobarUint8Array, 'utf8', false, false, 'String', execaSync);
test('Next generator argument is Uint8Array with default encoding, with Uint8Array writes, objectMode first, sync', testGeneratorNextEncoding, foobarUint8Array, 'utf8', true, false, 'Uint8Array', execaSync);
test('Next generator argument is string with default encoding, with Uint8Array writes, objectMode both, sync', testGeneratorNextEncoding, foobarUint8Array, 'utf8', true, true, 'Uint8Array', execaSync);
test('Next generator argument is string with encoding "utf16le", with string writes, sync', testGeneratorNextEncoding, foobarString, 'utf16le', false, false, 'String', execaSync);
test('Next generator argument is string with encoding "utf16le",, with string writes, objectMode first, sync', testGeneratorNextEncoding, foobarString, 'utf16le', true, false, 'String', execaSync);
test('Next generator argument is string with encoding "utf16le",, with string writes, objectMode both, sync', testGeneratorNextEncoding, foobarString, 'utf16le', true, true, 'String', execaSync);
test('Next generator argument is string with encoding "utf16le",, with Uint8Array writes, sync', testGeneratorNextEncoding, foobarUint8Array, 'utf16le', false, false, 'String', execaSync);
test('Next generator argument is Uint8Array with encoding "utf16le",, with Uint8Array writes, objectMode first, sync', testGeneratorNextEncoding, foobarUint8Array, 'utf16le', true, false, 'Uint8Array', execaSync);
test('Next generator argument is string with encoding "utf16le",, with Uint8Array writes, objectMode both, sync', testGeneratorNextEncoding, foobarUint8Array, 'utf16le', true, true, 'Uint8Array', execaSync);
test('Next generator argument is Uint8Array with encoding "buffer", with string writes, sync', testGeneratorNextEncoding, foobarString, 'buffer', false, false, 'Uint8Array', execaSync);
test('Next generator argument is string with encoding "buffer", with string writes, objectMode first, sync', testGeneratorNextEncoding, foobarString, 'buffer', true, false, 'String', execaSync);
test('Next generator argument is string with encoding "buffer", with string writes, objectMode both, sync', testGeneratorNextEncoding, foobarString, 'buffer', true, true, 'String', execaSync);
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, sync', testGeneratorNextEncoding, foobarUint8Array, 'buffer', false, false, 'Uint8Array', execaSync);
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, objectMode first, sync', testGeneratorNextEncoding, foobarUint8Array, 'buffer', true, false, 'Uint8Array', execaSync);
test('Next generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, objectMode both, sync', testGeneratorNextEncoding, foobarUint8Array, 'buffer', true, true, 'Uint8Array', execaSync);
test('Next generator argument is Uint8Array with encoding "hex", with string writes, sync', testGeneratorNextEncoding, foobarString, 'hex', false, false, 'Uint8Array', execaSync);
test('Next generator argument is Uint8Array with encoding "hex", with Uint8Array writes, sync', testGeneratorNextEncoding, foobarUint8Array, 'hex', false, false, 'Uint8Array', execaSync);
test('Next generator argument is object with default encoding, with object writes, objectMode first, sync', testGeneratorNextEncoding, foobarObject, 'utf8', true, false, 'Object', execaSync);
test('Next generator argument is object with default encoding, with object writes, objectMode both, sync', testGeneratorNextEncoding, foobarObject, 'utf8', true, true, 'Object', execaSync);

const testFirstOutputGeneratorArgument = async (t, fdNumber, execaMethod) => {
	const lines = [];
	await execaMethod('noop-fd.js', [`${fdNumber}`], getStdio(fdNumber, getTypeofGenerator(lines)(true)));
	assertTypeofChunk(t, lines, 'String');
};

test('The first generator with result.stdout does not receive an object argument even in objectMode', testFirstOutputGeneratorArgument, 1, execa);
test('The first generator with result.stderr does not receive an object argument even in objectMode', testFirstOutputGeneratorArgument, 2, execa);
test('The first generator with result.stdio[*] does not receive an object argument even in objectMode', testFirstOutputGeneratorArgument, 3, execa);
test('The first generator with result.stdout does not receive an object argument even in objectMode, sync', testFirstOutputGeneratorArgument, 1, execaSync);
test('The first generator with result.stderr does not receive an object argument even in objectMode, sync', testFirstOutputGeneratorArgument, 2, execaSync);
test('The first generator with result.stdio[*] does not receive an object argument even in objectMode, sync', testFirstOutputGeneratorArgument, 3, execaSync);
