import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarUint8Array, foobarObject} from '../helpers/input.js';
import {serializeGenerator, getOutputGenerator, convertTransformToFinal} from '../helpers/generator.js';

setFixtureDir();

// eslint-disable-next-line max-params
const testGeneratorReturn = async (t, fdNumber, generators, fixtureName, isNull) => {
	const subprocess = execa(fixtureName, [`${fdNumber}`], getStdio(fdNumber, generators));
	const message = isNull ? /not be called at all/ : /a string or an Uint8Array/;
	await t.throwsAsync(subprocess, {message});
};

const lastInputGenerator = (input, objectMode) => [foobarUint8Array, getOutputGenerator(input, objectMode)];
const inputGenerator = (input, objectMode) => [...lastInputGenerator(input, objectMode), serializeGenerator];

test('Generators with result.stdin cannot return an object if not in objectMode', testGeneratorReturn, 0, inputGenerator(foobarObject, false), 'stdin-fd.js', false);
test('Generators with result.stdio[*] as input cannot return an object if not in objectMode', testGeneratorReturn, 3, inputGenerator(foobarObject, false), 'stdin-fd.js', false);
test('The last generator with result.stdin cannot return an object even in objectMode', testGeneratorReturn, 0, lastInputGenerator(foobarObject, true), 'stdin-fd.js', false);
test('The last generator with result.stdio[*] as input cannot return an object even in objectMode', testGeneratorReturn, 3, lastInputGenerator(foobarObject, true), 'stdin-fd.js', false);
test('Generators with result.stdout cannot return an object if not in objectMode', testGeneratorReturn, 1, getOutputGenerator(foobarObject, false), 'noop-fd.js', false);
test('Generators with result.stderr cannot return an object if not in objectMode', testGeneratorReturn, 2, getOutputGenerator(foobarObject, false), 'noop-fd.js', false);
test('Generators with result.stdio[*] as output cannot return an object if not in objectMode', testGeneratorReturn, 3, getOutputGenerator(foobarObject, false), 'noop-fd.js', false);
test('Generators with result.stdin cannot return null if not in objectMode', testGeneratorReturn, 0, inputGenerator(null, false), 'stdin-fd.js', true);
test('Generators with result.stdin cannot return null if in objectMode', testGeneratorReturn, 0, inputGenerator(null, true), 'stdin-fd.js', true);
test('Generators with result.stdout cannot return null if not in objectMode', testGeneratorReturn, 1, getOutputGenerator(null, false), 'noop-fd.js', true);
test('Generators with result.stdout cannot return null if in objectMode', testGeneratorReturn, 1, getOutputGenerator(null, true), 'noop-fd.js', true);
test('Generators with result.stdin cannot return undefined if not in objectMode', testGeneratorReturn, 0, inputGenerator(undefined, false), 'stdin-fd.js', true);
test('Generators with result.stdin cannot return undefined if in objectMode', testGeneratorReturn, 0, inputGenerator(undefined, true), 'stdin-fd.js', true);
test('Generators with result.stdout cannot return undefined if not in objectMode', testGeneratorReturn, 1, getOutputGenerator(undefined, false), 'noop-fd.js', true);
test('Generators with result.stdout cannot return undefined if in objectMode', testGeneratorReturn, 1, getOutputGenerator(undefined, true), 'noop-fd.js', true);

test('Generators "final" return value is validated', async t => {
	const subprocess = execa('noop.js', {stdout: convertTransformToFinal(getOutputGenerator(null, true), true)});
	await t.throwsAsync(subprocess, {message: /not be called at all/});
});
