import {once} from 'node:events';
import {getDefaultHighWaterMark} from 'node:stream';
import test from 'ava';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {
	assertStreamOutput,
	assertIterableChunks,
	assertStreamChunks,
	assertSubprocessOutput,
	getReadableSubprocess,
	getReadWriteSubprocess,
} from '../helpers/convert.js';
import {
	stringToUint8Arrays,
	simpleFull,
	simpleChunks,
	simpleChunksBuffer,
	simpleChunksUint8Array,
	simpleLines,
	noNewlinesFull,
	complexFull,
	singleComplexBuffer,
	singleComplexUint8Array,
	singleComplexHex,
	singleComplexHexBuffer,
	singleComplexHexUint8Array,
	complexChunks,
	complexChunksEnd,
} from '../helpers/lines.js';
import {outputObjectGenerator, getOutputGenerator} from '../helpers/generator.js';
import {foobarString, foobarObject} from '../helpers/input.js';
import {multibyteChar, multibyteUint8Array, breakingLength, brokenSymbol} from '../helpers/encoding.js';

setFixtureDir();

const foobarObjectChunks = [foobarObject, foobarObject, foobarObject];

const getSubprocess = (methodName, output, options) => {
	if (methodName !== 'duplex') {
		return getReadableSubprocess(output, options);
	}

	const subprocess = getReadWriteSubprocess(options);
	subprocess.stdin.end(output);
	return subprocess;
};

const assertChunks = async (t, streamOrIterable, expectedChunks, methodName) => {
	const assertMethod = methodName === 'iterable' ? assertIterableChunks : assertStreamChunks;
	await assertMethod(t, streamOrIterable, expectedChunks);
};

// eslint-disable-next-line max-params
const testText = async (t, expectedChunks, methodName, binary, preserveNewlines, encoding) => {
	const subprocess = getSubprocess(methodName, complexFull, {encoding});
	const stream = subprocess[methodName]({binary, preserveNewlines});

	await assertChunks(t, stream, expectedChunks, methodName);
	const expectedOutput = encoding === 'hex'
		? singleComplexHex
		: stringToUint8Arrays(complexFull, encoding === 'buffer');
	await assertSubprocessOutput(t, subprocess, expectedOutput);
};

test('.iterable() can use "binary: true"', testText, [singleComplexUint8Array], 'iterable', true, undefined, 'utf8');
test('.iterable() can use "binary: undefined"', testText, complexChunks, 'iterable', undefined, undefined, 'utf8');
test('.iterable() can use "binary: undefined" + "encoding: buffer"', testText, [singleComplexUint8Array], 'iterable', undefined, undefined, 'buffer');
test('.iterable() can use "binary: undefined" + "encoding: hex"', testText, [singleComplexHexUint8Array], 'iterable', undefined, undefined, 'hex');
test('.iterable() can use "binary: false"', testText, complexChunks, 'iterable', false, undefined, 'utf8');
test('.iterable() can use "binary: false" + "encoding: buffer"', testText, [singleComplexUint8Array], 'iterable', false, undefined, 'buffer');
test('.iterable() can use "binary: false" + "encoding: hex"', testText, [singleComplexHexUint8Array], 'iterable', false, undefined, 'hex');
test('.iterable() can use "binary: false" + "preserveNewlines: true"', testText, complexChunksEnd, 'iterable', false, true, 'utf8');
test('.iterable() can use "binary: false" + "preserveNewlines: false"', testText, complexChunks, 'iterable', false, false, 'utf8');
test('.readable() can use "binary: true"', testText, singleComplexBuffer, 'readable', true, undefined, 'utf8');
test('.readable() can use "binary: undefined"', testText, singleComplexBuffer, 'readable', undefined, undefined, 'utf8');
test('.readable() can use "binary: undefined" + "encoding: buffer"', testText, singleComplexBuffer, 'readable', undefined, undefined, 'buffer');
test('.readable() can use "binary: undefined" + "encoding: hex"', testText, [singleComplexHexBuffer], 'readable', undefined, undefined, 'hex');
test('.readable() can use "binary: false"', testText, complexChunksEnd, 'readable', false, undefined, 'utf8');
test('.readable() can use "binary: false" + "encoding: buffer"', testText, singleComplexBuffer, 'readable', false, undefined, 'buffer');
test('.readable() can use "binary: false" + "encoding: hex"', testText, [singleComplexHexBuffer], 'readable', false, undefined, 'hex');
test('.readable() can use "binary: false" + "preserveNewlines: true"', testText, complexChunksEnd, 'readable', false, true, 'utf8');
test('.readable() can use "binary: false" + "preserveNewlines: false"', testText, complexChunks, 'readable', false, false, 'utf8');
test('.duplex() can use "binary: true"', testText, singleComplexBuffer, 'duplex', true, undefined, 'utf8');
test('.duplex() can use "binary: undefined"', testText, singleComplexBuffer, 'duplex', undefined, undefined, 'utf8');
test('.duplex() can use "binary: undefined" + "encoding: "buffer"', testText, singleComplexBuffer, 'duplex', undefined, undefined, 'buffer');
test('.duplex() can use "binary: undefined" + "encoding: "hex"', testText, [singleComplexHexBuffer], 'duplex', undefined, undefined, 'hex');
test('.duplex() can use "binary: false"', testText, complexChunksEnd, 'duplex', false, undefined, 'utf8');
test('.duplex() can use "binary: false" + "encoding: buffer"', testText, singleComplexBuffer, 'duplex', false, undefined, 'buffer');
test('.duplex() can use "binary: false" + "encoding: hex"', testText, [singleComplexHexBuffer], 'duplex', false, undefined, 'hex');
test('.duplex() can use "binary: false" + "preserveNewlines: true"', testText, complexChunksEnd, 'duplex', false, true, 'utf8');
test('.duplex() can use "binary: false" + "preserveNewlines: false"', testText, complexChunks, 'duplex', false, false, 'utf8');

