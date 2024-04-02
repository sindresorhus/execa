import {Buffer} from 'node:buffer';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarString, foobarUint8Array, foobarBuffer, foobarObject} from '../helpers/input.js';
import {noopGenerator, getOutputGenerator, getOutputsGenerator, convertTransformToFinal} from '../helpers/generator.js';
import {multibyteChar, multibyteString, multibyteUint8Array, breakingLength, brokenSymbol} from '../helpers/encoding.js';

setFixtureDir();

const getTypeofGenerator = (objectMode, binary) => ({
	* transform(line) {
		yield Object.prototype.toString.call(line);
	},
	objectMode,
	binary,
});

const assertTypeofChunk = (t, output, encoding, expectedType) => {
	const typeofChunk = Buffer.from(output, encoding === 'buffer' ? undefined : encoding).toString().trim();
	t.is(typeofChunk, `[object ${expectedType}]`);
};

// eslint-disable-next-line max-params
const testGeneratorFirstEncoding = async (t, input, encoding, expectedType, objectMode, binary) => {
	const subprocess = execa('stdin.js', {stdin: getTypeofGenerator(objectMode, binary), encoding});
	subprocess.stdin.end(input);
	const {stdout} = await subprocess;
	assertTypeofChunk(t, stdout, encoding, expectedType);
};

test('First generator argument is string with default encoding, with string writes', testGeneratorFirstEncoding, foobarString, 'utf8', 'String', false);
test('First generator argument is string with default encoding, with Buffer writes', testGeneratorFirstEncoding, foobarBuffer, 'utf8', 'String', false);
test('First generator argument is string with default encoding, with Uint8Array writes', testGeneratorFirstEncoding, foobarUint8Array, 'utf8', 'String', false);
test('First generator argument is Uint8Array with encoding "buffer", with string writes', testGeneratorFirstEncoding, foobarString, 'buffer', 'Uint8Array', false);
test('First generator argument is Uint8Array with encoding "buffer", with Buffer writes', testGeneratorFirstEncoding, foobarBuffer, 'buffer', 'Uint8Array', false);
test('First generator argument is Uint8Array with encoding "buffer", with Uint8Array writes', testGeneratorFirstEncoding, foobarUint8Array, 'buffer', 'Uint8Array', false);
test('First generator argument is Uint8Array with encoding "hex", with string writes', testGeneratorFirstEncoding, foobarString, 'hex', 'Uint8Array', false);
test('First generator argument is Uint8Array with encoding "hex", with Buffer writes', testGeneratorFirstEncoding, foobarBuffer, 'hex', 'Uint8Array', false);
test('First generator argument is Uint8Array with encoding "hex", with Uint8Array writes', testGeneratorFirstEncoding, foobarUint8Array, 'hex', 'Uint8Array', false);
test('First generator argument can be string with objectMode', testGeneratorFirstEncoding, foobarString, 'utf8', 'String', true);
test('First generator argument can be objects with objectMode', testGeneratorFirstEncoding, foobarObject, 'utf8', 'Object', true);
test('First generator argument is string with default encoding, with string writes, "binary: false"', testGeneratorFirstEncoding, foobarString, 'utf8', 'String', false, false);
test('First generator argument is Uint8Array with default encoding, with string writes, "binary: true"', testGeneratorFirstEncoding, foobarString, 'utf8', 'Uint8Array', false, true);
test('First generator argument is Uint8Array with encoding "buffer", with string writes, "binary: false"', testGeneratorFirstEncoding, foobarString, 'buffer', 'Uint8Array', false, false);
test('First generator argument is Uint8Array with encoding "buffer", with string writes, "binary: true"', testGeneratorFirstEncoding, foobarString, 'buffer', 'Uint8Array', false, true);
test('First generator argument is Uint8Array with encoding "hex", with string writes, "binary: false"', testGeneratorFirstEncoding, foobarString, 'hex', 'Uint8Array', false, false);
test('First generator argument is Uint8Array with encoding "hex", with string writes, "binary: true"', testGeneratorFirstEncoding, foobarString, 'hex', 'Uint8Array', false, true);

// eslint-disable-next-line max-params
const testGeneratorFirstEncodingSync = (t, input, encoding, expectedType, objectMode, binary) => {
	const {stdout} = execaSync('stdin.js', {stdin: [[input], getTypeofGenerator(objectMode, binary)], encoding});
	assertTypeofChunk(t, stdout, encoding, expectedType);
};

