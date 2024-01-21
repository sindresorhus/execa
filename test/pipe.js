import {PassThrough} from 'node:stream';
import {spawn} from 'node:child_process';
import test from 'ava';
import {execa} from '../index.js';
import {setFixtureDir} from './helpers/fixtures-dir.js';

setFixtureDir();

const pipeToProcess = async (t, index, funcName) => {
	const {stdout} = await execa('noop-fd.js', [`${index}`, 'test'], {all: true})[funcName](execa('stdin.js'));
	t.is(stdout, 'test');
};

test('pipeStdout() can pipe to Execa child processes', pipeToProcess, 1, 'pipeStdout');
test('pipeStderr() can pipe to Execa child processes', pipeToProcess, 2, 'pipeStderr');
test('pipeAll() can pipe stdout to Execa child processes', pipeToProcess, 1, 'pipeAll');
test('pipeAll() can pipe stderr to Execa child processes', pipeToProcess, 2, 'pipeAll');

const invalidTarget = (t, funcName, getTarget) => {
	t.throws(() => execa('empty.js', {all: true})[funcName](getTarget()), {
		message: /an Execa child process/,
	});
};

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

const invalidPipeToProcess = async (t, index, funcName) => {
	t.throws(() => execa('noop-fd.js', [`${index}`, 'test'], {all: true})[funcName](execa('stdin.js', {stdin: 'ignore'})), {
		message: /stdin must be available/,
	});
};

test('Must set target "stdin" option to "pipe" to use pipeStdout()', invalidPipeToProcess, 1, 'pipeStdout');
test('Must set target "stdin" option to "pipe" to use pipeStderr()', invalidPipeToProcess, 2, 'pipeStderr');
test('Must set target "stdin" option to "pipe" to use pipeAll()', invalidPipeToProcess, 1, 'pipeAll');
