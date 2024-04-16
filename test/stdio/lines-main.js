import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio} from '../helpers/stdio.js';
import {getOutputsGenerator} from '../helpers/generator.js';
import {foobarString} from '../helpers/input.js';
import {
	simpleFull,
	simpleChunks,
	simpleFullEndChunks,
	simpleLines,
	simpleFullEndLines,
	noNewlinesChunks,
	getSimpleChunkSubprocessAsync,
} from '../helpers/lines.js';

setFixtureDir();

// eslint-disable-next-line max-params
const testStreamLines = async (t, fdNumber, input, expectedOutput, lines, stripFinalNewline, execaMethod) => {
	const {stdio} = await execaMethod('noop-fd.js', [`${fdNumber}`, input], {...fullStdio, lines, stripFinalNewline});
	t.deepEqual(stdio[fdNumber], expectedOutput);
};

test('"lines: true" splits lines, stdout', testStreamLines, 1, simpleFull, simpleLines, true, false, execa);
test('"lines: true" splits lines, stdout, fd-specific', testStreamLines, 1, simpleFull, simpleLines, {stdout: true}, false, execa);
test('"lines: true" splits lines, stderr', testStreamLines, 2, simpleFull, simpleLines, true, false, execa);
test('"lines: true" splits lines, stderr, fd-specific', testStreamLines, 2, simpleFull, simpleLines, {stderr: true}, false, execa);
test('"lines: true" splits lines, stdio[*]', testStreamLines, 3, simpleFull, simpleLines, true, false, execa);
test('"lines: true" splits lines, stdio[*], fd-specific', testStreamLines, 3, simpleFull, simpleLines, {fd3: true}, false, execa);
test('"lines: true" splits lines, stdout, stripFinalNewline', testStreamLines, 1, simpleFull, noNewlinesChunks, true, true, execa);
test('"lines: true" splits lines, stdout, stripFinalNewline, fd-specific', testStreamLines, 1, simpleFull, noNewlinesChunks, true, {stdout: true}, execa);
test('"lines: true" splits lines, stderr, stripFinalNewline', testStreamLines, 2, simpleFull, noNewlinesChunks, true, true, execa);
test('"lines: true" splits lines, stderr, stripFinalNewline, fd-specific', testStreamLines, 2, simpleFull, noNewlinesChunks, true, {stderr: true}, execa);
test('"lines: true" splits lines, stdio[*], stripFinalNewline', testStreamLines, 3, simpleFull, noNewlinesChunks, true, true, execa);
test('"lines: true" splits lines, stdio[*], stripFinalNewline, fd-specific', testStreamLines, 3, simpleFull, noNewlinesChunks, true, {fd3: true}, execa);
test('"lines: true" splits lines, stdout, sync', testStreamLines, 1, simpleFull, simpleLines, true, false, execaSync);
test('"lines: true" splits lines, stdout, fd-specific, sync', testStreamLines, 1, simpleFull, simpleLines, {stdout: true}, false, execaSync);
test('"lines: true" splits lines, stderr, sync', testStreamLines, 2, simpleFull, simpleLines, true, false, execaSync);
test('"lines: true" splits lines, stderr, fd-specific, sync', testStreamLines, 2, simpleFull, simpleLines, {stderr: true}, false, execaSync);
test('"lines: true" splits lines, stdio[*], sync', testStreamLines, 3, simpleFull, simpleLines, true, false, execaSync);
test('"lines: true" splits lines, stdio[*], fd-specific, sync', testStreamLines, 3, simpleFull, simpleLines, {fd3: true}, false, execaSync);
test('"lines: true" splits lines, stdout, stripFinalNewline, sync', testStreamLines, 1, simpleFull, noNewlinesChunks, true, true, execaSync);
test('"lines: true" splits lines, stdout, stripFinalNewline, fd-specific, sync', testStreamLines, 1, simpleFull, noNewlinesChunks, true, {stdout: true}, execaSync);
test('"lines: true" splits lines, stderr, stripFinalNewline, sync', testStreamLines, 2, simpleFull, noNewlinesChunks, true, true, execaSync);
test('"lines: true" splits lines, stderr, stripFinalNewline, fd-specific, sync', testStreamLines, 2, simpleFull, noNewlinesChunks, true, {stderr: true}, execaSync);
test('"lines: true" splits lines, stdio[*], stripFinalNewline, sync', testStreamLines, 3, simpleFull, noNewlinesChunks, true, true, execaSync);
test('"lines: true" splits lines, stdio[*], stripFinalNewline, fd-specific, sync', testStreamLines, 3, simpleFull, noNewlinesChunks, true, {fd3: true}, execaSync);

