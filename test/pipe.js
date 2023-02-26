import {PassThrough, Readable} from 'node:stream';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
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

const invalidTargetMacro = (t, funcName, getTarget) => {
	t.throws(() => execa('noop.js', {all: true})[funcName](getTarget()), {
		message: /a stream or an Execa child process/,
	});
};

test('pipeStdout() can only pipe to writable streams', invalidTargetMacro, 'pipeStdout', () => new Readable());
test('pipeStderr() can only pipe to writable streams', invalidTargetMacro, 'pipeStderr', () => new Readable());
test('pipeAll() can only pipe to writable streams', invalidTargetMacro, 'pipeAll', () => new Readable());
test('pipeStdout() cannot pipe to processes with inherited stdin', invalidTargetMacro, 'pipeStdout', () => execa('stdin.js', {stdin: 'inherit'}));
test('pipeStderr() cannot pipe to processes with inherited stdin', invalidTargetMacro, 'pipeStderr', () => execa('stdin.js', {stdin: 'inherit'}));
test('pipeAll() cannot pipe to processes with inherited stdin', invalidTargetMacro, 'pipeStderr', () => execa('stdin.js', {stdin: 'inherit'}));
test('pipeStdout() cannot pipe to non-processes', invalidTargetMacro, 'pipeStdout', () => ({stdin: new PassThrough()}));
test('pipeStderr() cannot pipe to non-processes', invalidTargetMacro, 'pipeStderr', () => ({stdin: new PassThrough()}));
test('pipeAll() cannot pipe to non-processes', invalidTargetMacro, 'pipeStderr', () => ({stdin: new PassThrough()}));
test('pipeStdout() cannot pipe to non-Execa processes', invalidTargetMacro, 'pipeStdout', () => spawn('node', ['--version']));
test('pipeStderr() cannot pipe to non-Execa processes', invalidTargetMacro, 'pipeStderr', () => spawn('node', ['--version']));
test('pipeAll() cannot pipe to non-Execa processes', invalidTargetMacro, 'pipeStderr', () => spawn('node', ['--version']));

const invalidSourceMacro = (t, funcName) => {
	t.false(funcName in execa('noop.js', {stdout: 'ignore', stderr: 'ignore'}));
};

test('Must set "stdout" option to "pipe" use pipeStdout()', invalidSourceMacro, 'pipeStdout');
test('Must set "stderr" option to "pipe" use pipeStderr()', invalidSourceMacro, 'pipeStderr');
test('Must set "stdout" or "stderr" option to "pipe" use pipeAll()', invalidSourceMacro, 'pipeAll');