test('First generator argument is string with default encoding, with string writes, sync', testGeneratorFirstEncodingSync, foobarString, 'utf8', 'String', false);
test('First generator argument is string with default encoding, with Uint8Array writes, sync', testGeneratorFirstEncodingSync, foobarUint8Array, 'utf8', 'String', false);
test('First generator argument is Uint8Array with encoding "buffer", with string writes, sync', testGeneratorFirstEncodingSync, foobarString, 'buffer', 'Uint8Array', false);
test('First generator argument is Uint8Array with encoding "buffer", with Uint8Array writes, sync', testGeneratorFirstEncodingSync, foobarUint8Array, 'buffer', 'Uint8Array', false);
test('First generator argument is Uint8Array with encoding "hex", with string writes, sync', testGeneratorFirstEncodingSync, foobarString, 'hex', 'Uint8Array', false);
test('First generator argument is Uint8Array with encoding "hex", with Uint8Array writes, sync', testGeneratorFirstEncodingSync, foobarUint8Array, 'hex', 'Uint8Array', false);
test('First generator argument can be string with objectMode, sync', testGeneratorFirstEncodingSync, foobarString, 'utf8', 'String', true);
test('First generator argument can be objects with objectMode, sync', testGeneratorFirstEncodingSync, foobarObject, 'utf8', 'Object', true);
test('First generator argument is string with default encoding, with string writes, "binary: false", sync', testGeneratorFirstEncodingSync, foobarString, 'utf8', 'String', false, false);
test('First generator argument is Uint8Array with default encoding, with string writes, "binary: true", sync', testGeneratorFirstEncodingSync, foobarString, 'utf8', 'Uint8Array', false, true);
test('First generator argument is Uint8Array with encoding "buffer", with string writes, "binary: false", sync', testGeneratorFirstEncodingSync, foobarString, 'buffer', 'Uint8Array', false, false);
test('First generator argument is Uint8Array with encoding "buffer", with string writes, "binary: true", sync', testGeneratorFirstEncodingSync, foobarString, 'buffer', 'Uint8Array', false, true);
test('First generator argument is Uint8Array with encoding "hex", with string writes, "binary: false", sync', testGeneratorFirstEncodingSync, foobarString, 'hex', 'Uint8Array', false, false);
test('First generator argument is Uint8Array with encoding "hex", with string writes, "binary: true", sync', testGeneratorFirstEncodingSync, foobarString, 'hex', 'Uint8Array', false, true);

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
	const {stdout} = await execaMethod('noop.js', ['other'], {
		stdout: [
			getOutputGenerator(input)(firstObjectMode),
			getTypeofGenerator(secondObjectMode),
		],
		encoding,
	});
	const output = Array.isArray(stdout) ? stdout[0] : stdout;
	assertTypeofChunk(t, output, encoding, expectedType);
};

test('Next generator argument is string with default encoding, with string writes', testGeneratorNextEncoding, foobarString, 'utf8', false, false, 'String', execa);
test('Next generator argument is string with default encoding, with string writes, objectMode first', testGeneratorNextEncoding, foobarString, 'utf8', true, false, 'String', execa);
test('Next generator argument is string with default encoding, with string writes, objectMode both', testGeneratorNextEncoding, foobarString, 'utf8', true, true, 'String', execa);
test('Next generator argument is string with default encoding, with Uint8Array writes', testGeneratorNextEncoding, foobarUint8Array, 'utf8', false, false, 'String', execa);
test('Next generator argument is Uint8Array with default encoding, with Uint8Array writes, objectMode first', testGeneratorNextEncoding, foobarUint8Array, 'utf8', true, false, 'Uint8Array', execa);
test('Next generator argument is string with default encoding, with Uint8Array writes, objectMode both', testGeneratorNextEncoding, foobarUint8Array, 'utf8', true, true, 'Uint8Array', execa);
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
	const {stdio} = await execaMethod('noop-fd.js', [`${fdNumber}`], getStdio(fdNumber, getTypeofGenerator(true)));
	t.deepEqual(stdio[fdNumber], ['[object String]']);
};