const bigArray = Array.from({length: 1e5}).fill('.\n');
const bigString = bigArray.join('');
const bigStringNoNewlines = '.'.repeat(1e6);
const bigStringNoNewlinesEnd = `${bigStringNoNewlines}\n`;

// eslint-disable-next-line max-params
const testStreamLinesGenerator = async (t, input, expectedLines, objectMode, binary, stripFinalNewline, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: getOutputsGenerator(input)(objectMode, binary),
		lines: true,
		stripFinalNewline,
	});
	t.deepEqual(stdout, expectedLines);
};

test('"lines: true" works with strings generators', testStreamLinesGenerator, simpleChunks, simpleFullEndLines, false, false, false, execa);
test('"lines: true" works with strings generators, binary', testStreamLinesGenerator, simpleChunks, simpleLines, false, true, false, execa);
test('"lines: true" works with big strings generators', testStreamLinesGenerator, [bigString], bigArray, false, false, false, execa);
test('"lines: true" works with big strings generators without newlines', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlinesEnd], false, false, false, execa);
test('"lines: true" is a noop with strings generators, objectMode', testStreamLinesGenerator, simpleFullEndChunks, simpleFullEndChunks, true, false, false, execa);
test('"lines: true" is a noop with strings generators, stripFinalNewline, objectMode', testStreamLinesGenerator, simpleFullEndChunks, simpleFullEndChunks, true, false, true, execa);
test('"lines: true" is a noop with strings generators, stripFinalNewline, fd-specific, objectMode', testStreamLinesGenerator, simpleFullEndChunks, simpleFullEndChunks, true, false, {stdout: true}, execa);
test('"lines: true" is a noop with strings generators, binary, objectMode', testStreamLinesGenerator, simpleChunks, simpleChunks, true, true, false, execa);
test('"lines: true" is a noop big strings generators, objectMode', testStreamLinesGenerator, [bigString], [bigString], true, false, false, execa);
test('"lines: true" is a noop big strings generators without newlines, objectMode', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlines], true, false, false, execa);
test('"lines: true" works with strings generators, sync', testStreamLinesGenerator, simpleChunks, simpleFullEndLines, false, false, false, execaSync);
test('"lines: true" works with strings generators, binary, sync', testStreamLinesGenerator, simpleChunks, simpleLines, false, true, false, execaSync);
test('"lines: true" works with big strings generators, sync', testStreamLinesGenerator, [bigString], bigArray, false, false, false, execaSync);
test('"lines: true" works with big strings generators without newlines, sync', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlinesEnd], false, false, false, execaSync);
test('"lines: true" is a noop with strings generators, objectMode, sync', testStreamLinesGenerator, simpleFullEndChunks, simpleFullEndChunks, true, false, false, execaSync);
test('"lines: true" is a noop with strings generators, stripFinalNewline, objectMode, sync', testStreamLinesGenerator, simpleFullEndChunks, simpleFullEndChunks, true, false, true, execaSync);
test('"lines: true" is a noop with strings generators, stripFinalNewline, fd-specific, objectMode, sync', testStreamLinesGenerator, simpleFullEndChunks, simpleFullEndChunks, true, false, {stdout: true}, execaSync);
test('"lines: true" is a noop with strings generators, binary, objectMode, sync', testStreamLinesGenerator, simpleChunks, simpleChunks, true, true, false, execaSync);
test('"lines: true" is a noop big strings generators, objectMode, sync', testStreamLinesGenerator, [bigString], [bigString], true, false, false, execaSync);
test('"lines: true" is a noop big strings generators without newlines, objectMode, sync', testStreamLinesGenerator, [bigStringNoNewlines], [bigStringNoNewlines], true, false, false, execaSync);

test('"lines: true" stops on stream error', async t => {
	const cause = new Error(foobarString);
	const error = await t.throwsAsync(getSimpleChunkSubprocessAsync({
		* stdout(line) {
			if (line === noNewlinesChunks[2]) {
				throw cause;
			}

			yield line;
		},
	}));
	t.is(error.cause, cause);
	t.deepEqual(error.stdout, noNewlinesChunks.slice(0, 2));
});

test('"lines: true" stops on stream error event', async t => {
	const cause = new Error(foobarString);
	const subprocess = getSimpleChunkSubprocessAsync();
	subprocess.stdout.emit('error', cause);
	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.deepEqual(error.stdout, []);
});
