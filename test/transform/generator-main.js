import {Buffer} from 'node:buffer';
import {scheduler} from 'node:timers/promises';
import test from 'ava';
import {getStreamAsArray} from 'get-stream';
import {execa, execaSync} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {
	noopGenerator,
	outputObjectGenerator,
	convertTransformToFinal,
	prefix,
	suffix,
} from '../helpers/generator.js';
import {generatorsMap} from '../helpers/map.js';
import {defaultHighWaterMark} from '../helpers/stream.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {maxBuffer, assertErrorMessage} from '../helpers/max-buffer.js';

setFixtureDirectory();

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
