import assert from 'node:assert/strict';
import {promisify} from 'node:util';
import {gunzip} from 'node:zlib';
import test from 'node:test';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarUtf16Uint8Array, foobarUint8Array} from '../helpers/input.js';

setFixtureDirectory();

test('Can use CompressionStream()', async () => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: new CompressionStream('gzip'), encoding: 'buffer'});
	const decompressedStdout = await promisify(gunzip)(stdout);
	assert.equal(decompressedStdout.toString(), foobarString);
});

test('Can use TextDecoderStream()', async () => {
	const {stdout} = await execa('stdin.js', {
		input: foobarUtf16Uint8Array,
		stdout: new TextDecoderStream('utf-16le'),
		encoding: 'buffer',
	});
	assert.deepEqual(stdout, foobarUint8Array);
});
