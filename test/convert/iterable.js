import assert from 'node:assert/strict';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {fullStdio, assertEpipe} from '../helpers/stdio.js';
import {
	arrayFromAsync,
	assertWritableAborted,
	assertReadableAborted,
	assertProcessNormalExit,
} from '../helpers/convert.js';
import {simpleFull, noNewlinesChunks} from '../helpers/lines.js';

setFixtureDirectory();

const partialArrayFromAsync = async (asyncIterable, lines = []) => {
	// eslint-disable-next-line no-unreachable-loop
	for await (const line of asyncIterable) {
		lines.push(line);
		break;
	}

	return lines;
};

const errorArrayFromAsync = async (cause, asyncIterable, lines = []) => {
	const {value} = await asyncIterable.next();
	lines.push(value);
	await asyncIterable.throw(cause);
};

const throwsAsync = async (asyncIterable, arrayFromAsyncMethod) => {
	const lines = [];
	const error = await assertRejects(arrayFromAsyncMethod(asyncIterable, lines));
	return {error, lines};
};

const assertStdoutAbort = (subprocess, error, cause) => {
	assertProcessNormalExit(error, 1);
	assertEpipe(error.stderr);
	assertWritableAborted(subprocess.stdin);
	assert.equal(subprocess.stderr.readableEnded, true);

	if (cause === undefined) {
		assertReadableAborted(subprocess.stdout);
	} else {
		assert.equal(subprocess.stdout.errored, cause);
	}
};

const testSuccess = async (fdNumber, from, options = {}) => {
	const lines = await arrayFromAsync(execa('noop-fd.js', [`${fdNumber}`, simpleFull], options).iterable({from}));
	assert.deepEqual(lines, noNewlinesChunks);
};

test('Uses stdout by default', () => testSuccess(1, undefined));
test('Can iterate successfully on stdout', () => testSuccess(1, 'stdout'));
test('Can iterate successfully on stderr', () => testSuccess(2, 'stderr'));
test('Can iterate successfully on stdio[*]', () => testSuccess(3, 'fd3', fullStdio));

test('Can iterate successfully on all', async () => {
	const lines = await arrayFromAsync(execa('noop-both.js', [simpleFull], {all: true}).iterable({from: 'all'}));
	assert.deepEqual(lines, [...noNewlinesChunks, ...noNewlinesChunks]);
});

test('Can iterate using Symbol.asyncIterator', async () => {
	const lines = await arrayFromAsync(execa('noop-fd.js', ['1', simpleFull]));
	assert.deepEqual(lines, noNewlinesChunks);
});

const assertMultipleCalls = async (iterable, iterableTwo) => {
	assert.notEqual(iterable, iterableTwo);
	const lines = await arrayFromAsync(iterable);
	const linesTwo = await arrayFromAsync(iterableTwo);
	assert.deepEqual(lines, linesTwo);
	assert.deepEqual(lines, noNewlinesChunks);
};

test('Can be called multiple times', async () => {
	const subprocess = execa('noop-fd.js', ['1', simpleFull]);
	const iterable = subprocess.iterable();
	const iterableTwo = subprocess.iterable();
	await assertMultipleCalls(iterable, iterableTwo);
});

test('Can be called on different file descriptors', async () => {
	const subprocess = execa('noop-both.js', [simpleFull]);
	const iterable = subprocess.iterable();
	const iterableTwo = subprocess.iterable({from: 'stderr'});
	await assertMultipleCalls(iterable, iterableTwo);
});

test('Wait for the subprocess exit', async () => {
	const subprocess = execa('noop-delay.js', ['1', simpleFull]);
	const linesPromise = arrayFromAsync(subprocess);
	assert.equal(await Promise.race([linesPromise, subprocess]), await subprocess);
	assert.deepEqual(await linesPromise, noNewlinesChunks);
});

test('Wait for the subprocess exit on iterator.return()', async () => {
	const subprocess = execa('noop-delay.js', ['1', simpleFull]);
	const linesPromise = partialArrayFromAsync(subprocess);
	assert.equal(await Promise.race([linesPromise, subprocess]), await subprocess);
	assert.deepEqual(await linesPromise, [noNewlinesChunks[0]]);
});

test('Wait for the subprocess exit on iterator.throw()', async () => {
	const subprocess = execa('noop-delay.js', ['1', simpleFull]);
	const cause = new Error(foobarString);
	const lines = [];
	const linesPromise = assertRejects(errorArrayFromAsync(cause, subprocess.iterable(), lines));
	assert.equal(await Promise.race([linesPromise, subprocess]), await subprocess);
	assert.deepEqual(lines, [noNewlinesChunks[0]]);
});

test('Abort stdout on iterator.return()', async () => {
	const subprocess = execa('noop-repeat.js', ['1', simpleFull]);
	const {error, lines} = await throwsAsync(subprocess, partialArrayFromAsync);
	assert.deepEqual(lines, [noNewlinesChunks[0]]);
	assertStdoutAbort(subprocess, error);
	assert.equal(error, await assertRejects(subprocess));
});

test('Abort stdout on iterator.throw()', async () => {
	const subprocess = execa('noop-repeat.js', ['1', simpleFull]);
	const cause = new Error(foobarString);
	const {error, lines} = await throwsAsync(subprocess.iterable(), errorArrayFromAsync.bind(undefined, cause));
	assert.deepEqual(lines, [noNewlinesChunks[0]]);
	assertStdoutAbort(subprocess, error);
	assert.equal(error, await assertRejects(subprocess));
});

test('Propagate subprocess failure', async () => {
	const subprocess = execa('noop-fail.js', ['1', simpleFull]);
	const {error, lines} = await throwsAsync(subprocess, arrayFromAsync);
	assert.equal(error, await assertRejects(subprocess));
	assert.deepEqual(lines, noNewlinesChunks);
});

const testStdoutError = async (destroyStdout, isAbort, cause) => {
	const subprocess = execa('noop-repeat.js', ['1', simpleFull]);
	subprocess.stdout.once('data', () => {
		destroyStdout(subprocess.stdout, cause);
	});

	const {error} = await throwsAsync(subprocess, arrayFromAsync);
	assert.equal(error.cause, cause);
	assertStdoutAbort(subprocess, error, isAbort ? undefined : cause);
	assert.equal(error, await assertRejects(subprocess));
};

test('Propagate stdout abort', () => testStdoutError(subprocessStdout => subprocessStdout.destroy(), true));
test('Propagate stdout error', () => testStdoutError((subprocessStdout, cause) => subprocessStdout.destroy(cause), false, new Error(foobarString)));
test('Propagate stdout "error" event', () => testStdoutError((subprocessStdout, cause) => subprocessStdout.emit('error', cause), true, new Error(foobarString)));
