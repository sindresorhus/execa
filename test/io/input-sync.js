import assert from 'node:assert/strict';
import {openSync, closeSync} from 'node:fs';
import process from 'node:process';
import test from 'node:test';
import {assertThrows} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getStdio} from '../helpers/stdio.js';
import {noopGenerator, serializeGenerator} from '../helpers/generator.js';
import {foobarObject, foobarObjectString} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';

setFixtureDirectory();

const getFd3InputMessage = type => `not \`stdio[3]\`, can be ${type}`;

const testFd3InputSync = (stdioOption, expectedMessage) => {
	const {message} = assertThrows(() => {
		execaSync('empty.js', getStdio(3, stdioOption));
	});
	assert.ok(message.includes(expectedMessage));
};

test('Cannot use Uint8Array with stdio[*], sync', () => testFd3InputSync(new Uint8Array(), getFd3InputMessage('a Uint8Array')));
test('Cannot use iterable with stdio[*], sync', () => testFd3InputSync([[]], getFd3InputMessage('an iterable')));

/*
With asynchronous methods, all `stdin` sources are merged into a single stream before being transformed, so transform state (including line splitting) spans all sources.
Synchronous methods must apply the transform pipeline once over the merged sources, not once per source.
*/
const testMultipleSources = async execaMethod => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [['a'], ['b\n'], noopGenerator()],
	});
	assert.equal(stdout, 'ab');
};

test('Multiple stdin sources are transformed as a single stream', () => testMultipleSources(execa));
test('Multiple stdin sources are transformed as a single stream, sync', () => testMultipleSources(execaSync));

// The generator's `final` function must run once overall, not once per source
const finalCountGenerator = {
	* transform(value) {
		yield value;
	},
	* final() {
		yield '[F]';
	},
};

const testMultipleSourcesFinal = async execaMethod => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [['a'], ['b\n'], finalCountGenerator],
	});
	assert.equal(stdout, 'ab\n[F]');
};

test('Generator "final" runs once with multiple stdin sources', () => testMultipleSourcesFinal(execa));
test('Generator "final" runs once with multiple stdin sources, sync', () => testMultipleSourcesFinal(execaSync));

// Without transforms, multiple sources are simply concatenated, like a single source with multiple chunks
const testMultipleSourcesNoTransform = async execaMethod => {
	const {stdout} = await execaMethod('stdin.js', {stdin: [['a'], ['b\n']]});
	assert.equal(stdout, 'ab');
};

test('Multiple stdin sources are concatenated without transforms', () => testMultipleSourcesNoTransform(execa));
test('Multiple stdin sources are concatenated without transforms, sync', () => testMultipleSourcesNoTransform(execaSync));

// A `\r\n` sequence split across two sources must still be detected, like across two chunks of a single source
const testWindowsNewlineSpanningSources = async execaMethod => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [['x\r'], ['\ny'], noopGenerator()],
		stripFinalNewline: false,
	});
	assert.equal(stdout, 'x\r\ny\r\n');
};

test('Windows newlines can span multiple stdin sources', () => testWindowsNewlineSpanningSources(execa));
test('Windows newlines can span multiple stdin sources, sync', () => testWindowsNewlineSpanningSources(execaSync));

// The `input` option is one more source going through the same transforms, in the order the sources were passed
const testInputOptionWithStdinSource = async execaMethod => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [['a'], noopGenerator()],
		input: 'b',
	});
	assert.equal(stdout, 'ab');
};

test('The input option is transformed together with stdin sources', () => testInputOptionWithStdinSource(execa));
test('The input option is transformed together with stdin sources, sync', () => testInputOptionWithStdinSource(execaSync));

// Object inputs are serialized no matter how many sources they come from
const testMultipleObjectSources = async execaMethod => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [[foobarObject], [foobarObject], serializeGenerator(true)],
	});
	assert.equal(stdout, `${foobarObjectString}\n${foobarObjectString}`);
};

test('Multiple object stdin sources are serialized', () => testMultipleObjectSources(execa));
test('Multiple object stdin sources are serialized, sync', () => testMultipleObjectSources(execaSync));

// Like `inputFile`, the inherited file descriptor is read lazily, so that a read failure is reported like any other error, including with `reject: false`
if (process.platform !== 'win32') {
	test('Failing to read stdin: ["inherit", "pipe"] is reported as an Execa error, sync', async () => {
		const directoryFd = openSync('.', 'r');
		try {
			const {nestedResult} = await nestedSubprocess('empty.js', {isSync: true, stdin: ['inherit', 'pipe'], reject: false}, {stdin: directoryFd});
			assert.ok(nestedResult.message.startsWith('Command failed with EISDIR'));
		} finally {
			closeSync(directoryFd);
		}
	});
}
