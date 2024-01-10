import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdinOption, getStdoutOption, getStderrOption, getStdioOption} from '../helpers/stdio.js';

setFixtureDir();

const uint8ArrayFoobar = new TextEncoder().encode('foobar');

const testUint8Array = async (t, fixtureName, getOptions) => {
	const {stdout} = await execa(fixtureName, getOptions(uint8ArrayFoobar));
	t.is(stdout, 'foobar');
};

test('stdin option can be a Uint8Array', testUint8Array, 'stdin.js', getStdinOption);
test('stdio[*] option can be a Uint8Array', testUint8Array, 'stdin-fd3.js', getStdioOption);
test('stdin option can be a Uint8Array - sync', testUint8Array, 'stdin.js', getStdinOption);
test('stdio[*] option can be a Uint8Array - sync', testUint8Array, 'stdin-fd3.js', getStdioOption);

const testNoUint8ArrayOutput = (t, getOptions, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', getOptions(uint8ArrayFoobar));
	}, {message: /cannot be a Uint8Array/});
};

test('stdout option cannot be a Uint8Array', testNoUint8ArrayOutput, getStdoutOption, execa);
test('stderr option cannot be a Uint8Array', testNoUint8ArrayOutput, getStderrOption, execa);
test('stdout option cannot be a Uint8Array - sync', testNoUint8ArrayOutput, getStdoutOption, execaSync);
test('stderr option cannot be a Uint8Array - sync', testNoUint8ArrayOutput, getStderrOption, execaSync);
