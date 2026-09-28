import assert from 'node:assert/strict';
import {setTimeout} from 'node:timers/promises';
import {Readable} from 'node:stream';
import {text} from 'node:stream/consumers';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {simpleFull, noNewlinesFull, noNewlinesChunks} from '../helpers/lines.js';
import {foobarString, foobarArray} from '../helpers/input.js';
/* eslint-disable node-test/no-conditional-assertion -- shared helper functions are called from conditional paths on purpose */

setFixtureDirectory();

const timeoutSymbol = Symbol('timeout');

// `stdin.js` pipes its stdin to its stdout, so the piped output equals the source output
const pipeSimple = () => execa('noop-fd.js', ['1', simpleFull]).pipe('stdin.js');
const pipeAll = () => execa('noop-fd.js', ['1', simpleFull]).pipe('stdin.js', {all: true});
const pipeDistinctBoth = () => execa('noop-fd.js', ['1', simpleFull]).pipe('stdin-distinct-both.js');

const assertSettles = async (promise, timeout = 1000) => {
	const result = await Promise.race([
		promise,
		// Several pipe cancellation tests are specifically checking that a pending reader does not hang.
		setTimeout(timeout, timeoutSymbol, {ref: false}),
	]);

	assert.notEqual(result, timeoutSymbol);
	return result;
};

const cleanupSubprocesses = async (...subprocesses) => {
	for (const subprocess of subprocesses) {
		subprocess.kill();
	}

	await Promise.allSettled(subprocesses);
};

const getPipeMessages = async piped => {
	const messages = await Array.fromAsync(piped.getEachMessage());

	return messages;
};

test('The .pipe() return value can be iterated', async () => {
	const lines = await Array.fromAsync(pipeSimple());

	assert.deepEqual(lines, noNewlinesChunks);
});

test('The .pipe() return value has an .iterable() method', async () => {
	const lines = await Array.fromAsync(pipeSimple().iterable());

	assert.deepEqual(lines, noNewlinesChunks);
});

test('The .pipe() return value has a .readable() method', async () => {
	assert.equal(await text(pipeSimple().readable()), simpleFull);
});

test('The .pipe() return value has a .readableStream() method', async () => {
	assert.equal(await text(pipeSimple().readableStream()), simpleFull);
});

test('The .pipe() return value .readable() can be called multiple times', async () => {
	const piped = pipeSimple();
	const [output, secondOutput] = await Promise.all([
		text(piped.readable()),
		text(piped.readable()),
	]);

	assert.equal(output, simpleFull);
	assert.equal(secondOutput, simpleFull);
});

test('The .pipe() return value .readable() keeps conversion options', async () => {
	const chunks = await Array.fromAsync(pipeSimple().readable({binary: false, preserveNewlines: false}));

	assert.deepEqual(chunks, noNewlinesChunks);
	assert.equal(chunks.join(''), noNewlinesFull);
});

test('The .pipe() return value does not have a .writable() method', async () => {
	const piped = pipeSimple();
	assert.equal(piped.writable, undefined);
	assert.equal(piped.duplex, undefined);
	assert.equal(piped.writableStream, undefined);
	assert.equal(piped.transformStream, undefined);
	await piped;
});

test('The .pipe() return value does not have .all unless destination uses the "all" option', async () => {
	const piped = pipeSimple();
	const descriptor = Object.getOwnPropertyDescriptor(piped, 'all');

	assert.equal(piped.all, undefined);
	assert.equal(descriptor.value, undefined);
	assert.equal(descriptor.get, undefined);
	await piped;
});

test('The .pipe() return value has an .all property', async () => {
	const piped = pipeAll();
	assert.ok(piped.all instanceof Readable);
	assert.equal(await text(piped.all), simpleFull);
	await piped;
});

