import assert from 'node:assert/strict';
import {inspect} from 'node:util';
import test from 'node:test';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarObject} from '../helpers/input.js';
import {simpleFull, noNewlinesChunks} from '../helpers/lines.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {getOutputLine, getOutputLines, testTimestamp} from '../helpers/verbose.js';

setFixtureDirectory();

const testLines = async (lines, stripFinalNewline, isSync) => {
	const {stderr} = await nestedSubprocess('noop-fd.js', ['1', simpleFull], {
		verbose: 'full',
		lines,
		stripFinalNewline,
		isSync,
	});
	assert.deepEqual(getOutputLines(stderr), noNewlinesChunks.map(line => `${testTimestamp} [0]   ${line}`));
};

test('Prints stdout, "lines: true"', () => testLines(true, false, false));
test('Prints stdout, "lines: true", fd-specific', () => testLines({stdout: true}, false, false));
test('Prints stdout, "lines: true", stripFinalNewline', () => testLines(true, true, false));
test('Prints stdout, "lines: true", sync', () => testLines(true, false, true));
test('Prints stdout, "lines: true", fd-specific, sync', () => testLines({stdout: true}, false, true));
test('Prints stdout, "lines: true", stripFinalNewline, sync', () => testLines(true, true, true));

const testOnlyTransforms = async isSync => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {
		optionsFixture: 'generator-uppercase.js',
		verbose: 'full',
		isSync,
	});
	assert.equal(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString.toUpperCase()}`);
};

test('Prints stdout with only transforms', () => testOnlyTransforms(false));
test('Prints stdout with only transforms, sync', () => testOnlyTransforms(true));

test('Prints stdout with only duplexes', async () => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {
		optionsFixture: 'generator-duplex.js',
		verbose: 'full',
	});
	assert.equal(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString.toUpperCase()}`);
});

const testObjectMode = async isSync => {
	const {stderr} = await nestedSubprocess('noop.js', {
		optionsFixture: 'generator-object.js',
		verbose: 'full',
		isSync,
	});
	assert.equal(getOutputLine(stderr), `${testTimestamp} [0]   ${inspect(foobarObject)}`);
};

test('Prints stdout with object transforms', () => testObjectMode(false));
test('Prints stdout with object transforms, sync', () => testObjectMode(true));

const testBigArray = async isSync => {
	const {stderr} = await nestedSubprocess('noop.js', {
		optionsFixture: 'generator-big-array.js',
		verbose: 'full',
		isSync,
	});
	const lines = getOutputLines(stderr);
	assert.equal(lines[0], `${testTimestamp} [0]   [`);
	assert.ok(lines[1].startsWith(`${testTimestamp} [0]      0,  1,`));
	assert.equal(lines.at(-1), `${testTimestamp} [0]   ]`);
};

test('Prints stdout with big object transforms', () => testBigArray(false));
test('Prints stdout with big object transforms, sync', () => testBigArray(true));

const testObjectModeString = async isSync => {
	const {stderr} = await nestedSubprocess('noop.js', {
		optionsFixture: 'generator-string-object.js',
		verbose: 'full',
		isSync,
	});
	assert.deepEqual(getOutputLines(stderr), noNewlinesChunks.map(line => `${testTimestamp} [0]   ${line}`));
};

test('Prints stdout with string transforms in objectMode', () => testObjectModeString(false));
test('Prints stdout with string transforms in objectMode, sync', () => testObjectModeString(true));
