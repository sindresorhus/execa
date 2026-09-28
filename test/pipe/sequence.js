import assert from 'node:assert/strict';
import {once} from 'node:events';
import process from 'node:process';
import {PassThrough} from 'node:stream';
import {setTimeout} from 'node:timers/promises';
import test from 'node:test';
import {assertRejects, assertLike} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {noopGenerator} from '../helpers/generator.js';
import {prematureClose} from '../helpers/stdio.js';

setFixtureDirectory();

const isLinux = process.platform === 'linux';
const timeoutSymbol = Symbol('timeout');

// The `unhandledRejection` event is what these tests assert on, but `node:test` also listens to it
// and fails any test during which it fires. That listener is removed while the event is observed,
// since the event itself is what `assertUnhandledRejection()` asserts on.
const observeUnhandledRejection = async () => {
	const testRunnerListeners = process.listeners('unhandledRejection');
	for (const listener of testRunnerListeners) {
		process.removeListener('unhandledRejection', listener);
	}

	try {
		return await once(process, 'unhandledRejection');
	} finally {
		for (const listener of testRunnerListeners) {
			process.on('unhandledRejection', listener);
		}
	}
};

const assertUnhandledRejection = async pipePromise => {
	const result = await Promise.race([
		observeUnhandledRejection(),
		setTimeout(5000, timeoutSymbol),
	]);

	assert.notEqual(result, timeoutSymbol);

	if (result === timeoutSymbol) {
		return;
	}

	const [reason, unhandledPromise] = result;
	assert.equal(unhandledPromise, pipePromise);
	assert.match(reason.message, /Command failed with exit code 2/);
};

const assertUnhandledPipePromise = async ({destinationOptions = {}, inspectPipePromise} = {}) => {
	const source = execa('fail.js');
	const destination = execa('fail.js', destinationOptions);
	const pipePromise = source.pipe(destination);
	await inspectPipePromise?.(pipePromise);
	await assertUnhandledRejection(pipePromise);
	await Promise.all([
		assertRejects(source),
		assertRejects(destination),
	]);
	await assertRejects(pipePromise);
};

test('Source stream abort -> destination success', async () => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	source.stdout.destroy();

	assert.equal(await assertRejects(pipePromise), await assertRejects(source));
	assertLike(await assertRejects(source), {exitCode: 1});
	await destination;
});

test('Source stream error -> destination success', async () => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const cause = new Error('test');
	source.stdout.destroy(cause);

	assert.equal(await assertRejects(pipePromise), await assertRejects(source));
	assertLike(await assertRejects(source), {originalMessage: cause.message, exitCode: 1});
	await destination;
});

test('Destination stream abort -> source failure', async () => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	destination.stdin.destroy();

	assert.equal(await assertRejects(pipePromise), await assertRejects(destination));
	assertLike(await assertRejects(destination), prematureClose);
	assertLike(await assertRejects(source), {exitCode: 1});
});

test('Destination stream error -> source failure', async () => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const cause = new Error('test');
	destination.stdin.destroy(cause);

	assert.equal(await assertRejects(pipePromise), await assertRejects(destination));
	assertLike(await assertRejects(destination), {originalMessage: cause.message, exitCode: 0});
	assertLike(await assertRejects(source), {exitCode: 1});
});

test('Source success -> destination success', async () => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	assertLike(await source, {stdout: foobarString});
	assertLike(await destination, {stdout: foobarString});
	assert.equal(await pipePromise, await destination);
});

test('Destination stream end -> source failure', async () => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	destination.stdin.end();

	assert.equal(await assertRejects(pipePromise), await assertRejects(source));
	await destination;
	assertLike(await assertRejects(source), {exitCode: 1});
});

