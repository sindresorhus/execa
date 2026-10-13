import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import {assertThrows} from '../helpers/assert.js';
import {
	execa,
	execaSync,
	execaNode,
	$,
} from '../../index.js';
import {setFixtureDirectory, FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const NOOP_PATH = path.join(FIXTURES_DIRECTORY, 'noop.js');

const testSerializeArgument = async (commandArgument, execaMethod) => {
	const {stdout} = await execaMethod(NOOP_PATH, [commandArgument]);
	assert.equal(stdout, String(commandArgument));
};

test('execa()\'s arguments can be numbers', () => testSerializeArgument(1, execa));
test('execa()\'s arguments can be booleans', () => testSerializeArgument(true, execa));
test('execa()\'s arguments can be NaN', () => testSerializeArgument(NaN, execa));
test('execa()\'s arguments can be Infinity', () => testSerializeArgument(Infinity, execa));
test('execa()\'s arguments can be null', () => testSerializeArgument(null, execa));
test('execa()\'s arguments can be undefined', () => testSerializeArgument(undefined, execa));
test('execa()\'s arguments can be bigints', () => testSerializeArgument(1n, execa));
test('execa()\'s arguments can be symbols', () => testSerializeArgument(Symbol('test'), execa));
test('execaSync()\'s arguments can be numbers', () => testSerializeArgument(1, execaSync));
test('execaSync()\'s arguments can be booleans', () => testSerializeArgument(true, execaSync));
test('execaSync()\'s arguments can be NaN', () => testSerializeArgument(NaN, execaSync));
test('execaSync()\'s arguments can be Infinity', () => testSerializeArgument(Infinity, execaSync));
test('execaSync()\'s arguments can be null', () => testSerializeArgument(null, execaSync));
test('execaSync()\'s arguments can be undefined', () => testSerializeArgument(undefined, execaSync));
test('execaSync()\'s arguments can be bigints', () => testSerializeArgument(1n, execaSync));
test('execaSync()\'s arguments can be symbols', () => testSerializeArgument(Symbol('test'), execaSync));
test('execaNode()\'s arguments can be numbers', () => testSerializeArgument(1, execaNode));
test('execaNode()\'s arguments can be booleans', () => testSerializeArgument(true, execaNode));
test('execaNode()\'s arguments can be NaN', () => testSerializeArgument(NaN, execaNode));
test('execaNode()\'s arguments can be Infinity', () => testSerializeArgument(Infinity, execaNode));
test('execaNode()\'s arguments can be null', () => testSerializeArgument(null, execaNode));
test('execaNode()\'s arguments can be undefined', () => testSerializeArgument(undefined, execaNode));
test('execaNode()\'s arguments can be bigints', () => testSerializeArgument(1n, execaNode));
test('execaNode()\'s arguments can be symbols', () => testSerializeArgument(Symbol('test'), execaNode));
test('$\'s arguments can be numbers', () => testSerializeArgument(1, $));
test('$\'s arguments can be booleans', () => testSerializeArgument(true, $));
test('$\'s arguments can be NaN', () => testSerializeArgument(NaN, $));
test('$\'s arguments can be Infinity', () => testSerializeArgument(Infinity, $));
test('$\'s arguments can be null', () => testSerializeArgument(null, $));
test('$\'s arguments can be undefined', () => testSerializeArgument(undefined, $));
test('$\'s arguments can be bigints', () => testSerializeArgument(1n, $));
test('$\'s arguments can be symbols', () => testSerializeArgument(Symbol('test'), $));
test('$.sync\'s arguments can be numbers', () => testSerializeArgument(1, $.sync));
test('$.sync\'s arguments can be booleans', () => testSerializeArgument(true, $.sync));
test('$.sync\'s arguments can be NaN', () => testSerializeArgument(NaN, $.sync));
test('$.sync\'s arguments can be Infinity', () => testSerializeArgument(Infinity, $.sync));
test('$.sync\'s arguments can be null', () => testSerializeArgument(null, $.sync));
test('$.sync\'s arguments can be undefined', () => testSerializeArgument(undefined, $.sync));
test('$.sync\'s arguments can be bigints', () => testSerializeArgument(1n, $.sync));
test('$.sync\'s arguments can be symbols', () => testSerializeArgument(Symbol('test'), $.sync));

const testInvalidOptions = async execaMethod => {
	assertThrows(() => {
		execaMethod('echo', [], new Map());
	}, {message: /Last argument must be an options object/});
};

const testTwoOptionsObjects = execaMethod => {
	assertThrows(() => {
		execaMethod('echo', {all: true}, {timeout: 1});
	}, {message: /Please merge the second and third arguments/});
};

test('execa() rejects two options objects', () => testTwoOptionsObjects(execa));
test('execaSync() rejects two options objects', () => testTwoOptionsObjects(execaSync));
test('execaNode() rejects two options objects', () => testTwoOptionsObjects(execaNode));
test('$ rejects two options objects', () => testTwoOptionsObjects($));
test('$.sync rejects two options objects', () => testTwoOptionsObjects($.sync));

const testFourthArgument = execaMethod => {
	assertThrows(() => {
		execaMethod('echo', ['foo'], {}, {});
	}, {message: /at most three arguments/});
};

test('execa() rejects a fourth argument', () => testFourthArgument(execa));
test('execaSync() rejects a fourth argument', () => testFourthArgument(execaSync));

test('execa()\'s third argument must be a plain object', () => testInvalidOptions(execa));
test('execaSync()\'s third argument must be a plain object', () => testInvalidOptions(execaSync));
test('execaNode()\'s third argument must be a plain object', () => testInvalidOptions(execaNode));
test('$\'s third argument must be a plain object', () => testInvalidOptions($));
test('$.sync\'s third argument must be a plain object', () => testInvalidOptions($.sync));

const testInvalidFdSpecificOption = (execaMethod, optionName, optionValue, fdName = 'stdout') => {
	assertThrows(() => {
		execaMethod('noop.js', {[optionName]: {[fdName]: optionValue}});
	}, {instanceOf: TypeError, message: `The \`${optionName}.${fdName}\` option must use ${optionName === 'maxBuffer' ? 'a number' : 'a boolean'}.`});
};

test('The "lines.stdout" option must be a boolean', () => testInvalidFdSpecificOption(execa, 'lines', 'true'));
test('The "buffer.stdout" option must be a boolean', () => testInvalidFdSpecificOption(execa, 'buffer', 'false'));
test('The "stripFinalNewline.stdout" option must be a boolean', () => testInvalidFdSpecificOption(execa, 'stripFinalNewline', 1));
test('The "maxBuffer.stdout" option must be a number', () => testInvalidFdSpecificOption(execa, 'maxBuffer', '1024'));
test('The "maxBuffer.stdout" option must not be NaN', () => testInvalidFdSpecificOption(execa, 'maxBuffer', NaN));
test('The "maxBuffer.stderr" option must be a number - sync', () => testInvalidFdSpecificOption(execaSync, 'maxBuffer', '1024', 'stderr'));
test('The "lines.all" option is reported as "lines.all"', () => testInvalidFdSpecificOption(execa, 'lines', 'true', 'all'));
test('The "buffer.ipc" option is reported as "buffer.ipc"', () => testInvalidFdSpecificOption(execaNode, 'buffer', 'false', 'ipc'));

const testInfiniteMaxBuffer = async (execaMethod, maxBuffer) => {
	const {stdout} = await execaMethod('noop.js', ['.'.repeat(10)], {maxBuffer});
	assert.equal(stdout, '.'.repeat(10));
};

test('The "maxBuffer" option can be Infinity', () => testInfiniteMaxBuffer(execa, Infinity));
test('The "maxBuffer" option can be Infinity - sync', () => testInfiniteMaxBuffer(execaSync, Infinity));
test('The "maxBuffer.stdout" option can be Infinity', () => testInfiniteMaxBuffer(execa, {stdout: Infinity}));

const testInvalidBooleanOption = (execaMethod, optionName, optionValue) => {
	assertThrows(() => {
		execaMethod('noop.js', {[optionName]: optionValue});
	}, {instanceOf: TypeError, message: `The \`${optionName}\` option must use a boolean.`});
};

test('The "all" option must use a boolean', () => testInvalidBooleanOption(execa, 'all', 'false'));
test('The "reject" option must use a boolean', () => testInvalidBooleanOption(execa, 'reject', 'no'));
test('The "cleanup" option must use a boolean', () => testInvalidBooleanOption(execa, 'cleanup', 'false'));
test('The "ipc" option must use a boolean', () => testInvalidBooleanOption(execa, 'ipc', 'yes'));
test('The "ipc" option must use a boolean - execaNode()', () => testInvalidBooleanOption(execaNode, 'ipc', null));
test('The "extendEnv" option must use a boolean', () => testInvalidBooleanOption(execa, 'extendEnv', 'false'));
test('The "preferLocal" option must use a boolean', () => testInvalidBooleanOption(execa, 'preferLocal', 1));
test('The "node" option must use a boolean', () => testInvalidBooleanOption(execa, 'node', 'yes'));
test('The "gracefulCancel" option must use a boolean', () => testInvalidBooleanOption(execa, 'gracefulCancel', 'yes'));
test('The "node" option must use a boolean - sync', () => testInvalidBooleanOption(execaSync, 'node', 'yes'));

const testInvalidEnv = (execaMethod, env) => {
	assertThrows(() => {
		execaMethod('noop.js', {env});
	}, {instanceOf: TypeError, message: `The \`env\` option must be an object: ${String(env)}.`});
};

test('The "env" option must be an object', () => testInvalidEnv(execa, 'PATH=/bin'));
test('The "env" option must be an object - sync', () => testInvalidEnv(execaSync, 'PATH=/bin'));
test('The "env" option must not be null', () => testInvalidEnv(execa, null));
test('The "env" option must not be an array', () => testInvalidEnv(execa, ['PATH=/bin']));
test('The "env" option must not be a symbol', () => testInvalidEnv(execa, Symbol('env')));

test('Wrong-typed scalar "maxBuffer" values are reported without a file descriptor', () => {
	assertThrows(() => {
		execa('noop.js', {maxBuffer: '1024'});
	}, {instanceOf: TypeError, message: /^The `maxBuffer` option must use a number\.$/});
});

test('Wrong-typed scalar "lines" values are reported without a file descriptor', () => {
	assertThrows(() => {
		execa('noop.js', {lines: 'true'});
	}, {instanceOf: TypeError, message: /^The `lines` option must use a boolean\.$/});
});
