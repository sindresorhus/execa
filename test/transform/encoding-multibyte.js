import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {noopGenerator, getOutputsGenerator, addNoopGenerator} from '../helpers/generator.js';
import {multibyteChar, multibyteString, multibyteUint8Array, breakingLength, brokenSymbol} from '../helpers/encoding.js';

setFixtureDir();

const foobarArray = ['fo', 'ob', 'ar', '..'];

const testMultibyteCharacters = async (t, objectMode, addNoopTransform, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: addNoopGenerator(getOutputsGenerator(foobarArray)(objectMode, true), addNoopTransform, objectMode),
		encoding: 'base64',
	});
	if (objectMode) {
		t.deepEqual(stdout, foobarArray);
	} else {
		t.is(stdout, btoa(foobarArray.join('')));
	}
};

test('Handle multibyte characters', testMultibyteCharacters, false, false, execa);
test('Handle multibyte characters, noop transform', testMultibyteCharacters, false, true, execa);
test('Handle multibyte characters, with objectMode', testMultibyteCharacters, true, false, execa);
test('Handle multibyte characters, with objectMode, noop transform', testMultibyteCharacters, true, true, execa);
test('Handle multibyte characters, sync', testMultibyteCharacters, false, false, execaSync);
test('Handle multibyte characters, noop transform, sync', testMultibyteCharacters, false, true, execaSync);
test('Handle multibyte characters, with objectMode, sync', testMultibyteCharacters, true, false, execaSync);
test('Handle multibyte characters, with objectMode, noop transform, sync', testMultibyteCharacters, true, true, execaSync);

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
