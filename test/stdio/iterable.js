import {once} from 'node:events';
import {setImmediate} from 'node:timers/promises';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarObject, foobarObjectString, foobarArray} from '../helpers/input.js';
import {serializeGenerator, infiniteGenerator, throwingGenerator} from '../helpers/generator.js';

const stringGenerator = function * () {
	yield * foobarArray;
};

const textEncoder = new TextEncoder();
const binaryFoo = textEncoder.encode('foo');
const binaryBar = textEncoder.encode('bar');
const binaryArray = [binaryFoo, binaryBar];

const binaryGenerator = function * () {
	yield * binaryArray;
};

const mixedArray = [foobarArray[0], binaryArray[1]];

const mixedGenerator = function * () {
	yield * mixedArray;
};

const asyncGenerator = async function * () {
	await setImmediate();
	yield * foobarArray;
};

setFixtureDir();

const testIterable = async (t, stdioOption, fdNumber, execaMethod) => {
	const {stdout} = await execaMethod('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, stdioOption));
	t.is(stdout, 'foobar');
};

test.serial('stdin option can be an array of strings', testIterable, [foobarArray], 0, execa);
test.serial('stdin option can be an array of strings - sync', testIterable, [foobarArray], 0, execaSync);
test.serial('stdio[*] option can be an array of strings', testIterable, [foobarArray], 3, execa);
test.serial('stdin option can be an array of Uint8Arrays', testIterable, [binaryArray], 0, execa);
test.serial('stdin option can be an array of Uint8Arrays - sync', testIterable, [binaryArray], 0, execaSync);
test.serial('stdio[*] option can be an array of Uint8Arrays', testIterable, [binaryArray], 3, execa);
test.serial('stdin option can be an iterable of strings', testIterable, stringGenerator(), 0, execa);
test.serial('stdin option can be an iterable of strings - sync', testIterable, stringGenerator(), 0, execaSync);
test.serial('stdio[*] option can be an iterable of strings', testIterable, stringGenerator(), 3, execa);
test.serial('stdin option can be an iterable of Uint8Arrays', testIterable, binaryGenerator(), 0, execa);
test.serial('stdin option can be an iterable of Uint8Arrays - sync', testIterable, binaryGenerator(), 0, execaSync);
test.serial('stdio[*] option can be an iterable of Uint8Arrays', testIterable, binaryGenerator(), 3, execa);
test.serial('stdin option can be an iterable of strings + Uint8Arrays', testIterable, mixedGenerator(), 0, execa);
test.serial('stdin option can be an iterable of strings + Uint8Arrays - sync', testIterable, mixedGenerator(), 0, execaSync);
test.serial('stdio[*] option can be an iterable of strings + Uint8Arrays', testIterable, mixedGenerator(), 3, execa);
test.serial('stdin option can be an async iterable', testIterable, asyncGenerator(), 0, execa);
test.serial('stdio[*] option can be an async iterable', testIterable, asyncGenerator(), 3, execa);

const foobarObjectGenerator = function * () {
	yield foobarObject;
};

const foobarAsyncObjectGenerator = async function * () {
	yield foobarObject;
};

const testObjectIterable = async (t, stdioOption, fdNumber) => {
	const {stdout} = await execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [stdioOption, serializeGenerator(true)]));
	t.is(stdout, foobarObjectString);
};

test('stdin option can be an array of objects', testObjectIterable, [foobarObject], 0);
test('stdio[*] option can be an array of objects', testObjectIterable, [foobarObject], 3);
test('stdin option can be an iterable of objects', testObjectIterable, foobarObjectGenerator(), 0);
test('stdio[*] option can be an iterable of objects', testObjectIterable, foobarObjectGenerator(), 3);
test('stdin option can be an async iterable of objects', testObjectIterable, foobarAsyncObjectGenerator(), 0);
test('stdio[*] option can be an async iterable of objects', testObjectIterable, foobarAsyncObjectGenerator(), 3);

const testIterableSync = (t, stdioOption, fdNumber) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(fdNumber, stdioOption));
	}, {message: /an iterable with synchronous methods/});
};

test('stdio[*] option cannot be an array of strings - sync', testIterableSync, [foobarArray], 3);
test('stdio[*] option cannot be an array of Uint8Arrays - sync', testIterableSync, [binaryArray], 3);
test('stdio[*] option cannot be an array of objects - sync', testIterableSync, [[foobarObject]], 3);
test('stdio[*] option cannot be an iterable of strings - sync', testIterableSync, stringGenerator(), 3);
test('stdio[*] option cannot be an iterable of Uint8Arrays - sync', testIterableSync, binaryGenerator(), 3);
test('stdio[*] option cannot be an iterable of objects - sync', testIterableSync, foobarObjectGenerator(), 3);
test('stdio[*] option cannot be multiple iterables - sync', testIterableSync, [stringGenerator(), stringGenerator()], 3);

const testIterableObjectSync = (t, stdioOption, fdNumber) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(fdNumber, stdioOption));
	}, {message: /only strings or Uint8Arrays/});
};

