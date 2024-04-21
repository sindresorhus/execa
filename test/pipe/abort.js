import {once} from 'node:events';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const assertUnPipeError = async (t, pipePromise) => {
	const error = await t.throwsAsync(pipePromise);

	t.is(error.command, 'source.pipe(destination)');
	t.is(error.escapedCommand, error.command);

	t.is(typeof error.cwd, 'string');
	t.true(error.failed);
	t.false(error.timedOut);
	t.false(error.isCanceled);
	t.false(error.isTerminated);
	t.is(error.exitCode, undefined);
	t.is(error.signal, undefined);
	t.is(error.signalDescription, undefined);
	t.is(error.stdout, undefined);
	t.is(error.stderr, undefined);
	t.is(error.all, undefined);
	t.deepEqual(error.stdio, Array.from({length: error.stdio.length}));
	t.deepEqual(error.pipedFrom, []);

	t.true(error.originalMessage.includes('Pipe canceled'));
	t.true(error.shortMessage.includes(`Command failed: ${error.command}`));
	t.true(error.shortMessage.includes(error.originalMessage));
	t.true(error.message.includes(error.shortMessage));
};

test('Can unpipe a single subprocess', async t => {
	const abortController = new AbortController();
	const source = execa('stdin.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});

	abortController.abort();
	await assertUnPipeError(t, pipePromise);

	source.stdin.end(foobarString);
	destination.stdin.end('.');

	t.like(await destination, {stdout: '.'});
	t.like(await source, {stdout: foobarString});
});

test('Can use an already aborted signal', async t => {
	const abortController = new AbortController();
	abortController.abort();
	const source = execa('empty.js');
	const destination = execa('empty.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});

	await assertUnPipeError(t, pipePromise);
});

test('Can unpipe a subprocess among other sources', async t => {
	const abortController = new AbortController();
	const source = execa('stdin.js');
	const secondSource = execa('noop.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});
	const secondPipePromise = secondSource.pipe(destination);

	abortController.abort();
	await assertUnPipeError(t, pipePromise);

	source.stdin.end('.');

	t.is(await secondPipePromise, await destination);
	t.like(await destination, {stdout: foobarString});
	t.like(await source, {stdout: '.'});
	t.like(await secondSource, {stdout: foobarString});
});

test('Can unpipe a subprocess among other sources on the same subprocess', async t => {
	const abortController = new AbortController();
	const source = execa('stdin-both.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});
	const secondPipePromise = source.pipe(destination, {from: 'stderr'});

	abortController.abort();
	await assertUnPipeError(t, pipePromise);

	source.stdin.end(foobarString);

	t.is(await secondPipePromise, await destination);
	t.like(await destination, {stdout: foobarString});
	t.like(await source, {stdout: foobarString, stderr: foobarString});
});

test('Can unpipe a subprocess among other destinations', async t => {
	const abortController = new AbortController();
	const source = execa('stdin.js');
	const destination = execa('stdin.js');
	const secondDestination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});
	const secondPipePromise = source.pipe(secondDestination);

	abortController.abort();
	await assertUnPipeError(t, pipePromise);

	source.stdin.end(foobarString);
	destination.stdin.end('.');

	t.is(await secondPipePromise, await secondDestination);
	t.like(await destination, {stdout: '.'});
	t.like(await source, {stdout: foobarString});
	t.like(await secondDestination, {stdout: foobarString});
});

test('Can unpipe then re-pipe a subprocess', async t => {
	const abortController = new AbortController();
	const source = execa('stdin.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});

	source.stdin.write('.');
	const [firstWrite] = await once(source.stdout, 'data');
	t.is(firstWrite.toString(), '.');

	abortController.abort();
	await assertUnPipeError(t, pipePromise);

	source.pipe(destination);
	source.stdin.end('.');

	t.like(await destination, {stdout: '..'});
	t.like(await source, {stdout: '..'});
});

test('Can unpipe to prevent termination to propagate to source', async t => {
	const abortController = new AbortController();
	const source = execa('stdin.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});

	abortController.abort();
	await assertUnPipeError(t, pipePromise);

	destination.kill();
	t.like(await t.throwsAsync(destination), {signal: 'SIGTERM'});

	source.stdin.end(foobarString);
	t.like(await source, {stdout: foobarString});
});

test('Can unpipe to prevent termination to propagate to destination', async t => {
	const abortController = new AbortController();
	const source = execa('noop-forever.js', [foobarString]);
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {unpipeSignal: abortController.signal});

	abortController.abort();
	await assertUnPipeError(t, pipePromise);

	source.kill();
	t.like(await t.throwsAsync(source), {signal: 'SIGTERM'});

	destination.stdin.end(foobarString);
	t.like(await destination, {stdout: foobarString});
});
