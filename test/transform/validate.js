import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarUint8Array, foobarObject} from '../helpers/input.js';
import {serializeGenerator, getOutputGenerator, convertTransformToFinal} from '../helpers/generator.js';

setFixtureDirectory();

const getMessage = input => input === null || input === undefined
	? 'not be called at all'
	: 'a string or an Uint8Array';

const lastInputGenerator = input => objectMode => [foobarUint8Array, getOutputGenerator(input)(objectMode)];
const inputGenerator = input => objectMode => [...lastInputGenerator(input)(objectMode), serializeGenerator(true)];

// eslint-disable-next-line max-params
const testGeneratorReturn = async (t, fdNumber, generator, input, objectMode, isInput) => {
	const fixtureName = isInput ? 'stdin-fd.js' : 'noop-fd.js';
	const {message} = await t.throwsAsync(execa(fixtureName, [`${fdNumber}`], getStdio(fdNumber, generator(input)(objectMode))));
	t.true(message.includes(getMessage(input)));
};

test('Generators with result.stdin cannot return an object if not in objectMode', testGeneratorReturn, 0, inputGenerator, foobarObject, false, true);
test('Generators with result.stdio[*] as input cannot return an object if not in objectMode', testGeneratorReturn, 3, inputGenerator, foobarObject, false, true);
test('The last generator with result.stdin cannot return an object even in objectMode', testGeneratorReturn, 0, lastInputGenerator, foobarObject, true, true);
test('The last generator with result.stdio[*] as input cannot return an object even in objectMode', testGeneratorReturn, 3, lastInputGenerator, foobarObject, true, true);
test('Generators with result.stdout cannot return an object if not in objectMode', testGeneratorReturn, 1, getOutputGenerator, foobarObject, false, false);
test('Generators with result.stderr cannot return an object if not in objectMode', testGeneratorReturn, 2, getOutputGenerator, foobarObject, false, false);
test('Generators with result.stdio[*] as output cannot return an object if not in objectMode', testGeneratorReturn, 3, getOutputGenerator, foobarObject, false, false);
test('Generators with result.stdin cannot return null if not in objectMode', testGeneratorReturn, 0, inputGenerator, null, false, true);
test('Generators with result.stdin cannot return null if in objectMode', testGeneratorReturn, 0, inputGenerator, null, true, true);
test('Generators with result.stdout cannot return null if not in objectMode', testGeneratorReturn, 1, getOutputGenerator, null, false, false);
test('Generators with result.stdout cannot return null if in objectMode', testGeneratorReturn, 1, getOutputGenerator, null, true, false);
test('Generators with result.stdin cannot return undefined if not in objectMode', testGeneratorReturn, 0, inputGenerator, undefined, false, true);
test('Generators with result.stdin cannot return undefined if in objectMode', testGeneratorReturn, 0, inputGenerator, undefined, true, true);
test('Generators with result.stdout cannot return undefined if not in objectMode', testGeneratorReturn, 1, getOutputGenerator, undefined, false, false);
test('Generators with result.stdout cannot return undefined if in objectMode', testGeneratorReturn, 1, getOutputGenerator, undefined, true, false);

// eslint-disable-next-line max-params
const testGeneratorReturnSync = (t, fdNumber, generator, input, objectMode, isInput) => {
	const fixtureName = isInput ? 'stdin-fd.js' : 'noop-fd.js';
	const {message} = t.throws(() => {
		execaSync(fixtureName, [`${fdNumber}`], getStdio(fdNumber, generator(input)(objectMode)));
	});
	t.true(message.includes(getMessage(input)));
};

test('Generators with result.stdin cannot return an object if not in objectMode, sync', testGeneratorReturnSync, 0, inputGenerator, foobarObject, false, true);
test('The last generator with result.stdin cannot return an object even in objectMode, sync', testGeneratorReturnSync, 0, lastInputGenerator, foobarObject, true, true);
test('Generators with result.stdout cannot return an object if not in objectMode, sync', testGeneratorReturnSync, 1, getOutputGenerator, foobarObject, false, false);
test('Generators with result.stderr cannot return an object if not in objectMode, sync', testGeneratorReturnSync, 2, getOutputGenerator, foobarObject, false, false);
test('Generators with result.stdio[*] as output cannot return an object if not in objectMode, sync', testGeneratorReturnSync, 3, getOutputGenerator, foobarObject, false, false);
test('Generators with result.stdin cannot return null if not in objectMode, sync', testGeneratorReturnSync, 0, inputGenerator, null, false, true);
test('Generators with result.stdin cannot return null if in objectMode, sync', testGeneratorReturnSync, 0, inputGenerator, null, true, true);
test('Generators with result.stdout cannot return null if not in objectMode, sync', testGeneratorReturnSync, 1, getOutputGenerator, null, false, false);
test('Generators with result.stdout cannot return null if in objectMode, sync', testGeneratorReturnSync, 1, getOutputGenerator, null, true, false);
test('Generators with result.stdin cannot return undefined if not in objectMode, sync', testGeneratorReturnSync, 0, inputGenerator, undefined, false, true);
test('Generators with result.stdin cannot return undefined if in objectMode, sync', testGeneratorReturnSync, 0, inputGenerator, undefined, true, true);
test('Generators with result.stdout cannot return undefined if not in objectMode, sync', testGeneratorReturnSync, 1, getOutputGenerator, undefined, false, false);
test('Generators with result.stdout cannot return undefined if in objectMode, sync', testGeneratorReturnSync, 1, getOutputGenerator, undefined, true, false);

test('Generators "final" return value is validated', async t => {
	await t.throwsAsync(
		execa('noop.js', {stdout: convertTransformToFinal(getOutputGenerator(null)(true), true)}),
		{message: /not be called at all/},
	);
});

test('Generators "final" return value is validated, sync', t => {
	t.throws(() => {
		execaSync('noop.js', {stdout: convertTransformToFinal(getOutputGenerator(null)(true), true)});
	}, {message: /not be called at all/});
});
