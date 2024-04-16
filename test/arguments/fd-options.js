import {PassThrough} from 'node:stream';
import {spawn} from 'node:child_process';
import process from 'node:process';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio, getStdio} from '../helpers/stdio.js';
import {getEarlyErrorSubprocess} from '../helpers/early-error.js';
import {assertPipeError} from '../helpers/pipe.js';

setFixtureDir();

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

const testNodeStream = async (t, {
	message,
	sourceOptions = {},
	getSource = () => execa('empty.js', sourceOptions),
	from,
	to,
	writable = to !== undefined,
}) => {
	assertNodeStream({t, message, getSource, from, to, methodName: writable ? 'writable' : 'readable'});
	assertNodeStream({t, message, getSource, from, to, methodName: 'duplex'});
};

const assertNodeStream = ({t, message, getSource, from, to, methodName}) => {
	const error = t.throws(() => {
		getSource()[methodName]({from, to});
	});
	t.true(error.message.includes(getMessage(message)));
};

const testIterable = async (t, {
	message,
	sourceOptions = {},
	getSource = () => execa('empty.js', sourceOptions),
	from,
}) => {
	const error = t.throws(() => {
		getSource().iterable({from});
	});
	t.true(error.message.includes(getMessage(message)));
};

test('Must set "all" option to "true" to use .pipe("all")', testPipeError, {
	from: 'all',
	message: '"all" option must be true',
});
test('Must set "all" option to "true" to use .duplex("all")', testNodeStream, {
	from: 'all',
	message: '"all" option must be true',
});
test('Must set "all" option to "true" to use .iterable("all")', testIterable, {
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
test('.duplex() "from" option cannot be "stdin"', testNodeStream, {
	from: 'stdin',
	message: '"from" must not be',
});
test('.iterable() "from" option cannot be "stdin"', testIterable, {
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
test('.duplex() "to" option cannot be "stdout"', testNodeStream, {
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
test('.duplex() "from" option cannot be any string', testNodeStream, {
	from: 'other',
	message: 'must be "stdout", "stderr", "all"',
});
test('.iterable() "from" option cannot be any string', testIterable, {
	from: 'other',
	message: 'must be "stdout", "stderr", "all"',
});
test('.pipe() "to" option cannot be any string', testPipeError, {
	to: 'other',
	message: 'must be "stdin"',
});
test('.duplex() "to" option cannot be any string', testNodeStream, {
	to: 'other',
	message: 'must be "stdin"',
});
test('.pipe() "from" option cannot be a number without "fd"', testPipeError, {
	from: '1',
	message: 'must be "stdout", "stderr", "all"',
});
test('.duplex() "from" option cannot be a number without "fd"', testNodeStream, {
	from: '1',
	message: 'must be "stdout", "stderr", "all"',
});
test('.iterable() "from" option cannot be a number without "fd"', testIterable, {
	from: '1',
	message: 'must be "stdout", "stderr", "all"',
});
test('.pipe() "to" option cannot be a number without "fd"', testPipeError, {
	to: '0',
	message: 'must be "stdin"',
});
test('.duplex() "to" option cannot be a number without "fd"', testNodeStream, {
	to: '0',
	message: 'must be "stdin"',
});
test('.pipe() "from" option cannot be just "fd"', testPipeError, {
	from: 'fd',
	message: 'must be "stdout", "stderr", "all"',
});
test('.duplex() "from" option cannot be just "fd"', testNodeStream, {
	from: 'fd',
	message: 'must be "stdout", "stderr", "all"',
});
test('.iterable() "from" option cannot be just "fd"', testIterable, {
	from: 'fd',
	message: 'must be "stdout", "stderr", "all"',
});
test('.pipe() "to" option cannot be just "fd"', testPipeError, {
	to: 'fd',
	message: 'must be "stdin"',
});
test('.duplex() "to" option cannot be just "fd"', testNodeStream, {
	to: 'fd',
	message: 'must be "stdin"',
});
test('.pipe() "from" option cannot be a float', testPipeError, {
	from: 'fd1.5',
	message: 'must be "stdout", "stderr", "all"',
});
test('.duplex() "from" option cannot be a float', testNodeStream, {
	from: 'fd1.5',
	message: 'must be "stdout", "stderr", "all"',
});
test('.iterable() "from" option cannot be a float', testIterable, {
	from: 'fd1.5',
	message: 'must be "stdout", "stderr", "all"',
});
test('.pipe() "to" option cannot be a float', testPipeError, {
	to: 'fd1.5',
	message: 'must be "stdin"',
});
test('.duplex() "to" option cannot be a float', testNodeStream, {
	to: 'fd1.5',
	message: 'must be "stdin"',
});
test('.pipe() "from" option cannot be a negative number', testPipeError, {
	from: 'fd-1',
	message: 'must be "stdout", "stderr", "all"',
});
test('.duplex() "from" option cannot be a negative number', testNodeStream, {
	from: 'fd-1',
	message: 'must be "stdout", "stderr", "all"',
});
test('.iterable() "from" option cannot be a negative number', testIterable, {
	from: 'fd-1',
	message: 'must be "stdout", "stderr", "all"',
});
test('.pipe() "to" option cannot be a negative number', testPipeError, {
	to: 'fd-1',
	message: 'must be "stdin"',
});
test('.duplex() "to" option cannot be a negative number', testNodeStream, {
	to: 'fd-1',
	message: 'must be "stdin"',
});
test('.pipe() "from" option cannot be a non-existing file descriptor', testPipeError, {
	from: 'fd3',
	message: 'file descriptor does not exist',
});
test('.duplex() "from" cannot be a non-existing file descriptor', testNodeStream, {
	from: 'fd3',
	message: 'file descriptor does not exist',
});
test('.iterable() "from" cannot be a non-existing file descriptor', testIterable, {
	from: 'fd3',
	message: 'file descriptor does not exist',
});
test('.pipe() "to" option cannot be a non-existing file descriptor', testPipeError, {
	to: 'fd3',
	message: 'file descriptor does not exist',
});
test('.duplex() "to" cannot be a non-existing file descriptor', testNodeStream, {
	to: 'fd3',
	message: 'file descriptor does not exist',
});
test('.pipe() "from" option cannot be an input file descriptor', testPipeError, {
	sourceOptions: getStdio(3, new Uint8Array()),
	from: 'fd3',
	message: 'must be a readable stream',
});
test('.duplex() "from" option cannot be an input file descriptor', testNodeStream, {
	sourceOptions: getStdio(3, new Uint8Array()),
	from: 'fd3',
	message: 'must be a readable stream',
});
test('.iterable() "from" option cannot be an input file descriptor', testIterable, {
	sourceOptions: getStdio(3, new Uint8Array()),
	from: 'fd3',
	message: 'must be a readable stream',
});
test('.pipe() "to" option cannot be an output file descriptor', testPipeError, {
	destinationOptions: fullStdio,
	to: 'fd3',
	message: 'must be a writable stream',
});
test('.duplex() "to" option cannot be an output file descriptor', testNodeStream, {
	sourceOptions: fullStdio,
	to: 'fd3',
	message: 'must be a writable stream',
});
test('.pipe() "to" option cannot be "all"', testPipeError, {
	destinationOptions: fullStdio,
	to: 'all',
	message: 'must be a writable stream',
});
test('.duplex() "to" option cannot be "all"', testNodeStream, {
	sourceOptions: fullStdio,
	to: 'all',
	message: 'must be a writable stream',
});
test('Cannot set "stdout" option to "ignore" to use .pipe()', testPipeError, {
	sourceOptions: {stdout: 'ignore'},
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" option to "ignore" to use .duplex()', testNodeStream, {
	sourceOptions: {stdout: 'ignore'},
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" option to "ignore" to use .iterable()', testIterable, {
	sourceOptions: {stdout: 'ignore'},
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdin" option to "ignore" to use .pipe()', testPipeError, {
	destinationOptions: {stdin: 'ignore'},
	message: ['stdin', '\'ignore\''],
});
test('Cannot set "stdin" option to "ignore" to use .duplex()', testNodeStream, {
	sourceOptions: {stdin: 'ignore'},
	message: ['stdin', '\'ignore\''],
	writable: true,
});
test('Cannot set "stdout" option to "ignore" to use .pipe(1)', testPipeError, {
	sourceOptions: {stdout: 'ignore'},
	from: 'fd1',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" option to "ignore" to use .duplex(1)', testNodeStream, {
	sourceOptions: {stdout: 'ignore'},
	from: 'fd1',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" option to "ignore" to use .iterable(1)', testIterable, {
	sourceOptions: {stdout: 'ignore'},
	from: 'fd1',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdin" option to "ignore" to use .pipe(0)', testPipeError, {
	destinationOptions: {stdin: 'ignore'},
	message: ['stdin', '\'ignore\''],
	to: 'fd0',
});
test('Cannot set "stdin" option to "ignore" to use .duplex(0)', testNodeStream, {
	sourceOptions: {stdin: 'ignore'},
	message: ['stdin', '\'ignore\''],
	to: 'fd0',
});
test('Cannot set "stdout" option to "ignore" to use .pipe("stdout")', testPipeError, {
	sourceOptions: {stdout: 'ignore'},
	from: 'stdout',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" option to "ignore" to use .duplex("stdout")', testNodeStream, {
	sourceOptions: {stdout: 'ignore'},
	from: 'stdout',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" option to "ignore" to use .iterable("stdout")', testIterable, {
	sourceOptions: {stdout: 'ignore'},
	from: 'stdout',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdin" option to "ignore" to use .pipe("stdin")', testPipeError, {
	destinationOptions: {stdin: 'ignore'},
	message: ['stdin', '\'ignore\''],
	to: 'stdin',
});
test('Cannot set "stdin" option to "ignore" to use .duplex("stdin")', testNodeStream, {
	sourceOptions: {stdin: 'ignore'},
	message: ['stdin', '\'ignore\''],
	to: 'stdin',
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .pipe()', testPipeError, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .duplex()', testNodeStream, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .iterable()', testIterable, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .pipe(1)', testPipeError, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'fd1',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .duplex(1)', testNodeStream, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'fd1',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .iterable(1)', testIterable, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'fd1',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .pipe("stdout")', testPipeError, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'stdout',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .duplex("stdout")', testNodeStream, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'stdout',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .iterable("stdout")', testIterable, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'stdout',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdio[1]" option to "ignore" to use .pipe()', testPipeError, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'pipe']},
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[1]" option to "ignore" to use .duplex()', testNodeStream, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'pipe']},
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[1]" option to "ignore" to use .iterable()', testIterable, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'pipe']},
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[0]" option to "ignore" to use .pipe()', testPipeError, {
	destinationOptions: {stdio: ['ignore', 'pipe', 'pipe']},
	message: ['stdio[0]', '\'ignore\''],
});
test('Cannot set "stdio[0]" option to "ignore" to use .duplex()', testNodeStream, {
	sourceOptions: {stdio: ['ignore', 'pipe', 'pipe']},
	message: ['stdio[0]', '\'ignore\''],
	writable: true,
});
test('Cannot set "stdio[1]" option to "ignore" to use .pipe(1)', testPipeError, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'pipe']},
	from: 'fd1',
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[1]" option to "ignore" to use .duplex(1)', testNodeStream, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'pipe']},
	from: 'fd1',
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[1]" option to "ignore" to use .iterable(1)', testIterable, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'pipe']},
	from: 'fd1',
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[0]" option to "ignore" to use .pipe(0)', testPipeError, {
	destinationOptions: {stdio: ['ignore', 'pipe', 'pipe']},
	message: ['stdio[0]', '\'ignore\''],
	to: 'fd0',
});
test('Cannot set "stdio[0]" option to "ignore" to use .duplex(0)', testNodeStream, {
	sourceOptions: {stdio: ['ignore', 'pipe', 'pipe']},
	message: ['stdio[0]', '\'ignore\''],
	to: 'fd0',
});
test('Cannot set "stdio[1]" option to "ignore" to use .pipe("stdout")', testPipeError, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'pipe']},
	from: 'stdout',
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[1]" option to "ignore" to use .duplex("stdout")', testNodeStream, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'pipe']},
	from: 'stdout',
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[1]" option to "ignore" to use .iterable("stdout")', testIterable, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'pipe']},
	from: 'stdout',
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[0]" option to "ignore" to use .pipe("stdin")', testPipeError, {
	destinationOptions: {stdio: ['ignore', 'pipe', 'pipe']},
	message: ['stdio[0]', '\'ignore\''],
	to: 'stdin',
});
test('Cannot set "stdio[0]" option to "ignore" to use .duplex("stdin")', testNodeStream, {
	sourceOptions: {stdio: ['ignore', 'pipe', 'pipe']},
	message: ['stdio[0]', '\'ignore\''],
	to: 'stdin',
});
test('Cannot set "stderr" option to "ignore" to use .pipe(2)', testPipeError, {
	sourceOptions: {stderr: 'ignore'},
	from: 'fd2',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stderr" option to "ignore" to use .duplex(2)', testNodeStream, {
	sourceOptions: {stderr: 'ignore'},
	from: 'fd2',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stderr" option to "ignore" to use .iterable(2)', testIterable, {
	sourceOptions: {stderr: 'ignore'},
	from: 'fd2',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stderr" option to "ignore" to use .pipe("stderr")', testPipeError, {
	sourceOptions: {stderr: 'ignore'},
	from: 'stderr',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stderr" option to "ignore" to use .duplex("stderr")', testNodeStream, {
	sourceOptions: {stderr: 'ignore'},
	from: 'stderr',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stderr" option to "ignore" to use .iterable("stderr")', testIterable, {
	sourceOptions: {stderr: 'ignore'},
	from: 'stderr',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .pipe(2)', testPipeError, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'fd2',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .duplex(2)', testNodeStream, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'fd2',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .iterable(2)', testIterable, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'fd2',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .pipe("stderr")', testPipeError, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'stderr',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .duplex("stderr")', testNodeStream, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'stderr',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .iterable("stderr")', testIterable, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore'},
	from: 'stderr',
	message: ['stderr', '\'ignore\''],
});
test('Cannot set "stdio[2]" option to "ignore" to use .pipe(2)', testPipeError, {
	sourceOptions: {stdio: ['pipe', 'pipe', 'ignore']},
	from: 'fd2',
	message: ['stdio[2]', '\'ignore\''],
});
test('Cannot set "stdio[2]" option to "ignore" to use .duplex(2)', testNodeStream, {
	sourceOptions: {stdio: ['pipe', 'pipe', 'ignore']},
	from: 'fd2',
	message: ['stdio[2]', '\'ignore\''],
});
test('Cannot set "stdio[2]" option to "ignore" to use .iterable(2)', testIterable, {
	sourceOptions: {stdio: ['pipe', 'pipe', 'ignore']},
	from: 'fd2',
	message: ['stdio[2]', '\'ignore\''],
});
test('Cannot set "stdio[2]" option to "ignore" to use .pipe("stderr")', testPipeError, {
	sourceOptions: {stdio: ['pipe', 'pipe', 'ignore']},
	from: 'stderr',
	message: ['stdio[2]', '\'ignore\''],
});
test('Cannot set "stdio[2]" option to "ignore" to use .duplex("stderr")', testNodeStream, {
	sourceOptions: {stdio: ['pipe', 'pipe', 'ignore']},
	from: 'stderr',
	message: ['stdio[2]', '\'ignore\''],
});
test('Cannot set "stdio[2]" option to "ignore" to use .iterable("stderr")', testIterable, {
	sourceOptions: {stdio: ['pipe', 'pipe', 'ignore']},
	from: 'stderr',
	message: ['stdio[2]', '\'ignore\''],
});
test('Cannot set "stdio[3]" option to "ignore" to use .pipe(3)', testPipeError, {
	sourceOptions: getStdio(3, 'ignore'),
	from: 'fd3',
	message: ['stdio[3]', '\'ignore\''],
});
test('Cannot set "stdio[3]" option to "ignore" to use .duplex(3)', testNodeStream, {
	sourceOptions: getStdio(3, 'ignore'),
	from: 'fd3',
	message: ['stdio[3]', '\'ignore\''],
});
test('Cannot set "stdio[3]" option to "ignore" to use .iterable(3)', testIterable, {
	sourceOptions: getStdio(3, 'ignore'),
	from: 'fd3',
	message: ['stdio[3]', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .pipe("all")', testPipeError, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore', all: true},
	from: 'all',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .duplex("all")', testNodeStream, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore', all: true},
	from: 'all',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdout" + "stderr" option to "ignore" to use .iterable("all")', testIterable, {
	sourceOptions: {stdout: 'ignore', stderr: 'ignore', all: true},
	from: 'all',
	message: ['stdout', '\'ignore\''],
});
test('Cannot set "stdio[1]" + "stdio[2]" option to "ignore" to use .pipe("all")', testPipeError, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'ignore'], all: true},
	from: 'all',
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[1]" + "stdio[2]" option to "ignore" to use .duplex("all")', testNodeStream, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'ignore'], all: true},
	from: 'all',
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdio[1]" + "stdio[2]" option to "ignore" to use .iterable("all")', testIterable, {
	sourceOptions: {stdio: ['pipe', 'ignore', 'ignore'], all: true},
	from: 'all',
	message: ['stdio[1]', '\'ignore\''],
});
test('Cannot set "stdout" option to "inherit" to use .pipe()', testPipeError, {
	sourceOptions: {stdout: 'inherit'},
	message: ['stdout', '\'inherit\''],
});
test('Cannot set "stdout" option to "inherit" to use .duplex()', testNodeStream, {
	sourceOptions: {stdout: 'inherit'},
	message: ['stdout', '\'inherit\''],
});
test('Cannot set "stdout" option to "inherit" to use .iterable()', testIterable, {
	sourceOptions: {stdout: 'inherit'},
	message: ['stdout', '\'inherit\''],
});
test('Cannot set "stdin" option to "inherit" to use .pipe()', testPipeError, {
	destinationOptions: {stdin: 'inherit'},
	message: ['stdin', '\'inherit\''],
});
test('Cannot set "stdin" option to "inherit" to use .duplex()', testNodeStream, {
	sourceOptions: {stdin: 'inherit'},
	message: ['stdin', '\'inherit\''],
	writable: true,
});
test('Cannot set "stdout" option to "ipc" to use .pipe()', testPipeError, {
	sourceOptions: {stdout: 'ipc'},
	message: ['stdout', '\'ipc\''],
});
test('Cannot set "stdout" option to "ipc" to use .duplex()', testNodeStream, {
	sourceOptions: {stdout: 'ipc'},
	message: ['stdout', '\'ipc\''],
});
test('Cannot set "stdout" option to "ipc" to use .iterable()', testIterable, {
	sourceOptions: {stdout: 'ipc'},
	message: ['stdout', '\'ipc\''],
});
test('Cannot set "stdin" option to "ipc" to use .pipe()', testPipeError, {
	destinationOptions: {stdin: 'ipc'},
	message: ['stdin', '\'ipc\''],
});
test('Cannot set "stdin" option to "ipc" to use .duplex()', testNodeStream, {
	sourceOptions: {stdin: 'ipc'},
	message: ['stdin', '\'ipc\''],
	writable: true,
});
test('Cannot set "stdout" option to file descriptors to use .pipe()', testPipeError, {
	sourceOptions: {stdout: 1},
	message: ['stdout', '1'],
});
test('Cannot set "stdout" option to file descriptors to use .duplex()', testNodeStream, {
	sourceOptions: {stdout: 1},
	message: ['stdout', '1'],
});
test('Cannot set "stdout" option to file descriptors to use .iterable()', testIterable, {
	sourceOptions: {stdout: 1},
	message: ['stdout', '1'],
});
test('Cannot set "stdin" option to file descriptors to use .pipe()', testPipeError, {
	destinationOptions: {stdin: 0},
	message: ['stdin', '0'],
});
test('Cannot set "stdin" option to file descriptors to use .duplex()', testNodeStream, {
	sourceOptions: {stdin: 0},
	message: ['stdin', '0'],
	writable: true,
});
test('Cannot set "stdout" option to Node.js streams to use .pipe()', testPipeError, {
	sourceOptions: {stdout: process.stdout},
	message: ['stdout', 'Stream'],
});
test('Cannot set "stdout" option to Node.js streams to use .duplex()', testNodeStream, {
	sourceOptions: {stdout: process.stdout},
	message: ['stdout', 'Stream'],
});
test('Cannot set "stdout" option to Node.js streams to use .iterable()', testIterable, {
	sourceOptions: {stdout: process.stdout},
	message: ['stdout', 'Stream'],
});
test('Cannot set "stdin" option to Node.js streams to use .pipe()', testPipeError, {
	destinationOptions: {stdin: process.stdin},
	message: ['stdin', 'Stream'],
});
test('Cannot set "stdin" option to Node.js streams to use .duplex()', testNodeStream, {
	sourceOptions: {stdin: process.stdin},
	message: ['stdin', 'Stream'],
	writable: true,
});
test('Cannot set "stdio[3]" option to Node.js Writable streams to use .pipe()', testPipeError, {
	sourceOptions: getStdio(3, process.stdout),
	message: ['stdio[3]', 'Stream'],
	from: 'fd3',
});
test('Cannot set "stdio[3]" option to Node.js Writable streams to use .duplex()', testNodeStream, {
	sourceOptions: getStdio(3, process.stdout),
	message: ['stdio[3]', 'Stream'],
	from: 'fd3',
});
test('Cannot set "stdio[3]" option to Node.js Writable streams to use .iterable()', testIterable, {
	sourceOptions: getStdio(3, process.stdout),
	message: ['stdio[3]', 'Stream'],
	from: 'fd3',
});
test('Cannot set "stdio[3]" option to Node.js Readable streams to use .pipe()', testPipeError, {
	destinationOptions: getStdio(3, process.stdin),
	message: ['stdio[3]', 'Stream'],
	to: 'fd3',
});
test('Cannot set "stdio[3]" option to Node.js Readable streams to use .duplex()', testNodeStream, {
	sourceOptions: getStdio(3, process.stdin),
	message: ['stdio[3]', 'Stream'],
	to: 'fd3',
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
