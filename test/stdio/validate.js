import {Buffer} from 'node:buffer';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarUint8Array, foobarBuffer, foobarObject} from '../helpers/input.js';
import {serializeGenerator, getOutputGenerator, convertTransformToFinal} from '../helpers/generator.js';

setFixtureDir();

// eslint-disable-next-line max-params
const testGeneratorReturn = async (t, fdNumber, generator, input, objectMode, isInput) => {
	const fixtureName = isInput ? 'stdin-fd.js' : 'noop-fd.js';
	const subprocess = execa(fixtureName, [`${fdNumber}`], getStdio(fdNumber, generator(input, objectMode)));
	const {message} = await t.throwsAsync(subprocess);
	t.true(message.includes(getMessage(input)));
};

const getMessage = input => {
	if (input === null || input === undefined) {
		return 'not be called at all';
	}

	if (Buffer.isBuffer(input)) {
		return 'not a buffer';
	}

	return 'a string or an Uint8Array';
};

const lastInputGenerator = (input, objectMode) => [foobarUint8Array, getOutputGenerator(input, objectMode)];
const inputGenerator = (input, objectMode) => [...lastInputGenerator(input, objectMode), serializeGenerator(true)];

test('Generators with result.stdin cannot return an object if not in objectMode', testGeneratorReturn, 0, inputGenerator, foobarObject, false, true);
test('Generators with result.stdio[*] as input cannot return an object if not in objectMode', testGeneratorReturn, 3, inputGenerator, foobarObject, false, true);
test('The last generator with result.stdin cannot return an object even in objectMode', testGeneratorReturn, 0, lastInputGenerator, foobarObject, true, true);
test('The last generator with result.stdio[*] as input cannot return an object even in objectMode', testGeneratorReturn, 3, lastInputGenerator, foobarObject, true, true);
test('Generators with result.stdout cannot return an object if not in objectMode', testGeneratorReturn, 1, getOutputGenerator, foobarObject, false, false);
test('Generators with result.stderr cannot return an object if not in objectMode', testGeneratorReturn, 2, getOutputGenerator, foobarObject, false, false);
test('Generators with result.stdio[*] as output cannot return an object if not in objectMode', testGeneratorReturn, 3, getOutputGenerator, foobarObject, false, false);
test('Generators with result.stdin cannot return a Buffer if not in objectMode', testGeneratorReturn, 0, inputGenerator, foobarBuffer, false, true);
test('Generators with result.stdio[*] as input cannot return a Buffer if not in objectMode', testGeneratorReturn, 3, inputGenerator, foobarBuffer, false, true);
test('The last generator with result.stdin cannot return a Buffer even in objectMode', testGeneratorReturn, 0, lastInputGenerator, foobarBuffer, true, true);
test('The last generator with result.stdio[*] as input cannot return a Buffer even in objectMode', testGeneratorReturn, 3, lastInputGenerator, foobarBuffer, true, true);
test('Generators with result.stdout cannot return a Buffer if not in objectMode', testGeneratorReturn, 1, getOutputGenerator, foobarBuffer, false, false);
test('Generators with result.stderr cannot return a Buffer if not in objectMode', testGeneratorReturn, 2, getOutputGenerator, foobarBuffer, false, false);
test('Generators with result.stdio[*] as output cannot return a Buffer if not in objectMode', testGeneratorReturn, 3, getOutputGenerator, foobarBuffer, false, false);
test('Generators with result.stdin cannot return null if not in objectMode', testGeneratorReturn, 0, inputGenerator, null, false, true);
test('Generators with result.stdin cannot return null if in objectMode', testGeneratorReturn, 0, inputGenerator, null, true, true);
test('Generators with result.stdout cannot return null if not in objectMode', testGeneratorReturn, 1, getOutputGenerator, null, false, false);
test('Generators with result.stdout cannot return null if in objectMode', testGeneratorReturn, 1, getOutputGenerator, null, true, false);
test('Generators with result.stdin cannot return undefined if not in objectMode', testGeneratorReturn, 0, inputGenerator, undefined, false, true);
test('Generators with result.stdin cannot return undefined if in objectMode', testGeneratorReturn, 0, inputGenerator, undefined, true, true);
test('Generators with result.stdout cannot return undefined if not in objectMode', testGeneratorReturn, 1, getOutputGenerator, undefined, false, false);
test('Generators with result.stdout cannot return undefined if in objectMode', testGeneratorReturn, 1, getOutputGenerator, undefined, true, false);

test('Generators "final" return value is validated', async t => {
	const subprocess = execa('noop.js', {stdout: convertTransformToFinal(getOutputGenerator(null, true), true)});
	await t.throwsAsync(subprocess, {message: /not be called at all/});
});