test('Source normal failure -> destination success', async () => {
	const source = execa('noop-fail.js', ['1', foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	assert.equal(await assertRejects(pipePromise), await assertRejects(source));
	assertLike(await assertRejects(source), {stdout: foobarString, exitCode: 2});
	await destination;
});

test('Source normal failure -> deep destination success', async () => {
	const source = execa('noop-fail.js', ['1', foobarString]);
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = pipePromise.pipe(secondDestination);

	assert.equal(await assertRejects(pipePromise), await assertRejects(source));
	assert.equal(await assertRejects(secondPipePromise), await assertRejects(source));
	assertLike(await assertRejects(source), {stdout: foobarString, exitCode: 2});
	assertLike(await destination, {stdout: foobarString});
	assertLike(await secondDestination, {stdout: foobarString});
});

const testSourceTerminated = async signal => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	source.kill(signal);

	assert.equal(await assertRejects(pipePromise), await assertRejects(source));
	assertLike(await assertRejects(source), {signal});
	await destination;
};

test('Source SIGTERM -> destination success', () => testSourceTerminated('SIGTERM'));
test('Source SIGKILL -> destination success', () => testSourceTerminated('SIGKILL'));

test('Destination success before source -> source success', async () => {
	const passThroughStream = new PassThrough();
	const source = execa('stdin.js', {stdin: ['pipe', passThroughStream]});
	const destination = execa('empty.js');
	const pipePromise = source.pipe(destination);

	await destination;
	passThroughStream.end();
	await source;
	assert.equal(await pipePromise, await destination);
});

test('Destination normal failure -> source failure', async () => {
	const source = execa('noop-repeat.js');
	const destination = execa('fail.js');
	const pipePromise = source.pipe(destination);

	assert.equal(await assertRejects(pipePromise), await assertRejects(destination));
	assertLike(await assertRejects(destination), {exitCode: 2});
	assertLike(await assertRejects(source), {exitCode: 1});
});

test('Destination normal failure -> deep source failure', async () => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const secondDestination = execa('fail.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = pipePromise.pipe(secondDestination);

	assert.equal(await assertRejects(pipePromise), await assertRejects(destination));
	assert.equal(await assertRejects(secondPipePromise), await assertRejects(secondDestination));
	assertLike(await assertRejects(secondDestination), {exitCode: 2});
	assertLike(await assertRejects(destination), {exitCode: 1});
	assertLike(await assertRejects(source), {exitCode: 1});
});

const testDestinationTerminated = async signal => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	destination.kill(signal);

	assert.equal(await assertRejects(pipePromise), await assertRejects(destination));
	assertLike(await assertRejects(destination), {signal});
	assertLike(await assertRejects(source), {exitCode: 1});
};

test('Destination SIGTERM -> source abort', () => testDestinationTerminated('SIGTERM'));
test('Destination SIGKILL -> source abort', () => testDestinationTerminated('SIGKILL'));

test('Source already ended -> ignore source', async () => {
	const source = execa('noop.js', [foobarString]);
	await source;
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	assert.equal(await pipePromise, await destination);
	assertLike(await source, {stdout: foobarString});
	assertLike(await destination, {stdout: ''});
});

test('Source already aborted -> ignore source', async () => {
	const source = execa('noop.js', [foobarString]);
	source.stdout.destroy();
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	assert.equal(await pipePromise, await destination);
	assertLike(await source, {stdout: ''});
	assertLike(await destination, {stdout: ''});
});

test('Source already errored -> failure', async () => {
	const source = execa('noop.js', [foobarString]);
	const cause = new Error('test');
	source.stdout.destroy(cause);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	assert.equal(await assertRejects(pipePromise), await assertRejects(source));
	assertLike(await assertRejects(source), {cause});
	assertLike(await destination, {stdout: ''});
});

test('Destination already ended -> ignore source', async () => {
	const destination = execa('stdin.js');
	destination.stdin.end('.');
	await destination;
	const source = execa('noop.js', [foobarString]);
	const pipePromise = source.pipe(destination);

	assert.equal(await pipePromise, await destination);
	assertLike(await destination, {stdout: '.'});
	assertLike(await source, {stdout: ''});
});

test('Destination already aborted -> failure', async () => {
	const destination = execa('stdin.js');
	destination.stdin.destroy();
	assertLike(await assertRejects(destination), prematureClose);
	const source = execa('noop.js', [foobarString]);
	const pipePromise = source.pipe(destination);

	assert.equal(await assertRejects(pipePromise), await assertRejects(destination));
	assertLike(await source, {stdout: ''});
});

test('Destination already errored -> failure', async () => {
	const destination = execa('stdin.js');
	const cause = new Error('test');
	destination.stdin.destroy(cause);
	assertLike(await assertRejects(destination), {cause});
	const source = execa('noop.js', [foobarString]);
	const pipePromise = source.pipe(destination);

	assert.equal(await assertRejects(pipePromise), await assertRejects(destination));
	assertLike(await source, {stdout: ''});
});

