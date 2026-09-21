import {arch} from 'node:os';
import process from 'node:process';
import {finished} from 'node:stream/promises';
import test from 'ava';
import {execa, execaSync, $} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarUint8Array} from '../helpers/input.js';
import {fullStdio} from '../helpers/stdio.js';
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
test('kill() does not signal the current process when the command does not exist', async t => {
	const subprocess = execa('nonexistent-command-for-execa');
	t.is(subprocess.pid, undefined);
	t.is(subprocess.kill(), false);
	t.is((await t.throwsAsync(subprocess)).code, 'ENOENT');
});

test('execaSync() throws error if ENOENT', t => {
	t.throws(() => {
		execaSync('foo');
	}, {message: ENOENT_REGEXP});
});

const testEarlyErrorShape = async (t, reject) => {
	const subprocess = getEarlyErrorSubprocess({reject});
	t.notThrows(() => {
		subprocess.catch(() => {});
		subprocess.nodeChildProcess.unref();
		subprocess.nodeChildProcess.on('error', () => {});
	});
};

test('child_process.spawn() early errors have correct shape', testEarlyErrorShape, true);
test('child_process.spawn() early errors have correct shape - reject false', testEarlyErrorShape, false);

// The subprocess never spawned, so there is no process to signal.
// `ChildProcess.prototype.kill()` would signal the current process group instead, since its process id is `0`.
// The handle is replaced by a stub, so that a regression is caught by an assertion instead of killing this test process.
test('kill() does not signal the current process on early errors', async t => {
	const subprocess = getEarlyErrorSubprocess({reject: false});
	let isSignaled = false;
	subprocess.nodeChildProcess._handle = {
		kill() {
			isSignaled = true;
			return 0;
		},
	};

	t.is(subprocess.kill(), false);
	t.false(isSignaled);
	const {failed, isCanceled} = await subprocess;
	t.true(failed);
	t.false(isCanceled);
});

test('child_process.spawn() early errors are propagated', async t => {
	await t.throwsAsync(getEarlyErrorSubprocess(), expectedEarlyError);
});

test('child_process.spawn() early errors are returned', async t => {
	const {failed} = await getEarlyErrorSubprocess({reject: false});
	t.true(failed);
});

test('child_process.spawnSync() early errors are propagated with a correct shape', t => {
	t.throws(getEarlyErrorSubprocessSync, expectedEarlyErrorSync);
});

test('child_process.spawnSync() early errors are propagated with a correct shape - reject false', t => {
	const {failed} = getEarlyErrorSubprocessSync({reject: false});
	t.true(failed);
});

if (!isWindows) {
	test('execa() rejects if running non-executable', async t => {
		await t.throwsAsync(execa('non-executable.js'));
	});

	test('execa() rejects with correct error and doesn\'t throw if running non-executable with input', async t => {
		await t.throwsAsync(execa('non-executable.js', {input: 'Hey!'}), {message: /EACCES/});
	});

	if (arch() === 'x64') {
		test('write to fast-exit subprocess', async t => {
			t.plan(1);

			// Try-catch here is necessary, because this test is not 100% accurate
			// Sometimes subprocess can manage to accept input before exiting
			try {
				await execa(`fast-exit-${process.platform}`, [], {input: 'data'});
				t.pass();
			} catch (error) {
				// eslint-disable-next-line ava/no-conditional-assertion -- either outcome is acceptable, see comment above
				t.is(error.code, 'EPIPE');
			}
		});
	}
}

const testEarlyErrorPipe = async (t, getSubprocess) => {
	await t.throwsAsync(getSubprocess(), expectedEarlyError);
};

test('child_process.spawn() early errors on source can use .pipe()', testEarlyErrorPipe, () => getEarlyErrorSubprocess().pipe(execa('empty.js')));
test('child_process.spawn() early errors on destination can use .pipe()', testEarlyErrorPipe, () => execa('empty.js').pipe(getEarlyErrorSubprocess()));
test('child_process.spawn() early errors on source and destination can use .pipe()', testEarlyErrorPipe, () => getEarlyErrorSubprocess().pipe(getEarlyErrorSubprocess()));
test('child_process.spawn() early errors can use .pipe() multiple times', testEarlyErrorPipe, () => getEarlyErrorSubprocess().pipe(getEarlyErrorSubprocess()).pipe(getEarlyErrorSubprocess()));
test('child_process.spawn() early errors can use .pipe``', testEarlyErrorPipe, () => $(earlyErrorOptions)`empty.js`.pipe(earlyErrorOptions)`empty.js`);
test('child_process.spawn() early errors can use .pipe`` multiple times', testEarlyErrorPipe, () => $(earlyErrorOptions)`empty.js`.pipe(earlyErrorOptions)`empty.js`.pipe`empty.js`);

const testEarlyErrorConvertor = async (t, streamMethod) => {
	const subprocess = getEarlyErrorSubprocess();
	const stream = subprocess[streamMethod]();
	stream.on('close', () => {});
	stream.read?.();
	stream.write?.('.');
	await t.throwsAsync(subprocess);
};

