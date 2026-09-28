import assert from 'node:assert/strict';
import {setTimeout} from 'node:timers/promises';
import test from 'node:test';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {fullReadableStdio} from '../helpers/stdio.js';
import {
	finishedStream,
	assertStreamOutput,
	assertStreamError,
	assertStreamReadError,
	assertSubprocessOutput,
	assertSubprocessError,
	getReadWriteSubprocess,
} from '../helpers/convert.js';

setFixtureDirectory();

const endStream = async stream => {
	stream.end(foobarString);
	await setTimeout(0);
};

const endSameWritable = async (stream, secondStream, subprocess, fdNumber) => {
	await endStream(stream);
	assert.ok(subprocess.stdio[fdNumber].writable);

	await endStream(secondStream);
	assert.ok(!subprocess.stdio[fdNumber].writable);
};

// eslint-disable-next-line max-params
const endDifferentWritable = async (stream, secondStream, subprocess, fdNumber = 0, secondFdNumber = 3) => {
	await endStream(stream);
	assert.ok(!subprocess.stdio[fdNumber].writable);
	assert.ok(subprocess.stdio[secondFdNumber].writable);

	await endStream(secondStream);
	assert.ok(!subprocess.stdio[secondFdNumber].writable);
};

const testReadableTwice = async (fdNumber, from) => {
	const subprocess = execa('noop-fd.js', [`${fdNumber}`, foobarString]);
	const stream = subprocess.readable({from});
	const secondStream = subprocess.readable({from});

	await Promise.all([
		assertStreamOutput(stream),
		assertStreamOutput(secondStream),
	]);
	await assertSubprocessOutput(subprocess, foobarString, fdNumber);
};

test('Can call .readable() twice on same file descriptor', () => testReadableTwice(1));
test('Can call .readable({from: "stderr"}) twice on same file descriptor', () => testReadableTwice(2, 'stderr'));

const testWritableTwice = async (fdNumber, to, options) => {
	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], options);
	const stream = subprocess.writable({to});
	const secondStream = subprocess.writable({to});

	await Promise.all([
		finishedStream(stream),
		finishedStream(secondStream),
		endSameWritable(stream, secondStream, subprocess, fdNumber),
	]);
	await assertSubprocessOutput(subprocess, `${foobarString}${foobarString}`);
};

test('Can call .writable() twice on same file descriptor', () => testWritableTwice(0, undefined, {}));
test('Can call .writable({to: "fd3"}) twice on same file descriptor', () => testWritableTwice(3, 'fd3', fullReadableStdio()));

const testDuplexTwice = async (fdNumber, to, options) => {
	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], options);
	const stream = subprocess.duplex({to});
	const secondStream = subprocess.duplex({to});

	const expectedOutput = `${foobarString}${foobarString}`;
	await Promise.all([
		assertStreamOutput(stream, expectedOutput),
		assertStreamOutput(secondStream, expectedOutput),
		endSameWritable(stream, secondStream, subprocess, fdNumber),
	]);
	await assertSubprocessOutput(subprocess, expectedOutput);
};

test('Can call .duplex() twice on same file descriptor', () => testDuplexTwice(0, undefined, {}));
test('Can call .duplex({to: "fd3"}) twice on same file descriptor', () => testDuplexTwice(3, 'fd3', fullReadableStdio()));

