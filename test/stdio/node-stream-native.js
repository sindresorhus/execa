import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createReadStream, createWriteStream} from 'node:fs';
import {readFile, writeFile, rm} from 'node:fs/promises';
import test from 'node:test';
import tempfile from 'tempfile';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';
import {
	noopReadable,
	noopWritable,
	noopDuplex,
	simpleReadable,
} from '../helpers/stream.js';

setFixtureDirectory();

const testNoFileStreamSync = async (fdNumber, stream) => {
	assertThrows(() => {
		execaSync('empty.js', getStdio(fdNumber, stream));
	}, {code: 'ERR_INVALID_ARG_VALUE'});
};

test('stdin cannot be a Node.js Readable without a file descriptor - sync', () => testNoFileStreamSync(0, noopReadable()));
test('stdin cannot be a Node.js Duplex without a file descriptor - sync', () => testNoFileStreamSync(0, noopDuplex()));
test('stdout cannot be a Node.js Writable without a file descriptor - sync', () => testNoFileStreamSync(1, noopWritable()));
test('stdout cannot be a Node.js Duplex without a file descriptor - sync', () => testNoFileStreamSync(1, noopDuplex()));
test('stderr cannot be a Node.js Writable without a file descriptor - sync', () => testNoFileStreamSync(2, noopWritable()));
test('stderr cannot be a Node.js Duplex without a file descriptor - sync', () => testNoFileStreamSync(2, noopDuplex()));
test('stdio[*] cannot be a Node.js Readable without a file descriptor - sync', () => testNoFileStreamSync(3, noopReadable()));
test('stdio[*] cannot be a Node.js Writable without a file descriptor - sync', () => testNoFileStreamSync(3, noopWritable()));
test('stdio[*] cannot be a Node.js Duplex without a file descriptor - sync', () => testNoFileStreamSync(3, noopDuplex()));

test('input can be a Node.js Readable without a file descriptor', async () => {
	const {stdout} = await execa('stdin.js', {input: simpleReadable()});
	assert.equal(stdout, foobarString);
});

test('input cannot be a Node.js Readable without a file descriptor - sync', () => {
	assertThrows(() => {
		execaSync('empty.js', {input: simpleReadable()});
	}, {message: 'The `input` option cannot be a Node.js stream with synchronous methods.'});
});

const testNoFileStream = async (fdNumber, stream) => {
	await assertRejects(execa('empty.js', getStdio(fdNumber, stream)), {code: 'ERR_INVALID_ARG_VALUE'});
};

test('stdin cannot be a Node.js Readable without a file descriptor', () => testNoFileStream(0, noopReadable()));
test('stdin cannot be a Node.js Duplex without a file descriptor', () => testNoFileStream(0, noopDuplex()));
test('stdout cannot be a Node.js Writable without a file descriptor', () => testNoFileStream(1, noopWritable()));
test('stdout cannot be a Node.js Duplex without a file descriptor', () => testNoFileStream(1, noopDuplex()));
test('stderr cannot be a Node.js Writable without a file descriptor', () => testNoFileStream(2, noopWritable()));
test('stderr cannot be a Node.js Duplex without a file descriptor', () => testNoFileStream(2, noopDuplex()));
test('stdio[*] cannot be a Node.js Readable without a file descriptor', () => testNoFileStream(3, noopReadable()));
test('stdio[*] cannot be a Node.js Writable without a file descriptor', () => testNoFileStream(3, noopWritable()));
test('stdio[*] cannot be a Node.js Duplex without a file descriptor', () => testNoFileStream(3, noopDuplex()));

const createFileReadStream = async () => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const stream = createReadStream(filePath);
	await once(stream, 'open');
	return {stream, filePath};
};

const createFileWriteStream = async () => {
	const filePath = tempfile();
	const stream = createWriteStream(filePath);
	await once(stream, 'open');
	return {stream, filePath};
};

const assertFileStreamError = async (subprocess, stream, filePath) => {
	const cause = new Error('test');
	stream.destroy(cause);

	const error = await assertRejects(subprocess);
	assert.equal(error.cause, cause);
	assert.equal(error.exitCode, 0);
	assert.equal(error.signal, undefined);

	await rm(filePath);
};

const testFileReadable = async (fdNumber, execaMethod) => {
	const {stream, filePath} = await createFileReadStream();

	const fdNumberString = fdNumber === 'input' ? '0' : `${fdNumber}`;
	const {stdout} = await execaMethod('stdin-fd.js', [fdNumberString], getStdio(fdNumber, stream));
	assert.equal(stdout, 'foobar');

	await rm(filePath);
};

test('input can be a Node.js Readable with a file descriptor', () => testFileReadable('input', execa));
test('stdin can be a Node.js Readable with a file descriptor', () => testFileReadable(0, execa));
test('stdio[*] can be a Node.js Readable with a file descriptor', () => testFileReadable(3, execa));
test('stdin can be a Node.js Readable with a file descriptor - sync', () => testFileReadable(0, execaSync));
test('stdio[*] can be a Node.js Readable with a file descriptor - sync', () => testFileReadable(3, execaSync));