test('child_process.spawn() early errors can use .readable()', testEarlyErrorConvertor, 'readable');
test('child_process.spawn() early errors can use .writable()', testEarlyErrorConvertor, 'writable');
test('child_process.spawn() early errors can use .duplex()', testEarlyErrorConvertor, 'duplex');

const testEarlyErrorWebConvertor = async (t, streamMethod) => {
	const subprocess = getEarlyErrorSubprocess();
	subprocess[streamMethod]();
	await t.throwsAsync(subprocess);
};

test('child_process.spawn() early errors can use .readableStream()', testEarlyErrorWebConvertor, 'readableStream');
test('child_process.spawn() early errors can use .writableStream()', testEarlyErrorWebConvertor, 'writableStream');
test('child_process.spawn() early errors can use .transformStream()', testEarlyErrorWebConvertor, 'transformStream');

// The subprocess never started, so those streams have no contents.
// They must end right away, like `subprocess.stdout` and `.iterable()` do, instead of hanging forever.
const testEarlyErrorReadableEnd = async (t, streamMethod) => {
	const subprocess = getEarlyErrorSubprocess();
	const chunks = await Array.fromAsync(subprocess[streamMethod]());

	t.deepEqual(chunks, []);
	await t.throwsAsync(subprocess);
};

test('child_process.spawn() early errors end .readable()', testEarlyErrorReadableEnd, 'readable');
test('child_process.spawn() early errors end .duplex()', testEarlyErrorReadableEnd, 'duplex');
test('child_process.spawn() early errors end .readableStream()', testEarlyErrorReadableEnd, 'readableStream');

const testEarlyErrorWritableEnd = async (t, streamMethod) => {
	const subprocess = getEarlyErrorSubprocess();
	const stream = subprocess[streamMethod]();
	stream.end(foobarString);
	await finished(stream, {readable: false});

	t.false(stream.writable);
	await t.throwsAsync(subprocess);
};

test('child_process.spawn() early errors end .writable()', testEarlyErrorWritableEnd, 'writable');
test('child_process.spawn() early errors end .duplex() writable side', testEarlyErrorWritableEnd, 'duplex');

test('child_process.spawn() early errors end .writableStream()', async t => {
	const subprocess = getEarlyErrorSubprocess();
	const writer = subprocess.writableStream().getWriter();
	await writer.write(foobarUint8Array);
	await writer.close();

	await t.throwsAsync(subprocess);
});

test('child_process.spawn() early errors end .transformStream()', async t => {
	const subprocess = getEarlyErrorSubprocess();
	const {readable, writable} = subprocess.transformStream();
	const writer = writable.getWriter();
	await writer.write(foobarUint8Array);
	await writer.close();
	const chunks = await Array.fromAsync(readable);

	t.deepEqual(chunks, []);
	await t.throwsAsync(subprocess);
});

const testEarlyErrorIpc = async (t, runIpcMethod) => {
	const subprocess = getEarlyErrorSubprocess({ipc: true});
	t.throws(() => {
		runIpcMethod(subprocess);
	}, {message: /cannot be used: the subprocess has already exited or disconnected/});
	await t.throwsAsync(subprocess, expectedEarlyError);
};

test('child_process.spawn() early errors can use .sendMessage()', testEarlyErrorIpc, subprocess => subprocess.sendMessage('.'));
test('child_process.spawn() early errors can use .getOneMessage()', testEarlyErrorIpc, subprocess => subprocess.getOneMessage());
test('child_process.spawn() early errors can use .getEachMessage()', testEarlyErrorIpc, subprocess => subprocess.getEachMessage());

test('child_process.spawn() early errors can use .iterable()', async t => {
	const subprocess = getEarlyErrorSubprocess();
	const lines = await Array.fromAsync(subprocess.iterable());

	t.deepEqual(lines, []);
	await t.throwsAsync(subprocess);
});

test('child_process.spawn() early errors can use Symbol.asyncIterator', async t => {
	const subprocess = getEarlyErrorSubprocess();
	const lines = await Array.fromAsync(subprocess);

	t.deepEqual(lines, []);
	await t.throwsAsync(subprocess);
});

const testEarlyErrorStream = async (t, getStreamProperty, options) => {
	const subprocess = getEarlyErrorSubprocess(options);
	const stream = getStreamProperty(subprocess);
	stream.on('close', () => {});
	stream.read?.();
	stream.end?.();
	await t.throwsAsync(subprocess);
};

test('child_process.spawn() early errors can use .stdin', testEarlyErrorStream, ({stdin}) => stdin);
test('child_process.spawn() early errors can use .stdout', testEarlyErrorStream, ({stdout}) => stdout);
test('child_process.spawn() early errors can use .stderr', testEarlyErrorStream, ({stderr}) => stderr);
test('child_process.spawn() early errors can use .stdio[1]', testEarlyErrorStream, ({stdio}) => stdio[1]);
test('child_process.spawn() early errors can use .stdio[3]', testEarlyErrorStream, ({stdio}) => stdio[3], fullStdio);
test('child_process.spawn() early errors can use .all', testEarlyErrorStream, ({all}) => all, {all: true});