test('stdin option cannot be an array of objects - sync', testIterableObjectSync, [[foobarObject]], 0);
test('stdin option cannot be an iterable of objects - sync', testIterableObjectSync, foobarObjectGenerator(), 0);

const testAsyncIterableSync = (t, stdioOption, fdNumber) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(fdNumber, stdioOption));
	}, {message: /an async iterable with synchronous method/});
};

test('stdin option cannot be an async iterable - sync', testAsyncIterableSync, asyncGenerator(), 0);
test('stdio[*] option cannot be an async iterable - sync', testAsyncIterableSync, asyncGenerator(), 3);
test('stdin option cannot be an async iterable of objects - sync', testAsyncIterableSync, foobarAsyncObjectGenerator(), 0);
test('stdio[*] option cannot be an async iterable of objects - sync', testAsyncIterableSync, foobarAsyncObjectGenerator(), 3);

const testIterableError = async (t, fdNumber, execaMethod) => {
	const {originalMessage} = await t.throwsAsync(execaMethod('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, throwingGenerator().transform())));
	t.is(originalMessage, 'Generator error');
};

test('stdin option handles errors in iterables', testIterableError, 0, execa);
test('stdio[*] option handles errors in iterables', testIterableError, 3, execa);

const testIterableErrorSync = (t, fdNumber, execaMethod) => {
	t.throws(() => {
		execaMethod('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, throwingGenerator().transform()));
	}, {message: 'Generator error'});
};

test('stdin option handles errors in iterables - sync', testIterableErrorSync, 0, execaSync);
test('stdio[*] option handles errors in iterables - sync', testIterableErrorSync, 3, execaSync);

const testNoIterableOutput = (t, stdioOption, fdNumber, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(fdNumber, stdioOption));
	}, {message: /cannot be an iterable/});
};

test('stdout option cannot be an array of strings', testNoIterableOutput, [foobarArray], 1, execa);
test('stderr option cannot be an array of strings', testNoIterableOutput, [foobarArray], 2, execa);
test('stdout option cannot be an array of strings - sync', testNoIterableOutput, [foobarArray], 1, execaSync);
test('stderr option cannot be an array of strings - sync', testNoIterableOutput, [foobarArray], 2, execaSync);
test('stdout option cannot be an iterable', testNoIterableOutput, stringGenerator(), 1, execa);
test('stderr option cannot be an iterable', testNoIterableOutput, stringGenerator(), 2, execa);
test('stdout option cannot be an iterable - sync', testNoIterableOutput, stringGenerator(), 1, execaSync);
test('stderr option cannot be an iterable - sync', testNoIterableOutput, stringGenerator(), 2, execaSync);

test('stdin option can be an infinite iterable', async t => {
	const iterable = infiniteGenerator().transform();
	const subprocess = execa('stdin.js', getStdio(0, iterable));
	await once(subprocess.stdout, 'data');
	subprocess.kill();
	const {stdout} = await t.throwsAsync(subprocess);
	t.true(stdout.startsWith('foo'));
	t.deepEqual(await iterable.next(), {value: undefined, done: true});
});

const testMultipleIterable = async (t, stdioOption, fdNumber, execaMethod) => {
	const {stdout} = await execaMethod('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, stdioOption));
	const expectedOutputs = [
		`${foobarArray[0]}${foobarArray[1]}${foobarArray[0]}${foobarArray[1]}`,
		`${foobarArray[0]}${foobarArray[0]}${foobarArray[1]}${foobarArray[1]}`,
	];
	t.true(expectedOutputs.includes(stdout));
};

test('stdin option can be multiple iterables', testMultipleIterable, [stringGenerator(), stringGenerator()], 0, execa);
test('stdio[*] option can be multiple iterables', testMultipleIterable, [stringGenerator(), stringGenerator()], 3, execa);
test('stdin option can be multiple iterables - sync', testMultipleIterable, [stringGenerator(), stringGenerator()], 0, execaSync);
test('stdin option can be multiple mixed iterables', testMultipleIterable, [stringGenerator(), binaryGenerator()], 0, execa);
test('stdio[*] option can be multiple mixed iterables', testMultipleIterable, [stringGenerator(), binaryGenerator()], 3, execa);
test('stdin option can be multiple mixed iterables - sync', testMultipleIterable, [stringGenerator(), binaryGenerator()], 0, execaSync);
test('stdin option can be sync/async mixed iterables', testMultipleIterable, [stringGenerator(), asyncGenerator()], 0, execa);
test('stdio[*] option can be sync/async mixed iterables', testMultipleIterable, [stringGenerator(), asyncGenerator()], 3, execa);

test('stdin option iterable is canceled on subprocess error', async t => {
	const iterable = infiniteGenerator().transform();
	await t.throwsAsync(execa('stdin.js', {stdin: iterable, timeout: 1}), {message: /timed out/});
	// eslint-disable-next-line no-unused-vars, no-empty
	for await (const _ of iterable) {}
});
