import assert from 'node:assert/strict';
import test from 'node:test';
import {assertThrows} from '../helpers/assert.js';
import {execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {throwingGenerator} from '../helpers/generator.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

test('Handles errors with stdout generator, sync', () => {
	const cause = new Error(foobarString);
	const error = assertThrows(() => {
		execaSync('noop.js', {stdout: throwingGenerator(cause)()});
	});
	assert.equal(error.cause, cause);
});

test('Handles errors with stdout generator, spawn failure, sync', () => {
	const cause = new Error(foobarString);
	const error = assertThrows(() => {
		execaSync('noop.js', {cwd: 'does_not_exist', stdout: throwingGenerator(cause)()});
	});
	assert.equal(error.failed, true);
	assert.equal(error.cause.code, 'ENOENT');
});

test('Handles errors with stdout generator, subprocess failure, sync', () => {
	const cause = new Error(foobarString);
	const error = assertThrows(() => {
		execaSync('noop-fail.js', ['1'], {stdout: throwingGenerator(cause)()});
	});
	assert.equal(error.failed, true);
	assert.equal(error.cause, cause);
});
