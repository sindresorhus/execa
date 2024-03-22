import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
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

setFixtureDir();

const endStream = async stream => {
	stream.end(foobarString);
	await setTimeout(0);
};

// eslint-disable-next-line max-params
const endSameWritable = async (t, stream, secondStream, subprocess, fdNumber) => {
	await endStream(stream);
	t.true(subprocess.stdio[fdNumber].writable);

	await endStream(secondStream);
	t.false(subprocess.stdio[fdNumber].writable);
};

// eslint-disable-next-line max-params
const endDifferentWritable = async (t, stream, secondStream, subprocess, fdNumber = 0, secondFdNumber = 3) => {
	await endStream(stream);
	t.false(subprocess.stdio[fdNumber].writable);
	t.true(subprocess.stdio[secondFdNumber].writable);

	await endStream(secondStream);
	t.false(subprocess.stdio[secondFdNumber].writable);
};

const testReadableTwice = async (t, fdNumber, from) => {
	const subprocess = execa('noop-fd.js', [`${fdNumber}`, foobarString]);
	const stream = subprocess.readable({from});
	const secondStream = subprocess.readable({from});

	await Promise.all([
		assertStreamOutput(t, stream),
		assertStreamOutput(t, secondStream),
	]);
	await assertSubprocessOutput(t, subprocess, foobarString, fdNumber);
};

test('Can call .readable() twice on same file descriptor', testReadableTwice, 1);
test('Can call .readable({from: "stderr"}) twice on same file descriptor', testReadableTwice, 2, 'stderr');

const testWritableTwice = async (t, fdNumber, to, options) => {
	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], options);
	const stream = subprocess.writable({to});
	const secondStream = subprocess.writable({to});

	await Promise.all([
		finishedStream(stream),
		finishedStream(secondStream),
		endSameWritable(t, stream, secondStream, subprocess, fdNumber),
	]);
	await assertSubprocessOutput(t, subprocess, `${foobarString}${foobarString}`);
};

test('Can call .writable() twice on same file descriptor', testWritableTwice, 0, undefined, {});
test('Can call .writable({to: "fd3"}) twice on same file descriptor', testWritableTwice, 3, 'fd3', fullReadableStdio());

const testDuplexTwice = async (t, fdNumber, to, options) => {
	const subprocess = execa('stdin-fd.js', [`${fdNumber}`], options);
	const stream = subprocess.duplex({to});
	const secondStream = subprocess.duplex({to});

	const expectedOutput = `${foobarString}${foobarString}`;
	await Promise.all([
		assertStreamOutput(t, stream, expectedOutput),
		assertStreamOutput(t, secondStream, expectedOutput),
		endSameWritable(t, stream, secondStream, subprocess, fdNumber),
	]);
	await assertSubprocessOutput(t, subprocess, expectedOutput);
};

test('Can call .duplex() twice on same file descriptor', testDuplexTwice, 0, undefined, {});
test('Can call .duplex({to: "fd3"}) twice on same file descriptor', testDuplexTwice, 3, 'fd3', fullReadableStdio());

