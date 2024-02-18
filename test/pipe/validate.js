import {PassThrough} from 'node:stream';
import {spawn} from 'node:child_process';
import process from 'node:process';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';

setFixtureDir();

const assertPipeError = async (t, pipePromise, message) => {
	const error = await t.throwsAsync(pipePromise);

	t.is(error.command, 'source.pipe(destination)');
	t.is(error.escapedCommand, error.command);

	t.is(typeof error.cwd, 'string');
	t.true(error.failed);
	t.false(error.timedOut);
	t.false(error.isCanceled);
	t.false(error.isTerminated);
	t.is(error.exitCode, undefined);
	t.is(error.signal, undefined);
	t.is(error.signalDescription, undefined);
	t.is(error.stdout, undefined);
	t.is(error.stderr, undefined);
	t.is(error.all, undefined);
	t.deepEqual(error.stdio, Array.from({length: error.stdio.length}));
	t.deepEqual(error.pipedFrom, []);

	t.true(error.shortMessage.includes(`Command failed: ${error.command}`));
	t.true(error.shortMessage.includes(error.originalMessage));
	t.true(error.message.includes(error.shortMessage));

	t.true(error.originalMessage.includes(message));
};

test('Must set "all" option to "true" to use pipe(..., {from: "all"})', async t => {
	await assertPipeError(
		t,
		execa('empty.js')
			.pipe(execa('empty.js'), {from: 'all'}),
		'"all" option must be true',
	);
});

const invalidDestination = async (t, getDestination) => {
	await assertPipeError(
		t,
		execa('empty.js')
			.pipe(getDestination()),
		'an Execa child process',
	);
};

test('pipe() cannot pipe to non-processes', invalidDestination, () => ({stdin: new PassThrough()}));
test('pipe() cannot pipe to non-Execa processes', invalidDestination, () => spawn('node', ['--version']));

test('pipe() "from" option cannot be "stdin"', async t => {
	await assertPipeError(
		t,
		execa('empty.js')
			.pipe(execa('empty.js'), {from: 'stdin'}),
		'not be "stdin"',
	);
});

const invalidFromOption = async (t, from) => {
	await assertPipeError(
		t,
		execa('empty.js')
			.pipe(execa('empty.js'), {from}),
		'"from" option must not be',
	);
};

test('pipe() "from" option cannot be any string', invalidFromOption, 'other');
test('pipe() "from" option cannot be a float', invalidFromOption, 1.5);
test('pipe() "from" option cannot be a negative number', invalidFromOption, -1);

test('pipe() "from" option cannot be a non-existing file descriptor', async t => {
	await assertPipeError(
		t,
		execa('empty.js')
			.pipe(execa('empty.js'), {from: 3}),
		'file descriptor does not exist',
	);
});

test('pipe() "from" option cannot be an input file descriptor', async t => {
	await assertPipeError(
		t,
		execa('stdin-fd.js', ['3'], {stdio: ['pipe', 'pipe', 'pipe', new Uint8Array()]})
			.pipe(execa('empty.js'), {from: 3}),
		'must be a readable stream',
	);
});

test('Must set destination "stdin" option to "pipe" to use pipe()', async t => {
	await assertPipeError(
		t,
		execa('empty.js')
			.pipe(execa('stdin.js', {stdin: 'ignore'})),
		'stdin must be available',
	);
});

// eslint-disable-next-line max-params
const invalidSource = async (t, optionName, optionValue, from, options) => {
	await assertPipeError(
		t,
		execa('empty.js', options)
			.pipe(execa('empty.js'), {from}),
		`\`${optionName}: ${optionValue}\` option is incompatible`,
	);
};