const testFileReadableError = async fdNumber => {
	const {stream, filePath} = await createFileReadStream();

	const fdNumberString = fdNumber === 'input' ? '0' : `${fdNumber}`;
	const subprocess = execa('stdin-fd.js', [fdNumberString], getStdio(fdNumber, stream));

	await assertFileStreamError(subprocess, stream, filePath);
};

test('input handles errors from a Node.js Readable with a file descriptor', () => testFileReadableError('input'));
test('stdin handles errors from a Node.js Readable with a file descriptor', () => testFileReadableError(0));
test('stdio[*] handles errors from a Node.js Readable with a file descriptor', () => testFileReadableError(3));

const testFileReadableOpen = async (fdNumber, useSingle, execaMethod) => {
	const {stream, filePath} = await createFileReadStream();
	assert.deepEqual(stream.eventNames(), []);

	const stdioOption = useSingle ? stream : [stream, 'pipe'];
	await execaMethod('empty.js', getStdio(fdNumber, stdioOption));

	assert.equal(stream.readable, useSingle && fdNumber !== 'input');
	assert.deepEqual(stream.eventNames(), []);

	await rm(filePath);
};

test('input closes a Node.js Readable with a file descriptor', () => testFileReadableOpen('input', true, execa));
test('stdin leaves open a single Node.js Readable with a file descriptor', () => testFileReadableOpen(0, true, execa));
test('stdin closes a combined Node.js Readable with a file descriptor', () => testFileReadableOpen(0, false, execa));
test('stdio[*] leaves open a single Node.js Readable with a file descriptor', () => testFileReadableOpen(3, true, execa));
test('stdin leaves open a single Node.js Readable with a file descriptor - sync', () => testFileReadableOpen(0, true, execaSync));
test('stdio[*] leaves open a single Node.js Readable with a file descriptor - sync', () => testFileReadableOpen(3, true, execaSync));

const testFileWritable = async (fdNumber, execaMethod) => {
	const {stream, filePath} = await createFileWriteStream();

	await execaMethod('noop-fd.js', [`${fdNumber}`, 'foobar'], getStdio(fdNumber, stream));
	assert.equal(await readFile(filePath, 'utf8'), 'foobar');

	await rm(filePath);
};

test('stdout can be a Node.js Writable with a file descriptor', () => testFileWritable(1, execa));
test('stderr can be a Node.js Writable with a file descriptor', () => testFileWritable(2, execa));
test('stdio[*] can be a Node.js Writable with a file descriptor', () => testFileWritable(3, execa));
test('stdout can be a Node.js Writable with a file descriptor - sync', () => testFileWritable(1, execaSync));
test('stderr can be a Node.js Writable with a file descriptor - sync', () => testFileWritable(2, execaSync));
test('stdio[*] can be a Node.js Writable with a file descriptor - sync', () => testFileWritable(3, execaSync));

const testFileWritableError = async fdNumber => {
	const {stream, filePath} = await createFileWriteStream();

	const subprocess = execa('noop-fd.js', [`${fdNumber}`, foobarString], getStdio(fdNumber, stream));

	await assertFileStreamError(subprocess, stream, filePath);
};

test('stdout handles errors from a Node.js Writable with a file descriptor', () => testFileWritableError(1));
test('stderr handles errors from a Node.js Writable with a file descriptor', () => testFileWritableError(2));
test('stdio[*] handles errors from a Node.js Writable with a file descriptor', () => testFileWritableError(3));

const testFileWritableOpen = async (fdNumber, useSingle, execaMethod) => {
	const {stream, filePath} = await createFileWriteStream();
	assert.deepEqual(stream.eventNames(), []);

	const stdioOption = useSingle ? stream : [stream, 'pipe'];
	await execaMethod('empty.js', getStdio(fdNumber, stdioOption));

	assert.equal(stream.writable, useSingle);
	assert.deepEqual(stream.eventNames(), []);

	await rm(filePath);
};

test('stdout leaves open a single Node.js Writable with a file descriptor', () => testFileWritableOpen(1, true, execa));
test('stdout closes a combined Node.js Writable with a file descriptor', () => testFileWritableOpen(1, false, execa));
test('stderr leaves open a single Node.js Writable with a file descriptor', () => testFileWritableOpen(2, true, execa));
test('stderr closes a combined Node.js Writable with a file descriptor', () => testFileWritableOpen(2, false, execa));
test('stdio[*] leaves open a single Node.js Writable with a file descriptor', () => testFileWritableOpen(3, true, execa));
test('stdio[*] closes a combined Node.js Writable with a file descriptor', () => testFileWritableOpen(3, false, execa));
test('stdout leaves open a single Node.js Writable with a file descriptor - sync', () => testFileWritableOpen(1, true, execaSync));
test('stderr leaves open a single Node.js Writable with a file descriptor - sync', () => testFileWritableOpen(2, true, execaSync));
test('stdio[*] leaves open a single Node.js Writable with a file descriptor - sync', () => testFileWritableOpen(3, true, execaSync));