const testTextOutput = async (t, expectedOutput, methodName, preserveNewlines) => {
	const subprocess = getSubprocess(methodName, complexFull);
	const stream = subprocess[methodName]({binary: false, preserveNewlines});

	await assertStreamOutput(t, stream, expectedOutput);
	await assertSubprocessOutput(t, subprocess, complexFull);
};

test('.readable() "binary: false" keeps output as is', testTextOutput, complexFull, 'readable', undefined);
test('.readable() "binary: false" + "preserveNewlines: true" keeps output as is', testTextOutput, complexFull, 'readable', true);
test('.readable() "binary: false" + "preserveNewlines: false" removes all newlines', testTextOutput, noNewlinesFull, 'readable', false);
test('.duplex() "binary: false" keeps output as is', testTextOutput, complexFull, 'duplex', undefined);
test('.duplex() "binary: false" + "preserveNewlines: true" keeps output as is', testTextOutput, complexFull, 'duplex', true);
test('.duplex() "binary: false" + "preserveNewlines: false" removes all newlines', testTextOutput, noNewlinesFull, 'duplex', false);

// eslint-disable-next-line max-params
const testObjectMode = async (t, expectedChunks, methodName, encoding, initialObjectMode, finalObjectMode, binary, options) => {
	const subprocess = getSubprocess(methodName, simpleFull, options);
	if (encoding !== null) {
		subprocess.stdout.setEncoding(encoding);
	}

	t.is(subprocess.stdout.readableEncoding, encoding);
	t.is(subprocess.stdout.readableObjectMode, initialObjectMode);
	t.is(subprocess.stdout.readableHighWaterMark, getDefaultHighWaterMark(initialObjectMode));

	const stream = subprocess[methodName]({binary, preserveNewlines: true});

	if (methodName !== 'iterable') {
		t.is(stream.readableEncoding, encoding);
		t.is(stream.readableObjectMode, finalObjectMode);
		t.is(stream.readableHighWaterMark, getDefaultHighWaterMark(finalObjectMode));
	}

	t.is(subprocess.stdout.readableEncoding, encoding);
	t.is(subprocess.stdout.readableObjectMode, initialObjectMode);
	t.is(subprocess.stdout.readableHighWaterMark, getDefaultHighWaterMark(initialObjectMode));

	await assertChunks(t, stream, expectedChunks, methodName);
	await subprocess;
};

