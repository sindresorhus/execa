import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getOutputsGenerator, resultGenerator} from '../helpers/generator.js';
import {
	foobarString,
	foobarUint8Array,
	foobarObject,
	foobarObjectString,
} from '../helpers/input.js';

setFixtureDirectory();

const resultUint8ArrayGenerator = function * (lines, chunk) {
	lines.push(chunk);
	yield new TextEncoder().encode(chunk);
};

// eslint-disable-next-line max-params
const testStringToUint8Array = async (t, expectedOutput, objectMode, preserveNewlines, execaMethod) => {
	const lines = [];
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {
		stdout: {
			transform: resultUint8ArrayGenerator.bind(undefined, lines),
			objectMode,
			preserveNewlines,
		},
		lines: true,
	});
	t.deepEqual(lines, [foobarString]);
	t.deepEqual(stdout, expectedOutput);
};

test('Line splitting when converting from string to Uint8Array', testStringToUint8Array, [foobarString], false, true, execa);
test('Line splitting when converting from string to Uint8Array, objectMode', testStringToUint8Array, [foobarUint8Array], true, true, execa);
test('Line splitting when converting from string to Uint8Array, preserveNewlines', testStringToUint8Array, [foobarString], false, false, execa);
test('Line splitting when converting from string to Uint8Array, objectMode, preserveNewlines', testStringToUint8Array, [foobarUint8Array], true, false, execa);
test('Line splitting when converting from string to Uint8Array, sync', testStringToUint8Array, [foobarString], false, true, execaSync);
test('Line splitting when converting from string to Uint8Array, objectMode, sync', testStringToUint8Array, [foobarUint8Array], true, true, execaSync);
test('Line splitting when converting from string to Uint8Array, preserveNewlines, sync', testStringToUint8Array, [foobarString], false, false, execaSync);
test('Line splitting when converting from string to Uint8Array, objectMode, preserveNewlines, sync', testStringToUint8Array, [foobarUint8Array], true, false, execaSync);

const serializeResultGenerator = function * (lines, chunk) {
	lines.push(chunk);
	yield JSON.stringify(chunk);
};

const testUnsetObjectMode = async (t, expectedOutput, preserveNewlines, execaMethod) => {
	const lines = [];
	const {stdout} = await execaMethod('noop.js', {
		stdout: [
			getOutputsGenerator([foobarObject])(true),
			{transform: serializeResultGenerator.bind(undefined, lines), preserveNewlines, objectMode: false},
		],
		stripFinalNewline: false,
	});
	t.deepEqual(lines, [foobarObject]);
	t.is(stdout, expectedOutput);
};

test('Can switch from objectMode to non-objectMode', testUnsetObjectMode, `${foobarObjectString}\n`, false, execa);
test('Can switch from objectMode to non-objectMode, preserveNewlines', testUnsetObjectMode, foobarObjectString, true, execa);
test('Can switch from objectMode to non-objectMode, sync', testUnsetObjectMode, `${foobarObjectString}\n`, false, execaSync);
test('Can switch from objectMode to non-objectMode, preserveNewlines, sync', testUnsetObjectMode, foobarObjectString, true, execaSync);

// eslint-disable-next-line max-params
const testYieldArray = async (t, input, expectedLines, expectedOutput, execaMethod) => {
	const lines = [];
	const {stdout} = await execaMethod('noop.js', {
		stdout: [
			getOutputsGenerator(input)(),
			resultGenerator(lines)(),
		],
		stripFinalNewline: false,
	});
	t.deepEqual(lines, expectedLines);
	t.deepEqual(stdout, expectedOutput);
};

test('Can use "yield* array" to produce multiple lines', testYieldArray, [foobarString, foobarString], [foobarString, foobarString], `${foobarString}\n${foobarString}\n`, execa);
test('Can use "yield* array" to produce empty lines', testYieldArray, [foobarString, ''], [foobarString, ''], `${foobarString}\n\n`, execa);
test('Can use "yield* array" to produce multiple lines, sync', testYieldArray, [foobarString, foobarString], [foobarString, foobarString], `${foobarString}\n${foobarString}\n`, execaSync);
test('Can use "yield* array" to produce empty lines, sync', testYieldArray, [foobarString, ''], [foobarString, ''], `${foobarString}\n\n`, execaSync);
