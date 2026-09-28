import assert from 'node:assert/strict';
import {platform} from 'node:process';
import test from 'node:test';
import {assertThrows} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {getStdio, fullStdio} from '../helpers/stdio.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';

setFixtureDirectory();

const isLinux = platform === 'linux';

const testFd3InheritOutput = async (stdioOption, isSync) => {
	const {stdio} = await nestedSubprocess('noop-fd.js', ['3', foobarString], {...getStdio(3, stdioOption), isSync}, fullStdio);
	assert.equal(stdio[3], foobarString);
};

test('stdio[*] output can use "inherit"', () => testFd3InheritOutput('inherit', false));
test('stdio[*] output can use ["inherit"]', () => testFd3InheritOutput(['inherit'], false));
test('stdio[*] output can use "inherit", sync', () => testFd3InheritOutput('inherit', true));
test('stdio[*] output can use ["inherit"], sync', () => testFd3InheritOutput(['inherit'], true));

if (isLinux) {
	const testOverflowStream = async (fdNumber, stdioOption, isSync) => {
		const {stdout} = await nestedSubprocess('empty.js', {...getStdio(fdNumber, stdioOption), isSync}, fullStdio);
		assert.equal(stdout, '');
	};

	test('stdin can use 4+', () => testOverflowStream(0, 4, false));
	test('stdin can use [4+]', () => testOverflowStream(0, [4], false));
	test('stdout can use 4+', () => testOverflowStream(1, 4, false));
	test('stdout can use [4+]', () => testOverflowStream(1, [4], false));
	test('stderr can use 4+', () => testOverflowStream(2, 4, false));
	test('stderr can use [4+]', () => testOverflowStream(2, [4], false));
	test('stdio[*] can use 4+', () => testOverflowStream(3, 4, false));
	test('stdio[*] can use [4+]', () => testOverflowStream(3, [4], false));
	test('stdin can use 4+, sync', () => testOverflowStream(0, 4, true));
	test('stdin can use [4+], sync', () => testOverflowStream(0, [4], true));
	test('stdout can use 4+, sync', () => testOverflowStream(1, 4, true));
	test('stdout can use [4+], sync', () => testOverflowStream(1, [4], true));
	test('stderr can use 4+, sync', () => testOverflowStream(2, 4, true));
	test('stderr can use [4+], sync', () => testOverflowStream(2, [4], true));
	test('stdio[*] can use 4+, sync', () => testOverflowStream(3, 4, true));
	test('stdio[*] can use [4+], sync', () => testOverflowStream(3, [4], true));
}

const testOverflowStreamArray = (fdNumber, stdioOption) => {
	assertThrows(() => {
		execa('empty.js', getStdio(fdNumber, stdioOption));
	}, {message: /no such standard stream/});
};

test('stdin cannot use 4+ and another value', () => testOverflowStreamArray(0, [4, 'pipe']));
test('stdout cannot use 4+ and another value', () => testOverflowStreamArray(1, [4, 'pipe']));
test('stderr cannot use 4+ and another value', () => testOverflowStreamArray(2, [4, 'pipe']));
test('stdio[*] cannot use 4+ and another value', () => testOverflowStreamArray(3, [4, 'pipe']));
test('stdio[*] cannot use "inherit" and another value', () => testOverflowStreamArray(3, ['inherit', 'pipe']));

// A file descriptor number which is not open in the current process.
// Lower ones might be used internally by Node.js, and the error then depends on what they are.
const closedFdNumber = 1000;

const testOverflowStreamArraySync = fdNumber => {
	assertThrows(() => {
		execaSync('noop-fd.js', [fdNumber, foobarString], getStdio(fdNumber, [closedFdNumber, 'pipe']));
	}, {code: 'EBADF'});
};

test('stdout cannot use 4+ and another value, sync', () => testOverflowStreamArraySync(1));
test('stderr cannot use 4+ and another value, sync', () => testOverflowStreamArraySync(2));
test('stdio[*] cannot use 4+ and another value, sync', () => testOverflowStreamArraySync(3));

// `1` and 'inherit' are two spellings of the same target, which only becomes apparent once native values are normalized.
// The output must be written to the inherited file descriptor only once, which the nested parent captures.
// The nested parent's `stdout` has its final newline stripped by the outer `execa()` call.
const testSameTargetOutput = async (stdioOption, isSync) => {
	const {stdout} = await nestedSubprocess('noop.js', [foobarString], {stdout: stdioOption, isSync});
	assert.equal(stdout, foobarString);
};

test('stdout output is not duplicated with [1, "inherit"]', () => testSameTargetOutput([1, 'inherit'], false));
test('stdout output is not duplicated with ["inherit", 1]', () => testSameTargetOutput(['inherit', 1], false));
test('stdout output is not duplicated with [1, "inherit"], sync', () => testSameTargetOutput([1, 'inherit'], true));
test('stdout output is not duplicated with ["inherit", 1], sync', () => testSameTargetOutput(['inherit', 1], true));