test('Source normal failure + destination normal failure', async () => {
	const source = execa('noop-fail.js', ['1', foobarString]);
	const destination = execa('stdin-fail.js');
	const pipePromise = source.pipe(destination);

	assert.equal(await assertRejects(pipePromise), await assertRejects(destination));
	assertLike(await assertRejects(source), {stdout: foobarString, exitCode: 2});
	assertLike(await assertRejects(destination), {stdout: foobarString, exitCode: 2});
});

test('Simultaneous error on source and destination', async () => {
	const source = execa('noop.js', ['']);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	const sourceCause = new Error(foobarString);
	source.nodeChildProcess.emit('error', sourceCause);
	const destinationCause = new Error('other');
	destination.nodeChildProcess.emit('error', destinationCause);

	assert.equal(await assertRejects(pipePromise), await assertRejects(destination));
	assertLike(await assertRejects(source), {cause: sourceCause});
	assertLike(await assertRejects(destination), {cause: destinationCause});
});

test('Does not need to await individual promises', async () => {
	const source = execa('fail.js');
	const destination = execa('fail.js');
	await assertRejects(source.pipe(destination));
});

test('Need to await .pipe() return value', async () => {
	await assertUnhandledPipePromise();
});

test('Need to await .pipe() return value, "all" option', async () => {
	await assertUnhandledPipePromise({destinationOptions: {all: true}});
});

test('Need to await .pipe() return value after inspecting lazy .all', async () => {
	await assertUnhandledPipePromise({
		destinationOptions: {all: true},
		inspectPipePromise(pipePromise) {
			const descriptor = Object.getOwnPropertyDescriptor(pipePromise, 'all');
			assert.equal(typeof descriptor.get, 'function');
		},
	});
});

test('Need to await .pipe() return value after getOneMessage()', async () => {
	const source = execa('fail.js');
	const destination = execa('ipc-send-twice.js', {ipc: true});
	const pipePromise = source.pipe(destination);

	assert.equal(await pipePromise.getOneMessage(), 'foo');
	await assertUnhandledRejection(pipePromise);
	await assertRejects(source);
	await destination;
	await assertRejects(pipePromise);
});

test('Need to await .pipe() return value after paused getEachMessage()', async () => {
	const source = execa('fail.js');
	const destination = execa('ipc-send-twice.js', {ipc: true});
	const pipePromise = source.pipe(destination);
	const iterator = pipePromise.getEachMessage();

	assert.deepEqual(await iterator.next(), {done: false, value: 'foo'});
	await assertUnhandledRejection(pipePromise);
	await assertRejects(source);
	await destination;
	await assertRejects(pipePromise);
});

if (isLinux) {
	const testYesHead = async (useStdoutTransform, useStdinTransform, all) => {
		const source = execa('yes', {stdout: useStdoutTransform ? noopGenerator(false) : 'pipe', all});
		const destination = execa('head', ['-n', '1'], {stdin: useStdinTransform ? noopGenerator(false) : 'pipe'});
		const pipePromise = source.pipe(destination);
		assert.equal(await assertRejects(pipePromise), await assertRejects(source));
		assertLike(await destination, {stdout: 'y'});
		const sourceError = await assertRejects(source);
		assert.equal(sourceError.exitCode, 1);
		assert.match(sourceError.stderr, /^yes: standard output: (?:Broken pipe|Connection reset by peer)$/);

		assert.equal(source.stdout.readableEnded, false);
		assert.equal(source.stdout.errored, null);
		assert.equal(source.stdout.destroyed, true);
		assert.equal(source.stderr.readableEnded, true);
		assert.equal(source.stderr.errored, null);
		assert.equal(source.stderr.destroyed, true);

		if (!all) {
			return;
		}

		assert.equal(source.all.readableEnded, true);
		assert.equal(source.all.errored, null);
		assert.equal(source.all.destroyed, true);
	};

	test('Works with yes | head', () => testYesHead(false, false, false));
	test('Works with yes | head, input transform', () => testYesHead(false, true, false));
	test('Works with yes | head, output transform', () => testYesHead(true, false, false));
	test('Works with yes | head, input/output transform', () => testYesHead(true, true, false));
	test('Works with yes | head, "all" option', () => testYesHead(false, false, true));
	test('Works with yes | head, "all" option, input transform', () => testYesHead(false, true, true));
	test('Works with yes | head, "all" option, output transform', () => testYesHead(true, false, true));
	test('Works with yes | head, "all" option, input/output transform', () => testYesHead(true, true, true));
}
