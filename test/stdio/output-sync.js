import test from 'ava';
import {execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {throwingGenerator} from '../helpers/generator.js';
import {foobarString} from '../helpers/input.js';

setFixtureDir();

test('Handles errors with stdout generator, sync', t => {
	const cause = new Error(foobarString);
	const error = t.throws(() => {
		execaSync('noop.js', {stdout: throwingGenerator(cause)()});
	});
	t.is(error.cause, cause);
});

test('Handles errors with stdout generator, spawn failure, sync', t => {
	const cause = new Error(foobarString);
	const error = t.throws(() => {
		execaSync('noop.js', {cwd: 'does_not_exist', stdout: throwingGenerator(cause)()});
	});
	t.true(error.failed);
	t.is(error.cause.code, 'ENOENT');
});

test('Handles errors with stdout generator, subprocess failure, sync', t => {
	const cause = new Error(foobarString);
	const error = t.throws(() => {
		execaSync('noop-fail.js', ['1'], {stdout: throwingGenerator(cause)()});
	});
	t.true(error.failed);
	t.is(error.cause, cause);
});
