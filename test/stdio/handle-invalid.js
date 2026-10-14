import assert from 'node:assert/strict';
import {open, readFile, rm} from 'node:fs/promises';
import {Writable} from 'node:stream';
import test from 'node:test';
import tempfile from 'tempfile';
import {assertThrows} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const testEmptyArray = (fdNumber, optionName, execaMethod) => {
	assertThrows(() => {
		execaMethod('empty.js', getStdio(fdNumber, []));
	}, {message: `The \`${optionName}\` option must not be an empty array.`});
};

test('Cannot pass an empty array to stdin', () => testEmptyArray(0, 'stdin', execa));
test('Cannot pass an empty array to stdout', () => testEmptyArray(1, 'stdout', execa));
test('Cannot pass an empty array to stderr', () => testEmptyArray(2, 'stderr', execa));
test('Cannot pass an empty array to stdio[*]', () => testEmptyArray(3, 'stdio[3]', execa));
test('Cannot pass an empty array to stdin - sync', () => testEmptyArray(0, 'stdin', execaSync));
test('Cannot pass an empty array to stdout - sync', () => testEmptyArray(1, 'stdout', execaSync));
test('Cannot pass an empty array to stderr - sync', () => testEmptyArray(2, 'stderr', execaSync));
test('Cannot pass an empty array to stdio[*] - sync', () => testEmptyArray(3, 'stdio[3]', execaSync));

const testEmptyArrayBufferFalse = (fdNumber, optionName, execaMethod) => {
	assertThrows(() => {
		execaMethod('empty.js', {...getStdio(fdNumber, []), buffer: false});
	}, {message: `The \`${optionName}\` option must not be an empty array.`});
};

test('Cannot pass an empty array to stdout with buffer: false', () => testEmptyArrayBufferFalse(1, 'stdout', execa));
test('Cannot pass an empty array to stderr with buffer: false', () => testEmptyArrayBufferFalse(2, 'stderr', execa));
test('Cannot pass an empty array to stdout with buffer: false - sync', () => testEmptyArrayBufferFalse(1, 'stdout', execaSync));
test('Cannot pass an empty array to stderr with buffer: false - sync', () => testEmptyArrayBufferFalse(2, 'stderr', execaSync));

const testInvalidValueSync = (fdNumber, stdioOption) => {
	const {message} = assertThrows(() => {
		execaSync('empty.js', getStdio(fdNumber, stdioOption));
	});
	assert.ok(message.includes(`cannot be "${stdioOption}" with synchronous methods`));
};

test('stdin cannot be "overlapped", sync', () => testInvalidValueSync(0, 'overlapped'));
test('stdout cannot be "overlapped", sync', () => testInvalidValueSync(1, 'overlapped'));
test('stderr cannot be "overlapped", sync', () => testInvalidValueSync(2, 'overlapped'));
test('stdio[*] cannot be "overlapped", sync', () => testInvalidValueSync(3, 'overlapped'));

const testInvalidArrayValue = (invalidStdio, fdNumber, execaMethod) => {
	assertThrows(() => {
		execaMethod('empty.js', getStdio(fdNumber, ['pipe', invalidStdio]));
	}, {message: /must not include/});
};

test('Cannot pass "ignore" and another value to stdin', () => testInvalidArrayValue('ignore', 0, execa));
test('Cannot pass "ignore" and another value to stdout', () => testInvalidArrayValue('ignore', 1, execa));
test('Cannot pass "ignore" and another value to stderr', () => testInvalidArrayValue('ignore', 2, execa));
test('Cannot pass "ignore" and another value to stdio[*]', () => testInvalidArrayValue('ignore', 3, execa));
test('Cannot pass "ignore" and another value to stdin - sync', () => testInvalidArrayValue('ignore', 0, execaSync));
test('Cannot pass "ignore" and another value to stdout - sync', () => testInvalidArrayValue('ignore', 1, execaSync));
test('Cannot pass "ignore" and another value to stderr - sync', () => testInvalidArrayValue('ignore', 2, execaSync));
test('Cannot pass "ignore" and another value to stdio[*] - sync', () => testInvalidArrayValue('ignore', 3, execaSync));

// The `stdio: 'ipc'` value (raw `child_process` syntax) was replaced by the `ipc: true` option
const testIpcStdioOption = (fdNumber, stdioOption, execaMethod) => {
	assertThrows(() => {
		execaMethod('empty.js', getStdio(fdNumber, stdioOption));
	}, {message: /The `ipc: true` option must be used instead/});
};