test('The .pipe() return value .all is created lazily and cached', async () => {
	const piped = pipeAll();
	const descriptor = Object.getOwnPropertyDescriptor(piped, 'all');

	assert.equal(typeof descriptor.get, 'function');
	const {all} = piped;
	assert.ok(all instanceof Readable);
	assert.equal(piped.all, all);
	assert.equal(Object.getOwnPropertyDescriptor(piped, 'all').get, undefined);
	assert.equal(await text(all), simpleFull);
	await piped;
});

test('The .pipe() return value .readable() can read destination stderr', async () => {
	const piped = pipeDistinctBoth();

	assert.equal(await text(piped.readable({from: 'stderr'})), `${simpleFull}:stderr`);
	await piped;
});

test('The .pipe() return value .iterable() can read destination stderr', async () => {
	const piped = pipeDistinctBoth();
	const lines = await Array.fromAsync(piped.iterable({from: 'stderr'}));

	assert.deepEqual(lines, ['aaa', 'bbb', 'ccc:stderr']);
	await piped;
});

test('The .pipe() return value has IPC methods', async () => {
	const piped = execa('empty.js').pipe('ipc-send-twice.js', {ipc: true});
	assert.deepEqual(await getPipeMessages(piped), foobarArray);
	const {ipcOutput} = await piped;
	assert.deepEqual(ipcOutput, foobarArray);
});

test('The .pipe() return value .getEachMessage() can be called twice at the same time', async () => {
	const piped = execa('empty.js').pipe('ipc-send-twice.js', {ipc: true});

	assert.deepEqual(
		await Promise.all([getPipeMessages(piped), getPipeMessages(piped)]),
		[foobarArray, foobarArray],
	);

	const {ipcOutput} = await piped;
	assert.deepEqual(ipcOutput, foobarArray);
});

test('The .pipe() return value .getEachMessage() preserves setup errors', async () => {
	const piped = execa('empty.js').pipe('ipc-send-twice.js', {ipc: true});

	assertThrows(() => {
		piped.getEachMessage(null);
	}, {instanceOf: TypeError});

	await piped;
});

test('The .pipe() return value .getEachMessage() waits for source failure', async () => {
	const piped = execa('fail.js').pipe('ipc-send-twice.js', {ipc: true});

	await assertRejects(async () => {
		for await (const message of piped.getEachMessage()) {
			assert.ok(foobarArray.includes(message));
		}
	}, {message: /Command failed with exit code 2/});
});

test('The .pipe() return value .getEachMessage() waits for pipe cancellation', async t => {
	const abortController = new AbortController();
	const source = execa('noop-repeat.js');
	const destination = execa('ipc-send-forever.js', {ipc: true});
	t.after(async () => {
		await cleanupSubprocesses(source, destination);
	});

	const piped = source.pipe(destination, {unpipeSignal: abortController.signal});
	const iterator = piped.getEachMessage();
	assert.deepEqual(await iterator.next(), {done: false, value: foobarString});

	const readerPromise = assertRejects(iterator.next(), {message: /Pipe canceled/});
	abortController.abort();
	await assertSettles(readerPromise);
});

test('The .pipe() return value .getEachMessage() cancels every pending reader', async t => {
	const abortController = new AbortController();
	const source = execa('noop-repeat.js');
	const destination = execa('ipc-send-forever.js', {ipc: true});
	t.after(async () => {
		await cleanupSubprocesses(source, destination);
	});

	const piped = source.pipe(destination, {unpipeSignal: abortController.signal});
	const iterators = [
		piped.getEachMessage(),
		piped.getEachMessage(),
	];

	assert.deepEqual(
		await Promise.all(iterators.map(async iterator => iterator.next())),
		[
			{done: false, value: foobarString},
			{done: false, value: foobarString},
		],
	);

	const readerPromises = iterators.map(iterator => assertRejects(iterator.next(), {message: /Pipe canceled/}));
	abortController.abort();
	await Promise.all(readerPromises.map(async readerPromise => assertSettles(readerPromise)));
});

