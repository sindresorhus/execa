import {Buffer} from 'node:buffer';
import {once} from 'node:events';
import {scheduler} from 'node:timers/promises';
import test from 'ava';
import {getStreamAsArray} from 'get-stream';
import {execa} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {
	noopGenerator,
	getOutputAsyncGenerator,
	getOutputGenerator,
	infiniteGenerator,
	outputObjectGenerator,
	convertTransformToFinal,
	prefix,
	suffix,
	GENERATOR_ERROR_REGEXP,
} from '../helpers/generator.js';
import {generatorsMap} from '../helpers/map.js';
import {defaultHighWaterMark} from '../helpers/stream.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const testGeneratorFinal = async (t, fixtureName) => {
	const {stdout} = await execa(fixtureName, {stdout: convertTransformToFinal(getOutputGenerator(foobarString)(), true)});
	t.is(stdout, foobarString);
};

test('Generators "final" can be used', testGeneratorFinal, 'noop.js');
test('Generators "final" is used even on empty streams', testGeneratorFinal, 'empty.js');

const testFinalAlone = async (t, final) => {
	const {stdout} = await execa('noop-fd.js', ['1', '.'], {stdout: {final: final(foobarString)().transform, binary: true}});
	t.is(stdout, `.${foobarString}`);
};

test('Generators "final" can be used without "transform"', testFinalAlone, getOutputGenerator);
test('Generators "final" can be used without "transform", async', testFinalAlone, getOutputAsyncGenerator);

const testFinalNoOutput = async (t, final) => {
	const {stdout} = await execa('empty.js', {stdout: {final: final(foobarString)().transform}});
	t.is(stdout, foobarString);
};

test('Generators "final" can be used without "transform" nor output', testFinalNoOutput, getOutputGenerator);
test('Generators "final" can be used without "transform" nor output, async', testFinalNoOutput, getOutputAsyncGenerator);

const repeatCount = defaultHighWaterMark * 3;

const writerGenerator = function * () {
	for (let index = 0; index < repeatCount; index += 1) {
		yield '\n';
	}
};

const getLengthGenerator = function * (t, chunk) {
	t.is(chunk.length, 1);
	yield chunk;
};

const testHighWaterMark = async (t, passThrough, binary, objectMode) => {
	const {stdout} = await execa('noop.js', {
		stdout: [
			...(objectMode ? [outputObjectGenerator()] : []),
			writerGenerator,
			...(passThrough ? [noopGenerator(false, binary)] : []),
			{transform: getLengthGenerator.bind(undefined, t), preserveNewlines: true, objectMode: true},
		],
	});
	t.is(stdout.length, repeatCount);
	t.true(stdout.every(chunk => chunk === '\n'));
};

test('Synchronous yields are not buffered, no passThrough', testHighWaterMark, false, false, false);
test('Synchronous yields are not buffered, line-wise passThrough', testHighWaterMark, true, false, false);
test('Synchronous yields are not buffered, binary passThrough', testHighWaterMark, true, true, false);
test('Synchronous yields are not buffered, objectMode as input but not output', testHighWaterMark, false, false, true);

// eslint-disable-next-line max-params
const testNoYield = async (t, type, objectMode, final, output) => {
	const {stdout} = await execa('noop.js', {stdout: convertTransformToFinal(generatorsMap[type].noYield(objectMode), final)});
	t.deepEqual(stdout, output);
};

test('Generator can filter "transform" by not calling yield', testNoYield, 'generator', false, false, '');
test('Generator can filter "transform" by not calling yield, objectMode', testNoYield, 'generator', true, false, []);
test('Generator can filter "final" by not calling yield', testNoYield, 'generator', false, true, '');
test('Generator can filter "final" by not calling yield, objectMode', testNoYield, 'generator', true, true, []);
test('Duplex can filter by not calling push', testNoYield, 'duplex', false, false, '');
test('Duplex can filter by not calling push, objectMode', testNoYield, 'duplex', true, false, []);
test('WebTransform can filter by not calling push', testNoYield, 'webTransform', false, false, '');
test('WebTransform can filter by not calling push, objectMode', testNoYield, 'webTransform', true, false, []);

const testMultipleYields = async (t, type, final, binary) => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: convertTransformToFinal(generatorsMap[type].multipleYield(), final)});
	const newline = binary ? '' : '\n';
	t.is(stdout, `${prefix}${newline}${foobarString}${newline}${suffix}`);
};

test('Generator can yield "transform" multiple times at different moments', testMultipleYields, 'generator', false, false);
test('Generator can yield "final" multiple times at different moments', testMultipleYields, 'generator', true, false);
test('Duplex can push multiple times at different moments', testMultipleYields, 'duplex', false, true);
test('WebTransform can push multiple times at different moments', testMultipleYields, 'webTransform', false, true);

const partsPerChunk = 4;
const chunksPerCall = 10;
const callCount = 5;
const fullString = '\n'.repeat(defaultHighWaterMark / partsPerChunk);

const yieldFullStrings = function * () {
	yield * Array.from({length: partsPerChunk * chunksPerCall}).fill(fullString);
};

