import process from 'node:process';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio, getStdio} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';
import {QUOTE} from '../helpers/verbose.js';
import {noopGenerator, outputObjectGenerator} from '../helpers/generator.js';

const isWindows = process.platform === 'win32';

setFixtureDir();

const testSuccessShape = async (t, execaMethod) => {
	const result = await execaMethod('empty.js', {...fullStdio, all: true});
	t.deepEqual(Reflect.ownKeys(result), [
		'command',
		'escapedCommand',
		'cwd',
		'durationMs',
		'failed',
		'timedOut',
		'isCanceled',
		'isTerminated',
		'isMaxBuffer',
		'exitCode',
		'stdout',
		'stderr',
		'all',
		'stdio',
		'pipedFrom',
	]);
};

test('Return value properties are not missing and are ordered', testSuccessShape, execa);
test('Return value properties are not missing and are ordered, sync', testSuccessShape, execaSync);

const testErrorShape = async (t, execaMethod) => {
	const error = await execaMethod('fail.js', {...fullStdio, all: true, reject: false});
	t.is(error.exitCode, 2);
	t.deepEqual(Reflect.ownKeys(error), [
		'stack',
		'message',
		'shortMessage',
		'originalMessage',
		'command',
		'escapedCommand',
		'cwd',
		'durationMs',
		'failed',
		'timedOut',
		'isCanceled',
		'isTerminated',
		'isMaxBuffer',
		'exitCode',
		'signal',
		'signalDescription',
		'code',
		'stdout',
		'stderr',
		'all',
		'stdio',
		'pipedFrom',
	]);
};

test('Error properties are not missing and are ordered', testErrorShape, execa);
test('Error properties are not missing and are ordered, sync', testErrorShape, execaSync);

test('error.message contains the command', async t => {
	await t.throwsAsync(execa('exit.js', ['2', 'foo', 'bar']), {message: /exit.js 2 foo bar/});
});

// eslint-disable-next-line max-params
const testStdioMessage = async (t, encoding, all, objectMode, execaMethod) => {
	const {exitCode, message} = await execaMethod('echo-fail.js', {...getStdio(1, noopGenerator(objectMode, false, true), 4), encoding, all, reject: false});
	t.is(exitCode, 1);
	const output = all ? 'stdout\nstderr' : 'stderr\n\nstdout';
	t.true(message.endsWith(`echo-fail.js\n\n${output}\n\nfd3`));
};

test('error.message contains stdout/stderr/stdio if available', testStdioMessage, 'utf8', false, false, execa);
test('error.message contains stdout/stderr/stdio even with encoding "buffer"', testStdioMessage, 'buffer', false, false, execa);
test('error.message contains all if available', testStdioMessage, 'utf8', true, false, execa);
test('error.message contains all even with encoding "buffer"', testStdioMessage, 'buffer', true, false, execa);
test('error.message contains stdout/stderr/stdio if available, objectMode', testStdioMessage, 'utf8', false, true, execa);
test('error.message contains stdout/stderr/stdio even with encoding "buffer", objectMode', testStdioMessage, 'buffer', false, true, execa);
test('error.message contains all if available, objectMode', testStdioMessage, 'utf8', true, true, execa);
test('error.message contains all even with encoding "buffer", objectMode', testStdioMessage, 'buffer', true, true, execa);
test('error.message contains stdout/stderr/stdio if available, sync', testStdioMessage, 'utf8', false, false, execaSync);
test('error.message contains stdout/stderr/stdio even with encoding "buffer", sync', testStdioMessage, 'buffer', false, false, execaSync);
test('error.message contains all if available, sync', testStdioMessage, 'utf8', true, false, execaSync);
test('error.message contains all even with encoding "buffer", sync', testStdioMessage, 'buffer', true, false, execaSync);
test('error.message contains stdout/stderr/stdio if available, objectMode, sync', testStdioMessage, 'utf8', false, true, execaSync);
test('error.message contains stdout/stderr/stdio even with encoding "buffer", objectMode, sync', testStdioMessage, 'buffer', false, true, execaSync);
test('error.message contains all if available, objectMode, sync', testStdioMessage, 'utf8', true, true, execaSync);
test('error.message contains all even with encoding "buffer", objectMode, sync', testStdioMessage, 'buffer', true, true, execaSync);

const testLinesMessage = async (t, encoding, stripFinalNewline, execaMethod) => {
	const {failed, message} = await execaMethod('noop-fail.js', ['1', `${foobarString}\n${foobarString}\n`], {
		lines: true,
		encoding,
		stripFinalNewline,
		reject: false,
	});
	t.true(failed);
	t.true(message.endsWith(`noop-fail.js 1 ${QUOTE}${foobarString}\\n${foobarString}\\n${QUOTE}\n\n${foobarString}\n${foobarString}`));
};

