import {PassThrough} from 'node:stream';
import {spawn} from 'node:child_process';
import process from 'node:process';
import test from 'ava';
import {execa} from '../index.js';
import {setFixtureDir} from './helpers/fixtures-dir.js';
import {fullStdio} from './helpers/stdio.js';

setFixtureDir();

const pipeToProcess = async (t, index, streamName) => {
	const {stdout} = await execa('noop-fd.js', [`${index}`, 'test'], {...fullStdio, all: true}).pipe(execa('stdin.js'), streamName);
	t.is(stdout, 'test');
};

test('pipe() can pipe to Execa child processes', pipeToProcess, 1, undefined);
test('pipe() stdout can pipe to Execa child processes', pipeToProcess, 1, 'stdout');
test('pipe() 1 can pipe to Execa child processes', pipeToProcess, 1, 1);
test('pipe() stderr can pipe to Execa child processes', pipeToProcess, 2, 'stderr');
test('pipe() 2 can pipe to Execa child processes', pipeToProcess, 2, 2);
test('pipe() 3 can pipe to Execa child processes', pipeToProcess, 3, 3);

const pipeAllToProcess = async (t, index) => {
	const {stdout} = await execa('noop-fd.js', [`${index}`, 'test'], {...fullStdio, all: true}).pipe(execa('stdin.js'), 'all');
	t.is(stdout, 'test');
};

test('pipe() all can pipe stdout to Execa child processes', pipeAllToProcess, 1, {all: true});
test('pipe() all can pipe stdout to Execa child processes even with "stderr: ignore"', pipeAllToProcess, 1, {all: true, stderr: 'ignore'});
test('pipe() all can pipe stderr to Execa child processes', pipeAllToProcess, 2, {all: true});
test('pipe() all can pipe stderr to Execa child processes even with "stdout: ignore"', pipeAllToProcess, 1, {all: true, stdout: 'ignore'});

test('Must set "all" option to "true" to use pipe() with "all"', t => {
	t.throws(() => {
		execa('empty.js').pipe(execa('empty.js'), 'all');
	}, {message: /"all" option must be true/});
});

const invalidTarget = (t, getTarget) => {
	t.throws(() => {
		execa('empty.js').pipe(getTarget());
	}, {message: /an Execa child process/});
};

test('pipe() cannot pipe to non-processes', invalidTarget, () => ({stdin: new PassThrough()}));
test('pipe() cannot pipe to non-Execa processes', invalidTarget, () => spawn('node', ['--version']));

test('pipe() second argument cannot be "stdin"', t => {
	t.throws(() => {
		execa('empty.js').pipe(execa('empty.js'), 'stdin');
	}, {message: /not be "stdin"/});
});

const invalidStreamName = (t, streamName) => {
	t.throws(() => {
		execa('empty.js').pipe(execa('empty.js'), streamName);
	}, {message: /second argument must not be/});
};

test('pipe() second argument cannot be any string', invalidStreamName, 'other');
test('pipe() second argument cannot be a float', invalidStreamName, 1.5);
test('pipe() second argument cannot be a negative number', invalidStreamName, -1);

test('pipe() second argument cannot be a non-existing file descriptor', t => {
	t.throws(() => {
		execa('empty.js').pipe(execa('empty.js'), 3);
	}, {message: /file descriptor does not exist/});
});

test('pipe() second argument cannot be an input file descriptor', t => {
	t.throws(() => {
		execa('stdin-fd.js', ['3'], {stdio: ['pipe', 'pipe', 'pipe', new Uint8Array()]}).pipe(execa('empty.js'), 3);
	}, {message: /must be a readable stream/});
});

test('Must set target "stdin" option to "pipe" to use pipe()', t => {
	t.throws(() => {
		execa('empty.js').pipe(execa('stdin.js', {stdin: 'ignore'}));
	}, {message: /stdin must be available/});
});

const invalidSource = (t, optionName, streamName, options) => {
	t.throws(() => {
		execa('empty.js', options).pipe(execa('empty.js'), streamName);
	}, {message: new RegExp(`"${optionName}" option's value is incompatible`)});
};

test('Cannot set "stdout" option to "ignore" to use pipe()', invalidSource, 'stdout', 1, {stdout: 'ignore'});
test('Cannot set "stderr" option to "ignore" to use pipe()', invalidSource, 'stderr', 2, {stderr: 'ignore'});
test('Cannot set "stdio[*]" option to "ignore" to use pipe()', invalidSource, 'stdio', 3, {stdio: ['pipe', 'pipe', 'pipe', 'ignore']});
test('Cannot set "stdout" + "stderr" option to "ignore" to use pipe() with "all"', invalidSource, 'stdout', 1, {stdout: 'ignore', stderr: 'ignore', all: true});
test('Cannot set "stdout" option to "inherit" to use pipe()', invalidSource, 'stdout', 1, {stdout: 'inherit'});
test('Cannot set "stdout" option to "ipc" to use pipe()', invalidSource, 'stdout', 1, {stdout: 'ipc'});
test('Cannot set "stdout" option to file descriptors to use pipe()', invalidSource, 'stdout', 1, {stdout: 1});
test('Cannot set "stdout" option to Node.js streams to use pipe()', invalidSource, 'stdout', 1, {stdout: process.stdout});