const manyYieldGenerator = async function * () {
	for (let index = 0; index < callCount; index += 1) {
		yield * yieldFullStrings();
		// eslint-disable-next-line no-await-in-loop
		await scheduler.yield();
	}
};

const testManyYields = async (t, final) => {
	const subprocess = execa('noop.js', {stdout: convertTransformToFinal(manyYieldGenerator, final), stripFinalNewline: false});
	const [chunks, {stdout}] = await Promise.all([getStreamAsArray(subprocess.stdout), subprocess]);
	const expectedChunk = Buffer.from(fullString);
	t.deepEqual(chunks, Array.from({length: callCount * partsPerChunk * chunksPerCall}).fill(expectedChunk));
	t.is(chunks.join(''), stdout);
};

test('Generator "transform" yields are sent right away', testManyYields, false);
test('Generator "final" yields are sent right away', testManyYields, true);

const maxBuffer = 10;

const testMaxBuffer = async (t, type) => {
	const bigString = '.'.repeat(maxBuffer);
	const {stdout} = await execa('noop.js', {
		maxBuffer,
		stdout: generatorsMap[type].getOutput(bigString)(false, true),
	});
	t.is(stdout, bigString);

	await t.throwsAsync(execa('noop.js', {maxBuffer, stdout: generatorsMap[type].getOutput(`${bigString}.`)(false)}));
};

test('Generators take "maxBuffer" into account', testMaxBuffer, 'generator');
test('Duplexes take "maxBuffer" into account', testMaxBuffer, 'duplex');
test('WebTransforms take "maxBuffer" into account', testMaxBuffer, 'webTransform');

const testMaxBufferObject = async (t, type) => {
	const bigArray = Array.from({length: maxBuffer}).fill('.');
	const {stdout} = await execa('noop.js', {
		maxBuffer,
		stdout: generatorsMap[type].getOutputs(bigArray)(true, true),
	});
	t.is(stdout.length, maxBuffer);

	await t.throwsAsync(execa('noop.js', {maxBuffer, stdout: generatorsMap[type].getOutputs([...bigArray, ''])(true)}));
};

test('Generators take "maxBuffer" into account, objectMode', testMaxBufferObject, 'generator');
test('Duplexes take "maxBuffer" into account, objectMode', testMaxBufferObject, 'duplex');
test('WebTransforms take "maxBuffer" into account, objectMode', testMaxBufferObject, 'webTransform');

const testAsyncGenerators = async (t, type, final) => {
	const {stdout} = await execa('noop.js', {
		stdout: convertTransformToFinal(generatorsMap[type].timeout(1e2)(), final),
	});
	t.is(stdout, foobarString);
};

test('Generators "transform" is awaited on success', testAsyncGenerators, 'generator', false);
test('Generators "final" is awaited on success', testAsyncGenerators, 'generator', true);
test('Duplex is awaited on success', testAsyncGenerators, 'duplex', false);
test('WebTransform is awaited on success', testAsyncGenerators, 'webTransform', false);

const testThrowingGenerator = async (t, type, final) => {
	await t.throwsAsync(
		execa('noop-fd.js', ['1', foobarString], {stdout: convertTransformToFinal(generatorsMap[type].throwing(), final)}),
		{message: GENERATOR_ERROR_REGEXP},
	);
};

test('Generators "transform" errors make subprocess fail', testThrowingGenerator, 'generator', false);
test('Generators "final" errors make subprocess fail', testThrowingGenerator, 'generator', true);
test('Duplexes "transform" errors make subprocess fail', testThrowingGenerator, 'duplex', false);
test('WebTransform "transform" errors make subprocess fail', testThrowingGenerator, 'webTransform', false);

const testSingleErrorOutput = async (t, type) => {
	await t.throwsAsync(
		execa('noop-fd.js', ['1', foobarString], {stdout: [generatorsMap[type].noop(false), generatorsMap[type].throwing(), generatorsMap[type].noop(false)]}),
		{message: GENERATOR_ERROR_REGEXP},
	);
};

test('Generators errors make subprocess fail even when other output generators do not throw', testSingleErrorOutput, 'generator');
test('Duplexes errors make subprocess fail even when other output generators do not throw', testSingleErrorOutput, 'duplex');
test('WebTransform errors make subprocess fail even when other output generators do not throw', testSingleErrorOutput, 'webTransform');

const testSingleErrorInput = async (t, type) => {
	const subprocess = execa('stdin-fd.js', ['0'], {stdin: [generatorsMap[type].noop(false), generatorsMap[type].throwing(), generatorsMap[type].noop(false)]});
	subprocess.stdin.write('foobar\n');
	await t.throwsAsync(subprocess, {message: GENERATOR_ERROR_REGEXP});
};

test('Generators errors make subprocess fail even when other input generators do not throw', testSingleErrorInput, 'generator');
test('Duplexes errors make subprocess fail even when other input generators do not throw', testSingleErrorInput, 'duplex');
test('WebTransform errors make subprocess fail even when other input generators do not throw', testSingleErrorInput, 'webTransform');

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
