import {platform} from 'node:process';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {getStdio, fullStdio} from '../helpers/stdio.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';

setFixtureDirectory();

const isLinux = platform === 'linux';
const isWindows = platform === 'win32';

const testFd3InheritOutput = async (t, stdioOption, isSync) => {
	const {stdio} = await nestedSubprocess('noop-fd.js', ['3', foobarString], {...getStdio(3, stdioOption), isSync}, fullStdio);
	t.is(stdio[3], foobarString);
};

test('stdio[*] output can use "inherit"', testFd3InheritOutput, 'inherit', false);
test('stdio[*] output can use ["inherit"]', testFd3InheritOutput, ['inherit'], false);
test('stdio[*] output can use "inherit", sync', testFd3InheritOutput, 'inherit', true);
test('stdio[*] output can use ["inherit"], sync', testFd3InheritOutput, ['inherit'], true);

if (isLinux) {
	const testOverflowStream = async (t, fdNumber, stdioOption, isSync) => {
		const {stdout} = await nestedSubprocess('empty.js', {...getStdio(fdNumber, stdioOption), isSync}, fullStdio);
		t.is(stdout, '');
	};

	test('stdin can use 4+', testOverflowStream, 0, 4, false);
	test('stdin can use [4+]', testOverflowStream, 0, [4], false);
	test('stdout can use 4+', testOverflowStream, 1, 4, false);
	test('stdout can use [4+]', testOverflowStream, 1, [4], false);
	test('stderr can use 4+', testOverflowStream, 2, 4, false);
	test('stderr can use [4+]', testOverflowStream, 2, [4], false);
	test('stdio[*] can use 4+', testOverflowStream, 3, 4, false);
	test('stdio[*] can use [4+]', testOverflowStream, 3, [4], false);
	test('stdin can use 4+, sync', testOverflowStream, 0, 4, true);
	test('stdin can use [4+], sync', testOverflowStream, 0, [4], true);
	test('stdout can use 4+, sync', testOverflowStream, 1, 4, true);
	test('stdout can use [4+], sync', testOverflowStream, 1, [4], true);
	test('stderr can use 4+, sync', testOverflowStream, 2, 4, true);
	test('stderr can use [4+], sync', testOverflowStream, 2, [4], true);
	test('stdio[*] can use 4+, sync', testOverflowStream, 3, 4, true);
	test('stdio[*] can use [4+], sync', testOverflowStream, 3, [4], true);
}

const testOverflowStreamArray = (t, fdNumber, stdioOption) => {
	t.throws(() => {
		execa('empty.js', getStdio(fdNumber, stdioOption));
	}, {message: /no such standard stream/});
};

test('stdin cannot use 4+ and another value', testOverflowStreamArray, 0, [4, 'pipe']);
test('stdout cannot use 4+ and another value', testOverflowStreamArray, 1, [4, 'pipe']);
test('stderr cannot use 4+ and another value', testOverflowStreamArray, 2, [4, 'pipe']);
test('stdio[*] cannot use 4+ and another value', testOverflowStreamArray, 3, [4, 'pipe']);
test('stdio[*] cannot use "inherit" and another value', testOverflowStreamArray, 3, ['inherit', 'pipe']);

const getInvalidFdCode = () => {
	if (isLinux) {
		return 'EINVAL';
	}

	return isWindows ? 'EBADF' : 'ENXIO';
};

const testOverflowStreamArraySync = (t, fdNumber) => {
	t.throws(() => {
		execaSync('noop-fd.js', [fdNumber, foobarString], getStdio(fdNumber, [4, 'pipe']));
	}, {code: getInvalidFdCode()});
};

test('stdout cannot use 4+ and another value, sync', testOverflowStreamArraySync, 1);
test('stderr cannot use 4+ and another value, sync', testOverflowStreamArraySync, 2);
test('stdio[*] cannot use 4+ and another value, sync', testOverflowStreamArraySync, 3);
