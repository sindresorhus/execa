import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarUint8Array, foobarBuffer, foobarString} from '../helpers/input.js';

setFixtureDirectory();

const testUint8Array = async (t, fdNumber, stdioOption, execaMethod) => {
	const {stdout} = await execaMethod('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, stdioOption));
	t.is(stdout, foobarString);
};

test('stdin option can be a Uint8Array', testUint8Array, 0, foobarUint8Array, execa);
test('stdio[*] option can be a Uint8Array', testUint8Array, 3, foobarUint8Array, execa);
test('stdin option can be a Uint8Array - sync', testUint8Array, 0, foobarUint8Array, execaSync);
test('stdin option can be a Buffer', testUint8Array, 0, foobarBuffer, execa);
test('stdio[*] option can be a Buffer', testUint8Array, 3, foobarBuffer, execa);
test('stdin option can be a Buffer - sync', testUint8Array, 0, foobarBuffer, execaSync);

const testNoUint8ArrayOutput = (t, fdNumber, stdioOption, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(fdNumber, stdioOption));
	}, {message: /cannot be a Uint8Array/});
};

test('stdout option cannot be a Uint8Array', testNoUint8ArrayOutput, 1, foobarUint8Array, execa);
test('stderr option cannot be a Uint8Array', testNoUint8ArrayOutput, 2, foobarUint8Array, execa);
test('stdout option cannot be a Uint8Array - sync', testNoUint8ArrayOutput, 1, foobarUint8Array, execaSync);
test('stderr option cannot be a Uint8Array - sync', testNoUint8ArrayOutput, 2, foobarUint8Array, execaSync);
test('stdout option cannot be a Buffer', testNoUint8ArrayOutput, 1, foobarBuffer, execa);
test('stderr option cannot be a Buffer', testNoUint8ArrayOutput, 2, foobarBuffer, execa);
test('stdout option cannot be a Buffer - sync', testNoUint8ArrayOutput, 1, foobarBuffer, execaSync);
test('stderr option cannot be a Buffer - sync', testNoUint8ArrayOutput, 2, foobarBuffer, execaSync);
