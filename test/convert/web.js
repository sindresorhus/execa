import assert from 'node:assert/strict';
import {ReadableStream, WritableStream} from 'node:stream/web';
import test from 'node:test';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {
	assertStreamOutput,
	assertStreamReadError,
	assertSubprocessOutput,
	assertSubprocessError,
	assertPromiseError,
	getReadableSubprocess,
	getWritableSubprocess,
	getReadWriteSubprocess,
} from '../helpers/convert.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const writeToStream = async (stream, input = foobarString) => {
	const writer = stream.getWriter();
	await writer.write(new TextEncoder().encode(input));
	await writer.close();
};

test('.readableStream() success', async () => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readableStream();

	assert.ok(stream instanceof ReadableStream);

	await assertStreamOutput(stream);
	await assertSubprocessOutput(subprocess);
});

test('.readableStream() can use from', async () => {
	const subprocess = execa('noop-fd.js', ['2', foobarString]);
	const stream = subprocess.readableStream({from: 'stderr'});

	await assertStreamOutput(stream);
});

test('.writableStream() success', async () => {
	const subprocess = getWritableSubprocess();
	const stream = subprocess.writableStream();

	assert.ok(stream instanceof WritableStream);

	await writeToStream(stream);
	await assertSubprocessOutput(subprocess, foobarString, 2);
});

test('.writableStream() can use to', async () => {
	const subprocess = execa('stdin-fd.js', ['0']);
	const stream = subprocess.writableStream({to: 'stdin'});

	await writeToStream(stream);
	await assertSubprocessOutput(subprocess);
});

test('.transformStream() success', async () => {
	const subprocess = getReadWriteSubprocess();
	const {readable, writable} = subprocess.transformStream();

	assert.ok(readable instanceof ReadableStream);
	assert.ok(writable instanceof WritableStream);

	await writeToStream(writable);
	await assertStreamOutput(readable);
	await assertSubprocessOutput(subprocess);
});

test('subprocess fail -> .readableStream() error', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.readableStream();

	const cause = new Error(foobarString);
	subprocess.kill(cause);

	await assertStreamReadError(stream, {cause});
	await assertSubprocessError(subprocess, {cause});
});

test('subprocess fail -> .writableStream() error', async () => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.writableStream();
	const writer = stream.getWriter();

	const cause = new Error(foobarString);
	subprocess.kill(cause);

	await assertPromiseError(writer.closed, {cause});
	await assertSubprocessError(subprocess, {cause});
});

test('subprocess fail -> .transformStream() error', async () => {
	const subprocess = getReadWriteSubprocess();
	const {readable} = subprocess.transformStream();

	const cause = new Error(foobarString);
	subprocess.kill(cause);

	await assertStreamReadError(readable, {cause});
	await assertSubprocessError(subprocess, {cause});
});
