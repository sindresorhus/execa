import {PassThrough, Readable, Writable} from 'node:stream';
import {spawn} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import tempfile from 'tempfile';
import test from 'ava';
import getStream from 'get-stream';
import {execa} from '../index.js';
import {setFixtureDir} from './helpers/fixtures-dir.js';

setFixtureDir();

const pipeToProcess = async (t, fixtureName, funcName) => {
	const {stdout} = await execa(fixtureName, ['test'], {all: true})[funcName](execa('stdin.js'));
	t.is(stdout, 'test');
};

test('pipeStdout() can pipe to Execa child processes', pipeToProcess, 'noop.js', 'pipeStdout');
test('pipeStderr() can pipe to Execa child processes', pipeToProcess, 'noop-err.js', 'pipeStderr');
test('pipeAll() can pipe stdout to Execa child processes', pipeToProcess, 'noop.js', 'pipeAll');
test('pipeAll() can pipe stderr to Execa child processes', pipeToProcess, 'noop-err.js', 'pipeAll');

const pipeToStream = async (t, fixtureName, funcName, streamName) => {
	const stream = new PassThrough();
	const result = await execa(fixtureName, ['test'], {all: true})[funcName](stream);
	t.is(result[streamName], 'test');
	t.is(await getStream(stream), 'test\n');
};

test('pipeStdout() can pipe to streams', pipeToStream, 'noop.js', 'pipeStdout', 'stdout');
test('pipeStderr() can pipe to streams', pipeToStream, 'noop-err.js', 'pipeStderr', 'stderr');
test('pipeAll() can pipe stdout to streams', pipeToStream, 'noop.js', 'pipeAll', 'stdout');
test('pipeAll() can pipe stderr to streams', pipeToStream, 'noop-err.js', 'pipeAll', 'stderr');

const pipeToFile = async (t, fixtureName, funcName, streamName) => {
	const file = tempfile('.txt');
	const result = await execa(fixtureName, ['test'], {all: true})[funcName](file);
	t.is(result[streamName], 'test');
	t.is(await readFile(file, 'utf8'), 'test\n');
};

test('pipeStdout() can pipe to files', pipeToFile, 'noop.js', 'pipeStdout', 'stdout');
test('pipeStderr() can pipe to files', pipeToFile, 'noop-err.js', 'pipeStderr', 'stderr');
test('pipeAll() can pipe stdout to files', pipeToFile, 'noop.js', 'pipeAll', 'stdout');
test('pipeAll() can pipe stderr to files', pipeToFile, 'noop-err.js', 'pipeAll', 'stderr');

const invalidTarget = (t, funcName, getTarget) => {
	t.throws(() => execa('noop.js', {all: true})[funcName](getTarget()), {
		message: /a stream or an Execa child process/,
	});
};

test('pipeStdout() can only pipe to writable streams', invalidTarget, 'pipeStdout', () => new Readable());
test('pipeStderr() can only pipe to writable streams', invalidTarget, 'pipeStderr', () => new Readable());
test('pipeAll() can only pipe to writable streams', invalidTarget, 'pipeAll', () => new Readable());
test('pipeStdout() cannot pipe to non-processes', invalidTarget, 'pipeStdout', () => ({stdin: new PassThrough()}));
test('pipeStderr() cannot pipe to non-processes', invalidTarget, 'pipeStderr', () => ({stdin: new PassThrough()}));
test('pipeAll() cannot pipe to non-processes', invalidTarget, 'pipeStderr', () => ({stdin: new PassThrough()}));
test('pipeStdout() cannot pipe to non-Execa processes', invalidTarget, 'pipeStdout', () => spawn('node', ['--version']));
test('pipeStderr() cannot pipe to non-Execa processes', invalidTarget, 'pipeStderr', () => spawn('node', ['--version']));
test('pipeAll() cannot pipe to non-Execa processes', invalidTarget, 'pipeStderr', () => spawn('node', ['--version']));

const invalidSource = (t, funcName) => {
	t.false(funcName in execa('noop.js', {stdout: 'ignore', stderr: 'ignore'}));
};

test('Must set "stdout" option to "pipe" to use pipeStdout()', invalidSource, 'pipeStdout');
test('Must set "stderr" option to "pipe" to use pipeStderr()', invalidSource, 'pipeStderr');
test('Must set "stdout" or "stderr" option to "pipe" to use pipeAll()', invalidSource, 'pipeAll');

const invalidPipeToProcess = async (t, fixtureName, funcName) => {
	t.throws(() => execa(fixtureName, ['test'], {all: true})[funcName](execa('stdin.js', {stdin: 'ignore'})), {
		message: /stdin must be available/,
	});
};

test('Must set target "stdin" option to "pipe" to use pipeStdout()', invalidPipeToProcess, 'noop.js', 'pipeStdout');
test('Must set target "stdin" option to "pipe" to use pipeStderr()', invalidPipeToProcess, 'noop-err.js', 'pipeStderr');
test('Must set target "stdin" option to "pipe" to use pipeAll()', invalidPipeToProcess, 'noop.js', 'pipeAll');

test('pipeToStdinFrom() can pipe stdout from Execa child processes', async t => {
	const {stdout} = await execa('stdin.js').pipeToStdinFrom(execa('noop.js', ['test']));
	t.is(stdout, 'test');
});

test('pipeToStdinFrom() cannot pipe stderr from Execa child processes', async t => {
	const {stdout, stderr} = await execa('stdin.js').pipeToStdinFrom(execa('noop-err.js', ['test']));
	t.is(stdout, '');
	t.is(stderr, '');
});

test('pipeToStdinFrom() can pipe stdout from streams', async t => {
	const stream = Readable.from('test');
	const {stdout} = await execa('stdin.js').pipeToStdinFrom(stream);
	t.is(stdout, 'test');
});

test('pipeToStdinFrom() can pipe stdout from files', async t => {
	const file = tempfile('.txt');
	await writeFile(file, 'test');
	const {stdout} = await execa('stdin.js').pipeToStdinFrom(file);
	t.is(stdout, 'test');
});

const invalidStdinSource = (t, getTarget) => {
	t.throws(() => execa('stdin.js').pipeToStdinFrom(getTarget()), {
		message: /a stream or an Execa child process/,
	});
};

test('pipeToStdinFrom() can only pipe from readable streams', invalidStdinSource, () => new Writable());
test('pipeToStdinFrom() cannot pipe from non-processes', invalidStdinSource, () => ({stdout: new Readable()}));
test('pipeToStdinFrom() cannot pipe from non-Execa processes', invalidStdinSource, () => ({stdout: spawn('node', ['--version'])}));

test('Must set "stdin" to "pipe" to use pipeToStdinFrom()', t => {
	t.false('pipeToStdinFrom' in execa('stdin.js', {stdin: 'ignore'}));
});

test('Must set source "stdout" option to "pipe" to use pipeToStdinFrom()', t => {
	t.throws(() => execa('stdin.js').pipeToStdinFrom(execa('noop.js', ['test'], {stdout: 'ignore'})), {
		message: /stdout must be available/,
	});
});