const assertCanceledPipeMessageReader = async (t, getReader, shouldAbortBeforePipe = false) => {
	const abortController = new AbortController();
	if (shouldAbortBeforePipe) {
		abortController.abort();
	}

	const source = execa('noop-repeat.js');
	const destination = execa('ipc-get.js', {ipc: true});
	t.after(async () => {
		await cleanupSubprocesses(source, destination);
	});

	const piped = source.pipe(destination, {unpipeSignal: abortController.signal});
	const readerPromise = assertRejects(getReader(piped), {message: /Pipe canceled/});

	if (!shouldAbortBeforePipe) {
		abortController.abort();
	}

	await assertSettles(readerPromise);
	await assertRejects(piped, {message: /Pipe canceled/});
};

test('The .pipe() return value .getEachMessage() waits for pipe cancellation before IPC messages', async t => {
	await assertCanceledPipeMessageReader(t, piped => piped.getEachMessage().next());
});

test('The .pipe() return value .getEachMessage() waits for already canceled pipes', async t => {
	await assertCanceledPipeMessageReader(t, piped => piped.getEachMessage().next(), true);
});

test('The .pipe() return value .getOneMessage() waits for pipe cancellation before IPC messages', async t => {
	await assertCanceledPipeMessageReader(t, piped => piped.getOneMessage());
});

test('The .pipe() return value .getOneMessage() waits for already canceled pipes', async t => {
	await assertCanceledPipeMessageReader(t, piped => piped.getOneMessage(), true);
});

test('The .pipe() return value .getEachMessage() waits for the pipe when the iterator is returned', async t => {
	const source = execa('empty.js');
	const destination = execa('ipc-send-forever.js', {ipc: true});
	t.after(async () => {
		await cleanupSubprocesses(source, destination);
	});

	const piped = source.pipe(destination);
	const iterator = piped.getEachMessage();

	assert.deepEqual(await iterator.next(), {done: false, value: foobarString});
	const returnPromise = assertRejects(iterator.return());
	destination.kill();
	const error = await returnPromise;
	assert.equal(error.isTerminated, true);
	await Promise.allSettled([source, destination, piped]);
});

test('The .pipe() return value .getEachMessage() propagates source failure when the iterator is returned', async () => {
	const source = execa('ipc-echo-fail.js', {ipc: true});
	const piped = source.pipe('ipc-send-wait-print.js', {ipc: true});
	const iterator = piped.getEachMessage();

	assert.deepEqual(await iterator.next(), {done: false, value: foobarString});
	const returnPromise = assertRejects(iterator.return(), {message: /Command failed with exit code 1/});
	await source.sendMessage(foobarString);
	await returnPromise;
});

test('The .pipe() return value .getEachMessage() propagates destination failure', async () => {
	const piped = execa('empty.js').pipe('ipc-send-fail.js', {ipc: true});

	await assertRejects(async () => {
		for await (const message of piped.getEachMessage()) {
			assert.equal(message, foobarString);
		}
	}, {message: /Command failed with exit code 1/});

	const {ipcOutput} = await assertRejects(piped);
	assert.deepEqual(ipcOutput, [foobarString]);
});

test('The .pipe() return value .getEachMessage() waits for the pipe when the consumer throws', async () => {
	const piped = execa('empty.js').pipe('ipc-send-wait-print.js', {ipc: true});
	const cause = new Error(foobarString);

	assert.equal(await assertRejects(async () => {
		// eslint-disable-next-line no-unreachable-loop
		for await (const message of piped.getEachMessage()) {
			assert.equal(message, foobarString);
			throw cause;
		}
	}), cause);

	const {ipcOutput, stdout} = await piped;
	assert.deepEqual(ipcOutput, [foobarString]);
	assert.equal(stdout, '.');
});

