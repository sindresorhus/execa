import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getOutputsGenerator, resultGenerator} from '../helpers/generator.js';
import {
	simpleFull,
	simpleChunks,
	simpleFullUint8Array,
	simpleFullUtf16Inverted,
	simpleFullUtf16Uint8Array,
	simpleChunksUint8Array,
	simpleFullEnd,
	simpleFullEndUtf16Inverted,
	simpleFullHex,
	simpleLines,
	noNewlinesChunks,
} from '../helpers/lines.js';

setFixtureDir();

// eslint-disable-next-line max-params
const testBinaryOption = async (t, binary, input, expectedLines, expectedOutput, objectMode, preserveNewlines, encoding, execaMethod) => {
	const lines = [];
	const {stdout} = await execaMethod('noop.js', {
		stdout: [
			getOutputsGenerator(input)(false, true),
			resultGenerator(lines)(objectMode, binary, preserveNewlines),
		],
		stripFinalNewline: false,
		encoding,
	});
	t.deepEqual(lines, expectedLines);
	t.deepEqual(stdout, expectedOutput);
};

test('Does not split lines when "binary" is true', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFull, false, true, 'utf8', execa);
test('Splits lines when "binary" is false', testBinaryOption, false, simpleChunks, simpleLines, simpleFull, false, true, 'utf8', execa);
test('Splits lines when "binary" is undefined', testBinaryOption, undefined, simpleChunks, simpleLines, simpleFull, false, true, 'utf8', execa);
test('Does not split lines when "binary" is true, encoding "utf16le"', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFullUtf16Inverted, false, true, 'utf16le', execa);
test('Splits lines when "binary" is false, encoding "utf16le"', testBinaryOption, false, [simpleFullUtf16Uint8Array], simpleLines, simpleFullUtf16Inverted, false, true, 'utf16le', execa);
test('Splits lines when "binary" is undefined, encoding "utf16le"', testBinaryOption, undefined, [simpleFullUtf16Uint8Array], simpleLines, simpleFullUtf16Inverted, false, true, 'utf16le', execa);
test('Does not split lines when "binary" is true, encoding "buffer"', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, true, 'buffer', execa);
test('Does not split lines when "binary" is undefined, encoding "buffer"', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, true, 'buffer', execa);
test('Does not split lines when "binary" is false, encoding "buffer"', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, true, 'buffer', execa);
test('Does not split lines when "binary" is true, encoding "hex"', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, true, 'hex', execa);
test('Does not split lines when "binary" is undefined, encoding "hex"', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, true, 'hex', execa);
test('Does not split lines when "binary" is false, encoding "hex"', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, true, 'hex', execa);
test('Does not split lines when "binary" is true, objectMode', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleChunksUint8Array, true, true, 'utf8', execa);
test('Splits lines when "binary" is false, objectMode', testBinaryOption, false, simpleChunks, simpleLines, simpleLines, true, true, 'utf8', execa);
test('Splits lines when "binary" is undefined, objectMode', testBinaryOption, undefined, simpleChunks, simpleLines, simpleLines, true, true, 'utf8', execa);
test('Does not split lines when "binary" is true, preserveNewlines', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFull, false, false, 'utf8', execa);
test('Splits lines when "binary" is false, preserveNewlines', testBinaryOption, false, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, 'utf8', execa);
test('Splits lines when "binary" is undefined, preserveNewlines', testBinaryOption, undefined, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, 'utf8', execa);
test('Does not split lines when "binary" is true, preserveNewlines, encoding "utf16le"', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFullUtf16Inverted, false, false, 'utf16le', execa);
test('Splits lines when "binary" is false, preserveNewlines, encoding "utf16le"', testBinaryOption, false, [simpleFullUtf16Uint8Array], noNewlinesChunks, simpleFullEndUtf16Inverted, false, false, 'utf16le', execa);
test('Splits lines when "binary" is undefined, preserveNewlines, encoding "utf16le"', testBinaryOption, undefined, [simpleFullUtf16Uint8Array], noNewlinesChunks, simpleFullEndUtf16Inverted, false, false, 'utf16le', execa);
test('Does not split lines when "binary" is true, encoding "buffer", preserveNewlines', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, false, 'buffer', execa);
test('Does not split lines when "binary" is undefined, encoding "buffer", preserveNewlines', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, false, 'buffer', execa);
test('Does not split lines when "binary" is false, encoding "buffer", preserveNewlines', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, false, 'buffer', execa);
test('Does not split lines when "binary" is true, objectMode, preserveNewlines', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleChunksUint8Array, true, false, 'utf8', execa);
test('Does not split lines when "binary" is true, encoding "hex", preserveNewlines', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, false, 'hex', execa);
test('Does not split lines when "binary" is undefined, encoding "hex", preserveNewlines', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, false, 'hex', execa);
test('Does not split lines when "binary" is false, encoding "hex", preserveNewlines', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, false, 'hex', execa);
test('Splits lines when "binary" is false, objectMode, preserveNewlines', testBinaryOption, false, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, 'utf8', execa);
test('Splits lines when "binary" is undefined, objectMode, preserveNewlines', testBinaryOption, undefined, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, 'utf8', execa);
test('Does not split lines when "binary" is true, sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFull, false, true, 'utf8', execaSync);
test('Splits lines when "binary" is false, sync', testBinaryOption, false, simpleChunks, simpleLines, simpleFull, false, true, 'utf8', execaSync);
test('Splits lines when "binary" is undefined, sync', testBinaryOption, undefined, simpleChunks, simpleLines, simpleFull, false, true, 'utf8', execaSync);
test('Does not split lines when "binary" is true, encoding "utf16le", sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFullUtf16Inverted, false, true, 'utf16le', execaSync);
test('Splits lines when "binary" is false, encoding "utf16le", sync', testBinaryOption, false, [simpleFullUtf16Uint8Array], simpleLines, simpleFullUtf16Inverted, false, true, 'utf16le', execaSync);
test('Splits lines when "binary" is undefined, encoding "utf16le", sync', testBinaryOption, undefined, [simpleFullUtf16Uint8Array], simpleLines, simpleFullUtf16Inverted, false, true, 'utf16le', execaSync);
test('Does not split lines when "binary" is true, encoding "buffer", sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, true, 'buffer', execaSync);
test('Does not split lines when "binary" is undefined, encoding "buffer", sync', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, true, 'buffer', execaSync);
test('Does not split lines when "binary" is false, encoding "buffer", sync', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, true, 'buffer', execaSync);
test('Does not split lines when "binary" is true, encoding "hex", sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, true, 'hex', execaSync);
test('Does not split lines when "binary" is undefined, encoding "hex", sync', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, true, 'hex', execaSync);
test('Does not split lines when "binary" is false, encoding "hex", sync', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, true, 'hex', execaSync);
test('Does not split lines when "binary" is true, objectMode, sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleChunksUint8Array, true, true, 'utf8', execaSync);
test('Splits lines when "binary" is false, objectMode, sync', testBinaryOption, false, simpleChunks, simpleLines, simpleLines, true, true, 'utf8', execaSync);
test('Splits lines when "binary" is undefined, objectMode, sync', testBinaryOption, undefined, simpleChunks, simpleLines, simpleLines, true, true, 'utf8', execaSync);
test('Does not split lines when "binary" is true, preserveNewlines, sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFull, false, false, 'utf8', execaSync);
test('Splits lines when "binary" is false, preserveNewlines, sync', testBinaryOption, false, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, 'utf8', execaSync);
test('Splits lines when "binary" is undefined, preserveNewlines, sync', testBinaryOption, undefined, simpleChunks, noNewlinesChunks, simpleFullEnd, false, false, 'utf8', execaSync);
test('Does not split lines when "binary" is true, preserveNewlines, encoding "utf16le", sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFullUtf16Inverted, false, false, 'utf16le', execaSync);
test('Splits lines when "binary" is false, preserveNewlines, encoding "utf16le", sync', testBinaryOption, false, [simpleFullUtf16Uint8Array], noNewlinesChunks, simpleFullEndUtf16Inverted, false, false, 'utf16le', execaSync);
test('Splits lines when "binary" is undefined, preserveNewlines, encoding "utf16le", sync', testBinaryOption, undefined, [simpleFullUtf16Uint8Array], noNewlinesChunks, simpleFullEndUtf16Inverted, false, false, 'utf16le', execaSync);
test('Does not split lines when "binary" is true, encoding "buffer", preserveNewlines, sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, false, 'buffer', execaSync);
test('Does not split lines when "binary" is undefined, encoding "buffer", preserveNewlines, sync', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, false, 'buffer', execaSync);
test('Does not split lines when "binary" is false, encoding "buffer", preserveNewlines, sync', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullUint8Array, false, false, 'buffer', execaSync);
test('Does not split lines when "binary" is true, objectMode, preserveNewlines, sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleChunksUint8Array, true, false, 'utf8', execaSync);
test('Does not split lines when "binary" is true, encoding "hex", preserveNewlines, sync', testBinaryOption, true, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, false, 'hex', execaSync);
test('Does not split lines when "binary" is undefined, encoding "hex", preserveNewlines, sync', testBinaryOption, undefined, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, false, 'hex', execaSync);
test('Does not split lines when "binary" is false, encoding "hex", preserveNewlines, sync', testBinaryOption, false, simpleChunks, simpleChunksUint8Array, simpleFullHex, false, false, 'hex', execaSync);
test('Splits lines when "binary" is false, objectMode, preserveNewlines, sync', testBinaryOption, false, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, 'utf8', execaSync);
test('Splits lines when "binary" is undefined, objectMode, preserveNewlines, sync', testBinaryOption, undefined, simpleChunks, noNewlinesChunks, noNewlinesChunks, true, false, 'utf8', execaSync);
