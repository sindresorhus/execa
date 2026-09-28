import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {createGzip, gunzip} from 'node:zlib';
import test from 'node:test';
import {assertThrows} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {
	foobarString,
	foobarObject,
	foobarUppercase,
	foobarUppercaseHex,
} from '../helpers/input.js';
import {uppercaseEncodingDuplex, getOutputDuplex} from '../helpers/duplex.js';

setFixtureDirectory();

test('Can use crypto.createHash()', async () => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: {transform: createHash('sha1')}, encoding: 'hex'});
	const expectedStdout = createHash('sha1').update(foobarString).digest('hex');
	assert.equal(stdout, expectedStdout);
});

test('Can use zlib.createGzip()', async () => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: {transform: createGzip()}, encoding: 'buffer'});
	const decompressedStdout = await promisify(gunzip)(stdout);
	assert.equal(decompressedStdout.toString(), foobarString);
});

test('Can use encoding "hex"', async () => {
	const {transform} = uppercaseEncodingDuplex('hex')();
	assert.equal(transform.readableEncoding, 'hex');
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: {transform}});
	assert.equal(stdout, foobarUppercaseHex);
});

test('Cannot use objectMode: true with duplex.readableObjectMode: false', () => {
	assertThrows(() => {
		execa('noop-fd.js', ['1', foobarString], {stdout: uppercaseEncodingDuplex(undefined, false)(true)});
	}, {message: /cannot be `false` if `new Duplex\({objectMode: true}\)`/});
});

test('Cannot use objectMode: false with duplex.readableObjectMode: true', () => {
	assertThrows(() => {
		execa('noop-fd.js', ['1', foobarString], {stdout: uppercaseEncodingDuplex(undefined, true)(false)});
	}, {message: /can only be `true` if `new Duplex\({objectMode: true}\)`/});
});

const testObjectModeFalse = async objectMode => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: uppercaseEncodingDuplex(undefined, objectMode)(false)});
	assert.equal(stdout, foobarUppercase);
};

test('Can use objectMode: false with duplex.readableObjectMode: false', () => testObjectModeFalse(false));
test('Can use objectMode: undefined with duplex.readableObjectMode: false', () => testObjectModeFalse(undefined));

const testObjectModeTrue = async objectMode => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: getOutputDuplex(foobarObject, objectMode)(true)});
	assert.deepEqual(stdout, [foobarObject]);
};

test('Can use objectMode: true with duplex.readableObjectMode: true', () => testObjectModeTrue(true));
test('Can use objectMode: undefined with duplex.readableObjectMode: true', () => testObjectModeTrue(undefined));
