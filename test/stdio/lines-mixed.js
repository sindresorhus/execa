import assert from 'node:assert/strict';
import {Writable} from 'node:stream';
import test from 'node:test';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {assertStreamOutput, assertStreamDataEvents, assertIterableChunks} from '../helpers/convert.js';
import {
	simpleFull,
	simpleLines,
	noNewlinesChunks,
	getSimpleChunkSubprocessAsync,
} from '../helpers/lines.js';

setFixtureDirectory();

const testAsyncIteration = async (expectedLines, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocessAsync({stripFinalNewline});
	assert.equal(subprocess.stdout.readableObjectMode, false);
	await assertStreamOutput(subprocess.stdout, simpleFull);
	const {stdout} = await subprocess;
	assert.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with stream async iteration', () => testAsyncIteration(simpleLines, false));
test('"lines: true" works with stream async iteration, stripFinalNewline', () => testAsyncIteration(noNewlinesChunks, true));

const testDataEvents = async (expectedLines, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocessAsync({stripFinalNewline});
	await assertStreamDataEvents(subprocess.stdout, simpleFull);
	const {stdout} = await subprocess;
	assert.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with stream "data" events', () => testDataEvents(simpleLines, false));
test('"lines: true" works with stream "data" events, stripFinalNewline', () => testDataEvents(noNewlinesChunks, true));

const testWritableStream = async (expectedLines, stripFinalNewline) => {
	let output = '';
	const writable = new Writable({
		write(line, encoding, done) {
			output += line.toString();
			done();
		},
		decodeStrings: false,
	});
	const {stdout} = await getSimpleChunkSubprocessAsync({stripFinalNewline, stdout: ['pipe', writable]});
	assert.deepEqual(output, simpleFull);
	assert.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with writable streams targets', () => testWritableStream(simpleLines, false));
test('"lines: true" works with writable streams targets, stripFinalNewline', () => testWritableStream(noNewlinesChunks, true));

const testIterable = async (expectedLines, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocessAsync({stripFinalNewline});
	await assertIterableChunks(subprocess, noNewlinesChunks);
	const {stdout} = await subprocess;
	assert.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with subprocess.iterable()', () => testIterable(simpleLines, false));
test('"lines: true" works with subprocess.iterable(), stripFinalNewline', () => testIterable(noNewlinesChunks, true));
