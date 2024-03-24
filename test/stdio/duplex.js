import {createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {createGzip, gunzip} from 'node:zlib';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString, foobarUppercaseHex} from '../helpers/input.js';
import {uppercaseEncodingDuplex} from '../helpers/duplex.js';

setFixtureDir();

test('Can use crypto.createHash()', async t => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: {duplex: createHash('sha1')}, encoding: 'hex'});
	const expectedStdout = createHash('sha1').update(foobarString).digest('hex');
	t.is(stdout, expectedStdout);
});

test('Can use zlib.createGzip()', async t => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: {duplex: createGzip()}, encoding: 'buffer'});
	const decompressedStdout = await promisify(gunzip)(stdout);
	t.is(decompressedStdout.toString(), foobarString);
});

test('Can use encoding "hex"', async t => {
	const {duplex} = uppercaseEncodingDuplex('hex')();
	t.is(duplex.readableEncoding, 'hex');
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: {duplex}});
	t.is(stdout, foobarUppercaseHex);
});
