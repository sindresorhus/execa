import assert from 'node:assert/strict';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {PassThrough} from 'node:stream';
import test from 'node:test';
import getStream from 'get-stream';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarUppercase, foobarUint8Array} from '../helpers/input.js';
import {uppercaseGenerator} from '../helpers/generator.js';
import {uppercaseBufferDuplex} from '../helpers/duplex.js';
import {uppercaseBufferWebTransform} from '../helpers/web-transform.js';
import {generatorsMap} from '../helpers/map.js';

setFixtureDirectory();

const testInputOption = async (type, execaMethod) => {
	const {stdout} = await execaMethod('stdin-fd.js', ['0'], {stdin: generatorsMap[type].uppercase(), input: foobarUint8Array});
	assert.equal(stdout, foobarUppercase);
};

test('Can use generators with input option', () => testInputOption('generator', execa));
test('Can use generators with input option, sync', () => testInputOption('generator', execaSync));
test('Can use duplexes with input option', () => testInputOption('duplex', execa));
test('Can use webTransforms with input option', () => testInputOption('webTransform', execa));

const testInputFile = async (stdinOption, useInputFile, reversed, execaMethod) => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const options = useInputFile
		? {inputFile: filePath, stdin: stdinOption}
		: {stdin: [{file: filePath}, stdinOption]};
	options.stdin = reversed ? options.stdin.reverse() : options.stdin;
	const {stdout} = await execaMethod('stdin-fd.js', ['0'], options);
	assert.equal(stdout, foobarUppercase);
	await rm(filePath);
};

test('Can use generators with a file as input', () => testInputFile(uppercaseGenerator(), false, false, execa));
test('Can use generators with a file as input, reversed', () => testInputFile(uppercaseGenerator(), false, true, execa));
test('Can use generators with inputFile option', () => testInputFile(uppercaseGenerator(), true, false, execa));
test('Can use generators with a file as input, sync', () => testInputFile(uppercaseGenerator(), false, false, execaSync));
test('Can use generators with a file as input, reversed, sync', () => testInputFile(uppercaseGenerator(), false, true, execaSync));
test('Can use generators with inputFile option, sync', () => testInputFile(uppercaseGenerator(), true, false, execaSync));
test('Can use duplexes with a file as input', () => testInputFile(uppercaseBufferDuplex(), false, false, execa));
test('Can use duplexes with a file as input, reversed', () => testInputFile(uppercaseBufferDuplex(), false, true, execa));
test('Can use duplexes with inputFile option', () => testInputFile(uppercaseBufferDuplex(), true, false, execa));
test('Can use webTransforms with a file as input', () => testInputFile(uppercaseBufferWebTransform(), false, false, execa));
test('Can use webTransforms with a file as input, reversed', () => testInputFile(uppercaseBufferWebTransform(), false, true, execa));
test('Can use webTransforms with inputFile option', () => testInputFile(uppercaseBufferWebTransform(), true, false, execa));

const testOutputFile = async (reversed, type, execaMethod) => {
	const filePath = tempfile();
	const stdoutOption = [generatorsMap[type].uppercaseBuffer(false, true), {file: filePath}];
	const reversedStdoutOption = reversed ? stdoutOption.reverse() : stdoutOption;
	const {stdout} = await execaMethod('noop-fd.js', ['1'], {stdout: reversedStdoutOption});
	assert.equal(stdout, foobarUppercase);
	assert.equal(await readFile(filePath, 'utf8'), foobarUppercase);
	await rm(filePath);
};

test('Can use generators with a file as output', () => testOutputFile(false, 'generator', execa));
test('Can use generators with a file as output, reversed', () => testOutputFile(true, 'generator', execa));
test('Can use generators with a file as output, sync', () => testOutputFile(false, 'generator', execaSync));
test('Can use generators with a file as output, reversed, sync', () => testOutputFile(true, 'generator', execaSync));
test('Can use duplexes with a file as output', () => testOutputFile(false, 'duplex', execa));
test('Can use duplexes with a file as output, reversed', () => testOutputFile(true, 'duplex', execa));
test('Can use webTransforms with a file as output', () => testOutputFile(false, 'webTransform', execa));
test('Can use webTransforms with a file as output, reversed', () => testOutputFile(true, 'webTransform', execa));

const testWritableDestination = async type => {
	const passThrough = new PassThrough();
	const [{stdout}, streamOutput] = await Promise.all([
		execa('noop-fd.js', ['1', foobarString], {stdout: [generatorsMap[type].uppercaseBuffer(false, true), passThrough]}),
		getStream(passThrough),
	]);
	assert.equal(stdout, foobarUppercase);
	assert.equal(streamOutput, foobarUppercase);
};

test('Can use generators to a Writable stream', () => testWritableDestination('generator'));
test('Can use duplexes to a Writable stream', () => testWritableDestination('duplex'));
test('Can use webTransforms to a Writable stream', () => testWritableDestination('webTransform'));

const testReadableSource = async type => {
	const passThrough = new PassThrough();
	const subprocess = execa('stdin-fd.js', ['0'], {stdin: [passThrough, generatorsMap[type].uppercase()]});
	passThrough.end(foobarString);
	const {stdout} = await subprocess;
	assert.equal(stdout, foobarUppercase);
};

test('Can use generators from a Readable stream', () => testReadableSource('generator'));
test('Can use duplexes from a Readable stream', () => testReadableSource('duplex'));
test('Can use webTransforms from a Readable stream', () => testReadableSource('webTransform'));

const testInherit = async type => {
	const {stdout} = await execa('nested-inherit.js', [type]);
	assert.equal(stdout, foobarUppercase);
};

test('Can use generators with "inherit"', () => testInherit('generator'));
test('Can use duplexes with "inherit"', () => testInherit('duplex'));
test('Can use webTransforms with "inherit"', () => testInherit('webTransform'));
