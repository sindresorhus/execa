import {once} from 'node:events';
import process from 'node:process';
import {PassThrough} from 'node:stream';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {noopGenerator} from '../helpers/generator.js';
import {prematureClose} from '../helpers/stdio.js';

setFixtureDirectory();

const isLinux = process.platform === 'linux';
const timeoutSymbol = Symbol('timeout');

const assertUnhandledRejection = async (t, pipePromise, unhandledRejectionPromise) => {
	const result = await Promise.race([
		unhandledRejectionPromise,
		setTimeout(500, timeoutSymbol),
	]);

	t.not(result, timeoutSymbol);

	if (result === timeoutSymbol) {
		return;
	}

	const [reason, unhandledPromise] = result;
	t.is(unhandledPromise, pipePromise);
	t.regex(reason.message, /Command failed with exit code 2/);
};

const assertUnhandledPipePromise = async (t, {destinationOptions = {}, inspectPipePromise} = {}) => {
	const source = execa('fail.js');
	const destination = execa('fail.js', destinationOptions);
	const pipePromise = source.pipe(destination);
	const unhandledRejectionPromise = once(process, 'unhandledRejection');
	await inspectPipePromise?.(pipePromise);
	await assertUnhandledRejection(t, pipePromise, unhandledRejectionPromise);
	await Promise.all([
		t.throwsAsync(source),
		t.throwsAsync(destination),
	]);
	await t.throwsAsync(pipePromise);
};

test('Source stream abort -> destination success', async t => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	source.stdout.destroy();

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(source));
	t.like(await t.throwsAsync(source), {exitCode: 1});
	await destination;
});

test('Source stream error -> destination success', async t => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const cause = new Error('test');
	source.stdout.destroy(cause);

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(source));
	t.like(await t.throwsAsync(source), {originalMessage: cause.message, exitCode: 1});
	await destination;
});

test('Destination stream abort -> source failure', async t => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	destination.stdin.destroy();

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(destination));
	t.like(await t.throwsAsync(destination), prematureClose);
	t.like(await t.throwsAsync(source), {exitCode: 1});
});

test('Destination stream error -> source failure', async t => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const cause = new Error('test');
	destination.stdin.destroy(cause);

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(destination));
	t.like(await t.throwsAsync(destination), {originalMessage: cause.message, exitCode: 0});
	t.like(await t.throwsAsync(source), {exitCode: 1});
});

test('Source success -> destination success', async t => {
	const source = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	t.like(await source, {stdout: foobarString});
	t.like(await destination, {stdout: foobarString});
	t.is(await pipePromise, await destination);
});

test('Destination stream end -> source failure', async t => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	destination.stdin.end();

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(source));
	await destination;
	t.like(await t.throwsAsync(source), {exitCode: 1});
});

test('Source normal failure -> destination success', async t => {
	const source = execa('noop-fail.js', ['1', foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(source));
	t.like(await t.throwsAsync(source), {stdout: foobarString, exitCode: 2});
	await destination;
});

test('Source normal failure -> deep destination success', async t => {
	const source = execa('noop-fail.js', ['1', foobarString]);
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = pipePromise.pipe(secondDestination);

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(source));
	t.is(await t.throwsAsync(secondPipePromise), await t.throwsAsync(source));
	t.like(await t.throwsAsync(source), {stdout: foobarString, exitCode: 2});
	t.like(await destination, {stdout: foobarString});
	t.like(await secondDestination, {stdout: foobarString});
});

const testSourceTerminated = async (t, signal) => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	source.kill(signal);

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(source));
	t.like(await t.throwsAsync(source), {signal});
	await destination;
};

test('Source SIGTERM -> destination success', testSourceTerminated, 'SIGTERM');
test('Source SIGKILL -> destination success', testSourceTerminated, 'SIGKILL');

test('Destination success before source -> source success', async t => {
	const passThroughStream = new PassThrough();
	const source = execa('stdin.js', {stdin: ['pipe', passThroughStream]});
	const destination = execa('empty.js');
	const pipePromise = source.pipe(destination);

	await destination;
	passThroughStream.end();
	await source;
	t.is(await pipePromise, await destination);
});

