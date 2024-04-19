import process from 'node:process';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {outputObjectGenerator, addNoopGenerator} from '../helpers/generator.js';
import {foobarObject} from '../helpers/input.js';

setFixtureDirectory();

const testObjectMode = async (t, addNoopTransform, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: addNoopGenerator(outputObjectGenerator(), addNoopTransform, true),
		encoding: 'base64',
	});
	t.deepEqual(stdout, [foobarObject]);
};

test('Other encodings work with transforms that return objects', testObjectMode, false, execa);
test('Other encodings work with transforms that return objects, noop transform', testObjectMode, true, execa);
test('Other encodings work with transforms that return objects, sync', testObjectMode, false, execaSync);
test('Other encodings work with transforms that return objects, noop transform, sync', testObjectMode, true, execaSync);

// eslint-disable-next-line max-params
const testIgnoredEncoding = async (t, stdoutOption, isUndefined, options, execaMethod) => {
	const {stdout} = await execaMethod('empty.js', {stdout: stdoutOption, ...options});
	t.is(stdout === undefined, isUndefined);
};

const base64Options = {encoding: 'base64'};
const linesOptions = {lines: true};
test('Is ignored with other encodings and "ignore"', testIgnoredEncoding, 'ignore', true, base64Options, execa);
test('Is ignored with other encodings and ["ignore"]', testIgnoredEncoding, ['ignore'], true, base64Options, execa);
test('Is ignored with other encodings and "ipc"', testIgnoredEncoding, 'ipc', true, base64Options, execa);
test('Is ignored with other encodings and ["ipc"]', testIgnoredEncoding, ['ipc'], true, base64Options, execa);
test('Is ignored with other encodings and "inherit"', testIgnoredEncoding, 'inherit', true, base64Options, execa);
test('Is ignored with other encodings and ["inherit"]', testIgnoredEncoding, ['inherit'], true, base64Options, execa);
test('Is ignored with other encodings and 1', testIgnoredEncoding, 1, true, base64Options, execa);
test('Is ignored with other encodings and [1]', testIgnoredEncoding, [1], true, base64Options, execa);
test('Is ignored with other encodings and process.stdout', testIgnoredEncoding, process.stdout, true, base64Options, execa);
test('Is ignored with other encodings and [process.stdout]', testIgnoredEncoding, [process.stdout], true, base64Options, execa);
test('Is not ignored with other encodings and "pipe"', testIgnoredEncoding, 'pipe', false, base64Options, execa);
test('Is not ignored with other encodings and ["pipe"]', testIgnoredEncoding, ['pipe'], false, base64Options, execa);
test('Is not ignored with other encodings and "overlapped"', testIgnoredEncoding, 'overlapped', false, base64Options, execa);
test('Is not ignored with other encodings and ["overlapped"]', testIgnoredEncoding, ['overlapped'], false, base64Options, execa);
test('Is not ignored with other encodings and ["inherit", "pipe"]', testIgnoredEncoding, ['inherit', 'pipe'], false, base64Options, execa);
test('Is not ignored with other encodings and undefined', testIgnoredEncoding, undefined, false, base64Options, execa);
test('Is not ignored with other encodings and null', testIgnoredEncoding, null, false, base64Options, execa);
test('Is ignored with "lines: true" and "ignore"', testIgnoredEncoding, 'ignore', true, linesOptions, execa);
test('Is ignored with "lines: true" and ["ignore"]', testIgnoredEncoding, ['ignore'], true, linesOptions, execa);
test('Is ignored with "lines: true" and "ipc"', testIgnoredEncoding, 'ipc', true, linesOptions, execa);
test('Is ignored with "lines: true" and ["ipc"]', testIgnoredEncoding, ['ipc'], true, linesOptions, execa);
test('Is ignored with "lines: true" and "inherit"', testIgnoredEncoding, 'inherit', true, linesOptions, execa);
test('Is ignored with "lines: true" and ["inherit"]', testIgnoredEncoding, ['inherit'], true, linesOptions, execa);
test('Is ignored with "lines: true" and 1', testIgnoredEncoding, 1, true, linesOptions, execa);
test('Is ignored with "lines: true" and [1]', testIgnoredEncoding, [1], true, linesOptions, execa);
test('Is ignored with "lines: true" and process.stdout', testIgnoredEncoding, process.stdout, true, linesOptions, execa);
test('Is ignored with "lines: true" and [process.stdout]', testIgnoredEncoding, [process.stdout], true, linesOptions, execa);
test('Is not ignored with "lines: true" and "pipe"', testIgnoredEncoding, 'pipe', false, linesOptions, execa);
test('Is not ignored with "lines: true" and ["pipe"]', testIgnoredEncoding, ['pipe'], false, linesOptions, execa);
test('Is not ignored with "lines: true" and "overlapped"', testIgnoredEncoding, 'overlapped', false, linesOptions, execa);
test('Is not ignored with "lines: true" and ["overlapped"]', testIgnoredEncoding, ['overlapped'], false, linesOptions, execa);
test('Is not ignored with "lines: true" and ["inherit", "pipe"]', testIgnoredEncoding, ['inherit', 'pipe'], false, linesOptions, execa);
test('Is not ignored with "lines: true" and undefined', testIgnoredEncoding, undefined, false, linesOptions, execa);
test('Is not ignored with "lines: true" and null', testIgnoredEncoding, null, false, linesOptions, execa);
test('Is ignored with "lines: true", other encodings and "ignore"', testIgnoredEncoding, 'ignore', true, {...base64Options, ...linesOptions}, execa);
test('Is not ignored with "lines: true", other encodings and "pipe"', testIgnoredEncoding, 'pipe', false, {...base64Options, ...linesOptions}, execa);
test('Is ignored with other encodings and "ignore", sync', testIgnoredEncoding, 'ignore', true, base64Options, execaSync);
test('Is ignored with other encodings and ["ignore"], sync', testIgnoredEncoding, ['ignore'], true, base64Options, execaSync);
test('Is ignored with other encodings and "inherit", sync', testIgnoredEncoding, 'inherit', true, base64Options, execaSync);
test('Is ignored with other encodings and ["inherit"], sync', testIgnoredEncoding, ['inherit'], true, base64Options, execaSync);
test('Is ignored with other encodings and 1, sync', testIgnoredEncoding, 1, true, base64Options, execaSync);
test('Is ignored with other encodings and [1], sync', testIgnoredEncoding, [1], true, base64Options, execaSync);
test('Is ignored with other encodings and process.stdout, sync', testIgnoredEncoding, process.stdout, true, base64Options, execaSync);
test('Is ignored with other encodings and [process.stdout], sync', testIgnoredEncoding, [process.stdout], true, base64Options, execaSync);
test('Is not ignored with other encodings and "pipe", sync', testIgnoredEncoding, 'pipe', false, base64Options, execaSync);
test('Is not ignored with other encodings and ["pipe"], sync', testIgnoredEncoding, ['pipe'], false, base64Options, execaSync);
test('Is not ignored with other encodings and undefined, sync', testIgnoredEncoding, undefined, false, base64Options, execaSync);
test('Is not ignored with other encodings and null, sync', testIgnoredEncoding, null, false, base64Options, execaSync);
test('Is ignored with "lines: true" and "ignore", sync', testIgnoredEncoding, 'ignore', true, linesOptions, execaSync);
test('Is ignored with "lines: true" and ["ignore"], sync', testIgnoredEncoding, ['ignore'], true, linesOptions, execaSync);
test('Is ignored with "lines: true" and "inherit", sync', testIgnoredEncoding, 'inherit', true, linesOptions, execaSync);
test('Is ignored with "lines: true" and ["inherit"], sync', testIgnoredEncoding, ['inherit'], true, linesOptions, execaSync);
test('Is ignored with "lines: true" and 1, sync', testIgnoredEncoding, 1, true, linesOptions, execaSync);
test('Is ignored with "lines: true" and [1], sync', testIgnoredEncoding, [1], true, linesOptions, execaSync);
test('Is ignored with "lines: true" and process.stdout, sync', testIgnoredEncoding, process.stdout, true, linesOptions, execaSync);
test('Is ignored with "lines: true" and [process.stdout], sync', testIgnoredEncoding, [process.stdout], true, linesOptions, execaSync);
test('Is not ignored with "lines: true" and "pipe", sync', testIgnoredEncoding, 'pipe', false, linesOptions, execaSync);
test('Is not ignored with "lines: true" and ["pipe"], sync', testIgnoredEncoding, ['pipe'], false, linesOptions, execaSync);
test('Is not ignored with "lines: true" and undefined, sync', testIgnoredEncoding, undefined, false, linesOptions, execaSync);
test('Is not ignored with "lines: true" and null, sync', testIgnoredEncoding, null, false, linesOptions, execaSync);
test('Is ignored with "lines: true", other encodings and "ignore", sync', testIgnoredEncoding, 'ignore', true, {...base64Options, ...linesOptions}, execaSync);
test('Is not ignored with "lines: true", other encodings and "pipe", sync', testIgnoredEncoding, 'pipe', false, {...base64Options, ...linesOptions}, execaSync);
