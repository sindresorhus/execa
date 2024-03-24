import {createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {createGzip, gunzip} from 'node:zlib';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString, foobarObject, foobarUppercase, foobarUppercaseHex} from '../helpers/input.js';
import {uppercaseEncodingDuplex, getOutputDuplex} from '../helpers/duplex.js';

setFixtureDir();

test('Can use crypto.createHash()', async t => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: {transform: createHash('sha1')}, encoding: 'hex'});
	const expectedStdout = createHash('sha1').update(foobarString).digest('hex');
	t.is(stdout, expectedStdout);
});

test('Can use zlib.createGzip()', async t => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: {transform: createGzip()}, encoding: 'buffer'});
	const decompressedStdout = await promisify(gunzip)(stdout);
	t.is(decompressedStdout.toString(), foobarString);
});

test('Can use encoding "hex"', async t => {
	const {transform} = uppercaseEncodingDuplex('hex')();
	t.is(transform.readableEncoding, 'hex');
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: {transform}});
	t.is(stdout, foobarUppercaseHex);
});

test('Cannot use objectMode: true with duplex.readableObjectMode: false', t => {
	t.throws(() => {
		execa('noop-fd.js', ['1', foobarString], {stdout: uppercaseEncodingDuplex(undefined, false)(true)});
	}, {message: /cannot be `false` if `new Duplex\({objectMode: true}\)`/});
});

test('Cannot use objectMode: false with duplex.readableObjectMode: true', t => {
	t.throws(() => {
		execa('noop-fd.js', ['1', foobarString], {stdout: uppercaseEncodingDuplex(undefined, true)(false)});
	}, {message: /can only be `true` if `new Duplex\({objectMode: true}\)`/});
});

const testObjectModeFalse = async (t, objectMode) => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: uppercaseEncodingDuplex(undefined, objectMode)(false)});
	t.is(stdout, foobarUppercase);
};

test('Can use objectMode: false with duplex.readableObjectMode: false', testObjectModeFalse, false);
test('Can use objectMode: undefined with duplex.readableObjectMode: false', testObjectModeFalse, undefined);

const testObjectModeTrue = async (t, objectMode) => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: getOutputDuplex(foobarObject, objectMode)(true)});
	t.deepEqual(stdout, [foobarObject]);
};

test('Can use objectMode: true with duplex.readableObjectMode: true', testObjectModeTrue, true);
test('Can use objectMode: undefined with duplex.readableObjectMode: true', testObjectModeTrue, undefined);
