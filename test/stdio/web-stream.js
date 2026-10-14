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

test('stdin can read objects from a ReadableStream with an object mode transform', async () => {
	const input = {message: 'foobar'};
	const readableStream = new ReadableStream({
		start(controller) {
			controller.enqueue(input);
			controller.close();
		},
	});
	const {stdout} = await execa('stdin.js', {
		stdin: [readableStream, {
			objectMode: true,
			* transform(value) {
				yield JSON.stringify(value);
			},
		}],
	});
	assert.equal(stdout, JSON.stringify(input));
});

test('stdout can write objects to a WritableStream with an object mode transform', async () => {
	const output = {message: 'foobar'};
	const received = [];
	const writableStream = new WritableStream({
		write(chunk) {
			received.push(chunk);
		},
	});
	const {stdout} = await execa('noop.js', {
		stdout: [writableStream, {
			objectMode: true,
			* transform() {
				yield output;
			},
		}],
	});
	assert.deepEqual(stdout, [output]);
	assert.deepEqual(received, [output]);
	assert.equal(received[0], output);
});

const objectChunks = [{value: 1}, [1, [2]], false, 0, '', 'first\nsecond', new Uint8Array([97, 98])];

const testObjectReadableStream = async (fdNumber, hasOtherSource) => {
	const readableStream = new ReadableStream({
		start(controller) {
			for (const chunk of objectChunks) {
				controller.enqueue(chunk);
			}

			controller.close();
		},
	});
	const otherChunks = hasOtherSource ? [{other: true}] : [];
	const received = [];
	let finalCount = 0;
	const {stdout} = await execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [readableStream, otherChunks, {
		objectMode: true,
		* transform(chunk) {
			received.push(chunk);
			yield JSON.stringify(chunk);
		},
		* final() {
			finalCount += 1;
			yield 'finished';
		},
	}]));
	const expectedChunks = [...objectChunks, ...otherChunks];
	assert.deepEqual(stdout.split('\n').sort(), [...expectedChunks.map(chunk => JSON.stringify(chunk)), 'finished'].sort());
	assert.equal(finalCount, 1);
	for (const chunk of expectedChunks) {
		assert.ok(received.includes(chunk));
	}
};

test('stdin preserves arbitrary object chunks from a ReadableStream', () => testObjectReadableStream(0, false));
test('stdio[*] preserves arbitrary object chunks from a ReadableStream', () => testObjectReadableStream(3, false));
test('Object-mode ReadableStream input can be combined with another source', () => testObjectReadableStream(0, true));

const testObjectWritableStream = async fdNumber => {
	const received = [];
	let isClosed = false;
	const writableStream = new WritableStream({
		write(chunk) {
			received.push(chunk);
		},
		async close() {
			await setImmediate();
			isClosed = true;
		},
	});
	const {stdio} = await execa('noop-fd.js', [`${fdNumber}`, 'x'], getStdio(fdNumber, [writableStream, {
		objectMode: true,
		* transform() {
			yield * objectChunks;
		},
	}]));
	assert.deepEqual(stdio[fdNumber], objectChunks);
	assert.deepEqual(received, objectChunks);
	assert.equal(isClosed, true);
	for (const [index, chunk] of objectChunks.entries()) {
		assert.equal(received[index], chunk);
	}
};

test('stderr writes arbitrary object chunks to a WritableStream', () => testObjectWritableStream(2));
test('stdio[*] writes arbitrary object chunks to a WritableStream', () => testObjectWritableStream(3));

const testSharedObjectWritableStream = async objectDescriptor => {
	const output = {event: 'error'};
	const received = [];
	const writableStream = new WritableStream({
		write(chunk) {
			received.push(chunk);
		},
	});
	const byteDescriptor = objectDescriptor === 'stdout' ? 'stderr' : 'stdout';
	const result = await execa('noop-both.js', ['byte output'], {
		stdout: writableStream,
		stderr: writableStream,
		[objectDescriptor]: [writableStream, {
			objectMode: true,
			* transform() {
				yield output;
			},
		}],
	});
	assert.deepEqual(result[objectDescriptor], [output]);
	assert.equal(result[byteDescriptor], 'byte output');
	assert.equal(received.filter(chunk => chunk === output).length, 1);
	assert.equal(received.filter(chunk => chunk !== output).map(chunk => chunk.toString()).join(''), 'byte output\n');
};

test('A shared WritableStream can receive byte stdout and object-mode stderr', () => testSharedObjectWritableStream('stderr'));
test('A shared WritableStream can receive object-mode stdout and byte stderr', () => testSharedObjectWritableStream('stdout'));

test('A shared WritableStream receives byte stdout and stderr without dropping either', async () => {
	const received = [];
	const writableStream = new WritableStream({
		write(chunk) {
			assert.ok(chunk instanceof Uint8Array);
			received.push(chunk.toString());
		},
	});
	await execa('noop-both.js', ['stdout', 'stderr'], {stdout: writableStream, stderr: writableStream});
	assert.deepEqual(received.join('').trim().split('\n').sort(), ['stderr', 'stdout']);
});

test('Object-mode WritableStream errors preserve the original cause', async () => {
	const cause = new Error('Object write failed');
	const writableStream = new WritableStream({
		write() {
			throw cause;
		},
	});
	const error = await assertRejects(execa('noop.js', {
		stdout: [writableStream, {
			objectMode: true,
			* transform() {
				yield objectChunks[0];
			},
		}],
	}));
	assert.equal(error.cause, cause);
});

test('Byte-mode web streams preserve binary data without text decoding', async () => {
	const input = new Uint8Array([0, 255, 128, 10]);
	const readableStream = new ReadableStream({
		type: 'bytes',
		start(controller) {
			controller.enqueue(new Uint8Array(input));
			controller.close();
		},
	});
	const received = [];
	const writableStream = new WritableStream({
		write(chunk) {
			received.push(...chunk);
		},
	});
	const {stdout} = await execa('stdin.js', {
		stdin: readableStream,
		stdout: writableStream,
		encoding: 'buffer',
		stripFinalNewline: false,
	});
	assert.deepEqual(stdout, input);
	assert.deepEqual(received, [...input]);
});

test('A web ReadableStream requires a transform to serialize object input', async () => {
	const readableStream = new ReadableStream({
		start(controller) {
			controller.enqueue({value: 1});
			controller.close();
		},
	});
	const error = await assertRejects(execa('stdin.js', {stdin: readableStream}));
	assert.equal(error.cause.code, 'ERR_INVALID_ARG_TYPE');
});

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