test('Destination normal failure -> source failure', async t => {
	const source = execa('noop-repeat.js');
	const destination = execa('fail.js');
	const pipePromise = source.pipe(destination);

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(destination));
	t.like(await t.throwsAsync(destination), {exitCode: 2});
	t.like(await t.throwsAsync(source), {exitCode: 1});
});

test('Destination normal failure -> deep source failure', async t => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const secondDestination = execa('fail.js');
	const pipePromise = source.pipe(destination);
	const secondPipePromise = pipePromise.pipe(secondDestination);

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(destination));
	t.is(await t.throwsAsync(secondPipePromise), await t.throwsAsync(secondDestination));
	t.like(await t.throwsAsync(secondDestination), {exitCode: 2});
	t.like(await t.throwsAsync(destination), {exitCode: 1});
	t.like(await t.throwsAsync(source), {exitCode: 1});
});

const testDestinationTerminated = async (t, signal) => {
	const source = execa('noop-repeat.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);
	destination.kill(signal);

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(destination));
	t.like(await t.throwsAsync(destination), {signal});
	t.like(await t.throwsAsync(source), {exitCode: 1});
};

test('Destination SIGTERM -> source abort', testDestinationTerminated, 'SIGTERM');
test('Destination SIGKILL -> source abort', testDestinationTerminated, 'SIGKILL');

test('Source already ended -> ignore source', async t => {
	const source = execa('noop.js', [foobarString]);
	await source;
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	t.is(await pipePromise, await destination);
	t.like(await source, {stdout: foobarString});
	t.like(await destination, {stdout: ''});
});

test('Source already aborted -> ignore source', async t => {
	const source = execa('noop.js', [foobarString]);
	source.stdout.destroy();
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	t.is(await pipePromise, await destination);
	t.like(await source, {stdout: ''});
	t.like(await destination, {stdout: ''});
});

test('Source already errored -> failure', async t => {
	const source = execa('noop.js', [foobarString]);
	const cause = new Error('test');
	source.stdout.destroy(cause);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(source));
	t.like(await t.throwsAsync(source), {cause});
	t.like(await destination, {stdout: ''});
});

test('Destination already ended -> ignore source', async t => {
	const destination = execa('stdin.js');
	destination.stdin.end('.');
	await destination;
	const source = execa('noop.js', [foobarString]);
	const pipePromise = source.pipe(destination);

	t.is(await pipePromise, await destination);
	t.like(await destination, {stdout: '.'});
	t.like(await source, {stdout: ''});
});

test('Destination already aborted -> failure', async t => {
	const destination = execa('stdin.js');
	destination.stdin.destroy();
	t.like(await t.throwsAsync(destination), prematureClose);
	const source = execa('noop.js', [foobarString]);
	const pipePromise = source.pipe(destination);

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(destination));
	t.like(await source, {stdout: ''});
});

test('Destination already errored -> failure', async t => {
	const destination = execa('stdin.js');
	const cause = new Error('test');
	destination.stdin.destroy(cause);
	t.like(await t.throwsAsync(destination), {cause});
	const source = execa('noop.js', [foobarString]);
	const pipePromise = source.pipe(destination);

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(destination));
	t.like(await source, {stdout: ''});
});

test('Source normal failure + destination normal failure', async t => {
	const source = execa('noop-fail.js', ['1', foobarString]);
	const destination = execa('stdin-fail.js');
	const pipePromise = source.pipe(destination);

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(destination));
	t.like(await t.throwsAsync(source), {stdout: foobarString, exitCode: 2});
	t.like(await t.throwsAsync(destination), {stdout: foobarString, exitCode: 2});
});

test('Simultaneous error on source and destination', async t => {
	const source = execa('noop.js', ['']);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	const sourceCause = new Error(foobarString);
	source.emit('error', sourceCause);
	const destinationCause = new Error('other');
	destination.emit('error', destinationCause);

	t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(destination));
	t.like(await t.throwsAsync(source), {cause: {originalMessage: sourceCause.originalMessage}});
	t.like(await t.throwsAsync(destination), {cause: {originalMessage: destinationCause.originalMessage}});
});