test('Can call .duplex() twice on same readable file descriptor but different writable one', async t => {
	const subprocess = execa('stdin-fd-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.duplex();
	const secondStream = subprocess.duplex({to: 'fd3'});

	const expectedOutput = `${foobarString}${foobarString}`;
	await Promise.all([
		assertStreamOutput(t, stream, expectedOutput),
		assertStreamOutput(t, secondStream, expectedOutput),
		endDifferentWritable(t, stream, secondStream, subprocess),
	]);
	await assertSubprocessOutput(t, subprocess, expectedOutput);
});

test('Can call .readable() twice on different file descriptors', async t => {
	const subprocess = execa('noop-both.js', [foobarString]);
	const stream = subprocess.readable();
	const secondStream = subprocess.readable({from: 'stderr'});

	const expectedOutput = `${foobarString}\n`;
	await Promise.all([
		assertStreamOutput(t, stream, expectedOutput),
		assertStreamOutput(t, secondStream, expectedOutput),
	]);
	await assertSubprocessOutput(t, subprocess);
	await assertSubprocessOutput(t, subprocess, foobarString, 2);
});

test('Can call .writable() twice on different file descriptors', async t => {
	const subprocess = execa('stdin-fd-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.writable();
	const secondStream = subprocess.writable({to: 'fd3'});

	await Promise.all([
		finishedStream(stream),
		finishedStream(secondStream),
		endDifferentWritable(t, stream, secondStream, subprocess),
	]);
	await assertSubprocessOutput(t, subprocess, `${foobarString}${foobarString}`);
});

test('Can call .duplex() twice on different file descriptors', async t => {
	const subprocess = execa('stdin-twice-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.duplex();
	const secondStream = subprocess.duplex({from: 'stderr', to: 'fd3'});

	await Promise.all([
		assertStreamOutput(t, stream),
		assertStreamOutput(t, secondStream),
		endDifferentWritable(t, stream, secondStream, subprocess),
	]);
	await assertSubprocessOutput(t, subprocess);
	await assertSubprocessOutput(t, subprocess, foobarString, 2);
});

test('Can call .readable() and .writable()', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.writable();
	const secondStream = subprocess.readable();
	stream.end(foobarString);

	await Promise.all([
		finishedStream(stream),
		assertStreamOutput(t, secondStream),
	]);
	await assertSubprocessOutput(t, subprocess);
});

test('Can call .writable() and .duplex()', async t => {
	const subprocess = execa('stdin-fd-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.duplex();
	const secondStream = subprocess.writable({to: 'fd3'});

	const expectedOutput = `${foobarString}${foobarString}`;
	await Promise.all([
		assertStreamOutput(t, stream, expectedOutput),
		finishedStream(secondStream),
		endDifferentWritable(t, stream, secondStream, subprocess),
	]);
	await assertSubprocessOutput(t, subprocess, expectedOutput);
});

test('Can call .readable() and .duplex()', async t => {
	const subprocess = execa('stdin-both.js');
	const stream = subprocess.duplex();
	const secondStream = subprocess.readable({from: 'stderr'});
	stream.end(foobarString);

	await Promise.all([
		assertStreamOutput(t, stream),
		assertStreamOutput(t, secondStream),
	]);
	await assertSubprocessOutput(t, subprocess);
	await assertSubprocessOutput(t, subprocess, foobarString, 2);
});

test('Can error one of two .readable() on same file descriptor', async t => {
	const subprocess = execa('noop-fd.js', ['1', foobarString]);
	const stream = subprocess.readable();
	const secondStream = subprocess.readable();
	const cause = new Error(foobarString);
	stream.destroy(cause);

	await Promise.all([
		assertStreamReadError(t, stream, cause),
		assertStreamOutput(t, secondStream),
	]);
	await assertSubprocessOutput(t, subprocess);
});

test('Can error both .readable() on same file descriptor', async t => {
	const subprocess = execa('noop-fd.js', ['1', foobarString]);
	const stream = subprocess.readable();
	const secondStream = subprocess.readable();
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.destroy(cause);

	const [error, secondError] = await Promise.all([
		assertStreamReadError(t, stream, {cause}),
		assertStreamReadError(t, secondStream, {cause}),
	]);
	t.is(error, secondError);
	await assertSubprocessError(t, subprocess, error);
});

test('Can error one of two .readable() on different file descriptors', async t => {
	const subprocess = execa('noop-both.js', [foobarString]);
	const stream = subprocess.readable();
	const secondStream = subprocess.readable({from: 'stderr'});
	const cause = new Error(foobarString);
	stream.destroy(cause);

	const [error, secondError] = await Promise.all([
		assertStreamReadError(t, stream, {cause}),
		assertStreamReadError(t, secondStream, {cause}),
	]);
	t.is(error, secondError);
	t.is(error.stderr, foobarString);
	await assertSubprocessError(t, subprocess, error);
});

test('Can error both .readable() on different file descriptors', async t => {
	const subprocess = execa('noop-both.js', [foobarString]);
	const stream = subprocess.readable();
	const secondStream = subprocess.readable({from: 'stderr'});
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.destroy(cause);

	const [error, secondError] = await Promise.all([
		assertStreamReadError(t, stream, {cause}),
		assertStreamReadError(t, secondStream, {cause}),
	]);
	t.is(error, secondError);
	await assertSubprocessError(t, subprocess, error);
});

test('Can error one of two .writable() on same file descriptor', async t => {
	const subprocess = execa('stdin.js');
	const stream = subprocess.writable();
	const secondStream = subprocess.writable();
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.end(foobarString);

	await Promise.all([
		assertStreamError(t, stream, cause),
		finishedStream(secondStream),
	]);
	await assertSubprocessOutput(t, subprocess);
});

test('Can error both .writable() on same file descriptor', async t => {
	const subprocess = execa('stdin.js');
	const stream = subprocess.writable();
	const secondStream = subprocess.writable();
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.destroy(cause);

	const [error, secondError] = await Promise.all([
		assertStreamError(t, stream, {cause}),
		assertStreamError(t, secondStream, {cause}),
	]);
	t.is(error, secondError);
	await assertSubprocessError(t, subprocess, error);
});

test('Can error one of two .writable() on different file descriptors', async t => {
	const subprocess = execa('stdin-fd-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.writable();
	const secondStream = subprocess.writable({to: 'fd3'});
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.end(foobarString);

	const [error, secondError] = await Promise.all([
		assertStreamError(t, stream, {cause}),
		assertStreamError(t, secondStream, {cause}),
	]);
	t.is(error, secondError);
	t.is(error.stdout, foobarString);
	await assertSubprocessError(t, subprocess, error);
});

test('Can error both .writable() on different file descriptors', async t => {
	const subprocess = execa('stdin-fd-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.writable();
	const secondStream = subprocess.writable({to: 'fd3'});
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.destroy(cause);

	const [error, secondError] = await Promise.all([
		assertStreamError(t, stream, {cause}),
		assertStreamError(t, secondStream, {cause}),
	]);
	t.is(error, secondError);
	await assertSubprocessError(t, subprocess, error);
});

test('Can error one of two .duplex() on same file descriptor', async t => {
	const subprocess = execa('stdin.js');
	const stream = subprocess.duplex();
	const secondStream = subprocess.duplex();
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.end(foobarString);

	await Promise.all([
		assertStreamReadError(t, stream, cause),
		assertStreamOutput(t, secondStream),
	]);
	await assertSubprocessOutput(t, subprocess);
});

test('Can error both .duplex() on same file descriptor', async t => {
	const subprocess = execa('stdin.js');
	const stream = subprocess.duplex();
	const secondStream = subprocess.duplex();
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.destroy(cause);

	await Promise.all([
		assertStreamReadError(t, stream, cause),
		assertStreamReadError(t, secondStream, cause),
	]);
	await assertSubprocessError(t, subprocess, {cause});
});

test('Can error one of two .duplex() on different file descriptors', async t => {
	const subprocess = execa('stdin-twice-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.duplex();
	const secondStream = subprocess.duplex({from: 'stderr', to: 'fd3'});
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.end(foobarString);

	const [error] = await Promise.all([
		assertStreamReadError(t, secondStream, {cause}),
		assertStreamReadError(t, stream, cause),
	]);
	t.is(error.stderr, foobarString);
	await assertSubprocessError(t, subprocess, error);
});

test('Can error both .duplex() on different file descriptors', async t => {
	const subprocess = execa('stdin-twice-both.js', ['3'], fullReadableStdio());
	const stream = subprocess.duplex();
	const secondStream = subprocess.duplex({from: 'stderr', to: 'fd3'});
	const cause = new Error(foobarString);
	stream.destroy(cause);
	secondStream.destroy(cause);

	await Promise.all([
		assertStreamReadError(t, stream, cause),
		assertStreamReadError(t, secondStream, cause),
	]);
	await assertSubprocessError(t, subprocess, {cause});
});