test('.iterable() uses Uint8Arrays with "binary: true"', testObjectMode, simpleChunksUint8Array, 'iterable', null, false, false, true);
test('.iterable() uses Uint8Arrays with "binary: true" and .setEncoding("utf8")', testObjectMode, simpleChunksUint8Array, 'iterable', 'utf8', false, false, true);
test('.iterable() uses Uint8Arrays with "binary: true", .setEncoding("utf8") and "encoding: buffer"', testObjectMode, simpleChunksUint8Array, 'iterable', 'utf8', false, false, true, {encoding: 'buffer'});
test('.iterable() uses strings in objectMode with "binary: true" and object transforms', testObjectMode, foobarObjectChunks, 'iterable', null, true, true, true, {stdout: outputObjectGenerator()});
test('.iterable() uses strings in objectMode with "binary: false"', testObjectMode, simpleLines, 'iterable', null, false, true, false);
test('.iterable() uses strings in objectMode with "binary: false" and .setEncoding("utf8")', testObjectMode, simpleLines, 'iterable', 'utf8', false, true, false);
test('.iterable() uses Uint8Arrays in objectMode with "binary: false", .setEncoding("utf8") and "encoding: buffer"', testObjectMode, simpleChunksUint8Array, 'iterable', 'utf8', false, true, false, {encoding: 'buffer'});
test('.iterable() uses strings in objectMode with "binary: false" and object transforms', testObjectMode, foobarObjectChunks, 'iterable', null, true, true, false, {stdout: outputObjectGenerator()});
test('.readable() uses Buffers with "binary: true"', testObjectMode, simpleChunksBuffer, 'readable', null, false, false, true);
test('.readable() uses strings with "binary: true" and .setEncoding("utf8")', testObjectMode, simpleChunks, 'readable', 'utf8', false, false, true);
test('.readable() uses strings with "binary: true", .setEncoding("utf8") and "encoding: buffer"', testObjectMode, simpleChunks, 'readable', 'utf8', false, false, true, {encoding: 'buffer'});
test('.readable() uses strings in objectMode with "binary: true" and object transforms', testObjectMode, foobarObjectChunks, 'readable', null, true, true, true, {stdout: outputObjectGenerator()});
test('.readable() uses strings in objectMode with "binary: false"', testObjectMode, simpleLines, 'readable', null, false, true, false);
test('.readable() uses strings in objectMode with "binary: false" and .setEncoding("utf8")', testObjectMode, simpleLines, 'readable', 'utf8', false, true, false);
test('.readable() uses strings in objectMode with "binary: false", .setEncoding("utf8") and "encoding: buffer"', testObjectMode, simpleChunks, 'readable', 'utf8', false, false, false, {encoding: 'buffer'});
test('.readable() uses strings in objectMode with "binary: false" and object transforms', testObjectMode, foobarObjectChunks, 'readable', null, true, true, false, {stdout: outputObjectGenerator()});
test('.duplex() uses Buffers with "binary: true"', testObjectMode, simpleChunksBuffer, 'duplex', null, false, false, true);
test('.duplex() uses strings with "binary: true" and .setEncoding("utf8")', testObjectMode, simpleChunks, 'duplex', 'utf8', false, false, true);
test('.duplex() uses strings with "binary: true", .setEncoding("utf8") and "encoding: buffer"', testObjectMode, simpleChunks, 'duplex', 'utf8', false, false, true, {encoding: 'buffer'});
test('.duplex() uses strings in objectMode with "binary: true" and object transforms', testObjectMode, foobarObjectChunks, 'duplex', null, true, true, true, {stdout: outputObjectGenerator()});
test('.duplex() uses strings in objectMode with "binary: false"', testObjectMode, simpleLines, 'duplex', null, false, true, false);
test('.duplex() uses strings in objectMode with "binary: false" and .setEncoding("utf8")', testObjectMode, simpleLines, 'duplex', 'utf8', false, true, false);
test('.duplex() uses strings in objectMode with "binary: false", .setEncoding("utf8") and "encoding: buffer"', testObjectMode, simpleChunks, 'duplex', 'utf8', false, false, false, {encoding: 'buffer'});
test('.duplex() uses strings in objectMode with "binary: false" and object transforms', testObjectMode, foobarObjectChunks, 'duplex', null, true, true, false, {stdout: outputObjectGenerator()});

const testObjectSplit = async (t, methodName) => {
	const subprocess = getSubprocess(methodName, foobarString, {stdout: getOutputGenerator(simpleFull)(true)});
	const stream = subprocess[methodName]({binary: false});
	await assertChunks(t, stream, [simpleFull], methodName);
	await subprocess;
};

test('.iterable() "binary: false" does not split lines of strings produced by object transforms', testObjectSplit, 'iterable');
test('.readable() "binary: false" does not split lines of strings produced by object transforms', testObjectSplit, 'readable');
test('.duplex() "binary: false" does not split lines of strings produced by object transforms', testObjectSplit, 'duplex');

const testMultibyteCharacters = async (t, methodName) => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]({binary: false});
	const assertPromise = assertChunks(t, stream, [`${multibyteChar}${brokenSymbol}`], methodName);
	subprocess.stdin.write(multibyteUint8Array.slice(0, breakingLength));
	await once(subprocess.stdout, 'data');
	subprocess.stdin.end();
	await assertPromise;
};

test('.iterable() "binary: false" handles partial multibyte characters', testMultibyteCharacters, 'iterable');
test('.readable() "binary: false" handles partial multibyte characters', testMultibyteCharacters, 'readable');
test('.duplex() "binary: false" handles partial multibyte characters', testMultibyteCharacters, 'duplex');