test('The first generator with result.stdout does not receive an object argument even in objectMode', testFirstOutputGeneratorArgument, 1, execa);
test('The first generator with result.stderr does not receive an object argument even in objectMode', testFirstOutputGeneratorArgument, 2, execa);
test('The first generator with result.stdio[*] does not receive an object argument even in objectMode', testFirstOutputGeneratorArgument, 3, execa);
test('The first generator with result.stdout does not receive an object argument even in objectMode, sync', testFirstOutputGeneratorArgument, 1, execaSync);
test('The first generator with result.stderr does not receive an object argument even in objectMode, sync', testFirstOutputGeneratorArgument, 2, execaSync);
test('The first generator with result.stdio[*] does not receive an object argument even in objectMode, sync', testFirstOutputGeneratorArgument, 3, execaSync);

// eslint-disable-next-line max-params
const testGeneratorReturnType = async (t, input, encoding, reject, objectMode, final, execaMethod) => {
	const fixtureName = reject ? 'noop-fd.js' : 'noop-fail.js';
	const {stdout} = await execaMethod(fixtureName, ['1', foobarString], {
		stdout: convertTransformToFinal(getOutputGenerator(input)(objectMode, true), final),
		encoding,
		reject,
	});
	const typeofChunk = Array.isArray(stdout) ? stdout[0] : stdout;
	const output = Buffer.from(typeofChunk, encoding === 'buffer' || objectMode ? undefined : encoding).toString();
	t.is(output, foobarString);
};