test('error.message handles "lines: true"', testLinesMessage, 'utf8', false, execa);
test('error.message handles "lines: true", stripFinalNewline', testLinesMessage, 'utf8', true, execa);
test('error.message handles "lines: true", buffer', testLinesMessage, 'buffer', false, execa);
test('error.message handles "lines: true", buffer, stripFinalNewline', testLinesMessage, 'buffer', true, execa);
test('error.message handles "lines: true", sync', testLinesMessage, 'utf8', false, execaSync);
test('error.message handles "lines: true", stripFinalNewline, sync', testLinesMessage, 'utf8', true, execaSync);
test('error.message handles "lines: true", buffer, sync', testLinesMessage, 'buffer', false, execaSync);
test('error.message handles "lines: true", buffer, stripFinalNewline, sync', testLinesMessage, 'buffer', true, execaSync);

const testPartialIgnoreMessage = async (t, fdNumber, stdioOption, output) => {
	const {message} = await t.throwsAsync(execa('echo-fail.js', getStdio(fdNumber, stdioOption, 4)));
	t.true(message.endsWith(`echo-fail.js\n\n${output}\n\nfd3`));
};

test('error.message does not contain stdout if not available', testPartialIgnoreMessage, 1, 'ignore', 'stderr');
test('error.message does not contain stderr if not available', testPartialIgnoreMessage, 2, 'ignore', 'stdout');
test('error.message does not contain stdout if it is an object', testPartialIgnoreMessage, 1, outputObjectGenerator(), 'stderr');
test('error.message does not contain stderr if it is an object', testPartialIgnoreMessage, 2, outputObjectGenerator(), 'stdout');

const testFullIgnoreMessage = async (t, options, resultProperty) => {
	const {[resultProperty]: message} = await t.throwsAsync(execa('echo-fail.js', options));
	t.false(message.includes('stderr'));
	t.false(message.includes('stdout'));
	t.false(message.includes('fd3'));
};

test('error.message does not contain stdout/stderr/stdio if not available', testFullIgnoreMessage, {stdio: 'ignore'}, 'message');
test('error.shortMessage does not contain stdout/stderr/stdio', testFullIgnoreMessage, fullStdio, 'shortMessage');

const testErrorMessageConsistent = async (t, stdout) => {
	const {message} = await t.throwsAsync(execa('noop-both-fail-strict.js', [stdout, 'stderr']));
	t.true(message.endsWith(' stderr\n\nstderr\n\nstdout'));
};

test('error.message newlines are consistent - no newline', testErrorMessageConsistent, 'stdout');
test('error.message newlines are consistent - newline', testErrorMessageConsistent, 'stdout\n');

test('Original error.message is kept', async t => {
	const {originalMessage} = await t.throwsAsync(execa('noop.js', {uid: true}));
	t.is(originalMessage, 'The "options.uid" property must be int32. Received type boolean (true)');
});

test('failed is false on success', async t => {
	const {failed} = await execa('noop.js', ['foo']);
	t.false(failed);
});

test('failed is true on failure', async t => {
	const {failed} = await t.throwsAsync(execa('fail.js'));
	t.true(failed);
});

test('error.isTerminated is true if subprocess was killed directly', async t => {
	const subprocess = execa('forever.js', {killSignal: 'SIGINT'});

	subprocess.kill();

	const {isTerminated, signal, originalMessage, message, shortMessage} = await t.throwsAsync(subprocess, {message: /was killed with SIGINT/});
	t.true(isTerminated);
	t.is(signal, 'SIGINT');
	t.is(originalMessage, '');
	t.is(shortMessage, 'Command was killed with SIGINT (User interruption with CTRL-C): forever.js');
	t.is(message, shortMessage);
});

test('error.isTerminated is true if subprocess was killed indirectly', async t => {
	const subprocess = execa('forever.js', {killSignal: 'SIGHUP'});

	process.kill(subprocess.pid, 'SIGINT');

	// `subprocess.kill()` is emulated by Node.js on Windows
	if (isWindows) {
		const {isTerminated, signal} = await t.throwsAsync(subprocess, {message: /failed with exit code 1/});
		t.is(isTerminated, false);
		t.is(signal, undefined);
	} else {
		const {isTerminated, signal} = await t.throwsAsync(subprocess, {message: /was killed with SIGINT/});
		t.is(isTerminated, true);
		t.is(signal, 'SIGINT');
	}
});

test('result.isTerminated is false if not killed', async t => {
	const {isTerminated} = await execa('noop.js');
	t.false(isTerminated);
});

test('result.isTerminated is false if not killed and subprocess.kill() was called', async t => {
	const subprocess = execa('noop.js');
	subprocess.kill(0);
	t.true(subprocess.killed);
	const {isTerminated} = await subprocess;
	t.false(isTerminated);
});

test('result.isTerminated is false if not killed, in sync mode', t => {
	const {isTerminated} = execaSync('noop.js');
	t.false(isTerminated);
});

test('result.isTerminated is false on subprocess error', async t => {
	const {isTerminated} = await t.throwsAsync(execa('wrong command'));
	t.false(isTerminated);
});

test('result.isTerminated is false on subprocess error, in sync mode', t => {
	const {isTerminated} = t.throws(() => {
		execaSync('wrong command');
	});
	t.false(isTerminated);
});

test('error.code is undefined on success', async t => {
	const {code} = await execa('noop.js');
	t.is(code, undefined);
});

test('error.code is defined on failure if applicable', async t => {
	const {code} = await t.throwsAsync(execa('noop.js', {uid: true}));
	t.is(code, 'ERR_INVALID_ARG_TYPE');
});