test('stdin cannot be "ipc"', () => testIpcStdioOption(0, 'ipc', execa));
test('stdout cannot be "ipc"', () => testIpcStdioOption(1, 'ipc', execa));
test('stderr cannot be "ipc"', () => testIpcStdioOption(2, 'ipc', execa));
test('stdio[*] cannot be "ipc"', () => testIpcStdioOption(3, 'ipc', execa));
test('stdin cannot be "ipc" - sync', () => testIpcStdioOption(0, 'ipc', execaSync));
test('stdout cannot be "ipc" - sync', () => testIpcStdioOption(1, 'ipc', execaSync));
test('stderr cannot be "ipc" - sync', () => testIpcStdioOption(2, 'ipc', execaSync));
test('stdio[*] cannot be "ipc" - sync', () => testIpcStdioOption(3, 'ipc', execaSync));
test('stdio cannot be "ipc"', () => testIpcStdioOption('stdio', 'ipc', execa));
test('stdio cannot be "ipc" - sync', () => testIpcStdioOption('stdio', 'ipc', execaSync));
test('stdio[*] cannot be ["ipc"]', () => testIpcStdioOption(3, ['ipc'], execa));
test('stdio[*] cannot be ["ipc"] - sync', () => testIpcStdioOption(3, ['ipc'], execaSync));
test('stdio[*] cannot be {value: "ipc"}', () => testIpcStdioOption(3, {value: 'ipc'}, execa));
test('stdio[*] cannot be {value: "ipc"} - sync', () => testIpcStdioOption(3, {value: 'ipc'}, execaSync));
test('Cannot pass "ipc" and another value to stdio[*]', () => testIpcStdioOption(3, ['pipe', 'ipc'], execa));
test('Cannot pass "ipc" and another value to stdio[*] - sync', () => testIpcStdioOption(3, ['pipe', 'ipc'], execaSync));
test('Cannot pass {value: "ipc"} and another value to stdio[*]', () => testIpcStdioOption(3, ['pipe', {value: 'ipc'}], execa));
test('Cannot pass {value: "ipc"} and another value to stdio[*] - sync', () => testIpcStdioOption(3, ['pipe', {value: 'ipc'}], execaSync));

// A file descriptor must be a non-negative integer. Without this, `node:child_process` aborts the current process with a fatal assertion when spawning.
const testInvalidFileDescriptor = (fdNumber, optionName, stdioOption, execaMethod) => {
	assertThrows(() => {
		execaMethod('empty.js', getStdio(fdNumber, stdioOption));
	}, {message: `The \`${optionName}\` option must be a non-negative 32-bit integer: got ${stdioOption}.`});
};

test('Cannot pass a fractional file descriptor to stdin', () => testInvalidFileDescriptor(0, 'stdin', 1.5, execa));
test('Cannot pass NaN as a file descriptor to stdin', () => testInvalidFileDescriptor(0, 'stdin', NaN, execa));
test('Cannot pass Infinity as a file descriptor to stdout', () => testInvalidFileDescriptor(1, 'stdout', Infinity, execa));
test('Cannot pass a too large file descriptor to stderr', () => testInvalidFileDescriptor(2, 'stderr', 2 ** 32, execa));
test('Cannot pass a negative file descriptor to stdio[*]', () => testInvalidFileDescriptor(3, 'stdio[3]', -1, execa));
test('Cannot pass a fractional file descriptor to stdout', () => testInvalidFileDescriptor(1, 'stdout', 1.5, execaSync));
test('Cannot pass a negative file descriptor to stdin', () => testInvalidFileDescriptor(0, 'stdin', -1, execaSync));

// Invalid descriptor objects must be tested in a child: Node.js otherwise aborts the test process.
test('Cannot pass a fractional file descriptor object to stdout', async () => {
	const {stdout} = await execa('nested-invalid-file-handle.js', ['async', '1.5']);
	assert.equal(stdout, '');
});

const testInvalidFileHandle = async (fileDescriptor, method, fdNumber = 1, isWrapped = false) => {
	const {stdout} = await execa('nested-invalid-file-handle.js', [method, `${fileDescriptor}`, `${fdNumber}`, `${isWrapped}`]);
	assert.equal(stdout, '');
};

test('Cannot pass a fractional file descriptor object to stdout, sync', () => testInvalidFileHandle(1.5, 'sync'));

test('Cannot pass a fractional stream file descriptor to stdout', async () => {
	const {stdout} = await execa('nested-invalid-file-handle.js', ['async', '1.5', '1', 'false', 'stream']);
	assert.equal(stdout, '');
});

for (const method of ['async', 'sync']) {
	for (const fileDescriptor of [NaN, 2 ** 31]) {
		test(`Cannot pass an invalid stream file descriptor (${fileDescriptor}) to stdout, ${method}`, async () => {
			const {stdout} = await execa('nested-invalid-file-handle.js', [method, `${fileDescriptor}`, '1', 'false', 'stream']);
			assert.equal(stdout, '');
		});
	}
}