test('Generator can return string with default encoding', testGeneratorReturnType, foobarString, 'utf8', true, false, false, execa);
test('Generator can return Uint8Array with default encoding', testGeneratorReturnType, foobarUint8Array, 'utf8', true, false, false, execa);
test('Generator can return string with encoding "buffer"', testGeneratorReturnType, foobarString, 'buffer', true, false, false, execa);
test('Generator can return Uint8Array with encoding "buffer"', testGeneratorReturnType, foobarUint8Array, 'buffer', true, false, false, execa);
test('Generator can return string with encoding "hex"', testGeneratorReturnType, foobarString, 'hex', true, false, false, execa);
test('Generator can return Uint8Array with encoding "hex"', testGeneratorReturnType, foobarUint8Array, 'hex', true, false, false, execa);
test('Generator can return string with default encoding, failure', testGeneratorReturnType, foobarString, 'utf8', false, false, false, execa);
test('Generator can return Uint8Array with default encoding, failure', testGeneratorReturnType, foobarUint8Array, 'utf8', false, false, false, execa);
test('Generator can return string with encoding "buffer", failure', testGeneratorReturnType, foobarString, 'buffer', false, false, false, execa);
test('Generator can return Uint8Array with encoding "buffer", failure', testGeneratorReturnType, foobarUint8Array, 'buffer', false, false, false, execa);
test('Generator can return string with encoding "hex", failure', testGeneratorReturnType, foobarString, 'hex', false, false, false, execa);
test('Generator can return Uint8Array with encoding "hex", failure', testGeneratorReturnType, foobarUint8Array, 'hex', false, false, false, execa);
test('Generator can return string with default encoding, objectMode', testGeneratorReturnType, foobarString, 'utf8', true, true, false, execa);
test('Generator can return Uint8Array with default encoding, objectMode', testGeneratorReturnType, foobarUint8Array, 'utf8', true, true, false, execa);
test('Generator can return string with encoding "buffer", objectMode', testGeneratorReturnType, foobarString, 'buffer', true, true, false, execa);
test('Generator can return Uint8Array with encoding "buffer", objectMode', testGeneratorReturnType, foobarUint8Array, 'buffer', true, true, false, execa);
test('Generator can return string with encoding "hex", objectMode', testGeneratorReturnType, foobarString, 'hex', true, true, false, execa);
test('Generator can return Uint8Array with encoding "hex", objectMode', testGeneratorReturnType, foobarUint8Array, 'hex', true, true, false, execa);
test('Generator can return string with default encoding, objectMode, failure', testGeneratorReturnType, foobarString, 'utf8', false, true, false, execa);
test('Generator can return Uint8Array with default encoding, objectMode, failure', testGeneratorReturnType, foobarUint8Array, 'utf8', false, true, false, execa);
test('Generator can return string with encoding "buffer", objectMode, failure', testGeneratorReturnType, foobarString, 'buffer', false, true, false, execa);
test('Generator can return Uint8Array with encoding "buffer", objectMode, failure', testGeneratorReturnType, foobarUint8Array, 'buffer', false, true, false, execa);
test('Generator can return string with encoding "hex", objectMode, failure', testGeneratorReturnType, foobarString, 'hex', false, true, false, execa);
test('Generator can return Uint8Array with encoding "hex", objectMode, failure', testGeneratorReturnType, foobarUint8Array, 'hex', false, true, false, execa);
test('Generator can return final string with default encoding', testGeneratorReturnType, foobarString, 'utf8', true, false, true, execa);
test('Generator can return final Uint8Array with default encoding', testGeneratorReturnType, foobarUint8Array, 'utf8', true, false, true, execa);
test('Generator can return final string with encoding "buffer"', testGeneratorReturnType, foobarString, 'buffer', true, false, true, execa);
test('Generator can return final Uint8Array with encoding "buffer"', testGeneratorReturnType, foobarUint8Array, 'buffer', true, false, true, execa);
test('Generator can return final string with encoding "hex"', testGeneratorReturnType, foobarString, 'hex', true, false, true, execa);
test('Generator can return final Uint8Array with encoding "hex"', testGeneratorReturnType, foobarUint8Array, 'hex', true, false, true, execa);
test('Generator can return final string with default encoding, failure', testGeneratorReturnType, foobarString, 'utf8', false, false, true, execa);
test('Generator can return final Uint8Array with default encoding, failure', testGeneratorReturnType, foobarUint8Array, 'utf8', false, false, true, execa);
test('Generator can return final string with encoding "buffer", failure', testGeneratorReturnType, foobarString, 'buffer', false, false, true, execa);
test('Generator can return final Uint8Array with encoding "buffer", failure', testGeneratorReturnType, foobarUint8Array, 'buffer', false, false, true, execa);
test('Generator can return final string with encoding "hex", failure', testGeneratorReturnType, foobarString, 'hex', false, false, true, execa);
test('Generator can return final Uint8Array with encoding "hex", failure', testGeneratorReturnType, foobarUint8Array, 'hex', false, false, true, execa);
test('Generator can return final string with default encoding, objectMode', testGeneratorReturnType, foobarString, 'utf8', true, true, true, execa);
test('Generator can return final Uint8Array with default encoding, objectMode', testGeneratorReturnType, foobarUint8Array, 'utf8', true, true, true, execa);
test('Generator can return final string with encoding "buffer", objectMode', testGeneratorReturnType, foobarString, 'buffer', true, true, true, execa);
test('Generator can return final Uint8Array with encoding "buffer", objectMode', testGeneratorReturnType, foobarUint8Array, 'buffer', true, true, true, execa);
test('Generator can return final string with encoding "hex", objectMode', testGeneratorReturnType, foobarString, 'hex', true, true, true, execa);
test('Generator can return final Uint8Array with encoding "hex", objectMode', testGeneratorReturnType, foobarUint8Array, 'hex', true, true, true, execa);
test('Generator can return final string with default encoding, objectMode, failure', testGeneratorReturnType, foobarString, 'utf8', false, true, true, execa);
test('Generator can return final Uint8Array with default encoding, objectMode, failure', testGeneratorReturnType, foobarUint8Array, 'utf8', false, true, true, execa);
test('Generator can return final string with encoding "buffer", objectMode, failure', testGeneratorReturnType, foobarString, 'buffer', false, true, true, execa);
test('Generator can return final Uint8Array with encoding "buffer", objectMode, failure', testGeneratorReturnType, foobarUint8Array, 'buffer', false, true, true, execa);
test('Generator can return final string with encoding "hex", objectMode, failure', testGeneratorReturnType, foobarString, 'hex', false, true, true, execa);
test('Generator can return final Uint8Array with encoding "hex", objectMode, failure', testGeneratorReturnType, foobarUint8Array, 'hex', false, true, true, execa);
test('Generator can return string with default encoding, sync', testGeneratorReturnType, foobarString, 'utf8', true, false, false, execaSync);
test('Generator can return Uint8Array with default encoding, sync', testGeneratorReturnType, foobarUint8Array, 'utf8', true, false, false, execaSync);
test('Generator can return string with encoding "buffer", sync', testGeneratorReturnType, foobarString, 'buffer', true, false, false, execaSync);
test('Generator can return Uint8Array with encoding "buffer", sync', testGeneratorReturnType, foobarUint8Array, 'buffer', true, false, false, execaSync);
test('Generator can return string with encoding "hex", sync', testGeneratorReturnType, foobarString, 'hex', true, false, false, execaSync);
test('Generator can return Uint8Array with encoding "hex", sync', testGeneratorReturnType, foobarUint8Array, 'hex', true, false, false, execaSync);
test('Generator can return string with default encoding, failure, sync', testGeneratorReturnType, foobarString, 'utf8', false, false, false, execaSync);
test('Generator can return Uint8Array with default encoding, failure, sync', testGeneratorReturnType, foobarUint8Array, 'utf8', false, false, false, execaSync);
test('Generator can return string with encoding "buffer", failure, sync', testGeneratorReturnType, foobarString, 'buffer', false, false, false, execaSync);
test('Generator can return Uint8Array with encoding "buffer", failure, sync', testGeneratorReturnType, foobarUint8Array, 'buffer', false, false, false, execaSync);
test('Generator can return string with encoding "hex", failure, sync', testGeneratorReturnType, foobarString, 'hex', false, false, false, execaSync);
test('Generator can return Uint8Array with encoding "hex", failure, sync', testGeneratorReturnType, foobarUint8Array, 'hex', false, false, false, execaSync);
test('Generator can return string with default encoding, objectMode, sync', testGeneratorReturnType, foobarString, 'utf8', true, true, false, execaSync);
test('Generator can return Uint8Array with default encoding, objectMode, sync', testGeneratorReturnType, foobarUint8Array, 'utf8', true, true, false, execaSync);
test('Generator can return string with encoding "buffer", objectMode, sync', testGeneratorReturnType, foobarString, 'buffer', true, true, false, execaSync);
test('Generator can return Uint8Array with encoding "buffer", objectMode, sync', testGeneratorReturnType, foobarUint8Array, 'buffer', true, true, false, execaSync);
test('Generator can return string with encoding "hex", objectMode, sync', testGeneratorReturnType, foobarString, 'hex', true, true, false, execaSync);
test('Generator can return Uint8Array with encoding "hex", objectMode, sync', testGeneratorReturnType, foobarUint8Array, 'hex', true, true, false, execaSync);
test('Generator can return string with default encoding, objectMode, failure, sync', testGeneratorReturnType, foobarString, 'utf8', false, true, false, execaSync);
test('Generator can return Uint8Array with default encoding, objectMode, failure, sync', testGeneratorReturnType, foobarUint8Array, 'utf8', false, true, false, execaSync);
test('Generator can return string with encoding "buffer", objectMode, failure, sync', testGeneratorReturnType, foobarString, 'buffer', false, true, false, execaSync);
test('Generator can return Uint8Array with encoding "buffer", objectMode, failure, sync', testGeneratorReturnType, foobarUint8Array, 'buffer', false, true, false, execaSync);
test('Generator can return string with encoding "hex", objectMode, failure, sync', testGeneratorReturnType, foobarString, 'hex', false, true, false, execaSync);
test('Generator can return Uint8Array with encoding "hex", objectMode, failure, sync', testGeneratorReturnType, foobarUint8Array, 'hex', false, true, false, execaSync);
test('Generator can return final string with default encoding, sync', testGeneratorReturnType, foobarString, 'utf8', true, false, true, execaSync);
test('Generator can return final Uint8Array with default encoding, sync', testGeneratorReturnType, foobarUint8Array, 'utf8', true, false, true, execaSync);
test('Generator can return final string with encoding "buffer", sync', testGeneratorReturnType, foobarString, 'buffer', true, false, true, execaSync);
test('Generator can return final Uint8Array with encoding "buffer", sync', testGeneratorReturnType, foobarUint8Array, 'buffer', true, false, true, execaSync);
test('Generator can return final string with encoding "hex", sync', testGeneratorReturnType, foobarString, 'hex', true, false, true, execaSync);
test('Generator can return final Uint8Array with encoding "hex", sync', testGeneratorReturnType, foobarUint8Array, 'hex', true, false, true, execaSync);
test('Generator can return final string with default encoding, failure, sync', testGeneratorReturnType, foobarString, 'utf8', false, false, true, execaSync);
test('Generator can return final Uint8Array with default encoding, failure, sync', testGeneratorReturnType, foobarUint8Array, 'utf8', false, false, true, execaSync);
test('Generator can return final string with encoding "buffer", failure, sync', testGeneratorReturnType, foobarString, 'buffer', false, false, true, execaSync);
test('Generator can return final Uint8Array with encoding "buffer", failure, sync', testGeneratorReturnType, foobarUint8Array, 'buffer', false, false, true, execaSync);
test('Generator can return final string with encoding "hex", failure, sync', testGeneratorReturnType, foobarString, 'hex', false, false, true, execaSync);
test('Generator can return final Uint8Array with encoding "hex", failure, sync', testGeneratorReturnType, foobarUint8Array, 'hex', false, false, true, execaSync);
test('Generator can return final string with default encoding, objectMode, sync', testGeneratorReturnType, foobarString, 'utf8', true, true, true, execaSync);
test('Generator can return final Uint8Array with default encoding, objectMode, sync', testGeneratorReturnType, foobarUint8Array, 'utf8', true, true, true, execaSync);
test('Generator can return final string with encoding "buffer", objectMode, sync', testGeneratorReturnType, foobarString, 'buffer', true, true, true, execaSync);
test('Generator can return final Uint8Array with encoding "buffer", objectMode, sync', testGeneratorReturnType, foobarUint8Array, 'buffer', true, true, true, execaSync);
test('Generator can return final string with encoding "hex", objectMode, sync', testGeneratorReturnType, foobarString, 'hex', true, true, true, execaSync);
test('Generator can return final Uint8Array with encoding "hex", objectMode, sync', testGeneratorReturnType, foobarUint8Array, 'hex', true, true, true, execaSync);
test('Generator can return final string with default encoding, objectMode, failure, sync', testGeneratorReturnType, foobarString, 'utf8', false, true, true, execaSync);
test('Generator can return final Uint8Array with default encoding, objectMode, failure, sync', testGeneratorReturnType, foobarUint8Array, 'utf8', false, true, true, execaSync);
test('Generator can return final string with encoding "buffer", objectMode, failure, sync', testGeneratorReturnType, foobarString, 'buffer', false, true, true, execaSync);
test('Generator can return final Uint8Array with encoding "buffer", objectMode, failure, sync', testGeneratorReturnType, foobarUint8Array, 'buffer', false, true, true, execaSync);
test('Generator can return final string with encoding "hex", objectMode, failure, sync', testGeneratorReturnType, foobarString, 'hex', false, true, true, execaSync);
test('Generator can return final Uint8Array with encoding "hex", objectMode, failure, sync', testGeneratorReturnType, foobarUint8Array, 'hex', false, true, true, execaSync);

