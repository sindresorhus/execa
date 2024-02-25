import {PassThrough} from 'node:stream';
import {spawn} from 'node:child_process';
import process from 'node:process';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';
import {fullStdio, getStdio} from '../helpers/stdio.js';
import {getEarlyErrorSubprocess} from '../helpers/early-error.js';

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

const getMessage = message => Array.isArray(message)
	? `"${message[0]}: ${message[1]}" option is incompatible`
	: message;

const testPipeError = async (t, {
	message,
	sourceOptions = {},
	destinationOptions = {},
	getSource = () => execa('empty.js', sourceOptions),
	getDestination = () => execa('empty.js', destinationOptions),
	isScript = false,
	from,
	to,
}) => {
	const source = getSource();
	const pipePromise = isScript ? source.pipe({from, to})`empty.js` : source.pipe(getDestination(), {from, to});
	await assertPipeError(t, pipePromise, getMessage(message));
};

test('Must set "all" option to "true" to use .pipe("all")', testPipeError, {
	from: 'all',
	message: '"all" option must be true',
});
test('.pipe() cannot pipe to non-subprocesses', testPipeError, {
	getDestination: () => new PassThrough(),
	message: 'an Execa subprocess',
});
test('.pipe() cannot pipe to non-Execa subprocesses', testPipeError, {
	getDestination: () => spawn('node', ['--version']),
	message: 'an Execa subprocess',
});
test('.pipe() "from" option cannot be "stdin"', testPipeError, {
	from: 'stdin',
	message: '"from" must not be',
});
test('$.pipe() "from" option cannot be "stdin"', testPipeError, {
	from: 'stdin',
	isScript: true,
	message: '"from" must not be',
});
test('.pipe() "to" option cannot be "stdout"', testPipeError, {
	to: 'stdout',
	message: '"to" must not be',
});
test('$.pipe() "to" option cannot be "stdout"', testPipeError, {
	to: 'stdout',
	isScript: true,
	message: '"to" must not be',
});
test('.pipe() "from" option cannot be any string', testPipeError, {
	from: 'other',
	message: 'must be "stdout", "stderr", "all"',
});
test('.pipe() "to" option cannot be any string', testPipeError, {
	to: 'other',
	message: 'must be "stdin"',
});
test('.pipe() "from" option cannot be a float', testPipeError, {
	from: 1.5,
	message: 'must be "stdout", "stderr", "all"',
});
test('.pipe() "to" option cannot be a float', testPipeError, {
	to: 1.5,
	message: 'must be "stdin"',
});
test('.pipe() "from" option cannot be a negative number', testPipeError, {
	from: -1,
	message: 'must be "stdout", "stderr", "all"',
});
test('.pipe() "to" option cannot be a negative number', testPipeError, {
	to: -1,
	message: 'must be "stdin"',
});
test('.pipe() "from" option cannot be a non-existing file descriptor', testPipeError, {
	from: 3,
	message: 'file descriptor does not exist',
});
test('.pipe() "to" option cannot be a non-existing file descriptor', testPipeError, {
	to: 3,
	message: 'file descriptor does not exist',
});
test('.pipe() "from" option cannot be an input file descriptor', testPipeError, {
	sourceOptions: getStdio(3, new Uint8Array()),
	from: 3,
	message: 'must be a readable stream',
});
test('.pipe() "to" option cannot be an output file descriptor', testPipeError, {
	destinationOptions: fullStdio,
	to: 3,
	message: 'must be a writable stream',
});
test('Cannot set "stdout" option to "ignore" to use .pipe()', testPipeError, {
	sourceOptions: {stdout: 'ignore'},
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdin" option to "ignore" to use .pipe()', testPipeError, {
	destinationOptions: {stdin: 'ignore'},
	message: ['stdin', '\'ignore\''],
});
test('Cannot set "stdout" option to "ignore" to use .pipe(1)', testPipeError, {
	sourceOptions: {stdout: 'ignore'},
	from: 1,
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdin" option to "ignore" to use .pipe(0)', testPipeError, {
	destinationOptions: {stdin: 'ignore'},
	message: ['stdin', '\'ignore\''],
	to: 0,
});
test('Cannot set "stdout" option to "ignore" to use .pipe("stdout")', testPipeError, {
	sourceOptions: {stdout: 'ignore'},
	from: 'stdout',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdin" option to "ignore" to use .pipe("stdin")', testPipeError, {
	destinationOptions: {stdin: 'ignore'},
	message: ['stdin', '\'ignore\''],
	to: 'stdin',
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .pipe()', testPipeError, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .pipe(1)', testPipeError, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 1,
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .pipe("stdout")', testPipeError, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'stdout',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdio[1]" option to "ignore" to use .pipe()', testPipeError, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'pipe']},
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[0]" option to "ignore" to use .pipe()', testPipeError, {
	destinationOptions: {stdio: ['ignore', 'pipe', 'pipe']},
	message: ['stdio[0]', '\'ignore\''],
});
test('Cannot set "stdio[1]" option to "ignore" to use .pipe(1)', testPipeError, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'pipe']},
	from: 1,
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[0]" option to "ignore" to use .pipe(0)', testPipeError, {
	destinationOptions: {stdio: ['ignore', 'pipe', 'pipe']},
	message: ['stdio[0]', '\'ignore\''],
	to: 0,
});
test('Cannot set "stdio[1]" option to "ignore" to use .pipe("stdout")', testPipeError, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'pipe']},
	from: 'stdout',
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[0]" option to "ignore" to use .pipe("stdin")', testPipeError, {
	destinationOptions: {stdio: ['ignore', 'pipe', 'pipe']},
	message: ['stdio[0]', '\'ignore\''],
	to: 'stdin',
});
test('Cannot set "stderr" option to "ignore" to use .pipe(2)', testPipeError, {
	sourceOptions: {stderr: 'ignore'},
	from: 2,
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stderr" option to "ignore" to use .pipe("stderr")', testPipeError, {
	sourceOptions: {stderr: 'ignore'},
	from: 'stderr',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .pipe(2)', testPipeError, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 2,
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .pipe("stderr")', testPipeError, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'stderr',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stdio[2]" option to "ignore" to use .pipe(2)', testPipeError, {
	sourceOptions: {stdio: ['pipe', 'pipe', 'ignore']},
	from: 2,
	message: ['stdio[2]', '\'ignore\''],
});
test('Cannot set "stdio[2]" option to "ignore" to use .pipe("stderr")', testPipeError, {
	sourceOptions: {stdio: ['pipe', 'pipe', 'ignore']},
	from: 'stderr',
	message: ['stdio[2]', '\'ignore\''],
});
test('Cannot set "stdio[3]" option to "ignore" to use .pipe(3)', testPipeError, {
	sourceOptions: getStdio(3, 'ignore'),
	from: 3,
	message: ['stdio[3]', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .pipe("all")', testPipeError, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore', all: true},
	from: 'all',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdio[1]" + "stdio[2]" option to "ignore" to use .pipe("all")', testPipeError, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'ignore'], all: true},
	from: 'all',
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdout" option to "inherit" to use .pipe()', testPipeError, {
	sourceOptions: {stdout: 'inherit'},
	message: ['stdout', '\'inherit\''],
});
test('Cannot set "stdin" option to "inherit" to use .pipe()', testPipeError, {
	destinationOptions: {stdin: 'inherit'},
	message: ['stdin', '\'inherit\''],
});
test('Cannot set "stdout" option to "ipc" to use .pipe()', testPipeError, {
	sourceOptions: {stdout: 'ipc'},
	message: ['stdout', '\'ipc\''],
});
test('Cannot set "stdin" option to "ipc" to use .pipe()', testPipeError, {
	destinationOptions: {stdin: 'ipc'},
	message: ['stdin', '\'ipc\''],
});
test('Cannot set "stdout" option to file descriptors to use .pipe()', testPipeError, {
	sourceOptions: {stdout: 1},
	message: ['stdout', '1'],
});
test('Cannot set "stdin" option to file descriptors to use .pipe()', testPipeError, {
	destinationOptions: {stdin: 0},
	message: ['stdin', '0'],
});
test('Cannot set "stdout" option to Node.js streams to use .pipe()', testPipeError, {
	sourceOptions: {stdout: process.stdout},
	message: ['stdout', 'Stream'],
});
test('Cannot set "stdin" option to Node.js streams to use .pipe()', testPipeError, {
	destinationOptions: {stdin: process.stdin},
	message: ['stdin', 'Stream'],
});
test('Cannot set "stdio[3]" option to Node.js Writable streams to use .pipe()', testPipeError, {
	sourceOptions: getStdio(3, process.stdout),
	message: ['stdio[3]', 'Stream'],
	from: 3,
});
test('Cannot set "stdio[3]" option to Node.js Readable streams to use .pipe()', testPipeError, {
	destinationOptions: getStdio(3, process.stdin),
	message: ['stdio[3]', 'Stream'],
	to: 3,
});

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

test('Sets the right error message when the "all" option is incompatible - execa.$', async t => {
	await assertPipeError(
		t,
		execa('empty.js')
			.pipe({all: false})`stdin.js`
			.pipe(execa('empty.js'), {from: 'all'}),
		'"all" option must be true',
	);
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
		getEarlyErrorSubprocess()
			.pipe(execa('stdin.js', {all: false}))
			.pipe(execa('empty.js'), {from: 'all'}),
		'"all" option must be true',
	);
});
