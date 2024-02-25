import process from 'node:process';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio, getStdio} from '../helpers/stdio.js';
import {noopGenerator, outputObjectGenerator} from '../helpers/generator.js';

const isWindows = process.platform === 'win32';

setFixtureDir();

test('Return value properties are not missing and are ordered', async t => {
	const result = await execa('empty.js', {...fullStdio, all: true});
	t.deepEqual(Reflect.ownKeys(result), [
		'command',
		'escapedCommand',
		'cwd',
		'failed',
		'timedOut',
		'isCanceled',
		'isTerminated',
		'exitCode',
		'stdout',
		'stderr',
		'all',
		'stdio',
		'pipedFrom',
	]);
});

test('Error properties are not missing and are ordered', async t => {
	const error = await t.throwsAsync(execa('fail.js', {...fullStdio, all: true}));
	t.deepEqual(Reflect.ownKeys(error), [
		'stack',
		'message',
		'shortMessage',
		'originalMessage',
		'command',
		'escapedCommand',
		'cwd',
		'failed',
		'timedOut',
		'isCanceled',
		'isTerminated',
		'exitCode',
		'signal',
		'signalDescription',
		'stdout',
		'stderr',
		'all',
		'stdio',
		'pipedFrom',
	]);
});

test('error.message contains the command', async t => {
	await t.throwsAsync(execa('exit.js', ['2', 'foo', 'bar']), {message: /exit.js 2 foo bar/});
});

const testStdioMessage = async (t, encoding, all, objectMode) => {
	const {message} = await t.throwsAsync(execa('echo-fail.js', {...getStdio(1, noopGenerator(objectMode), 4), encoding, all}));
	const output = all ? 'stdout\nstderr' : 'stderr\n\nstdout';
	t.true(message.endsWith(`echo-fail.js\n\n${output}\n\nfd3`));
};

test('error.message contains stdout/stderr/stdio if available', testStdioMessage, 'utf8', false, false);
test('error.message contains stdout/stderr/stdio even with encoding "buffer"', testStdioMessage, 'buffer', false, false);
test('error.message contains all if available', testStdioMessage, 'utf8', true, false);
test('error.message contains all even with encoding "buffer"', testStdioMessage, 'buffer', true, false);
test('error.message contains stdout/stderr/stdio if available, objectMode', testStdioMessage, 'utf8', false, true);
test('error.message contains stdout/stderr/stdio even with encoding "buffer", objectMode', testStdioMessage, 'buffer', false, true);
test('error.message contains all if available, objectMode', testStdioMessage, 'utf8', true, true);
test('error.message contains all even with encoding "buffer", objectMode', testStdioMessage, 'buffer', true, true);

const testPartialIgnoreMessage = async (t, fdNumber, stdioOption, output) => {
	const {message} = await t.throwsAsync(execa('echo-fail.js', getStdio(fdNumber, stdioOption, 4)));
	t.true(message.endsWith(`echo-fail.js\n\n${output}\n\nfd3`));
};

test('error.message does not contain stdout if not available', testPartialIgnoreMessage, 1, 'ignore', 'stderr');
test('error.message does not contain stderr if not available', testPartialIgnoreMessage, 2, 'ignore', 'stdout');
test('error.message does not contain stdout if it is an object', testPartialIgnoreMessage, 1, outputObjectGenerator, 'stderr');
test('error.message does not contain stderr if it is an object', testPartialIgnoreMessage, 2, outputObjectGenerator, 'stdout');

const testFullIgnoreMessage = async (t, options, resultProperty) => {
	const {[resultProperty]: message} = await t.throwsAsync(execa('echo-fail.js', options));
	t.false(message.includes('stderr'));
	t.false(message.includes('stdout'));
	t.false(message.includes('fd3'));
};

test('error.message does not contain stdout/stderr/stdio if not available', testFullIgnoreMessage, {stdio: 'ignore'}, 'message');
test('error.shortMessage does not contain stdout/stderr/stdio', testFullIgnoreMessage, fullStdio, 'shortMessage');

const testErrorMessageConsistent = async (t, stdout) => {
	const {message} = await t.throwsAsync(execa('noop-both-fail.js', [stdout, 'stderr']));
	t.true(message.endsWith(`noop-both-fail.js ${stdout} stderr\n\nstderr\n\nstdout`));
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

test('error.isTerminated is true if process was killed directly', async t => {
	const subprocess = execa('forever.js', {killSignal: 'SIGINT'});

	subprocess.kill();

	const {isTerminated, signal, originalMessage, message, shortMessage} = await t.throwsAsync(subprocess, {message: /was killed with SIGINT/});
	t.true(isTerminated);
	t.is(signal, 'SIGINT');
	t.is(originalMessage, '');
	t.is(shortMessage, 'Command was killed with SIGINT (User interruption with CTRL-C): forever.js');
	t.is(message, shortMessage);
});

test('error.isTerminated is true if process was killed indirectly', async t => {
	const subprocess = execa('forever.js', {killSignal: 'SIGHUP'});

	process.kill(subprocess.pid, 'SIGINT');

	// `process.kill()` is emulated by Node.js on Windows
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

test('result.isTerminated is false if not killed and childProcess.kill() was called', async t => {
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

test('result.isTerminated is false on process error', async t => {
	const {isTerminated} = await t.throwsAsync(execa('wrong command'));
	t.false(isTerminated);
});

test('result.isTerminated is false on process error, in sync mode', t => {
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
