import assert from 'node:assert/strict';
import {arch} from 'node:os';
import process from 'node:process';
import {once} from 'node:events';
import {finished} from 'node:stream/promises';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {
	execa,
	execaSync,
	$,
	ExecaError,
	ExecaSyncError,
} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarUint8Array} from '../helpers/input.js';
import {fullStdio} from '../helpers/stdio.js';
import {getOutputGenerator, convertTransformToFinal} from '../helpers/generator.js';
import {
	earlyErrorOptions,
	getEarlyErrorSubprocess,
	getEarlyErrorSubprocessSync,
	expectedEarlyError,
	expectedEarlyErrorSync,
} from '../helpers/early-error.js';

setFixtureDirectory();

const isWindows = process.platform === 'win32';
const ENOENT_REGEXP = isWindows ? /failed with exit code 1/ : /spawn.* ENOENT/;

// A nonexistent command fails asynchronously, so it does not go through the early error path, but the subprocess still has no process to signal
test('kill() does not signal the current process when the command does not exist', async () => {
	const subprocess = execa('nonexistent-command-for-execa');
	assert.equal(subprocess.pid, undefined);
	assert.equal(subprocess.kill(), false);
	const {code} = await assertRejects(subprocess);
	assert.equal(code, 'ENOENT');
});

test('execaSync() throws error if ENOENT', () => {
	assertThrows(() => {
		execaSync('foo');
	}, {message: ENOENT_REGEXP});
});

// The subprocess never started, so its output is empty, but it must have the same shape as with the asynchronous methods
const testSpawnFailureOutput = async options => {
	const {stdio, all} = await execa('nonexistent-command-for-execa', {...options, reject: false});
	const {stdio: stdioSync, all: allSync} = execaSync('nonexistent-command-for-execa', {...options, reject: false});
	assert.deepEqual(stdioSync, stdio);
	assert.deepEqual(allSync, all);
};

test('execaSync() output is empty when the command does not exist', () => testSpawnFailureOutput({}));
test('execaSync() output is empty when the command does not exist, with encoding: buffer', () => testSpawnFailureOutput({encoding: 'buffer'}));
test('execaSync() output is empty when the command does not exist, with lines: true', () => testSpawnFailureOutput({lines: true}));
test('execaSync() output is empty when the command does not exist, with all: true', () => testSpawnFailureOutput({all: true}));
test('execaSync() output is empty when the command does not exist, with an additional file descriptor', () => testSpawnFailureOutput(fullStdio));
test('execaSync() output is undefined when the command does not exist, with stdout: ignore', () => testSpawnFailureOutput({stdout: 'ignore'}));
test('execaSync() output is undefined when the command does not exist, with buffer: false', () => testSpawnFailureOutput({buffer: false}));
test('execaSync() output is empty when the cwd does not exist', () => testSpawnFailureOutput({cwd: '/nonexistent-directory-for-execa'}));
test('execaSync() output runs the final of transforms when the command does not exist', () => testSpawnFailureOutput({stdout: convertTransformToFinal(getOutputGenerator(foobarString)(), true)}));

const testEarlyErrorShape = async reject => {
	const subprocess = getEarlyErrorSubprocess({reject});
	assert.doesNotThrow(() => {
		subprocess.catch(() => {});
		subprocess.nodeChildProcess.unref();
		subprocess.nodeChildProcess.on('error', () => {});
	});
};

test('child_process.spawn() early errors have correct shape', () => testEarlyErrorShape(true));
test('child_process.spawn() early errors have correct shape - reject false', () => testEarlyErrorShape(false));

// The subprocess never spawned, so there is no process to signal.
// `ChildProcess.prototype.kill()` would signal the current process group instead, since its process id is `0`.
// The handle is replaced by a stub, so that a regression is caught by an assertion instead of killing this test process.
test('kill() does not signal the current process on early errors', async () => {
	const subprocess = getEarlyErrorSubprocess({reject: false});
	let isSignaled = false;
	subprocess.nodeChildProcess._handle = {
		kill() {
			isSignaled = true;
			return 0;
		},
	};

	assert.equal(subprocess.kill(), false);
	assert.equal(isSignaled, false);
	const {failed, isCanceled} = await subprocess;
	assert.equal(failed, true);
	assert.equal(isCanceled, false);
});

test('child_process.spawn() early errors are propagated', async () => {
	await assertRejects(getEarlyErrorSubprocess(), expectedEarlyError);
});

test('child_process.spawn() early errors are returned', async () => {
	const {failed} = await getEarlyErrorSubprocess({reject: false});
	assert.equal(failed, true);
});

test('child_process.spawnSync() early errors are propagated with a correct shape', () => {
	assertThrows(getEarlyErrorSubprocessSync, expectedEarlyErrorSync);
});

test('child_process.spawnSync() early errors are propagated with a correct shape - reject false', () => {
	const {failed} = getEarlyErrorSubprocessSync({reject: false});
	assert.equal(failed, true);
});

