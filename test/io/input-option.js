import {Writable} from 'node:stream';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {
	runExeca,
	runExecaSync,
	runScript,
	runScriptSync,
} from '../helpers/run.js';
import {
	foobarUint8Array,
	foobarBuffer,
	foobarArrayBuffer,
	foobarUint16Array,
	foobarDataView,
} from '../helpers/input.js';

setFixtureDirectory();

const testInput = async (t, input, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {input});
	t.is(stdout, 'foobar');
};

test('input option can be a String', testInput, 'foobar', runExeca);
test('input option can be a Uint8Array', testInput, foobarUint8Array, runExeca);
test('input option can be a String - sync', testInput, 'foobar', runExecaSync);
test('input option can be a Uint8Array - sync', testInput, foobarUint8Array, runExecaSync);
test('input option can be used with $', testInput, 'foobar', runScript);
test('input option can be used with $.sync', testInput, 'foobar', runScriptSync);

const testInvalidInput = async (t, input, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', {input});
	}, {message: /a string, a Uint8Array/});
};

test('input option cannot be a Buffer', testInvalidInput, foobarBuffer, execa);
test('input option cannot be an ArrayBuffer', testInvalidInput, foobarArrayBuffer, execa);
test('input option cannot be a DataView', testInvalidInput, foobarDataView, execa);
test('input option cannot be a Uint16Array', testInvalidInput, foobarUint16Array, execa);
test('input option cannot be 0', testInvalidInput, 0, execa);
test('input option cannot be false', testInvalidInput, false, execa);
test('input option cannot be null', testInvalidInput, null, execa);
test('input option cannot be a non-Readable stream', testInvalidInput, new Writable(), execa);
test('input option cannot be a Buffer - sync', testInvalidInput, foobarBuffer, execaSync);
test('input option cannot be an ArrayBuffer - sync', testInvalidInput, foobarArrayBuffer, execaSync);
test('input option cannot be a DataView - sync', testInvalidInput, foobarDataView, execaSync);
test('input option cannot be a Uint16Array - sync', testInvalidInput, foobarUint16Array, execaSync);
test('input option cannot be 0 - sync', testInvalidInput, 0, execaSync);
test('input option cannot be false - sync', testInvalidInput, false, execaSync);
test('input option cannot be null - sync', testInvalidInput, null, execaSync);
test('input option cannot be a non-Readable stream - sync', testInvalidInput, new Writable(), execaSync);
