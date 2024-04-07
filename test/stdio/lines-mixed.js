import {Writable} from 'node:stream';
import test from 'ava';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {assertStreamOutput, assertStreamDataEvents, assertIterableChunks} from '../helpers/convert.js';
import {simpleFull, simpleLines, noNewlinesChunks, getSimpleChunkSubprocessAsync} from '../helpers/lines.js';

setFixtureDir();

const testAsyncIteration = async (t, expectedLines, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocessAsync({stripFinalNewline});
	t.false(subprocess.stdout.readableObjectMode);
	await assertStreamOutput(t, subprocess.stdout, simpleFull);
	const {stdout} = await subprocess;
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with stream async iteration', testAsyncIteration, simpleLines, false);
test('"lines: true" works with stream async iteration, stripFinalNewline', testAsyncIteration, noNewlinesChunks, true);

const testDataEvents = async (t, expectedLines, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocessAsync({stripFinalNewline});
	await assertStreamDataEvents(t, subprocess.stdout, simpleFull);
	const {stdout} = await subprocess;
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with stream "data" events', testDataEvents, simpleLines, false);
test('"lines: true" works with stream "data" events, stripFinalNewline', testDataEvents, noNewlinesChunks, true);

const testWritableStream = async (t, expectedLines, stripFinalNewline) => {
	let output = '';
	const writable = new Writable({
		write(line, encoding, done) {
			output += line.toString();
			done();
		},
		decodeStrings: false,
	});
	const {stdout} = await getSimpleChunkSubprocessAsync({stripFinalNewline, stdout: ['pipe', writable]});
	t.deepEqual(output, simpleFull);
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with writable streams targets', testWritableStream, simpleLines, false);
test('"lines: true" works with writable streams targets, stripFinalNewline', testWritableStream, noNewlinesChunks, true);

const testIterable = async (t, expectedLines, stripFinalNewline) => {
	const subprocess = getSimpleChunkSubprocessAsync({stripFinalNewline});
	await assertIterableChunks(t, subprocess, noNewlinesChunks);
	const {stdout} = await subprocess;
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with subprocess.iterable()', testIterable, simpleLines, false);
test('"lines: true" works with subprocess.iterable(), stripFinalNewline', testIterable, noNewlinesChunks, true);
