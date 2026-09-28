import test from 'node:test';
import {assertThrows} from '../helpers/assert.js';
import {
	execa,
	execaSync,
	execaNode,
	$,
} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const testInvalidArguments = async execaMethod => {
	assertThrows(() => {
		execaMethod('echo', true);
	}, {message: /Second argument must be either/});
};

test('execa()\'s second argument must be valid', () => testInvalidArguments(execa));
test('execaSync()\'s second argument must be valid', () => testInvalidArguments(execaSync));
test('execaNode()\'s second argument must be valid', () => testInvalidArguments(execaNode));
test('$\'s second argument must be valid', () => testInvalidArguments($));
test('$.sync\'s second argument must be valid', () => testInvalidArguments($.sync));

const testInvalidArgumentsItems = async execaMethod => {
	assertThrows(() => {
		execaMethod('echo', [{}]);
	}, {message: 'Second argument must be an array of strings: [object Object]'});
};

test('execa()\'s second argument must not be objects', () => testInvalidArgumentsItems(execa));
test('execaSync()\'s second argument must not be objects', () => testInvalidArgumentsItems(execaSync));
test('execaNode()\'s second argument must not be objects', () => testInvalidArgumentsItems(execaNode));
test('$\'s second argument must not be objects', () => testInvalidArgumentsItems($));
test('$.sync\'s second argument must not be objects', () => testInvalidArgumentsItems($.sync));

const testNullByteArgument = async execaMethod => {
	assertThrows(() => {
		execaMethod('echo', ['a\0b']);
	}, {message: /null bytes/});
};

test('execa()\'s second argument must not include \\0', () => testNullByteArgument(execa));
test('execaSync()\'s second argument must not include \\0', () => testNullByteArgument(execaSync));
test('execaNode()\'s second argument must not include \\0', () => testNullByteArgument(execaNode));
test('$\'s second argument must not include \\0', () => testNullByteArgument($));
test('$.sync\'s second argument must not include \\0', () => testNullByteArgument($.sync));