test('Can call .duplex() twice on same readable file descriptor but different writable one', async () => {
	const subprocess = execa('stdin-fd-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.duplex();
	const secondStream = subprocess.duplex({to: 'fd3'});

	const expectedOutput = `${foobarString}${foobarString}`;
	await Promise.all([
		assertStreamOutput(stream, expectedOutput),
		assertStreamOutput(secondStream, expectedOutput),
		endDifferentWritable(stream, secondStream, subprocess),
	]);
	await assertSubprocessOutput(subprocess, expectedOutput);
});

test('Can call .readable() twice on different file descriptors', async () => {
	const subprocess = execa('noop-both.js', [foobarString]);
	const stream = subprocess.readable();
	const secondStream = subprocess.readable({from: 'stderr'});

	const expectedOutput = `${foobarString}\n`;
	await Promise.all([
		assertStreamOutput(stream, expectedOutput),
		assertStreamOutput(secondStream, expectedOutput),
	]);
	await assertSubprocessOutput(subprocess);
	await assertSubprocessOutput(subprocess, foobarString, 2);
});

test('Can call .writable() twice on different file descriptors', async () => {
	const subprocess = execa('stdin-fd-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.writable();
	const secondStream = subprocess.writable({to: 'fd3'});

	await Promise.all([
		finishedStream(stream),
		finishedStream(secondStream),
		endDifferentWritable(stream, secondStream, subprocess),
	]);
	await assertSubprocessOutput(subprocess, `${foobarString}${foobarString}`);
});

test('Can call .duplex() twice on different file descriptors', async () => {
	const subprocess = execa('stdin-twice-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.duplex();
	const secondStream = subprocess.duplex({from: 'stderr', to: 'fd3'});

	await Promise.all([
		assertStreamOutput(stream),
		assertStreamOutput(secondStream),
		endDifferentWritable(stream, secondStream, subprocess),
	]);
	await assertSubprocessOutput(subprocess);
	await assertSubprocessOutput(subprocess, foobarString, 2);
});

test('Can call .readable() and .writable()', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.writable();
	const secondStream = subprocess.readable();
	stream.end(foobarString);

	await Promise.all([
		finishedStream(stream),
		assertStreamOutput(secondStream),
	]);
	await assertSubprocessOutput(subprocess);
});

test('Can call .writable() and .duplex()', async () => {
	const subprocess = execa('stdin-fd-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.duplex();
	const secondStream = subprocess.writable({to: 'fd3'});

	const expectedOutput = `${foobarString}${foobarString}`;
	await Promise.all([
		assertStreamOutput(stream, expectedOutput),
		finishedStream(secondStream),
		endDifferentWritable(stream, secondStream, subprocess),
	]);
	await assertSubprocessOutput(subprocess, expectedOutput);
});

test('Can call .readable() and .duplex()', async () => {
	const subprocess = execa('stdin-both.js');
	const stream = subprocess.duplex();
	const secondStream = subprocess.readable({from: 'stderr'});
	stream.end(foobarString);

	await Promise.all([
		assertStreamOutput(stream),
		assertStreamOutput(secondStream),
	]);
	await assertSubprocessOutput(subprocess);
	await assertSubprocessOutput(subprocess, foobarString, 2);
});

test('Can error one of two .readable() on same file descriptor', async () => {
	const subprocess = execa('noop-fd.js', ['1', foobarString]);
	const stream = subprocess.readable();
	const secondStream = subprocess.readable();
	const cause = new Error(foobarString);
	stream.destroy(cause);

	await Promise.all([
		assertStreamReadError(stream, cause),
		assertStreamOutput(secondStream),
	]);
	await assertSubprocessOutput(subprocess);
});

test('Can error both .readable() on same file descriptor', async () => {
	const subprocess = execa('noop-fd.js', ['1', foobarString]);
	const stream = subprocess.readable();
	const secondStream = subprocess.readable();
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.destroy(cause);

	const [error, secondError] = await Promise.all([
		assertStreamReadError(stream, {cause}),
		assertStreamReadError(secondStream, {cause}),
	]);
	assert.equal(error, secondError);
	await assertSubprocessError(subprocess, error);
});

test('Can error one of two .readable() on different file descriptors', async () => {
	const subprocess = execa('noop-both.js', [foobarString]);
	const stream = subprocess.readable();
	const secondStream = subprocess.readable({from: 'stderr'});
	const cause = new Error(foobarString);
	stream.destroy(cause);

	const [error, secondError] = await Promise.all([
		assertStreamReadError(stream, {cause}),
		assertStreamReadError(secondStream, {cause}),
	]);
	assert.equal(error, secondError);
	assert.equal(error.stderr, foobarString);
	await assertSubprocessError(subprocess, error);
});

test('Can error both .readable() on different file descriptors', async () => {
	const subprocess = execa('noop-both.js', [foobarString]);
	const stream = subprocess.readable();
	const secondStream = subprocess.readable({from: 'stderr'});
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.destroy(cause);

	const [error, secondError] = await Promise.all([
		assertStreamReadError(stream, {cause}),
		assertStreamReadError(secondStream, {cause}),
	]);
	assert.equal(error, secondError);
	await assertSubprocessError(subprocess, error);
});

test('Can error one of two .writable() on same file descriptor', async () => {
	const subprocess = execa('stdin.js');
	const stream = subprocess.writable();
	const secondStream = subprocess.writable();
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.end(foobarString);

	await Promise.all([
		assertStreamError(stream, cause),
		finishedStream(secondStream),
	]);
	await assertSubprocessOutput(subprocess);
});

test('Can error both .writable() on same file descriptor', async () => {
	const subprocess = execa('stdin.js');
	const stream = subprocess.writable();
	const secondStream = subprocess.writable();
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.destroy(cause);

	const [error, secondError] = await Promise.all([
		assertStreamError(stream, {cause}),
		assertStreamError(secondStream, {cause}),
	]);
	assert.equal(error, secondError);
	await assertSubprocessError(subprocess, error);
});

test('Can error one of two .writable() on different file descriptors', async () => {
	const subprocess = execa('stdin-fd-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.writable();
	const secondStream = subprocess.writable({to: 'fd3'});
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.end(foobarString);

	const [error, secondError] = await Promise.all([
		assertStreamError(stream, {cause}),
		assertStreamError(secondStream, {cause}),
	]);
	assert.equal(error, secondError);
	assert.equal(error.stdout, foobarString);
	await assertSubprocessError(subprocess, error);
});

test('Can error both .writable() on different file descriptors', async () => {
	const subprocess = execa('stdin-fd-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.writable();
	const secondStream = subprocess.writable({to: 'fd3'});
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.destroy(cause);

	const [error, secondError] = await Promise.all([
		assertStreamError(stream, {cause}),
		assertStreamError(secondStream, {cause}),
	]);
	assert.equal(error, secondError);
	await assertSubprocessError(subprocess, error);
});

test('Can error one of two .duplex() on same file descriptor', async () => {
	const subprocess = execa('stdin.js');
	const stream = subprocess.duplex();
	const secondStream = subprocess.duplex();
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.end(foobarString);

	await Promise.all([
		assertStreamReadError(stream, cause),
		assertStreamOutput(secondStream),
	]);
	await assertSubprocessOutput(subprocess);
});

test('Can error both .duplex() on same file descriptor', async () => {
	const subprocess = execa('stdin.js');
	const stream = subprocess.duplex();
	const secondStream = subprocess.duplex();
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.destroy(cause);

	await Promise.all([
		assertStreamReadError(stream, cause),
		assertStreamReadError(secondStream, cause),
	]);
	await assertSubprocessError(subprocess, {cause});
});

test('Can error one of two .duplex() on different file descriptors', async () => {
	const subprocess = execa('stdin-twice-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.duplex();
	const secondStream = subprocess.duplex({from: 'stderr', to: 'fd3'});
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.end(foobarString);

	const [error] = await Promise.all([
		assertStreamReadError(secondStream, {cause}),
		assertStreamReadError(stream, cause),
	]);
	assert.equal(error.stderr, foobarString);
	await assertSubprocessError(subprocess, error);
});

test('Can error both .duplex() on different file descriptors', async () => {
	const subprocess = execa('stdin-twice-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.duplex();
	const secondStream = subprocess.duplex({from: 'stderr', to: 'fd3'});
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.destroy(cause);

	await Promise.all([
		assertStreamReadError(stream, cause),
		assertStreamReadError(secondStream, cause),
	]);
	await assertSubprocessError(subprocess, {cause});
});
