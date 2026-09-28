import assert from 'node:assert/strict';
import {once} from 'node:events';
import test from 'node:test';
import {assertRejects, assertLike} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const assertUnPipeError = async pipePromise => {
	const error = await assertRejects(pipePromise);

	assert.equal(error.command, 'source.pipe(destination)');
	assert.equal(error.escapedCommand, error.command);

	assert.equal(typeof error.cwd, 'string');
	assert.equal(error.failed, true);
	assert.equal(error.timedOut, false);
	assert.equal(error.isCanceled, false);
	assert.equal(error.isTerminated, false);
	assert.equal(error.exitCode, undefined);
	assert.equal(error.signal, undefined);
	assert.equal(error.signalDescription, undefined);
	assert.equal(error.stdout, undefined);
	assert.equal(error.stderr, undefined);
	assert.equal(error.all, undefined);
	assert.deepEqual(error.stdio, Array.from({length: error.stdio.length}));
	assert.deepEqual(error.pipedFrom, []);

	assert.ok(error.originalMessage.includes('Pipe canceled'));
	assert.ok(error.shortMessage.includes(`Command failed: ${error.command}`));
	assert.ok(error.shortMessage.includes(error.originalMessage));
	assert.ok(error.message.includes(error.shortMessage));
};

test('Can unpipe a single subprocess', async () => {
	const abortController = new AbortController();
	const source = execa('stdin.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});

	abortController.abort();
	await assertUnPipeError(pipePromise);

	source.stdin.end(foobarString);
	destination.stdin.end('.');

	assertLike(await destination, {stdout: '.'});
	assertLike(await source, {stdout: foobarString});
});

test('Can use an already aborted signal', async () => {
	const abortController = new AbortController();
	abortController.abort();
	const source = execa('empty.js');
	const destination = execa('empty.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});

	await assertUnPipeError(pipePromise);
});

test('Can unpipe a subprocess among other sources', async () => {
	const abortController = new AbortController();
	const source = execa('stdin.js');
	const secondSource = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});
	const secondPipePromise = secondSource.pipe(destination);

	abortController.abort();
	await assertUnPipeError(pipePromise);

	source.stdin.end('.');

	assert.equal(await secondPipePromise, await destination);
	assertLike(await destination, {stdout: foobarString});
	assertLike(await source, {stdout: '.'});
	assertLike(await secondSource, {stdout: foobarString});
});

test('Can unpipe a subprocess among other sources on the same subprocess', async () => {
	const abortController = new AbortController();
	const source = execa('stdin-both.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});
	const secondPipePromise = source.pipe(destination, {from: 'stderr'});

	abortController.abort();
	await assertUnPipeError(pipePromise);

	source.stdin.end(foobarString);

	assert.equal(await secondPipePromise, await destination);
	assertLike(await destination, {stdout: foobarString});
	assertLike(await source, {stdout: foobarString, stderr: foobarString});
});

test('Can unpipe a subprocess among other destinations', async () => {
	const abortController = new AbortController();
	const source = execa('stdin.js');
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});
	const secondPipePromise = source.pipe(secondDestination);

	abortController.abort();
	await assertUnPipeError(pipePromise);

	source.stdin.end(foobarString);
	destination.stdin.end('.');

	assert.equal(await secondPipePromise, await secondDestination);
	assertLike(await destination, {stdout: '.'});
	assertLike(await source, {stdout: foobarString});
	assertLike(await secondDestination, {stdout: foobarString});
});

test('Can unpipe then re-pipe a subprocess', async () => {
	const abortController = new AbortController();
	const source = execa('stdin.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});

	source.stdin.write('.');
	const [firstWrite] = await once(source.stdout, 'data');
	assert.equal(firstWrite.toString(), '.');

	abortController.abort();
	await assertUnPipeError(pipePromise);

	source.pipe(destination);
	source.stdin.end('.');

	assertLike(await destination, {stdout: '..'});
	assertLike(await source, {stdout: '..'});
});

test('Can unpipe to prevent termination to propagate to source', async () => {
	const abortController = new AbortController();
	const source = execa('stdin.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});

	abortController.abort();
	await assertUnPipeError(pipePromise);

	destination.kill();
	assertLike(await assertRejects(destination), {signal: 'SIGTERM'});

	source.stdin.end(foobarString);
	assertLike(await source, {stdout: foobarString});
});

test('Can unpipe to prevent termination to propagate to destination', async () => {
	const abortController = new AbortController();
	const source = execa('noop-forever.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});

	abortController.abort();
	await assertUnPipeError(pipePromise);

	source.kill();
	assertLike(await assertRejects(source), {signal: 'SIGTERM'});

	destination.stdin.end(foobarString);
	assertLike(await destination, {stdout: foobarString});
});
