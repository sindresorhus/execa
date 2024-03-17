import {once} from 'node:events';
import {getDefaultHighWaterMark} from 'node:stream';
import test from 'ava';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {
	assertStreamOutput,
	assertStreamChunks,
	assertSubprocessOutput,
	getReadableSubprocess,
	getReadWriteSubprocess,
} from '../helpers/convert.js';
import {
	simpleFull,
	simpleChunks,
	simpleChunksBuffer,
	simpleLines,
	noNewlinesFull,
	complexFull,
	singleComplexBuffer,
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

// eslint-disable-next-line max-params
const testText = async (t, expectedChunks, methodName, binary, preserveNewlines) => {
	const subprocess = getSubprocess(methodName, complexFull);
	const stream = subprocess[methodName]({binary, preserveNewlines});

	await assertStreamChunks(t, stream, expectedChunks);
	await assertSubprocessOutput(t, subprocess, complexFull);
};

test('.readable() can use "binary: true"', testText, singleComplexBuffer, 'readable', true, undefined);
test('.readable() can use "binary: undefined"', testText, singleComplexBuffer, 'readable', undefined, undefined);
test('.readable() can use "binary: false"', testText, complexChunksEnd, 'readable', false, undefined);
test('.readable() can use "binary: false" + "preserveNewlines: true"', testText, complexChunksEnd, 'readable', false, true);
test('.readable() can use "binary: false" + "preserveNewlines: false"', testText, complexChunks, 'readable', false, false);
test('.duplex() can use "binary: true"', testText, singleComplexBuffer, 'duplex', true, undefined);
test('.duplex() can use "binary: undefined"', testText, singleComplexBuffer, 'duplex', undefined, undefined);
test('.duplex() can use "binary: false"', testText, complexChunksEnd, 'duplex', false, undefined);
test('.duplex() can use "binary: false" + "preserveNewlines: true"', testText, complexChunksEnd, 'duplex', false, true);
test('.duplex() can use "binary: false" + "preserveNewlines: false"', testText, complexChunks, 'duplex', false, false);

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
	t.is(stream.readableEncoding, encoding);
	t.is(stream.readableObjectMode, finalObjectMode);
	t.is(stream.readableHighWaterMark, getDefaultHighWaterMark(finalObjectMode));
	t.is(subprocess.stdout.readableEncoding, encoding);
	t.is(subprocess.stdout.readableObjectMode, initialObjectMode);
	t.is(subprocess.stdout.readableHighWaterMark, getDefaultHighWaterMark(initialObjectMode));

	await assertStreamChunks(t, stream, expectedChunks);
	await subprocess;
};

test('.readable() uses Buffers with "binary: true"', testObjectMode, simpleChunksBuffer, 'readable', null, false, false, true);
test('.readable() uses strings with "binary: true" and .setEncoding("utf8")', testObjectMode, simpleChunks, 'readable', 'utf8', false, false, true);
test('.readable() uses strings with "binary: true" and "encoding: buffer"', testObjectMode, simpleChunks, 'readable', 'utf8', false, false, true, {encoding: 'buffer'});
test('.readable() uses strings in objectMode with "binary: true" and object transforms', testObjectMode, foobarObjectChunks, 'readable', null, true, true, true, {stdout: outputObjectGenerator});
test('.readable() uses strings in objectMode with "binary: false"', testObjectMode, simpleLines, 'readable', null, false, true, false);
test('.readable() uses strings in objectMode with "binary: false" and .setEncoding("utf8")', testObjectMode, simpleLines, 'readable', 'utf8', false, true, false);
test('.readable() uses strings in objectMode with "binary: false" and "encoding: buffer"', testObjectMode, simpleLines, 'readable', 'utf8', false, true, false, {encoding: 'buffer'});
test('.readable() uses strings in objectMode with "binary: false" and object transforms', testObjectMode, foobarObjectChunks, 'readable', null, true, true, false, {stdout: outputObjectGenerator});
test('.duplex() uses Buffers with "binary: true"', testObjectMode, simpleChunksBuffer, 'duplex', null, false, false, true);
test('.duplex() uses strings with "binary: true" and .setEncoding("utf8")', testObjectMode, simpleChunks, 'duplex', 'utf8', false, false, true);
test('.duplex() uses strings with "binary: true" and "encoding: buffer"', testObjectMode, simpleChunks, 'duplex', 'utf8', false, false, true, {encoding: 'buffer'});
test('.duplex() uses strings in objectMode with "binary: true" and object transforms', testObjectMode, foobarObjectChunks, 'duplex', null, true, true, true, {stdout: outputObjectGenerator});
test('.duplex() uses strings in objectMode with "binary: false"', testObjectMode, simpleLines, 'duplex', null, false, true, false);
test('.duplex() uses strings in objectMode with "binary: false" and .setEncoding("utf8")', testObjectMode, simpleLines, 'duplex', 'utf8', false, true, false);
test('.duplex() uses strings in objectMode with "binary: false" and "encoding: buffer"', testObjectMode, simpleLines, 'duplex', 'utf8', false, true, false, {encoding: 'buffer'});
test('.duplex() uses strings in objectMode with "binary: false" and object transforms', testObjectMode, foobarObjectChunks, 'duplex', null, true, true, false, {stdout: outputObjectGenerator});

const testObjectSplit = async (t, methodName) => {
	const subprocess = getSubprocess(methodName, foobarString, {stdout: getOutputGenerator(simpleFull, true)});
	const stream = subprocess[methodName]({binary: false});
	await assertStreamChunks(t, stream, [simpleFull]);
	await subprocess;
};

test('.readable() "binary: false" does not split lines of strings produced by object transforms', testObjectSplit, 'readable');
test('.duplex() "binary: false" does not split lines of strings produced by object transforms', testObjectSplit, 'duplex');

const testMultibyteCharacters = async (t, methodName) => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess[methodName]({binary: false});
	const assertPromise = assertStreamOutput(t, stream, `${multibyteChar}${brokenSymbol}`);
	subprocess.stdin.write(multibyteUint8Array.slice(0, breakingLength));
	await once(subprocess.stdout, 'data');
	subprocess.stdin.end();
	await assertPromise;
};

test('.readable() "binary: false" handles partial multibyte characters', testMultibyteCharacters, 'readable');
test('.duplex() "binary: false" handles partial multibyte characters', testMultibyteCharacters, 'duplex');
