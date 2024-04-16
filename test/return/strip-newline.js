import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio} from '../helpers/stdio.js';
import {noopGenerator} from '../helpers/generator.js';
import {foobarString} from '../helpers/input.js';

setFixtureDir();

// eslint-disable-next-line max-params
const testStripFinalNewline = async (t, fdNumber, stripFinalNewline, shouldStrip, execaMethod) => {
	const {stdio} = await execaMethod('noop-fd.js', [`${fdNumber}`, `${foobarString}\n`], {...fullStdio, stripFinalNewline});
	t.is(stdio[fdNumber], `${foobarString}${shouldStrip ? '' : '\n'}`);
};

test('stripFinalNewline: default with stdout', testStripFinalNewline, 1, undefined, true, execa);
test('stripFinalNewline: true with stdout', testStripFinalNewline, 1, true, true, execa);
test('stripFinalNewline: false with stdout', testStripFinalNewline, 1, false, false, execa);
test('stripFinalNewline: default with stderr', testStripFinalNewline, 2, undefined, true, execa);
test('stripFinalNewline: true with stderr', testStripFinalNewline, 2, true, true, execa);
test('stripFinalNewline: false with stderr', testStripFinalNewline, 2, false, false, execa);
test('stripFinalNewline: default with stdio[*]', testStripFinalNewline, 3, undefined, true, execa);
test('stripFinalNewline: true with stdio[*]', testStripFinalNewline, 3, true, true, execa);
test('stripFinalNewline: false with stdio[*]', testStripFinalNewline, 3, false, false, execa);
test('stripFinalNewline: default with stdout, fd-specific', testStripFinalNewline, 1, {}, true, execa);
test('stripFinalNewline: true with stdout, fd-specific', testStripFinalNewline, 1, {stdout: true}, true, execa);
test('stripFinalNewline: false with stdout, fd-specific', testStripFinalNewline, 1, {stdout: false}, false, execa);
test('stripFinalNewline: default with stderr, fd-specific', testStripFinalNewline, 2, {}, true, execa);
test('stripFinalNewline: true with stderr, fd-specific', testStripFinalNewline, 2, {stderr: true}, true, execa);
test('stripFinalNewline: false with stderr, fd-specific', testStripFinalNewline, 2, {stderr: false}, false, execa);
test('stripFinalNewline: default with stdio[*], fd-specific', testStripFinalNewline, 3, {}, true, execa);
test('stripFinalNewline: true with stdio[*], fd-specific', testStripFinalNewline, 3, {fd3: true}, true, execa);
test('stripFinalNewline: false with stdio[*], fd-specific', testStripFinalNewline, 3, {fd3: false}, false, execa);
test('stripFinalNewline: default with stdout, sync', testStripFinalNewline, 1, undefined, true, execaSync);
test('stripFinalNewline: true with stdout, sync', testStripFinalNewline, 1, true, true, execaSync);
test('stripFinalNewline: false with stdout, sync', testStripFinalNewline, 1, false, false, execaSync);
test('stripFinalNewline: default with stderr, sync', testStripFinalNewline, 2, undefined, true, execaSync);
test('stripFinalNewline: true with stderr, sync', testStripFinalNewline, 2, true, true, execaSync);
test('stripFinalNewline: false with stderr, sync', testStripFinalNewline, 2, false, false, execaSync);
test('stripFinalNewline: default with stdio[*], sync', testStripFinalNewline, 3, undefined, true, execaSync);
test('stripFinalNewline: true with stdio[*], sync', testStripFinalNewline, 3, true, true, execaSync);
test('stripFinalNewline: false with stdio[*], sync', testStripFinalNewline, 3, false, false, execaSync);
test('stripFinalNewline: default with stdout, fd-specific, sync', testStripFinalNewline, 1, {}, true, execaSync);
test('stripFinalNewline: true with stdout, fd-specific, sync', testStripFinalNewline, 1, {stdout: true}, true, execaSync);
test('stripFinalNewline: false with stdout, fd-specific, sync', testStripFinalNewline, 1, {stdout: false}, false, execaSync);
test('stripFinalNewline: default with stderr, fd-specific, sync', testStripFinalNewline, 2, {}, true, execaSync);
test('stripFinalNewline: true with stderr, fd-specific, sync', testStripFinalNewline, 2, {stderr: true}, true, execaSync);
test('stripFinalNewline: false with stderr, fd-specific, sync', testStripFinalNewline, 2, {stderr: false}, false, execaSync);
test('stripFinalNewline: default with stdio[*], fd-specific, sync', testStripFinalNewline, 3, {}, true, execaSync);
test('stripFinalNewline: true with stdio[*], fd-specific, sync', testStripFinalNewline, 3, {fd3: true}, true, execaSync);
test('stripFinalNewline: false with stdio[*], fd-specific, sync', testStripFinalNewline, 3, {fd3: false}, false, execaSync);

test('stripFinalNewline is not used in objectMode', async t => {
	const {stdout} = await execa('noop-fd.js', ['1', `${foobarString}\n`], {stripFinalNewline: true, stdout: noopGenerator(true, false, true)});
	t.deepEqual(stdout, [`${foobarString}\n`]);
});