if (!isWindows) {
	test('execa() rejects if running non-executable', async () => {
		await assertRejects(execa('non-executable.js'));
	});

	test('execa() rejects with correct error and doesn\'t throw if running non-executable with input', async () => {
		await assertRejects(execa('non-executable.js', {input: 'Hey!'}), {message: /EACCES/});
	});

	if (arch() === 'x64') {
		test('write to fast-exit subprocess', async () => {
			// Try-catch here is necessary, because this test is not 100% accurate
			// Sometimes subprocess can manage to accept input before exiting
			// eslint-disable-next-line node-test/prefer-assert-throws -- either outcome is acceptable, see comment above
			try {
				await execa(`fast-exit-${process.platform}`, [], {input: 'data'});
			} catch (error) {
				assert.equal(error.code, 'EPIPE');
			}
		});
	}
}

const testEarlyErrorPipe = async getSubprocess => {
	await assertRejects(getSubprocess(), expectedEarlyError);
};

test('child_process.spawn() early errors on source can use .pipe()', () => testEarlyErrorPipe(() => getEarlyErrorSubprocess().pipe(execa('empty.js'))));
test('child_process.spawn() early errors on destination can use .pipe()', () => testEarlyErrorPipe(() => execa('empty.js').pipe(getEarlyErrorSubprocess())));
test('child_process.spawn() early errors on source and destination can use .pipe()', () => testEarlyErrorPipe(() => getEarlyErrorSubprocess().pipe(getEarlyErrorSubprocess())));
test('child_process.spawn() early errors can use .pipe() multiple times', () => testEarlyErrorPipe(() => getEarlyErrorSubprocess().pipe(getEarlyErrorSubprocess()).pipe(getEarlyErrorSubprocess())));
test('child_process.spawn() early errors can use .pipe``', () => testEarlyErrorPipe(() => $(earlyErrorOptions)`empty.js`.pipe(earlyErrorOptions)`empty.js`));
test('child_process.spawn() early errors can use .pipe`` multiple times', () => testEarlyErrorPipe(() => $(earlyErrorOptions)`empty.js`.pipe(earlyErrorOptions)`empty.js`.pipe`empty.js`));

const testEarlyErrorConvertor = async streamMethod => {
	const subprocess = getEarlyErrorSubprocess();
	const stream = subprocess[streamMethod]();
	const errorPromise = once(stream, 'error');
	stream.read?.();
	stream.write?.('.');
	const [streamError] = await errorPromise;
	assert.equal(streamError, await assertRejects(subprocess));
};

test('child_process.spawn() early errors can use .readable()', () => testEarlyErrorConvertor('readable'));
test('child_process.spawn() early errors can use .writable()', () => testEarlyErrorConvertor('writable'));
test('child_process.spawn() early errors can use .duplex()', () => testEarlyErrorConvertor('duplex'));

const testEarlyErrorWebConvertor = async streamMethod => {
	const subprocess = getEarlyErrorSubprocess();
	subprocess[streamMethod]();
	await assertRejects(subprocess);
};

test('child_process.spawn() early errors can use .readableStream()', () => testEarlyErrorWebConvertor('readableStream'));
test('child_process.spawn() early errors can use .writableStream()', () => testEarlyErrorWebConvertor('writableStream'));
test('child_process.spawn() early errors can use .transformStream()', () => testEarlyErrorWebConvertor('transformStream'));

// The subprocess never started, so those streams have no contents.
// Like when the subprocess did start, they error with its error, or end with `reject: false`, instead of hanging forever.
const readEarlyErrorStream = (subprocess, streamMethod) => Array.fromAsync(subprocess[streamMethod]?.() ?? subprocess);

const testEarlyErrorReadableEnd = async streamMethod => {
	const subprocess = getEarlyErrorSubprocess();
	const streamError = await assertRejects(readEarlyErrorStream(subprocess, streamMethod));
	assert.equal(streamError, await assertRejects(subprocess));
};

test('child_process.spawn() early errors make .readable() fail', () => testEarlyErrorReadableEnd('readable'));
test('child_process.spawn() early errors make .duplex() fail', () => testEarlyErrorReadableEnd('duplex'));
test('child_process.spawn() early errors make .readableStream() fail', () => testEarlyErrorReadableEnd('readableStream'));
test('child_process.spawn() early errors make .iterable() fail', () => testEarlyErrorReadableEnd('iterable'));
test('child_process.spawn() early errors make Symbol.asyncIterator fail', () => testEarlyErrorReadableEnd());

const testEarlyErrorReadableEndNoReject = async streamMethod => {
	const subprocess = getEarlyErrorSubprocess({reject: false});
	assert.deepEqual(await readEarlyErrorStream(subprocess, streamMethod), []);
	const {failed} = await subprocess;
	assert.equal(failed, true);
};