const testMultibyte = async (t, objectMode, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [
			[multibyteUint8Array.slice(0, breakingLength), multibyteUint8Array.slice(breakingLength)],
			noopGenerator(objectMode, true),
		],
	});
	t.is(stdout, multibyteString);
};

test('Generator handles multibyte characters with Uint8Array', testMultibyte, false, execa);
test('Generator handles multibyte characters with Uint8Array, objectMode', testMultibyte, true, execa);
test('Generator handles multibyte characters with Uint8Array, sync', testMultibyte, false, execaSync);
test('Generator handles multibyte characters with Uint8Array, objectMode, sync', testMultibyte, true, execaSync);

const testMultibytePartial = async (t, objectMode, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [
			[multibyteUint8Array.slice(0, breakingLength)],
			noopGenerator(objectMode, true),
		],
	});
	t.is(stdout, `${multibyteChar}${brokenSymbol}`);
};

test('Generator handles partial multibyte characters with Uint8Array', testMultibytePartial, false, execa);
test('Generator handles partial multibyte characters with Uint8Array, objectMode', testMultibytePartial, true, execa);
test('Generator handles partial multibyte characters with Uint8Array, sync', testMultibytePartial, false, execaSync);
test('Generator handles partial multibyte characters with Uint8Array, objectMode, sync', testMultibytePartial, true, execaSync);

const testMultibytePartialOutput = async (t, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: getOutputsGenerator([
			multibyteUint8Array.slice(0, breakingLength),
			multibyteUint8Array.slice(breakingLength),
		])(false, true),
	});
	t.is(stdout, multibyteString);
};

test('Generator handles output multibyte characters with Uint8Array', testMultibytePartialOutput, execa);
test('Generator handles output multibyte characters with Uint8Array, sync', testMultibytePartialOutput, execaSync);