test('The .pipe() return value .getEachMessage() validates IPC immediately', async t => {
	const source = execa('stdin.js');
	const destination = execa('stdin.js');
	t.after(async () => {
		await cleanupSubprocesses(source, destination);
	});

	const piped = source.pipe(destination);
	const {message} = assertThrows(() => piped.getEachMessage());

	assert.ok(message.includes('subprocess.getEachMessage() can only be used'));
	source.kill();
	destination.kill();
	await Promise.allSettled([source, destination, piped]);
});

test('The .pipe() return value can exchange IPC messages', async () => {
	const piped = execa('empty.js').pipe('ipc-echo.js', {ipc: true});
	await piped.sendMessage(foobarString);
	assert.equal(await piped.getOneMessage(), foobarString);
	await piped;
});

test('A chained .pipe() return value can be iterated', async () => {
	const lines = await Array.fromAsync(execa('noop-fd.js', ['1', simpleFull]).pipe('stdin.js').pipe('stdin.js'));

	assert.deepEqual(lines, noNewlinesChunks);
});

test('The .pipe() return value still awaits both subprocesses', async () => {
	await assertRejects(execa('fail.js').pipe('stdin.js'), {message: /Command failed with exit code 2/});
});

test('The .pipe() return value iteration waits for source failure', async () => {
	const piped = execa('fail.js').pipe('stdin.js');

	await assertRejects(async () => {
		for await (const line of piped) {
			assert.fail(`Unexpected line: ${line}`);
		}
	}, {message: /Command failed with exit code 2/});
});

test('The .pipe() return value .readable() waits for source failure', async () => {
	const piped = execa('fail.js').pipe('stdin.js');

	await assertRejects(text(piped.readable()), {message: /Command failed with exit code 2/});
});

test('The .pipe() return value .readableStream() waits for source failure', async () => {
	const piped = execa('fail.js').pipe('stdin.js');

	await assertRejects(text(piped.readableStream()), {message: /Command failed with exit code 2/});
});

test('The .pipe() return value .all waits for source failure', async () => {
	const piped = execa('fail.js').pipe('stdin.js', {all: true});

	await assertRejects(text(piped.all), {message: /Command failed with exit code 2/});
});

const assertCanceledPipeReader = async (t, getReader, shouldAbortBeforePipe = false) => {
	const abortController = new AbortController();
	if (shouldAbortBeforePipe) {
		abortController.abort();
	}

	const source = execa('stdin.js');
	const destination = execa('stdin.js', {all: true});
	t.after(async () => {
		await cleanupSubprocesses(source, destination);
	});

	const piped = source.pipe(destination, {unpipeSignal: abortController.signal});
	const readerPromise = assertRejects(getReader(piped), {message: /Pipe canceled/});

	if (!shouldAbortBeforePipe) {
		abortController.abort();
	}

	await assertSettles(readerPromise, 200);
};

test('The .pipe() return value .readable() waits for pipe cancellation', async t => {
	await assertCanceledPipeReader(t, piped => text(piped.readable()));
});

test('The .pipe() return value .all waits for pipe cancellation', async t => {
	await assertCanceledPipeReader(t, piped => text(piped.all));
});

test('The .pipe() return value .readable() waits for already canceled pipes', async t => {
	await assertCanceledPipeReader(t, piped => text(piped.readable()), true);
});

test('The .pipe() return value .all waits for already canceled pipes', async t => {
	await assertCanceledPipeReader(t, piped => text(piped.all), true);
});

test('Multiple sources piped to one destination each expose the destination methods', async () => {
	const destination = execa('stdin.js');
	const piped = [
		execa('noop-fd.js', ['1', foobarString]).pipe(destination),
		execa('noop-fd.js', ['1', foobarString]).pipe(destination),
	];

	for (const pipePromise of piped) {
		assert.equal(typeof pipePromise.iterable, 'function');
		assert.equal(typeof pipePromise[Symbol.asyncIterator], 'function');
	}

	await Promise.all(piped);
});

/* eslint-enable node-test/no-conditional-assertion */
