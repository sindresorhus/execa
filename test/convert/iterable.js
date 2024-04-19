import test from 'ava';
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

const errorArrayFromAsync = async (t, cause, asyncIterable, lines = []) => {
	const {value} = await asyncIterable.next();
	lines.push(value);
	await asyncIterable.throw(cause);
};

const throwsAsync = async (t, asyncIterable, arrayFromAsyncMethod) => {
	const lines = [];
	const error = await t.throwsAsync(arrayFromAsyncMethod(asyncIterable, lines));
	return {error, lines};
};

const assertStdoutAbort = (t, subprocess, error, cause) => {
	assertProcessNormalExit(t, error, 1);
	assertEpipe(t, error.stderr);
	assertWritableAborted(t, subprocess.stdin);
	t.true(subprocess.stderr.readableEnded);

	if (cause === undefined) {
		assertReadableAborted(t, subprocess.stdout);
	} else {
		t.is(subprocess.stdout.errored, cause);
	}
};

const testSuccess = async (t, fdNumber, from, options = {}) => {
	const lines = await arrayFromAsync(execa('noop-fd.js', [`${fdNumber}`, simpleFull], options).iterable({from}));
	t.deepEqual(lines, noNewlinesChunks);
};

test('Uses stdout by default', testSuccess, 1, undefined);
test('Can iterate successfully on stdout', testSuccess, 1, 'stdout');
test('Can iterate successfully on stderr', testSuccess, 2, 'stderr');
test('Can iterate successfully on stdio[*]', testSuccess, 3, 'fd3', fullStdio);

test('Can iterate successfully on all', async t => {
	const lines = await arrayFromAsync(execa('noop-both.js', [simpleFull], {all: true}).iterable({from: 'all'}));
	t.deepEqual(lines, [...noNewlinesChunks, ...noNewlinesChunks]);
});

test('Can iterate using Symbol.asyncIterator', async t => {
	const lines = await arrayFromAsync(execa('noop-fd.js', ['1', simpleFull]));
	t.deepEqual(lines, noNewlinesChunks);
});

const assertMultipleCalls = async (t, iterable, iterableTwo) => {
	t.not(iterable, iterableTwo);
	const lines = await arrayFromAsync(iterable);
	const linesTwo = await arrayFromAsync(iterableTwo);
	t.deepEqual(lines, linesTwo);
	t.deepEqual(lines, noNewlinesChunks);
};

test('Can be called multiple times', async t => {
	const subprocess = execa('noop-fd.js', ['1', simpleFull]);
	const iterable = subprocess.iterable();
	const iterableTwo = subprocess.iterable();
	await assertMultipleCalls(t, iterable, iterableTwo);
});

test('Can be called on different file descriptors', async t => {
	const subprocess = execa('noop-both.js', [simpleFull]);
	const iterable = subprocess.iterable();
	const iterableTwo = subprocess.iterable({from: 'stderr'});
	await assertMultipleCalls(t, iterable, iterableTwo);
});

test('Wait for the subprocess exit', async t => {
	const subprocess = execa('noop-delay.js', ['1', simpleFull]);
	const linesPromise = arrayFromAsync(subprocess);
	t.is(await Promise.race([linesPromise, subprocess]), await subprocess);
	t.deepEqual(await linesPromise, noNewlinesChunks);
});

test('Wait for the subprocess exit on iterator.return()', async t => {
	const subprocess = execa('noop-delay.js', ['1', simpleFull]);
	const linesPromise = partialArrayFromAsync(subprocess);
	t.is(await Promise.race([linesPromise, subprocess]), await subprocess);
	t.deepEqual(await linesPromise, [noNewlinesChunks[0]]);
});

test('Wait for the subprocess exit on iterator.throw()', async t => {
	const subprocess = execa('noop-delay.js', ['1', simpleFull]);
	const cause = new Error(foobarString);
	const lines = [];
	const linesPromise = t.throwsAsync(errorArrayFromAsync(t, cause, subprocess.iterable(), lines));
	t.is(await Promise.race([linesPromise, subprocess]), await subprocess);
	t.deepEqual(lines, [noNewlinesChunks[0]]);
});

test('Abort stdout on iterator.return()', async t => {
	const subprocess = execa('noop-repeat.js', ['1', simpleFull]);
	const {error, lines} = await throwsAsync(t, subprocess, partialArrayFromAsync);
	t.deepEqual(lines, [noNewlinesChunks[0]]);
	assertStdoutAbort(t, subprocess, error);
	t.is(error, await t.throwsAsync(subprocess));
});

test('Abort stdout on iterator.throw()', async t => {
	const subprocess = execa('noop-repeat.js', ['1', simpleFull]);
	const cause = new Error(foobarString);
	const {error, lines} = await throwsAsync(t, subprocess.iterable(), errorArrayFromAsync.bind(undefined, t, cause));
	t.deepEqual(lines, [noNewlinesChunks[0]]);
	assertStdoutAbort(t, subprocess, error);
	t.is(error, await t.throwsAsync(subprocess));
});

test('Propagate subprocess failure', async t => {
	const subprocess = execa('noop-fail.js', ['1', simpleFull]);
	const {error, lines} = await throwsAsync(t, subprocess, arrayFromAsync);
	t.is(error, await t.throwsAsync(subprocess));
	t.deepEqual(lines, noNewlinesChunks);
});

const testStdoutError = async (t, destroyStdout, isAbort, cause) => {
	const subprocess = execa('noop-repeat.js', ['1', simpleFull]);
	subprocess.stdout.once('data', () => {
		destroyStdout(subprocess.stdout, cause);
	});

	const {error} = await throwsAsync(t, subprocess, arrayFromAsync);
	t.is(error.cause, cause);
	assertStdoutAbort(t, subprocess, error, isAbort ? undefined : cause);
	t.is(error, await t.throwsAsync(subprocess));
};

test('Propagate stdout abort', testStdoutError, subprocessStdout => subprocessStdout.destroy(), true);
test('Propagate stdout error', testStdoutError, (subprocessStdout, cause) => subprocessStdout.destroy(cause), false, new Error(foobarString));
test('Propagate stdout "error" event', testStdoutError, (subprocessStdout, cause) => subprocessStdout.emit('error', cause), true, new Error(foobarString));
