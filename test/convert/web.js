import {ReadableStream, WritableStream} from 'node:stream/web';
import test from 'ava';
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

test('.readableStream() success', async t => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readableStream();

	t.true(stream instanceof ReadableStream);

	await assertStreamOutput(t, stream);
	await assertSubprocessOutput(t, subprocess);
});

test('.readableStream() can use from', async t => {
	const subprocess = execa('noop-fd.js', ['2', foobarString]);
	const stream = subprocess.readableStream({from: 'stderr'});

	await assertStreamOutput(t, stream);
});

test('.writableStream() success', async t => {
	const subprocess = getWritableSubprocess();
	const stream = subprocess.writableStream();

	t.true(stream instanceof WritableStream);

	await writeToStream(stream);
	await assertSubprocessOutput(t, subprocess, foobarString, 2);
});

test('.writableStream() can use to', async t => {
	const subprocess = execa('stdin-fd.js', ['0']);
	const stream = subprocess.writableStream({to: 'stdin'});

	await writeToStream(stream);
	await assertSubprocessOutput(t, subprocess);
});

test('.transformStream() success', async t => {
	const subprocess = getReadWriteSubprocess();
	const {readable, writable} = subprocess.transformStream();

	t.true(readable instanceof ReadableStream);
	t.true(writable instanceof WritableStream);

	await writeToStream(writable);
	await assertStreamOutput(t, readable);
	await assertSubprocessOutput(t, subprocess);
});

test('subprocess fail -> .readableStream() error', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.readableStream();

	const cause = new Error(foobarString);
	subprocess.kill(cause);

	await assertStreamReadError(t, stream, {cause});
	await assertSubprocessError(t, subprocess, {cause});
});

test('subprocess fail -> .writableStream() error', async t => {
	const subprocess = getReadWriteSubprocess();
	const stream = subprocess.writableStream();
	const writer = stream.getWriter();

	const cause = new Error(foobarString);
	subprocess.kill(cause);

	await assertPromiseError(t, writer.closed, {cause});
	await assertSubprocessError(t, subprocess, {cause});
});

test('subprocess fail -> .transformStream() error', async t => {
	const subprocess = getReadWriteSubprocess();
	const {readable} = subprocess.transformStream();

	const cause = new Error(foobarString);
	subprocess.kill(cause);

	await assertStreamReadError(t, readable, {cause});
	await assertSubprocessError(t, subprocess, {cause});
});
