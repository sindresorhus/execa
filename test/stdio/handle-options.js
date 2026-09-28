import assert from 'node:assert/strict';
import test from 'node:test';
import {execa} from '../../index.js';
import {getStdio, fullStdio} from '../helpers/stdio.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {nestedSubprocess} from '../helpers/nested.js';

setFixtureDirectory();

const testNoPipeOption = async (stdioOption, fdNumber) => {
	const subprocess = execa('empty.js', getStdio(fdNumber, stdioOption));
	assert.equal(subprocess.stdio[fdNumber], null);
	await subprocess;
};

test('stdin can be "ignore"', () => testNoPipeOption('ignore', 0));
test('stdin can be ["ignore"]', () => testNoPipeOption(['ignore'], 0));
test('stdin can be ["ignore", "ignore"]', () => testNoPipeOption(['ignore', 'ignore'], 0));
test('stdin can be "inherit"', () => testNoPipeOption('inherit', 0));
test('stdin can be ["inherit"]', () => testNoPipeOption(['inherit'], 0));
test('stdin can be 0', () => testNoPipeOption(0, 0));
test('stdin can be [0]', () => testNoPipeOption([0], 0));
test('stdout can be "ignore"', () => testNoPipeOption('ignore', 1));
test('stdout can be ["ignore"]', () => testNoPipeOption(['ignore'], 1));
test('stdout can be ["ignore", "ignore"]', () => testNoPipeOption(['ignore', 'ignore'], 1));
test('stdout can be "inherit"', () => testNoPipeOption('inherit', 1));
test('stdout can be ["inherit"]', () => testNoPipeOption(['inherit'], 1));
test('stdout can be 1', () => testNoPipeOption(1, 1));
test('stdout can be [1]', () => testNoPipeOption([1], 1));
test('stderr can be "ignore"', () => testNoPipeOption('ignore', 2));
test('stderr can be ["ignore"]', () => testNoPipeOption(['ignore'], 2));
test('stderr can be ["ignore", "ignore"]', () => testNoPipeOption(['ignore', 'ignore'], 2));
test('stderr can be "inherit"', () => testNoPipeOption('inherit', 2));
test('stderr can be ["inherit"]', () => testNoPipeOption(['inherit'], 2));
test('stderr can be 2', () => testNoPipeOption(2, 2));
test('stderr can be [2]', () => testNoPipeOption([2], 2));
test('stdio[*] can be "ignore"', () => testNoPipeOption('ignore', 3));
test('stdio[*] can be ["ignore"]', () => testNoPipeOption(['ignore'], 3));
test('stdio[*] can be ["ignore", "ignore"]', () => testNoPipeOption(['ignore', 'ignore'], 3));

// Inheriting fd 3 requires the current process to have one that can be inherited. The test runner does not provide one, so this runs inside a parent process which does.
const testNoPipeOptionFd3 = async stdioOption => {
	const {nestedResult} = await nestedSubprocess('empty.js', getStdio(3, stdioOption), fullStdio);
	assert.equal(nestedResult.failed, false);
	assert.equal(nestedResult.stdio[3], undefined);
};

test('stdio[*] can be "inherit"', () => testNoPipeOptionFd3('inherit'));
test('stdio[*] can be ["inherit"]', () => testNoPipeOptionFd3(['inherit']));
test('stdio[*] can be 3', () => testNoPipeOptionFd3(3));
test('stdio[*] can be [3]', () => testNoPipeOptionFd3([3]));