test('child_process.spawn() early errors end .readable() with reject: false', () => testEarlyErrorReadableEndNoReject('readable'));
test('child_process.spawn() early errors end .duplex() with reject: false', () => testEarlyErrorReadableEndNoReject('duplex'));
test('child_process.spawn() early errors end .readableStream() with reject: false', () => testEarlyErrorReadableEndNoReject('readableStream'));
test('child_process.spawn() early errors end .iterable() with reject: false', () => testEarlyErrorReadableEndNoReject('iterable'));
test('child_process.spawn() early errors end Symbol.asyncIterator with reject: false', () => testEarlyErrorReadableEndNoReject());

const writeEarlyErrorStream = async (subprocess, streamMethod) => {
	const stream = subprocess[streamMethod]();
	stream.end(foobarString);
	await finished(stream, {readable: false});
};

const writeEarlyErrorWebStream = async (subprocess, streamMethod) => {
	const stream = subprocess[streamMethod]();
	const writer = (stream.writable ?? stream).getWriter();
	await writer.write(foobarUint8Array);
	await writer.close();
};

const testEarlyErrorWritableEnd = async (streamMethod, writeStream) => {
	const subprocess = getEarlyErrorSubprocess();
	const streamError = await assertRejects(writeStream(subprocess, streamMethod));
	assert.equal(streamError, await assertRejects(subprocess));
};

test('child_process.spawn() early errors make .writable() fail', () => testEarlyErrorWritableEnd('writable', writeEarlyErrorStream));
test('child_process.spawn() early errors make .duplex() writable side fail', () => testEarlyErrorWritableEnd('duplex', writeEarlyErrorStream));
test('child_process.spawn() early errors make .writableStream() fail', () => testEarlyErrorWritableEnd('writableStream', writeEarlyErrorWebStream));
test('child_process.spawn() early errors make .transformStream() fail', () => testEarlyErrorWritableEnd('transformStream', writeEarlyErrorWebStream));

const testEarlyErrorWritableEndNoReject = async (streamMethod, writeStream) => {
	const subprocess = getEarlyErrorSubprocess({reject: false});
	await writeStream(subprocess, streamMethod);
	const {failed} = await subprocess;
	assert.equal(failed, true);
};

test('child_process.spawn() early errors end .writable() with reject: false', () => testEarlyErrorWritableEndNoReject('writable', writeEarlyErrorStream));
test('child_process.spawn() early errors end .duplex() writable side with reject: false', () => testEarlyErrorWritableEndNoReject('duplex', writeEarlyErrorStream));
test('child_process.spawn() early errors end .writableStream() with reject: false', () => testEarlyErrorWritableEndNoReject('writableStream', writeEarlyErrorWebStream));
test('child_process.spawn() early errors end .transformStream() with reject: false', () => testEarlyErrorWritableEndNoReject('transformStream', writeEarlyErrorWebStream));

const testEarlyErrorIpc = async runIpcMethod => {
	const subprocess = getEarlyErrorSubprocess({ipc: true});
	assertThrows(() => {
		runIpcMethod(subprocess);
	}, {message: /cannot be used: the subprocess has already exited or disconnected/});
	await assertRejects(subprocess, expectedEarlyError);
};

test('child_process.spawn() early errors can use .sendMessage()', () => testEarlyErrorIpc(subprocess => subprocess.sendMessage('.')));
test('child_process.spawn() early errors can use .getOneMessage()', () => testEarlyErrorIpc(subprocess => subprocess.getOneMessage()));
test('child_process.spawn() early errors can use .getEachMessage()', () => testEarlyErrorIpc(subprocess => subprocess.getEachMessage()));

const testEarlyErrorStream = async (getStreamProperty, options) => {
	const subprocess = getEarlyErrorSubprocess(options);
	const stream = getStreamProperty(subprocess);
	stream.on('close', () => {});
	stream.read?.();
	stream.end?.();
	await assertRejects(subprocess);
};

test('child_process.spawn() early errors can use .stdin', () => testEarlyErrorStream(({stdin}) => stdin));
test('child_process.spawn() early errors can use .stdout', () => testEarlyErrorStream(({stdout}) => stdout));
test('child_process.spawn() early errors can use .stderr', () => testEarlyErrorStream(({stderr}) => stderr));
test('child_process.spawn() early errors can use .stdio[1]', () => testEarlyErrorStream(({stdio}) => stdio[1]));
test('child_process.spawn() early errors can use .stdio[3]', () => testEarlyErrorStream(({stdio}) => stdio[3], fullStdio));
test('child_process.spawn() early errors can use .all', () => testEarlyErrorStream(({all}) => all, {all: true}));

// Reading the `inputFile` happens after the file descriptors are set up, so a missing file is reported as an early error, like with asynchronous methods
test('inputFile which does not exist is an early error', async () => {
	const error = await assertRejects(execa('stdin.js', {inputFile: 'does_not_exist'}));
	assert.ok(error instanceof ExecaError);
	assert.equal(error.cause.code, 'ENOENT');
});

test('inputFile which does not exist is an early error, sync', () => {
	const error = assertThrows(() => {
		execaSync('stdin.js', {inputFile: 'does_not_exist'});
	});
	assert.ok(error instanceof ExecaSyncError);
	assert.equal(error.cause.code, 'ENOENT');
});
