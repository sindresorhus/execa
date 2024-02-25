import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarUint8Array} from '../helpers/input.js';

setFixtureDir();

const testUint8Array = async (t, fdNumber) => {
	const {stdout} = await execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, foobarUint8Array));
	t.is(stdout, 'foobar');
};

test('stdin option can be a Uint8Array', testUint8Array, 0);
test('stdio[*] option can be a Uint8Array', testUint8Array, 3);
test('stdin option can be a Uint8Array - sync', testUint8Array, 0);
test('stdio[*] option can be a Uint8Array - sync', testUint8Array, 3);

const testNoUint8ArrayOutput = (t, fdNumber, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(fdNumber, foobarUint8Array));
	}, {message: /cannot be a Uint8Array/});
};

test('stdout option cannot be a Uint8Array', testNoUint8ArrayOutput, 1, execa);
test('stderr option cannot be a Uint8Array', testNoUint8ArrayOutput, 2, execa);
test('stdout option cannot be a Uint8Array - sync', testNoUint8ArrayOutput, 1, execaSync);
test('stderr option cannot be a Uint8Array - sync', testNoUint8ArrayOutput, 2, execaSync);
