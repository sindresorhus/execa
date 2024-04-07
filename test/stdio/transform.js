import {Buffer} from 'node:buffer';
import {once} from 'node:events';
import {scheduler} from 'node:timers/promises';
import test from 'ava';
import {getStreamAsArray} from 'get-stream';
import {execa, execaSync} from '../../index.js';
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
} from '../helpers/generator.js';
import {generatorsMap} from '../helpers/map.js';
import {defaultHighWaterMark} from '../helpers/stream.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {maxBuffer, assertErrorMessage} from '../helpers/max-buffer.js';

setFixtureDir();

const testGeneratorFinal = async (t, fixtureName, execaMethod) => {
	const {stdout} = await execaMethod(fixtureName, {stdout: convertTransformToFinal(getOutputGenerator(foobarString)(), true)});
	t.is(stdout, foobarString);
};

test('Generators "final" can be used', testGeneratorFinal, 'noop.js', execa);
test('Generators "final" is used even on empty streams', testGeneratorFinal, 'empty.js', execa);
test('Generators "final" can be used, sync', testGeneratorFinal, 'noop.js', execaSync);
test('Generators "final" is used even on empty streams, sync', testGeneratorFinal, 'empty.js', execaSync);

const testFinalAlone = async (t, final, execaMethod) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', '.'], {stdout: {final: final(foobarString)().transform, binary: true}});
	t.is(stdout, `.${foobarString}`);
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

// eslint-disable-next-line max-params
const testHighWaterMark = async (t, passThrough, binary, objectMode, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
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

test('Synchronous yields are not buffered, no passThrough', testHighWaterMark, false, false, false, execa);
test('Synchronous yields are not buffered, line-wise passThrough', testHighWaterMark, true, false, false, execa);
test('Synchronous yields are not buffered, binary passThrough', testHighWaterMark, true, true, false, execa);
test('Synchronous yields are not buffered, objectMode as input but not output', testHighWaterMark, false, false, true, execa);
test('Synchronous yields are not buffered, no passThrough, sync', testHighWaterMark, false, false, false, execaSync);
test('Synchronous yields are not buffered, line-wise passThrough, sync', testHighWaterMark, true, false, false, execaSync);
test('Synchronous yields are not buffered, binary passThrough, sync', testHighWaterMark, true, true, false, execaSync);
test('Synchronous yields are not buffered, objectMode as input but not output, sync', testHighWaterMark, false, false, true, execaSync);

// eslint-disable-next-line max-params
const testNoYield = async (t, type, objectMode, final, output, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {stdout: convertTransformToFinal(generatorsMap[type].noYield(objectMode), final)});
	t.deepEqual(stdout, output);
};

test('Generator can filter "transform" by not calling yield', testNoYield, 'generator', false, false, '', execa);
test('Generator can filter "transform" by not calling yield, objectMode', testNoYield, 'generator', true, false, [], execa);
test('Generator can filter "final" by not calling yield', testNoYield, 'generator', false, true, '', execa);
test('Generator can filter "final" by not calling yield, objectMode', testNoYield, 'generator', true, true, [], execa);
test('Generator can filter "transform" by not calling yield, sync', testNoYield, 'generator', false, false, '', execaSync);
test('Generator can filter "transform" by not calling yield, objectMode, sync', testNoYield, 'generator', true, false, [], execaSync);
test('Generator can filter "final" by not calling yield, sync', testNoYield, 'generator', false, true, '', execaSync);
test('Generator can filter "final" by not calling yield, objectMode, sync', testNoYield, 'generator', true, true, [], execaSync);
test('Duplex can filter by not calling push', testNoYield, 'duplex', false, false, '', execa);
test('Duplex can filter by not calling push, objectMode', testNoYield, 'duplex', true, false, [], execa);
test('WebTransform can filter by not calling push', testNoYield, 'webTransform', false, false, '', execa);
test('WebTransform can filter by not calling push, objectMode', testNoYield, 'webTransform', true, false, [], execa);

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

const testMaxBuffer = async (t, type) => {
	const bigString = '.'.repeat(maxBuffer);
	const {stdout} = await execa('noop.js', {
		maxBuffer,
		stdout: generatorsMap[type].getOutput(bigString)(false, true),
	});
	t.is(stdout, bigString);

	const {isMaxBuffer, shortMessage} = await t.throwsAsync(execa('noop.js', {
		maxBuffer,
		stdout: generatorsMap[type].getOutput(`${bigString}.`)(false, true),
	}));
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage);
};

test('Generators take "maxBuffer" into account', testMaxBuffer, 'generator');
test('Duplexes take "maxBuffer" into account', testMaxBuffer, 'duplex');
test('WebTransforms take "maxBuffer" into account', testMaxBuffer, 'webTransform');

test('Generators does not take "maxBuffer" into account, sync', t => {
	const bigString = '.'.repeat(maxBuffer);
	const {isMaxBuffer, stdout} = execaSync('noop.js', {
		maxBuffer,
		stdout: generatorsMap.generator.getOutput(`${bigString}.`)(false, true),
	});
	t.false(isMaxBuffer);
	t.is(stdout.length, maxBuffer + 1);
});

const testMaxBufferObject = async (t, type) => {
	const bigArray = Array.from({length: maxBuffer}).fill('..');
	const {stdout} = await execa('noop.js', {
		maxBuffer,
		stdout: generatorsMap[type].getOutputs(bigArray)(true, true),
	});
	t.is(stdout.length, maxBuffer);

	const {isMaxBuffer, shortMessage} = await t.throwsAsync(execa('noop.js', {
		maxBuffer,
		stdout: generatorsMap[type].getOutputs([...bigArray, ''])(true, true),
	}));
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage, {unit: 'objects'});
};

test('Generators take "maxBuffer" into account, objectMode', testMaxBufferObject, 'generator');
test('Duplexes take "maxBuffer" into account, objectMode', testMaxBufferObject, 'duplex');
test('WebTransforms take "maxBuffer" into account, objectMode', testMaxBufferObject, 'webTransform');

test('Generators does not take "maxBuffer" into account, objectMode, sync', t => {
	const bigArray = Array.from({length: maxBuffer}).fill('..');
	const {isMaxBuffer, stdout} = execaSync('noop.js', {
		maxBuffer,
		stdout: generatorsMap.generator.getOutputs([...bigArray, ''])(true, true),
	});
	t.false(isMaxBuffer);
	t.is(stdout.length, maxBuffer + 1);
});

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
