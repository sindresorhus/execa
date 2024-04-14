import test from 'ava';
import {execa} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarUint8Array} from '../helpers/input.js';

setFixtureDirectory();

const testInputOverlapped = async (t, fdNumber) => {
	const {stdout} = await execa('stdin-fd.js', [`${fdNumber}`, foobarString], getStdio(fdNumber, [foobarUint8Array, 'overlapped', 'pipe']));
	t.is(stdout, foobarString);
};

test('stdin can be ["overlapped", "pipe"]', testInputOverlapped, 0);
test('stdio[*] input can be ["overlapped", "pipe"]', testInputOverlapped, 3);

const testOutputOverlapped = async (t, fdNumber) => {
	const {stdio} = await execa('noop-fd.js', [`${fdNumber}`, foobarString], getStdio(fdNumber, ['overlapped', 'pipe']));
	t.is(stdio[fdNumber], foobarString);
};

test('stdout can be ["overlapped", "pipe"]', testOutputOverlapped, 1);
test('stderr can be ["overlapped", "pipe"]', testOutputOverlapped, 2);
test('stdio[*] output can be ["overlapped", "pipe"]', testOutputOverlapped, 3);

const testFd3Undefined = async (t, stdioOption, options) => {
	const subprocess = execa('empty.js', {...getStdio(3, stdioOption), ...options});
	t.is(subprocess.stdio.length, 4);
	t.is(subprocess.stdio[3], null);

	const {stdio} = await subprocess;
	t.is(stdio.length, 4);
	t.is(stdio[3], undefined);
};

test('stdio[*] undefined means "ignore"', testFd3Undefined, undefined, {});
test('stdio[*] null means "ignore"', testFd3Undefined, null, {});
test('stdio[*] [undefined] means "ignore"', testFd3Undefined, [undefined], {});
test('stdio[*] [null] means "ignore"', testFd3Undefined, [null], {});
test('stdio[*] undefined means "ignore", "lines: true"', testFd3Undefined, undefined, {lines: true});
test('stdio[*] null means "ignore", "lines: true"', testFd3Undefined, null, {lines: true});
test('stdio[*] [undefined] means "ignore", "lines: true"', testFd3Undefined, [undefined], {lines: true});
test('stdio[*] [null] means "ignore", "lines: true"', testFd3Undefined, [null], {lines: true});
test('stdio[*] undefined means "ignore", "encoding: hex"', testFd3Undefined, undefined, {encoding: 'hex'});
test('stdio[*] null means "ignore", "encoding: hex"', testFd3Undefined, null, {encoding: 'hex'});
test('stdio[*] [undefined] means "ignore", "encoding: hex"', testFd3Undefined, [undefined], {encoding: 'hex'});
test('stdio[*] [null] means "ignore", "encoding: hex"', testFd3Undefined, [null], {encoding: 'hex'});