test('Does not need to await individual promises', async t => {
	const source = execa('fail.js');
	const destination = execa('fail.js');
	await t.throwsAsync(source.pipe(destination));
});

test.serial('Need to await .pipe() return value', async t => {
	await assertUnhandledPipePromise(t);
});

test.serial('Need to await .pipe() return value, "all" option', async t => {
	await assertUnhandledPipePromise(t, {destinationOptions: {all: true}});
});

test.serial('Need to await .pipe() return value after inspecting lazy .all', async t => {
	await assertUnhandledPipePromise(t, {
		destinationOptions: {all: true},
		inspectPipePromise(pipePromise) {
			const descriptor = Object.getOwnPropertyDescriptor(pipePromise, 'all');
			t.is(typeof descriptor.get, 'function');
		},
	});
});

test.serial('Need to await .pipe() return value after getOneMessage()', async t => {
	const source = execa('fail.js');
	const destination = execa('ipc-send-twice.js', {ipc: true});
	const pipePromise = source.pipe(destination);
	const unhandledRejectionPromise = once(process, 'unhandledRejection');

	t.is(await pipePromise.getOneMessage(), 'foo');
	await assertUnhandledRejection(t, pipePromise, unhandledRejectionPromise);
	await t.throwsAsync(source);
	await destination;
	await t.throwsAsync(pipePromise);
});

test.serial('Need to await .pipe() return value after paused getEachMessage()', async t => {
	const source = execa('fail.js');
	const destination = execa('ipc-send-twice.js', {ipc: true});
	const pipePromise = source.pipe(destination);
	const unhandledRejectionPromise = once(process, 'unhandledRejection');
	const iterator = pipePromise.getEachMessage();

	t.deepEqual(await iterator.next(), {done: false, value: 'foo'});
	await assertUnhandledRejection(t, pipePromise, unhandledRejectionPromise);
	await t.throwsAsync(source);
	await destination;
	await t.throwsAsync(pipePromise);
});

if (isLinux) {
	const testYesHead = async (t, useStdoutTransform, useStdinTransform, all) => {
		const source = execa('yes', {stdout: useStdoutTransform ? noopGenerator(false) : 'pipe', all});
		const destination = execa('head', ['-n', '1'], {stdin: useStdinTransform ? noopGenerator(false) : 'pipe'});
		const pipePromise = source.pipe(destination);
		t.is(await t.throwsAsync(pipePromise), await t.throwsAsync(source));
		t.like(await destination, {stdout: 'y'});
		const sourceError = await t.throwsAsync(source);
		t.is(sourceError.exitCode, 1);
		t.regex(sourceError.stderr, /^yes: standard output: (?:Broken pipe|Connection reset by peer)$/);

		t.false(source.stdout.readableEnded);
		t.is(source.stdout.errored, null);
		t.true(source.stdout.destroyed);
		t.true(source.stderr.readableEnded);
		t.is(source.stderr.errored, null);
		t.true(source.stderr.destroyed);

		if (all) {
			t.true(source.all.readableEnded);
			t.is(source.all.errored, null);
			t.true(source.all.destroyed);
		}
	};

	test.serial('Works with yes | head', testYesHead, false, false, false);
	test.serial('Works with yes | head, input transform', testYesHead, false, true, false);
	test.serial('Works with yes | head, output transform', testYesHead, true, false, false);
	test.serial('Works with yes | head, input/output transform', testYesHead, true, true, false);
	test.serial('Works with yes | head, "all" option', testYesHead, false, false, true);
	test.serial('Works with yes | head, "all" option, input transform', testYesHead, false, true, true);
	test.serial('Works with yes | head, "all" option, output transform', testYesHead, true, false, true);
	test.serial('Works with yes | head, "all" option, input/output transform', testYesHead, true, true, true);
}
