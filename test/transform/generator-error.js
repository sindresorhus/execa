import {once} from 'node:events';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {noopGenerator, infiniteGenerator, convertTransformToFinal} from '../helpers/generator.js';
import {generatorsMap} from '../helpers/map.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const assertProcessError = async (t, type, execaMethod, getSubprocess) => {
	const cause = new Error(foobarString);
	const transform = generatorsMap[type].throwing(cause)();
	const error = execaMethod === execa
		? await t.throwsAsync(getSubprocess(transform))
		: t.throws(() => {
			getSubprocess(transform);
		});
	t.is(error.cause, cause);
};

const testThrowingGenerator = async (t, type, final, execaMethod) => {
	await assertProcessError(t, type, execaMethod, transform => execaMethod('noop.js', {
		stdout: convertTransformToFinal(transform, final),
	}));
};

test('Generators "transform" errors make subprocess fail', testThrowingGenerator, 'generator', false, execa);
test('Generators "final" errors make subprocess fail', testThrowingGenerator, 'generator', true, execa);
test('Generators "transform" errors make subprocess fail, sync', testThrowingGenerator, 'generator', false, execaSync);
test('Generators "final" errors make subprocess fail, sync', testThrowingGenerator, 'generator', true, execaSync);
test('Duplexes "transform" errors make subprocess fail', testThrowingGenerator, 'duplex', false, execa);
test('WebTransform "transform" errors make subprocess fail', testThrowingGenerator, 'webTransform', false, execa);

const testSingleErrorOutput = async (t, type, execaMethod) => {
	await assertProcessError(t, type, execaMethod, transform => execaMethod('noop.js', {
		stdout: [
			generatorsMap[type].noop(false),
			transform,
			generatorsMap[type].noop(false),
		],
	}));
};

test('Generators errors make subprocess fail even when other output generators do not throw', testSingleErrorOutput, 'generator', execa);
test('Generators errors make subprocess fail even when other output generators do not throw, sync', testSingleErrorOutput, 'generator', execaSync);
test('Duplexes errors make subprocess fail even when other output generators do not throw', testSingleErrorOutput, 'duplex', execa);
test('WebTransform errors make subprocess fail even when other output generators do not throw', testSingleErrorOutput, 'webTransform', execa);

const testSingleErrorInput = async (t, type, execaMethod) => {
	await assertProcessError(t, type, execaMethod, transform => execaMethod('stdin.js', {
		stdin: [
			['foobar\n'],
			generatorsMap[type].noop(false),
			transform,
			generatorsMap[type].noop(false),
		],
	}));
};

test('Generators errors make subprocess fail even when other input generators do not throw', testSingleErrorInput, 'generator', execa);
test('Generators errors make subprocess fail even when other input generators do not throw, sync', testSingleErrorInput, 'generator', execaSync);
test('Duplexes errors make subprocess fail even when other input generators do not throw', testSingleErrorInput, 'duplex', execa);
test('WebTransform errors make subprocess fail even when other input generators do not throw', testSingleErrorInput, 'webTransform', execa);

const testGeneratorCancel = async (t, error) => {
	const subprocess = execa('noop.js', {stdout: infiniteGenerator()});
	await once(subprocess.stdout, 'data');
	subprocess.stdout.destroy(error);
	await (error === undefined ? t.notThrowsAsync(subprocess) : t.throwsAsync(subprocess));
};

test('Running generators are canceled on subprocess abort', testGeneratorCancel, undefined);
test('Running generators are canceled on subprocess error', testGeneratorCancel, new Error('test'));

const testGeneratorDestroy = async (t, transform) => {
	const subprocess = execa('forever.js', {stdout: transform});
	const cause = new Error('test');
	subprocess.stdout.destroy(cause);
	subprocess.kill();
	t.like(await t.throwsAsync(subprocess), {cause});
};

test('Generators are destroyed on subprocess error, sync', testGeneratorDestroy, noopGenerator(false));
test('Generators are destroyed on subprocess error, async', testGeneratorDestroy, infiniteGenerator());

test('Generators are destroyed on early subprocess exit', async t => {
	await t.throwsAsync(execa('noop.js', {stdout: infiniteGenerator(), uid: -1}));
});
