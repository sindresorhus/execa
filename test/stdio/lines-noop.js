import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getOutputsGenerator} from '../helpers/generator.js';
import {foobarObject} from '../helpers/input.js';
import {
	simpleFull,
	simpleFullUint8Array,
	simpleFullHex,
	simpleFullUtf16Uint8Array,
	simpleLines,
	noNewlinesChunks,
	getSimpleChunkSubprocess,
} from '../helpers/lines.js';

setFixtureDirectory();

const testStreamLinesNoop = async (t, lines, execaMethod) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', simpleFull], {lines});
	t.is(stdout, simpleFull);
};

test('"lines: false" is a noop', testStreamLinesNoop, false, execa);
test('"lines: false" is a noop, fd-specific', testStreamLinesNoop, {stderr: true}, execa);
test('"lines: false" is a noop, fd-specific none', testStreamLinesNoop, {}, execa);
test('"lines: false" is a noop, sync', testStreamLinesNoop, false, execaSync);
test('"lines: false" is a noop, fd-specific, sync', testStreamLinesNoop, {stderr: true}, execaSync);
test('"lines: false" is a noop, fd-specific none, sync', testStreamLinesNoop, {}, execaSync);

const testLinesObjectMode = async (t, lines, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: getOutputsGenerator([foobarObject])(true),
		lines,
	});
	t.deepEqual(stdout, [foobarObject]);
};

test('"lines: true" is a noop with objects generators, objectMode', testLinesObjectMode, true, execa);
test('"lines: true" is a noop with objects generators, fd-specific, objectMode', testLinesObjectMode, {stdout: true}, execa);
test('"lines: true" is a noop with objects generators, objectMode, sync', testLinesObjectMode, true, execaSync);
test('"lines: true" is a noop with objects generators, fd-specific, objectMode, sync', testLinesObjectMode, {stdout: true}, execaSync);

// eslint-disable-next-line max-params
const testEncoding = async (t, input, expectedOutput, encoding, lines, stripFinalNewline, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {
		lines,
		stripFinalNewline,
		encoding,
		input,
	});
	t.deepEqual(stdout, expectedOutput);
};

test('"lines: true" is a noop with "encoding: utf16"', testEncoding, simpleFullUtf16Uint8Array, simpleLines, 'utf16le', true, false, execa);
test('"lines: true" is a noop with "encoding: utf16", fd-specific', testEncoding, simpleFullUtf16Uint8Array, simpleLines, 'utf16le', {stdout: true}, false, execa);
test('"lines: true" is a noop with "encoding: utf16", stripFinalNewline', testEncoding, simpleFullUtf16Uint8Array, noNewlinesChunks, 'utf16le', true, true, execa);
test('"lines: true" is a noop with "encoding: utf16", stripFinalNewline, fd-specific', testEncoding, simpleFullUtf16Uint8Array, noNewlinesChunks, 'utf16le', true, {stdout: true}, execa);
test('"lines: true" is a noop with "encoding: buffer"', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', true, false, execa);
test('"lines: true" is a noop with "encoding: buffer", fd-specific', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', {stdout: true}, false, execa);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', true, false, execa);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline, fd-specific', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', true, {stdout: false}, execa);
test('"lines: true" is a noop with "encoding: hex"', testEncoding, simpleFull, simpleFullHex, 'hex', true, false, execa);
test('"lines: true" is a noop with "encoding: hex", fd-specific', testEncoding, simpleFull, simpleFullHex, 'hex', {stdout: true}, false, execa);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline', testEncoding, simpleFull, simpleFullHex, 'hex', true, true, execa);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline, fd-specific', testEncoding, simpleFull, simpleFullHex, 'hex', true, {stdout: true}, execa);
test('"lines: true" is a noop with "encoding: utf16", sync', testEncoding, simpleFullUtf16Uint8Array, simpleLines, 'utf16le', true, false, execaSync);
test('"lines: true" is a noop with "encoding: utf16", fd-specific, sync', testEncoding, simpleFullUtf16Uint8Array, simpleLines, 'utf16le', {stdout: true}, false, execaSync);
test('"lines: true" is a noop with "encoding: utf16", stripFinalNewline, sync', testEncoding, simpleFullUtf16Uint8Array, noNewlinesChunks, 'utf16le', true, true, execaSync);
test('"lines: true" is a noop with "encoding: utf16", stripFinalNewline, fd-specific, sync', testEncoding, simpleFullUtf16Uint8Array, noNewlinesChunks, 'utf16le', true, {stdout: true}, execaSync);
test('"lines: true" is a noop with "encoding: buffer", sync', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', true, false, execaSync);
test('"lines: true" is a noop with "encoding: buffer", fd-specific, sync', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', {stdout: true}, false, execaSync);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline, sync', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', true, false, execaSync);
test('"lines: true" is a noop with "encoding: buffer", stripFinalNewline, fd-specific, sync', testEncoding, simpleFull, simpleFullUint8Array, 'buffer', true, {stdout: false}, execaSync);
test('"lines: true" is a noop with "encoding: hex", sync', testEncoding, simpleFull, simpleFullHex, 'hex', true, false, execaSync);
test('"lines: true" is a noop with "encoding: hex", fd-specific, sync', testEncoding, simpleFull, simpleFullHex, 'hex', {stdout: true}, false, execaSync);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline, sync', testEncoding, simpleFull, simpleFullHex, 'hex', true, true, execaSync);
test('"lines: true" is a noop with "encoding: hex", stripFinalNewline, fd-specific, sync', testEncoding, simpleFull, simpleFullHex, 'hex', true, {stdout: true}, execaSync);

const testLinesNoBuffer = async (t, lines, buffer, execaMethod) => {
	const {stdout} = await getSimpleChunkSubprocess(execaMethod, {lines, buffer});
	t.is(stdout, undefined);
};

test('"lines: true" is a noop with "buffer: false"', testLinesNoBuffer, true, false, execa);
test('"lines: true" is a noop with "buffer: false", fd-specific buffer', testLinesNoBuffer, true, {stdout: false}, execa);
test('"lines: true" is a noop with "buffer: false", fd-specific lines', testLinesNoBuffer, {stdout: true}, false, execa);
test('"lines: true" is a noop with "buffer: false", sync', testLinesNoBuffer, true, false, execaSync);
test('"lines: true" is a noop with "buffer: false", fd-specific buffer, sync', testLinesNoBuffer, true, {stdout: false}, execaSync);
test('"lines: true" is a noop with "buffer: false", fd-specific lines, sync', testLinesNoBuffer, {stdout: true}, false, execaSync);
