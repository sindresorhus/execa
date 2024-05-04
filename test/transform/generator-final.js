import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {getOutputAsyncGenerator, getOutputGenerator, convertTransformToFinal} from '../helpers/generator.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const testGeneratorFinal = async (t, fixtureName, execaMethod) => {
	const {stdout} = await execaMethod(fixtureName, {stdout: convertTransformToFinal(getOutputGenerator(foobarString)(), true)});
	t.is(stdout, foobarString);
};

test('Generators "final" can be used', testGeneratorFinal, 'noop.js', execa);
test('Generators "final" is used even on empty streams', testGeneratorFinal, 'empty.js', execa);
test('Generators "final" can be used, sync', testGeneratorFinal, 'noop.js', execaSync);
test('Generators "final" is used even on empty streams, sync', testGeneratorFinal, 'empty.js', execaSync);

const testFinalAlone = async (t, final, execaMethod) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', '.'], {stdout: {final: final(foobarString)().transform}});
	t.is(stdout, `.\n${foobarString}`);
};

test('Generators "final" can be used without "transform"', testFinalAlone, getOutputGenerator, execa);
test('Generators "final" can be used without "transform", sync', testFinalAlone, getOutputGenerator, execaSync);
test('Generators "final" can be used without "transform", async', testFinalAlone, getOutputAsyncGenerator, execa);

const testFinalNoOutput = async (t, final, execaMethod) => {
	const {stdout} = await execaMethod('empty.js', {stdout: {final: final(foobarString)().transform}});
	t.is(stdout, foobarString);
};

test('Generators "final" can be used without "transform" nor output', testFinalNoOutput, getOutputGenerator, execa);
test('Generators "final" can be used without "transform" nor output, sync', testFinalNoOutput, getOutputGenerator, execaSync);
test('Generators "final" can be used without "transform" nor output, async', testFinalNoOutput, getOutputAsyncGenerator, execa);
