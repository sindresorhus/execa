import {promisify} from 'node:util';
import {gunzip} from 'node:zlib';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarUtf16Uint8Array, foobarUint8Array} from '../helpers/input.js';

setFixtureDirectory();

test('Can use CompressionStream()', async t => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: new CompressionStream('gzip'), encoding: 'buffer'});
	const decompressedStdout = await promisify(gunzip)(stdout);
	t.is(decompressedStdout.toString(), foobarString);
});

test('Can use TextDecoderStream()', async t => {
	const {stdout} = await execa('stdin.js', {
		input: foobarUtf16Uint8Array,
		stdout: new TextDecoderStream('utf-16le'),
		encoding: 'buffer',
	});
	t.deepEqual(stdout, foobarUint8Array);
});
