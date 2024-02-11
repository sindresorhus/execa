import {once} from 'node:events';
import {setImmediate} from 'node:timers/promises';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarObject, foobarObjectString} from '../helpers/input.js';
import {serializeGenerator, infiniteGenerator} from '../helpers/generator.js';

const stringArray = ['foo', 'bar'];

const stringGenerator = function * () {
	yield * stringArray;
};

const textEncoder = new TextEncoder();
const binaryFoo = textEncoder.encode('foo');
const binaryBar = textEncoder.encode('bar');
const binaryArray = [binaryFoo, binaryBar];

const binaryGenerator = function * () {
	yield * binaryArray;
};

const asyncGenerator = async function * () {
	await setImmediate();
	yield * stringArray;
};

setFixtureDir();

const testIterable = async (t, stdioOption, index) => {
	const {stdout} = await execa('stdin-fd.js', [`${index}`], getStdio(index, stdioOption));
	t.is(stdout, 'foobar');
};

test.serial('stdin option can be an array of strings', testIterable, [stringArray], 0);
test.serial('stdio[*] option can be an array of strings', testIterable, [stringArray], 3);
test.serial('stdin option can be an array of Uint8Arrays', testIterable, [binaryArray], 0);
test.serial('stdio[*] option can be an array of Uint8Arrays', testIterable, [binaryArray], 3);
test.serial('stdin option can be an iterable of strings', testIterable, stringGenerator(), 0);
test.serial('stdio[*] option can be an iterable of strings', testIterable, stringGenerator(), 3);
test.serial('stdin option can be an iterable of Uint8Arrays', testIterable, binaryGenerator(), 0);
test.serial('stdio[*] option can be an iterable of Uint8Arrays', testIterable, binaryGenerator(), 3);
test.serial('stdin option can be an async iterable', testIterable, asyncGenerator(), 0);
test.serial('stdio[*] option can be an async iterable', testIterable, asyncGenerator(), 3);

const foobarObjectGenerator = function * () {
	yield foobarObject;
};

const foobarAsyncObjectGenerator = function * () {
	yield foobarObject;
};

const testObjectIterable = async (t, stdioOption, index) => {
	const {stdout} = await execa('stdin-fd.js', [`${index}`], getStdio(index, [stdioOption, serializeGenerator]));
	t.is(stdout, foobarObjectString);
};

test('stdin option can be an array of objects', testObjectIterable, [foobarObject], 0);
test('stdio[*] option can be an array of objects', testObjectIterable, [foobarObject], 3);
test('stdin option can be an iterable of objects', testObjectIterable, foobarObjectGenerator(), 0);
test('stdio[*] option can be an iterable of objects', testObjectIterable, foobarObjectGenerator(), 3);
test('stdin option can be an async iterable of objects', testObjectIterable, foobarAsyncObjectGenerator(), 0);
test('stdio[*] option can be an async iterable of objects', testObjectIterable, foobarAsyncObjectGenerator(), 3);

const testIterableSync = (t, stdioOption, index) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(index, stdioOption));
	}, {message: /an iterable in sync mode/});
};

test('stdin option cannot be an array of strings - sync', testIterableSync, [stringArray], 0);
test('stdio[*] option cannot be an array of strings - sync', testIterableSync, [stringArray], 3);
test('stdin option cannot be a sync iterable - sync', testIterableSync, stringGenerator(), 0);
test('stdio[*] option cannot be a sync iterable - sync', testIterableSync, stringGenerator(), 3);
test('stdin option cannot be an async iterable - sync', testIterableSync, asyncGenerator(), 0);
test('stdio[*] option cannot be an async iterable - sync', testIterableSync, asyncGenerator(), 3);

// eslint-disable-next-line require-yield
const throwingGenerator = function * () {
	throw new Error('generator error');
};

const testIterableError = async (t, index) => {
	const {originalMessage} = await t.throwsAsync(execa('stdin-fd.js', [`${index}`], getStdio(index, throwingGenerator())));
	t.is(originalMessage, 'generator error');
};

test('stdin option handles errors in iterables', testIterableError, 0);
test('stdio[*] option handles errors in iterables', testIterableError, 3);

const testNoIterableOutput = (t, stdioOption, index, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(index, stdioOption));
	}, {message: /cannot be an iterable/});
};

test('stdout option cannot be an array of strings', testNoIterableOutput, [stringArray], 1, execa);
test('stderr option cannot be an array of strings', testNoIterableOutput, [stringArray], 2, execa);
test('stdout option cannot be an array of strings - sync', testNoIterableOutput, [stringArray], 1, execaSync);
test('stderr option cannot be an array of strings - sync', testNoIterableOutput, [stringArray], 2, execaSync);
test('stdout option cannot be an iterable', testNoIterableOutput, stringGenerator(), 1, execa);
test('stderr option cannot be an iterable', testNoIterableOutput, stringGenerator(), 2, execa);
test('stdout option cannot be an iterable - sync', testNoIterableOutput, stringGenerator(), 1, execaSync);
test('stderr option cannot be an iterable - sync', testNoIterableOutput, stringGenerator(), 2, execaSync);

test('stdin option can be an infinite iterable', async t => {
	const iterable = infiniteGenerator();
	const childProcess = execa('stdin.js', getStdio(0, iterable));
	await once(childProcess.stdout, 'data');
	childProcess.kill();
	const {stdout} = await t.throwsAsync(childProcess);
	t.true(stdout.startsWith('foo'));
	t.deepEqual(await iterable.next(), {value: undefined, done: true});
});

const testMultipleIterable = async (t, index) => {
	const {stdout} = await execa('stdin-fd.js', [`${index}`], getStdio(index, [stringGenerator(), asyncGenerator()]));
	t.is(stdout, 'foobarfoobar');
};

test('stdin option can be multiple iterables', testMultipleIterable, 0);
test('stdio[*] option can be multiple iterables', testMultipleIterable, 3);

test('stdin option iterable is canceled on process error', async t => {
	const iterable = infiniteGenerator();
	await t.throwsAsync(execa('stdin.js', {stdin: iterable, timeout: 1}), {message: /timed out/});
	// eslint-disable-next-line no-unused-vars, no-empty
	for await (const _ of iterable) {}
});
