import {Readable} from 'node:stream';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import {execa, execaSync, $} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdinOption, getPlainStdioOption, getScriptSync, identity} from '../helpers/stdio.js';

setFixtureDir();

const textEncoder = new TextEncoder();
const binaryFoobar = textEncoder.encode('foobar');

const testInputOptionError = (t, stdin, inputName) => {
	t.throws(() => {
		execa('stdin.js', {stdin, [inputName]: 'foobar'});
	}, {message: new RegExp(`\`${inputName}\` and \`stdin\` options`)});
};

test('stdin option cannot be an iterable when "input" is used', testInputOptionError, ['foo', 'bar'], 'input');
test('stdin option cannot be an iterable when "inputFile" is used', testInputOptionError, ['foo', 'bar'], 'inputFile');
test('stdin option cannot be a file URL when "input" is used', testInputOptionError, pathToFileURL('unknown'), 'input');
test('stdin option cannot be a file URL when "inputFile" is used', testInputOptionError, pathToFileURL('unknown'), 'inputFile');
test('stdin option cannot be a file path when "input" is used', testInputOptionError, './unknown', 'input');
test('stdin option cannot be a file path when "inputFile" is used', testInputOptionError, './unknown', 'inputFile');
test('stdin option cannot be a ReadableStream when "input" is used', testInputOptionError, new ReadableStream(), 'input');
test('stdin option cannot be a ReadableStream when "inputFile" is used', testInputOptionError, new ReadableStream(), 'inputFile');

const testInput = async (t, input, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {input});
	t.is(stdout, 'foobar');
};

test('input option can be a String', testInput, 'foobar', execa);
test('input option can be a String - sync', testInput, 'foobar', execaSync);
test('input option can be a Uint8Array', testInput, binaryFoobar, execa);
test('input option can be a Uint8Array - sync', testInput, binaryFoobar, execaSync);

const testInputScript = async (t, getExecaMethod) => {
	const {stdout} = await getExecaMethod($({input: 'foobar'}))`stdin.js`;
	t.is(stdout, 'foobar');
};

test('input option can be used with $', testInputScript, identity);
test('input option can be used with $.sync', testInputScript, getScriptSync);

const testInputWithStdinError = (t, input, getOptions, execaMethod) => {
	t.throws(() => {
		execaMethod('stdin.js', {input, ...getOptions('ignore')});
	}, {message: /`input` and `stdin` options/});
};

test('input option cannot be a String when stdin is set', testInputWithStdinError, 'foobar', getStdinOption, execa);
test('input option cannot be a String when stdio is set', testInputWithStdinError, 'foobar', getPlainStdioOption, execa);
test('input option cannot be a String when stdin is set - sync', testInputWithStdinError, 'foobar', getStdinOption, execaSync);
test('input option cannot be a String when stdio is set - sync', testInputWithStdinError, 'foobar', getPlainStdioOption, execaSync);
test('input option cannot be a Node.js Readable when stdin is set', testInputWithStdinError, new Readable(), getStdinOption, execa);
test('input option cannot be a Node.js Readable when stdio is set', testInputWithStdinError, new Readable(), getPlainStdioOption, execa);

const testInputAndInputFile = async (t, execaMethod) => {
	t.throws(() => execaMethod('stdin.js', {inputFile: '', input: ''}), {
		message: /cannot be both set/,
	});
};

test('inputFile and input cannot be both set', testInputAndInputFile, execa);
test('inputFile and input cannot be both set - sync', testInputAndInputFile, execaSync);
