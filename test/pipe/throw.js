import test from 'ava';
import {execa} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {assertPipeError} from '../helpers/pipe.js';

setFixtureDirectory();

test('Destination stream is ended when first argument is invalid', async t => {
	const source = execa('empty.js', {stdout: 'ignore'});
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	await assertPipeError(t, pipePromise, 'option is incompatible');
	await source;
	t.like(await destination, {stdout: ''});
});

test('Destination stream is ended when first argument is invalid - $', async t => {
	const pipePromise = execa('empty.js', {stdout: 'ignore'}).pipe`stdin.js`;
	await assertPipeError(t, pipePromise, 'option is incompatible');
});

test('Source stream is aborted when second argument is invalid', async t => {
	const source = execa('noop.js', [foobarString]);
	const pipePromise = source.pipe(false);

	await assertPipeError(t, pipePromise, 'an Execa subprocess');
	t.like(await source, {stdout: ''});
});

test('Both arguments might be invalid', async t => {
	const source = execa('empty.js', {stdout: 'ignore'});
	const pipePromise = source.pipe(false);

	await assertPipeError(t, pipePromise, 'an Execa subprocess');
	t.like(await source, {stdout: undefined});
});

// The destination subprocess is spawned before the `to` option is validated, so its error must be handled.
// This runs in another process, since that is where the unhandled rejection crashes it.
test('Destination subprocess error is not unhandled when the "to" option is invalid', async t => {
	const {stdout} = await execa('pipe-destination-error.js', ['fail.js']);
	t.is(stdout, 'REACHED THE END');
});

test('Destination subprocess is terminated when the "to" option is invalid', async t => {
	const {stdout} = await execa('pipe-destination-error.js', ['stdin.js'], {timeout: 10_000});
	t.is(stdout, 'REACHED THE END');
});

test('Destination subprocess passed by the user is not terminated when the "to" option is invalid', async t => {
	const source = execa('empty.js', {stdout: 'ignore'});
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {to: 'fd9'});

	await assertPipeError(t, pipePromise, 'fd9');
	destination.stdin.end(foobarString);
	const {stdout} = await destination;
	t.is(stdout, foobarString);
});
