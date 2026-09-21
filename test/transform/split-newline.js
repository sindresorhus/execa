import process from 'node:process';
import {Buffer} from 'node:buffer';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getOutputsGenerator, noopGenerator, noopAsyncGenerator} from '../helpers/generator.js';
import {singleFull, singleFullEnd} from '../helpers/lines.js';

setFixtureDirectory();

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

// A `\r\n` sequence can be split across two chunks, since chunk boundaries are arbitrary.
// `noop-progressive.js` writes each character as a separate chunk, then a final newline.
test('Detects Windows newlines split across chunks', async t => {
	const {stdout} = await execa('noop-progressive.js', ['aaa\r'], {lines: true});
	t.deepEqual(stdout, ['aaa']);
});

test('Keeps Windows newlines split across chunks', async t => {
	const {stdout} = await execa('noop-progressive.js', ['aaa\r'], {lines: true, stripFinalNewline: false});
	t.deepEqual(stdout, ['aaa\r\n']);
});

test('Detects multiple Windows newlines split across chunks', async t => {
	const {stdout} = await execa('noop-progressive.js', ['aaa\r\nbbb\r'], {lines: true});
	t.deepEqual(stdout, ['aaa', 'bbb']);
});

test('Keeps lone carriage returns split across chunks', async t => {
	const {stdout} = await execa('noop-progressive.js', ['aaa\rbbb'], {lines: true});
	t.deepEqual(stdout, ['aaa\rbbb']);
});

/*
The newline re-added after each stripped line must be encoded with the `encoding` option when the transform yields bytes, both for `\n` and `\r\n`, and whether the input comes from the subprocess or from the `stdin` option.
*/
const utf16Input = 'aaa\nbbb\nccc\n';
const utf16WindowsInput = 'aaa\r\nbbb\r\n';

const utf16YieldGenerator = {
	* transform(line) {
		yield Buffer.from(line, 'utf16le');
	},
};

// The transform yields bytes which already end with a newline: it must not be appended twice
const utf16YieldNewlineGenerator = {
	* transform(line) {
		yield Buffer.from(`${line}\n`, 'utf16le');
	},
};

const testUtf16LeInputNewlines = async (t, input, generator, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [[input], generator],
		encoding: 'utf16le',
		stripFinalNewline: false,
	});
	t.is(stdout, input);
};

test('Newlines re-added to bytes use encoding "utf16le"', testUtf16LeInputNewlines, utf16Input, utf16YieldGenerator, execa);
test('Newlines re-added to bytes use encoding "utf16le", sync', testUtf16LeInputNewlines, utf16Input, utf16YieldGenerator, execaSync);
test('Windows newlines re-added to bytes use encoding "utf16le"', testUtf16LeInputNewlines, utf16WindowsInput, utf16YieldGenerator, execa);
test('Windows newlines re-added to bytes use encoding "utf16le", sync', testUtf16LeInputNewlines, utf16WindowsInput, utf16YieldGenerator, execaSync);
test('Bytes already ending with a newline are not appended to, utf16le', testUtf16LeInputNewlines, utf16Input, utf16YieldNewlineGenerator, execa);
test('Bytes already ending with a newline are not appended to, utf16le, sync', testUtf16LeInputNewlines, utf16Input, utf16YieldNewlineGenerator, execaSync);

// The subprocess' own output goes through the same newline re-adding logic
const testUtf16LeOutputNewlines = async (t, execaMethod) => {
	const {stdout} = await execaMethod(process.execPath, ['-e', `process.stdout.write(${JSON.stringify(utf16Input)}, 'utf16le')`], {
		stdout: utf16YieldGenerator,
		encoding: 'utf16le',
		stripFinalNewline: false,
	});
	t.is(stdout, utf16Input);
};

test('Newlines re-added to bytes use encoding "utf16le", subprocess output', testUtf16LeOutputNewlines, execa);
test('Newlines re-added to bytes use encoding "utf16le", subprocess output, sync', testUtf16LeOutputNewlines, execaSync);

// Control: UTF-8 bytes keep using UTF-8 newlines
const utf8YieldGenerator = {
	* transform(line) {
		yield Buffer.from(line, 'utf8');
	},
};

const testUtf8InputNewlines = async (t, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [[utf16Input], utf8YieldGenerator],
		stripFinalNewline: false,
	});
	t.is(stdout, utf16Input);
};

test('Newlines re-added to bytes use UTF-8 by default', testUtf8InputNewlines, execa);
test('Newlines re-added to bytes use UTF-8 by default, sync', testUtf8InputNewlines, execaSync);

// With the `binary` transform option, the transform deals with raw bytes: they are left untouched
const testBinaryUtf16Le = async (t, execaMethod) => {
	const bytes = new Uint8Array(Buffer.from(utf16Input, 'utf16le'));
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [[bytes], noopGenerator(false, true)],
		encoding: 'utf16le',
		stripFinalNewline: false,
	});
	t.is(stdout, utf16Input);
};

test('"binary: true" leaves utf16le bytes untouched', testBinaryUtf16Le, execa);
test('"binary: true" leaves utf16le bytes untouched, sync', testBinaryUtf16Le, execaSync);
