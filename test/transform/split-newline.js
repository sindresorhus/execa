import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getOutputsGenerator, noopGenerator, noopAsyncGenerator} from '../helpers/generator.js';
import {singleFull, singleFullEnd} from '../helpers/lines.js';

setFixtureDir();

const singleFullEndWindows = `${singleFull}\r\n`;
const mixedNewlines = '.\n.\r\n.\n.\r\n.\n';

const testStripNewline = async (t, input, expectedOutput, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: getOutputsGenerator([input])(),
		stripFinalNewline: false,
	});
	t.is(stdout, expectedOutput);
};

test('Strips newline when user do not mistakenly yield one at the end', testStripNewline, singleFull, singleFullEnd, execa);
test('Strips newline when user mistakenly yielded one at the end', testStripNewline, singleFullEnd, singleFullEnd, execa);
test('Strips newline when user mistakenly yielded one at the end, Windows newline', testStripNewline, singleFullEndWindows, singleFullEndWindows, execa);
test('Strips newline when user do not mistakenly yield one at the end, sync', testStripNewline, singleFull, singleFullEnd, execaSync);
test('Strips newline when user mistakenly yielded one at the end, sync', testStripNewline, singleFullEnd, singleFullEnd, execaSync);
test('Strips newline when user mistakenly yielded one at the end, Windows newline, sync', testStripNewline, singleFullEndWindows, singleFullEndWindows, execaSync);

const testMixNewlines = async (t, generator, execaMethod) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', mixedNewlines], {
		stdout: generator(),
		stripFinalNewline: false,
	});
	t.is(stdout, mixedNewlines);
};

test('Can mix Unix and Windows newlines', testMixNewlines, noopGenerator, execa);
test('Can mix Unix and Windows newlines, sync', testMixNewlines, noopGenerator, execaSync);
test('Can mix Unix and Windows newlines, async', testMixNewlines, noopAsyncGenerator, execa);
