import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString, foobarUppercase, foobarUint8Array} from '../helpers/input.js';
import {casedSuffix} from '../helpers/generator.js';
import {generatorsMap} from '../helpers/map.js';

setFixtureDir();

const testAppendInput = async (t, reversed, type, execaMethod) => {
	const stdin = [foobarUint8Array, generatorsMap[type].uppercase(), generatorsMap[type].append()];
	const reversedStdin = reversed ? stdin.reverse() : stdin;
	const {stdout} = await execaMethod('stdin-fd.js', ['0'], {stdin: reversedStdin});
	const reversedSuffix = reversed ? casedSuffix.toUpperCase() : casedSuffix;
	t.is(stdout, `${foobarUppercase}${reversedSuffix}`);
};

test('Can use multiple generators as input', testAppendInput, false, 'generator', execa);
test('Can use multiple generators as input, reversed', testAppendInput, true, 'generator', execa);
test('Can use multiple generators as input, sync', testAppendInput, false, 'generator', execaSync);
test('Can use multiple generators as input, reversed, sync', testAppendInput, true, 'generator', execaSync);
test('Can use multiple duplexes as input', testAppendInput, false, 'duplex', execa);
test('Can use multiple duplexes as input, reversed', testAppendInput, true, 'duplex', execa);
test('Can use multiple webTransforms as input', testAppendInput, false, 'webTransform', execa);
test('Can use multiple webTransforms as input, reversed', testAppendInput, true, 'webTransform', execa);

const testAppendOutput = async (t, reversed, type, execaMethod) => {
	const stdoutOption = [generatorsMap[type].uppercase(), generatorsMap[type].append()];
	const reversedStdoutOption = reversed ? stdoutOption.reverse() : stdoutOption;
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {stdout: reversedStdoutOption});
	const reversedSuffix = reversed ? casedSuffix.toUpperCase() : casedSuffix;
	t.is(stdout, `${foobarUppercase}${reversedSuffix}`);
};

test('Can use multiple generators as output', testAppendOutput, false, 'generator', execa);
test('Can use multiple generators as output, reversed', testAppendOutput, true, 'generator', execa);
test('Can use multiple generators as output, sync', testAppendOutput, false, 'generator', execaSync);
test('Can use multiple generators as output, reversed, sync', testAppendOutput, true, 'generator', execaSync);
test('Can use multiple duplexes as output', testAppendOutput, false, 'duplex', execa);
test('Can use multiple duplexes as output, reversed', testAppendOutput, true, 'duplex', execa);
test('Can use multiple webTransforms as output', testAppendOutput, false, 'webTransform', execa);
test('Can use multiple webTransforms as output, reversed', testAppendOutput, true, 'webTransform', execa);

const testGeneratorSyntax = async (t, type, usePlainObject, execaMethod) => {
	const transform = generatorsMap[type].uppercase();
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {stdout: usePlainObject ? transform : transform.transform});
	t.is(stdout, foobarUppercase);
};

test('Can pass generators with an options plain object', testGeneratorSyntax, 'generator', false, execa);
test('Can pass generators without an options plain object', testGeneratorSyntax, 'generator', true, execa);
test('Can pass generators with an options plain object, sync', testGeneratorSyntax, 'generator', false, execaSync);
test('Can pass generators without an options plain object, sync', testGeneratorSyntax, 'generator', true, execaSync);
test('Can pass webTransforms with an options plain object', testGeneratorSyntax, 'webTransform', true, execa);
test('Can pass webTransforms without an options plain object', testGeneratorSyntax, 'webTransform', false, execa);
