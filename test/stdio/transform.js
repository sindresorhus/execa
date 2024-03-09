import {Buffer} from 'node:buffer';
import {once} from 'node:events';
import {setTimeout, scheduler} from 'node:timers/promises';
import {getDefaultHighWaterMark} from 'node:stream';
import test from 'ava';
import {getStreamAsArray} from 'get-stream';
import {execa} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {
	noopGenerator,
	getOutputsGenerator,
	getOutputGenerator,
	infiniteGenerator,
	outputObjectGenerator,
	convertTransformToFinal,
	noYieldGenerator,
} from '../helpers/generator.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const testGeneratorFinal = async (t, fixtureName) => {
	const {stdout} = await execa(fixtureName, {stdout: convertTransformToFinal(getOutputGenerator(foobarString), true)});
	t.is(stdout, foobarString);
};

test('Generators "final" can be used', testGeneratorFinal, 'noop.js');
test('Generators "final" is used even on empty streams', testGeneratorFinal, 'empty.js');

const repeatCount = getDefaultHighWaterMark() * 3;

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
			...(objectMode ? [outputObjectGenerator] : []),
			writerGenerator,
			...(passThrough ? [noopGenerator(false, binary)] : []),
			{transform: getLengthGenerator.bind(undefined, t), binary: true, objectMode: true},
		],
	});
	t.is(stdout.length, repeatCount);
	t.true(stdout.every(chunk => chunk.toString() === '\n'));
};

test('Synchronous yields are not buffered, no passThrough', testHighWaterMark, false, false, false);
test('Synchronous yields are not buffered, line-wise passThrough', testHighWaterMark, true, false, false);
test('Synchronous yields are not buffered, binary passThrough', testHighWaterMark, true, true, false);
test('Synchronous yields are not buffered, objectMode as input but not output', testHighWaterMark, false, false, true);

const testNoYield = async (t, objectMode, final, output) => {
	const {stdout} = await execa('noop.js', {stdout: convertTransformToFinal(noYieldGenerator(objectMode), final)});
	t.deepEqual(stdout, output);
};

test('Generator can filter "transform" by not calling yield', testNoYield, false, false, '');
test('Generator can filter "transform" by not calling yield, objectMode', testNoYield, true, false, []);
test('Generator can filter "final" by not calling yield', testNoYield, false, false, '');
test('Generator can filter "final" by not calling yield, objectMode', testNoYield, true, false, []);

const prefix = '> ';
const suffix = ' <';

const multipleYieldGenerator = async function * (line = foobarString) {
	yield prefix;
	await scheduler.yield();
	yield line;
	await scheduler.yield();
	yield suffix;
};

const testMultipleYields = async (t, final) => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: convertTransformToFinal(multipleYieldGenerator, final)});
	t.is(stdout, `${prefix}${foobarString}${suffix}`);
};

test('Generator can yield "transform" multiple times at different moments', testMultipleYields, false);
test('Generator can yield "final" multiple times at different moments', testMultipleYields, true);

const partsPerChunk = 4;
const chunksPerCall = 10;
const callCount = 5;
const fullString = '\n'.repeat(getDefaultHighWaterMark(false) / partsPerChunk);

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
	const subprocess = execa('noop.js', {stdout: convertTransformToFinal(manyYieldGenerator, final), buffer: false});
	const [chunks] = await Promise.all([getStreamAsArray(subprocess.stdout), subprocess]);
	const expectedChunk = Buffer.alloc(getDefaultHighWaterMark(false) * chunksPerCall).fill('\n');
	t.deepEqual(chunks, Array.from({length: callCount}).fill(expectedChunk));
};

test('Generator "transform" yields are sent right away', testManyYields, false);
test('Generator "final" yields are sent right away', testManyYields, true);

const maxBuffer = 10;

test('Generators take "maxBuffer" into account', async t => {
	const bigString = '.'.repeat(maxBuffer);
	const {stdout} = await execa('noop.js', {maxBuffer, stdout: getOutputGenerator(bigString, false)});
	t.is(stdout, bigString);

	await t.throwsAsync(execa('noop.js', {maxBuffer, stdout: getOutputGenerator(`${bigString}.`, false)}));
});

test('Generators take "maxBuffer" into account, objectMode', async t => {
	const bigArray = Array.from({length: maxBuffer}).fill('.');
	const {stdout} = await execa('noop.js', {maxBuffer, stdout: getOutputsGenerator(bigArray, true)});
	t.is(stdout.length, maxBuffer);

	await t.throwsAsync(execa('noop.js', {maxBuffer, stdout: getOutputsGenerator([...bigArray, ''], true)}));
});

const timeoutGenerator = async function * (timeout) {
	await setTimeout(timeout);
	yield foobarString;
};

const testAsyncGenerators = async (t, final) => {
	const {stdout} = await execa('noop.js', {
		maxBuffer,
		stdout: convertTransformToFinal(timeoutGenerator.bind(undefined, 1e2), final),
	});
	t.is(stdout, foobarString);
};

test('Generators "transform" is awaited on success', testAsyncGenerators, false);
test('Generators "final" is awaited on success', testAsyncGenerators, true);

// eslint-disable-next-line require-yield
const throwingGenerator = function * () {
	throw new Error('Generator error');
};

const GENERATOR_ERROR_REGEXP = /Generator error/;

const testThrowingGenerator = async (t, final) => {
	await t.throwsAsync(
		execa('noop-fd.js', ['1', foobarString], {stdout: convertTransformToFinal(throwingGenerator, final)}),
		{message: GENERATOR_ERROR_REGEXP},
	);
};

test('Generators "transform" errors make subprocess fail', testThrowingGenerator, false);
test('Generators "final" errors make subprocess fail', testThrowingGenerator, true);

test('Generators errors make subprocess fail even when other output generators do not throw', async t => {
	await t.throwsAsync(
		execa('noop-fd.js', ['1', foobarString], {stdout: [noopGenerator(false), throwingGenerator, noopGenerator(false)]}),
		{message: GENERATOR_ERROR_REGEXP},
	);
});

test('Generators errors make subprocess fail even when other input generators do not throw', async t => {
	const subprocess = execa('stdin-fd.js', ['0'], {stdin: [noopGenerator(false), throwingGenerator, noopGenerator(false)]});
	subprocess.stdin.write('foobar\n');
	await t.throwsAsync(subprocess, {message: GENERATOR_ERROR_REGEXP});
});

const testGeneratorCancel = async (t, error) => {
	const subprocess = execa('noop.js', {stdout: infiniteGenerator});
	await once(subprocess.stdout, 'data');
	subprocess.stdout.destroy(error);
	await (error === undefined ? t.notThrowsAsync(subprocess) : t.throwsAsync(subprocess));
};

test('Running generators are canceled on subprocess abort', testGeneratorCancel, undefined);
test('Running generators are canceled on subprocess error', testGeneratorCancel, new Error('test'));

const testGeneratorDestroy = async (t, transform) => {
	const subprocess = execa('forever.js', {stdout: transform});
	const error = new Error('test');
	subprocess.stdout.destroy(error);
	subprocess.kill();
	t.is(await t.throwsAsync(subprocess), error);
};

test('Generators are destroyed on subprocess error, sync', testGeneratorDestroy, noopGenerator(false));
test('Generators are destroyed on subprocess error, async', testGeneratorDestroy, infiniteGenerator);

test('Generators are destroyed on early subprocess exit', async t => {
	await t.throwsAsync(execa('noop.js', {stdout: infiniteGenerator, uid: -1}));
});
