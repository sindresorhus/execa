import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {setImmediate} from 'node:timers/promises';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getStdio} from '../helpers/stdio.js';

setFixtureDirectory();

const testReadableStream = async fdNumber => {
	const readableStream = Readable.toWeb(Readable.from('foobar'));
	const {stdout} = await execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, readableStream));
	assert.equal(stdout, 'foobar');
};

test('stdin can be a ReadableStream', () => testReadableStream(0));
test('stdio[*] can be a ReadableStream', () => testReadableStream(3));

const testWritableStream = async fdNumber => {
	const result = [];
	const writableStream = new WritableStream({
		write(chunk) {
			result.push(chunk);
		},
	});
	await execa('noop-fd.js', [`${fdNumber}`, 'foobar'], getStdio(fdNumber, writableStream));
	assert.equal(result.join(''), 'foobar');
};

test('stdout can be a WritableStream', () => testWritableStream(1));
test('stderr can be a WritableStream', () => testWritableStream(2));
test('stdio[*] can be a WritableStream', () => testWritableStream(3));

const testWebStreamSync = (StreamClass, fdNumber, optionName) => {
	assertThrows(() => {
		execaSync('empty.js', getStdio(fdNumber, new StreamClass()));
	}, {message: `The \`${optionName}\` option cannot be a web stream with synchronous methods.`});
};

test('stdin cannot be a ReadableStream - sync', () => testWebStreamSync(ReadableStream, 0, 'stdin'));
test('stdio[*] cannot be a ReadableStream - sync', () => testWebStreamSync(ReadableStream, 3, 'stdio[3]'));
test('stdout cannot be a WritableStream - sync', () => testWebStreamSync(WritableStream, 1, 'stdout'));
test('stderr cannot be a WritableStream - sync', () => testWebStreamSync(WritableStream, 2, 'stderr'));
test('stdio[*] cannot be a WritableStream - sync', () => testWebStreamSync(WritableStream, 3, 'stdio[3]'));

const testLongWritableStream = async fdNumber => {
	let isResult = false;
	const writableStream = new WritableStream({
		async close() {
			await setImmediate();
			isResult = true;
		},
	});
	await execa('empty.js', getStdio(fdNumber, writableStream));
	assert.equal(isResult, true);
};

test('stdout waits for WritableStream completion', () => testLongWritableStream(1));
test('stderr waits for WritableStream completion', () => testLongWritableStream(2));
test('stdio[*] waits for WritableStream completion', () => testLongWritableStream(3));

const testWritableStreamError = async fdNumber => {
	const cause = new Error('foobar');
	const writableStream = new WritableStream({
		start(controller) {
			controller.error(cause);
		},
	});
	const error = await assertRejects(execa('noop.js', getStdio(fdNumber, writableStream)));
	assert.equal(error.cause, cause);
};

test('stdout option handles errors in WritableStream', () => testWritableStreamError(1));
test('stderr option handles errors in WritableStream', () => testWritableStreamError(2));
test('stdio[*] option handles errors in WritableStream', () => testWritableStreamError(3));

const testReadableStreamError = async fdNumber => {
	const cause = new Error('foobar');
	const readableStream = new ReadableStream({
		start(controller) {
			controller.error(cause);
		},
	});
	const error = await assertRejects(execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, readableStream)));
	assert.equal(error.cause, cause);
};

test('stdin option handles errors in ReadableStream', () => testReadableStreamError(0));
test('stdio[*] option handles errors in ReadableStream', () => testReadableStreamError(3));

test('ReadableStream with stdin is canceled on subprocess exit', async () => {
	let readableStream;
	const promise = new Promise(resolve => {
		readableStream = new ReadableStream({cancel: resolve});
	});
	await assertRejects(execa('stdin.js', {stdin: readableStream, timeout: 1}), {message: /timed out/});
	await promise;
});

// A web stream can only be used once, but like Node.js streams, the same instance
// passed to multiple file descriptors should send its data to each of them.
const testSharedReadableStream = async (fixtureArguments, stdio) => {
	const readableStream = Readable.toWeb(Readable.from('foobar'));
	const {stdout} = await execa('stdin-fds.js', fixtureArguments, {stdio: stdio.map(value => value === 'shared' ? readableStream : value)});
	assert.equal(stdout, 'foobarfoobar');
};

test('stdin can share a ReadableStream with stdio[*]', () => testSharedReadableStream(['0', '3'], ['shared', 'pipe', 'pipe', 'shared']));
test('stdio[*] can share a ReadableStream with another stdio[*]', () => testSharedReadableStream(['3', '4'], ['pipe', 'pipe', 'pipe', 'shared', 'shared']));
