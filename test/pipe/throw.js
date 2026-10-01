import assert from 'node:assert/strict';
import test from 'node:test';
import {execa} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {assertPipeError} from '../helpers/pipe.js';
import {assertLike} from '../helpers/assert.js';

setFixtureDirectory();

test('Destination stream is ended when first argument is invalid', async () => {
	const source = execa('empty.js', {stdout: 'ignore'});
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	await assertPipeError(pipePromise, 'option is incompatible');
	await source;
	assertLike(await destination, {stdout: ''});
});

test('Destination stream is ended when first argument is invalid - $', async () => {
	const pipePromise = execa('empty.js', {stdout: 'ignore'}).pipe`stdin.js`;
	await assertPipeError(pipePromise, 'option is incompatible');
});

test('Source stream is aborted when second argument is invalid', async () => {
	const source = execa('noop.js', [foobarString]);
	const pipePromise = source.pipe(false);

	await assertPipeError(pipePromise, 'an Execa subprocess');
	assertLike(await source, {stdout: ''});
});

test('Both arguments might be invalid', async () => {
	const source = execa('empty.js', {stdout: 'ignore'});
	const pipePromise = source.pipe(false);

	await assertPipeError(pipePromise, 'an Execa subprocess');
	const {stdout} = await source;
	assert.equal(stdout, undefined);
});

// The destination subprocess is spawned before the `to` option is validated, so its error must be handled.
// This runs in another process, since that is where the unhandled rejection crashes it.
test('Destination subprocess error is not unhandled when the "to" option is invalid', async () => {
	const {stdout} = await execa('pipe-destination-error.js', ['fail.js']);
	assert.equal(stdout, 'REACHED THE END');
});

test('Destination subprocess is terminated when the "to" option is invalid', async () => {
	const {stdout} = await execa('pipe-destination-error.js', ['stdin.js'], {timeout: 10_000});
	assert.equal(stdout, 'REACHED THE END');
});

test('Destination subprocess passed by the user is not terminated when the "to" option is invalid', async () => {
	const source = execa('empty.js', {stdout: 'ignore'});
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, {to: 'fd9'});

	await assertPipeError(pipePromise, 'fd9');
	destination.stdin.end(foobarString);
	const {stdout} = await destination;
	assert.equal(stdout, foobarString);
});

test('The pipe options cannot be null', async () => {
	const source = execa('empty.js');
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination, null);

	await assertPipeError(pipePromise, 'not `null`');
	destination.stdin.end();
	await Promise.all([source, destination]);
});
