import {platform} from 'node:process';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {getStdio, fullStdio} from '../helpers/stdio.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';
import {parentExecaAsync, parentExecaSync} from '../helpers/nested.js';

setFixtureDir();

const isLinux = platform === 'linux';
const isWindows = platform === 'win32';

const testFd3InheritOutput = async (t, stdioOption, execaMethod) => {
	const {stdio} = await execaMethod('noop-fd.js', ['3', foobarString], getStdio(3, stdioOption), fullStdio);
	t.is(stdio[3], foobarString);
};

test('stdio[*] output can use "inherit"', testFd3InheritOutput, 'inherit', parentExecaAsync);
test('stdio[*] output can use ["inherit"]', testFd3InheritOutput, ['inherit'], parentExecaAsync);
test('stdio[*] output can use "inherit", sync', testFd3InheritOutput, 'inherit', parentExecaSync);
test('stdio[*] output can use ["inherit"], sync', testFd3InheritOutput, ['inherit'], parentExecaSync);

if (isLinux) {
	const testOverflowStream = async (t, fdNumber, stdioOption, execaMethod) => {
		const {stdout} = await execaMethod('empty.js', getStdio(fdNumber, stdioOption), fullStdio);
		t.is(stdout, '');
	};

	test('stdin can use 4+', testOverflowStream, 0, 4, parentExecaAsync);
	test('stdin can use [4+]', testOverflowStream, 0, [4], parentExecaAsync);
	test('stdout can use 4+', testOverflowStream, 1, 4, parentExecaAsync);
	test('stdout can use [4+]', testOverflowStream, 1, [4], parentExecaAsync);
	test('stderr can use 4+', testOverflowStream, 2, 4, parentExecaAsync);
	test('stderr can use [4+]', testOverflowStream, 2, [4], parentExecaAsync);
	test('stdio[*] can use 4+', testOverflowStream, 3, 4, parentExecaAsync);
	test('stdio[*] can use [4+]', testOverflowStream, 3, [4], parentExecaAsync);
	test('stdin can use 4+, sync', testOverflowStream, 0, 4, parentExecaSync);
	test('stdin can use [4+], sync', testOverflowStream, 0, [4], parentExecaSync);
	test('stdout can use 4+, sync', testOverflowStream, 1, 4, parentExecaSync);
	test('stdout can use [4+], sync', testOverflowStream, 1, [4], parentExecaSync);
	test('stderr can use 4+, sync', testOverflowStream, 2, 4, parentExecaSync);
	test('stderr can use [4+], sync', testOverflowStream, 2, [4], parentExecaSync);
	test('stdio[*] can use 4+, sync', testOverflowStream, 3, 4, parentExecaSync);
	test('stdio[*] can use [4+], sync', testOverflowStream, 3, [4], parentExecaSync);
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