for (const method of ['async', 'sync']) {
	for (const fileDescriptor of [NaN, Infinity, -Infinity, -1, 2 ** 31, 2 ** 32, Number.MAX_SAFE_INTEGER]) {
		test(`Cannot pass an invalid file descriptor object (${fileDescriptor}) to stdout, ${method}`, () => testInvalidFileHandle(fileDescriptor, method));
	}

	for (const fdNumber of [0, 2, 3]) {
		test(`Cannot pass a fractional file descriptor object to stdio[${fdNumber}], ${method}`, () => testInvalidFileHandle(1.5, method, fdNumber));
	}

	test(`Cannot pass a wrapped invalid file descriptor object to stdout, ${method}`, () => testInvalidFileHandle(1.5, method, 1, true));

	test(`Cannot pass a closed FileHandle to stdout, ${method}`, async () => {
		const filePath = tempfile();
		try {
			const fileHandle = await open(filePath, 'w');
			await fileHandle.close();
			const execaMethod = method === 'sync' ? execaSync : execa;
			assertThrows(() => {
				execaMethod('empty.js', {stdout: fileHandle});
			}, {instanceOf: TypeError, message: 'The `stdout` option must be a non-negative 32-bit integer: got -1.'});
		} finally {
			await rm(filePath);
		}
	});
}

const testValidFileHandleOutput = async (execaMethod, fdNumber, isWrapped) => {
	const filePath = tempfile();
	const fileHandle = await open(filePath, 'w');
	try {
		const descriptor = {fd: fileHandle.fd};
		const value = isWrapped ? {value: descriptor} : descriptor;
		await execaMethod('noop-fd.js', [`${fdNumber}`, 'file output'], getStdio(fdNumber, value));
		assert.equal(await readFile(filePath, 'utf8'), 'file output');
	} finally {
		await fileHandle.close();
		await rm(filePath);
	}
};

test('Can still pass a native descriptor object to stdout', () => testValidFileHandleOutput(execa, 1, false));
test('Can still pass a native descriptor object to stdout, sync', () => testValidFileHandleOutput(execaSync, 1, false));
test('Can still pass a wrapped native descriptor object to stderr', () => testValidFileHandleOutput(execa, 2, true));
test('Can still pass a wrapped native descriptor object to stderr, sync', () => testValidFileHandleOutput(execaSync, 2, true));

const testValidStreamFileDescriptor = async (execaMethod, isStdioArray) => {
	const filePath = tempfile();
	const fileHandle = await open(filePath, 'w');
	const chunks = [];
	const stream = new Writable({
		write(chunk, encoding, callback) {
			chunks.push(chunk.toString());
			callback();
		},
	});
	stream.fd = fileHandle.fd;
	try {
		await execaMethod('noop-fd.js', ['1', 'file output'], {stdout: isStdioArray ? ['pipe', stream] : stream});
		assert.equal(await readFile(filePath, 'utf8'), isStdioArray ? '' : 'file output');
		assert.equal(chunks.join(''), isStdioArray ? 'file output' : '');
	} finally {
		stream.destroy();
		await fileHandle.close();
		await rm(filePath);
	}
};

test('Can still pass a stream with a valid file descriptor to stdout', () => testValidStreamFileDescriptor(execa, false));
test('Can still pass a stream with a valid file descriptor to stdout, sync', () => testValidStreamFileDescriptor(execaSync, false));
test('Can still pipe to a stream with a file descriptor in a stdio array', () => testValidStreamFileDescriptor(execa, true));

const testUnknownNativeValue = (invalidStdio, fdNumber, execaMethod) => {
	const {message} = assertThrows(() => {
		execaMethod('empty.js', getStdio(fdNumber, ['pipe', invalidStdio]));
	}, {instanceOf: TypeError});
	assert.ok(message.includes(`option is invalid: ${String(invalidStdio)} (${typeof invalidStdio})`));
};

test('Cannot pass "true" and another value to stdout', () => testUnknownNativeValue(true, 1, execa));
test('Cannot pass a plain object and another value to stdout', () => testUnknownNativeValue({}, 1, execa));
test('Cannot pass "false" and another value to stdin', () => testUnknownNativeValue(false, 0, execa));
test('Cannot pass "true" and another value to stdout - sync', () => testUnknownNativeValue(true, 1, execaSync));

test('Cannot pass a file handle and another value to stdout', async () => {
	const filePath = tempfile();
	const fileHandle = await open(filePath, 'w');
	assertThrows(() => {
		execa('empty.js', getStdio(1, ['pipe', fileHandle]));
	}, {instanceOf: TypeError, message: /`stdout` option cannot combine file handles with other values/});
	await fileHandle.close();
	await rm(filePath);
});
