import {text} from 'node:stream/consumers';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {
	assertStreamOutput,
	assertProcessNormalExit,
	assertSubprocessOutput,
	assertSubprocessError,
	getReadableSubprocess,
	getWritableSubprocess,
	getReadWriteSubprocess,
} from '../helpers/convert.js';
import {foobarString, foobarUint8Array} from '../helpers/input.js';
import {fullReadableStdio} from '../helpers/stdio.js';

setFixtureDirectory();

const writeToWebStream = async (writableStream, chunk = foobarUint8Array) => {
	const writer = writableStream.getWriter();
	await writer.write(chunk);
	await writer.close();
};

test('.readableStream() success', async t => {
	const subprocess = getReadableSubprocess();
	const stream = subprocess.readableStream();

	t.true(stream instanceof ReadableStream);
	t.false(stream instanceof WritableStream);

	await assertStreamOutput(t, stream);
	await assertSubprocessOutput(t, subprocess);
});

test('.readableStream() can use a different file descriptor', async t => {
	const subprocess = execa('noop-fd.js', ['2', foobarString]);
	const stream = subprocess.readableStream({from: 'stderr'});

	await assertStreamOutput(t, stream);
	await assertSubprocessOutput(t, subprocess, foobarString, 2);
});

test('.readableStream() error -> subprocess fail', async t => {
	const subprocess = execa('noop-fail.js', ['1', foobarString]);
	const stream = subprocess.readableStream();

	const error = await t.throwsAsync(text(stream));
	assertProcessNormalExit(t, error, 2);
	await assertSubprocessError(t, subprocess, error);
});

test('.writableStream() success', async t => {
	const subprocess = getWritableSubprocess();
	const stream = subprocess.writableStream();

	t.true(stream instanceof WritableStream);
	t.false(stream instanceof ReadableStream);

	await writeToWebStream(stream);
	await assertSubprocessOutput(t, subprocess, foobarString, 2);
});

test('.writableStream() can use a different file descriptor', async t => {
	const subprocess = execa('stdin-fd.js', ['3'], fullReadableStdio());
	const stream = subprocess.writableStream({to: 'fd3'});

	await writeToWebStream(stream);
	await assertSubprocessOutput(t, subprocess);
});

test('.transformStream() success', async t => {
	const subprocess = getReadWriteSubprocess();
	const {readable, writable} = subprocess.transformStream();

	t.true(readable instanceof ReadableStream);
	t.true(writable instanceof WritableStream);

	await writeToWebStream(writable);
	await assertStreamOutput(t, readable);
	await assertSubprocessOutput(t, subprocess);
});