test('Cannot set "stdout" option to "ignore" to use pipe(...)', invalidSource, 'stdout', '"ignore"', undefined, {stdout: 'ignore'});
test('Cannot set "stdout" option to "ignore" to use pipe(..., 1)', invalidSource, 'stdout', '"ignore"', 1, {stdout: 'ignore'});
test('Cannot set "stdout" option to "ignore" to use pipe(..., "stdout")', invalidSource, 'stdout', '"ignore"', 'stdout', {stdout: 'ignore'});
test('Cannot set "stdout" + "stderr" option to "ignore" to use pipe(...)', invalidSource, 'stdout', '"ignore"', undefined, {stdout: 'ignore', stderr: 'ignore'});
test('Cannot set "stdout" + "stderr" option to "ignore" to use pipe(..., 1)', invalidSource, 'stdout', '"ignore"', 1, {stdout: 'ignore', stderr: 'ignore'});
test('Cannot set "stdout" + "stderr" option to "ignore" to use pipe(..., "stdout")', invalidSource, 'stdout', '"ignore"', 'stdout', {stdout: 'ignore', stderr: 'ignore'});
test('Cannot set "stdio[1]" option to "ignore" to use pipe(...)', invalidSource, 'stdio[1]', '"ignore"', undefined, {stdio: ['pipe', 'ignore', 'pipe']});
test('Cannot set "stdio[1]" option to "ignore" to use pipe(..., 1)', invalidSource, 'stdio[1]', '"ignore"', 1, {stdio: ['pipe', 'ignore', 'pipe']});
test('Cannot set "stdio[1]" option to "ignore" to use pipe(..., "stdout")', invalidSource, 'stdio[1]', '"ignore"', 'stdout', {stdio: ['pipe', 'ignore', 'pipe']});
test('Cannot set "stderr" option to "ignore" to use pipe(..., 2)', invalidSource, 'stderr', '"ignore"', 2, {stderr: 'ignore'});
test('Cannot set "stderr" option to "ignore" to use pipe(..., "stderr")', invalidSource, 'stderr', '"ignore"', 'stderr', {stderr: 'ignore'});
test('Cannot set "stdout" + "stderr" option to "ignore" to use pipe(..., 2)', invalidSource, 'stderr', '"ignore"', 2, {stdout: 'ignore', stderr: 'ignore'});
test('Cannot set "stdout" + "stderr" option to "ignore" to use pipe(..., "stderr")', invalidSource, 'stderr', '"ignore"', 'stderr', {stdout: 'ignore', stderr: 'ignore'});
test('Cannot set "stdio[2]" option to "ignore" to use pipe(..., 2)', invalidSource, 'stdio[2]', '"ignore"', 2, {stdio: ['pipe', 'pipe', 'ignore']});
test('Cannot set "stdio[2]" option to "ignore" to use pipe(..., "stderr")', invalidSource, 'stdio[2]', '"ignore"', 'stderr', {stdio: ['pipe', 'pipe', 'ignore']});
test('Cannot set "stdio[3]" option to "ignore" to use pipe(..., 3)', invalidSource, 'stdio[3]', '"ignore"', 3, {stdio: ['pipe', 'pipe', 'pipe', 'ignore']});
test('Cannot set "stdout" + "stderr" option to "ignore" to use pipe(..., "all")', invalidSource, 'stdout', '"ignore"', 'all', {stdout: 'ignore', stderr: 'ignore', all: true});
test('Cannot set "stdio[1]" + "stdio[2]" option to "ignore" to use pipe(..., "all")', invalidSource, 'stdio[1]', '"ignore"', 'all', {stdio: ['pipe', 'ignore', 'ignore'], all: true});
test('Cannot set "stdout" option to "inherit" to use pipe()', invalidSource, 'stdout', '"inherit"', 1, {stdout: 'inherit'});
test('Cannot set "stdout" option to "ipc" to use pipe()', invalidSource, 'stdout', '"ipc"', 1, {stdout: 'ipc'});
test('Cannot set "stdout" option to file descriptors to use pipe()', invalidSource, 'stdout', '1', 1, {stdout: 1});
test('Cannot set "stdout" option to Node.js streams to use pipe()', invalidSource, 'stdout', 'Stream', 1, {stdout: process.stdout});

test('Destination stream is ended when first argument is invalid', async t => {
	const source = execa('empty.js', {stdout: 'ignore'});
	const destination = execa('stdin.js');
	const pipePromise = source.pipe(destination);

	await assertPipeError(t, pipePromise, 'option is incompatible');
	await source;
	t.like(await destination, {stdout: ''});
});

test('Source stream is aborted when second argument is invalid', async t => {
	const source = execa('noop.js', [foobarString]);
	const pipePromise = source.pipe('');

	await assertPipeError(t, pipePromise, 'an Execa child process');
	t.like(await source, {stdout: ''});
});

test('Both arguments might be invalid', async t => {
	const source = execa('empty.js', {stdout: 'ignore'});
	const pipePromise = source.pipe('');

	await assertPipeError(t, pipePromise, 'an Execa child process');
	t.like(await source, {stdout: undefined});
});

test('Sets the right error message when the "all" option is incompatible - execa.execa', async t => {
	await assertPipeError(
		t,
		execa('empty.js')
			.pipe(execa('stdin.js', {all: false}))
			.pipe(execa('empty.js'), {from: 'all'}),
		'"all" option must be true',
	);
});

test('Sets the right error message when the "all" option is incompatible - early error', async t => {
	await assertPipeError(
		t,
		execa('empty.js', {killSignal: false})
			.pipe(execa('stdin.js', {all: false}))
			.pipe(execa('empty.js'), {from: 'all'}),
		'"all" option must be true',
	);
});
