import {Buffer} from 'node:buffer';
import {Writable} from 'node:stream';
import test from 'ava';
import {execa, execaSync, $} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getScriptSync, identity} from '../helpers/stdio.js';

setFixtureDir();

const textEncoder = new TextEncoder();
const binaryFoobar = textEncoder.encode('foobar');
const bufferFoobar = Buffer.from(binaryFoobar);
const arrayBufferFoobar = binaryFoobar.buffer;
const dataViewFoobar = new DataView(arrayBufferFoobar);
const uint16ArrayFoobar = new Uint16Array(arrayBufferFoobar);

const testInput = async (t, input, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {input});
	t.is(stdout, 'foobar');
};

test('input option can be a String', testInput, 'foobar', execa);
test('input option can be a String - sync', testInput, 'foobar', execaSync);
test('input option can be a Uint8Array', testInput, binaryFoobar, execa);
test('input option can be a Uint8Array - sync', testInput, binaryFoobar, execaSync);

const testInputScript = async (t, getExecaMethod) => {
	const {stdout} = await getExecaMethod($({input: 'foobar'}))`stdin.js`;
	t.is(stdout, 'foobar');
};

test('input option can be used with $', testInputScript, identity);
test('input option can be used with $.sync', testInputScript, getScriptSync);

const testInvalidInput = async (t, input, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', {input});
	}, {message: /a string, a Uint8Array/});
};

test('input option cannot be a Buffer', testInvalidInput, bufferFoobar, execa);
test('input option cannot be an ArrayBuffer', testInvalidInput, arrayBufferFoobar, execa);
test('input option cannot be a DataView', testInvalidInput, dataViewFoobar, execa);
test('input option cannot be a Uint16Array', testInvalidInput, uint16ArrayFoobar, execa);
test('input option cannot be 0', testInvalidInput, 0, execa);
test('input option cannot be false', testInvalidInput, false, execa);
test('input option cannot be null', testInvalidInput, null, execa);
test('input option cannot be a non-Readable stream', testInvalidInput, new Writable(), execa);
test('input option cannot be a Buffer - sync', testInvalidInput, bufferFoobar, execaSync);
test('input option cannot be an ArrayBuffer - sync', testInvalidInput, arrayBufferFoobar, execaSync);
test('input option cannot be a DataView - sync', testInvalidInput, dataViewFoobar, execaSync);
test('input option cannot be a Uint16Array - sync', testInvalidInput, uint16ArrayFoobar, execaSync);
test('input option cannot be 0 - sync', testInvalidInput, 0, execaSync);
test('input option cannot be false - sync', testInvalidInput, false, execaSync);
test('input option cannot be null - sync', testInvalidInput, null, execaSync);
test('input option cannot be a non-Readable stream - sync', testInvalidInput, new Writable(), execaSync);
