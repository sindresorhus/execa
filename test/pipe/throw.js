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
