import {join} from 'node:path';
import test from 'ava';
import {
	execa,
	execaSync,
	execaCommand,
	execaCommandSync,
	execaNode,
	$,
} from '../../index.js';
import {setFixtureDirectory, FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const NOOP_PATH = join(FIXTURES_DIRECTORY, 'noop.js');

const testSerializeArgument = async (t, commandArgument, execaMethod) => {
	const {stdout} = await execaMethod(NOOP_PATH, [commandArgument]);
	t.is(stdout, String(commandArgument));
};

test('execa()\'s arguments can be numbers', testSerializeArgument, 1, execa);
test('execa()\'s arguments can be booleans', testSerializeArgument, true, execa);
test('execa()\'s arguments can be NaN', testSerializeArgument, Number.NaN, execa);
test('execa()\'s arguments can be Infinity', testSerializeArgument, Number.POSITIVE_INFINITY, execa);
test('execa()\'s arguments can be null', testSerializeArgument, null, execa);
test('execa()\'s arguments can be undefined', testSerializeArgument, undefined, execa);
test('execa()\'s arguments can be bigints', testSerializeArgument, 1n, execa);
test('execa()\'s arguments can be symbols', testSerializeArgument, Symbol('test'), execa);
test('execaSync()\'s arguments can be numbers', testSerializeArgument, 1, execaSync);
test('execaSync()\'s arguments can be booleans', testSerializeArgument, true, execaSync);
test('execaSync()\'s arguments can be NaN', testSerializeArgument, Number.NaN, execaSync);
test('execaSync()\'s arguments can be Infinity', testSerializeArgument, Number.POSITIVE_INFINITY, execaSync);
test('execaSync()\'s arguments can be null', testSerializeArgument, null, execaSync);
test('execaSync()\'s arguments can be undefined', testSerializeArgument, undefined, execaSync);
test('execaSync()\'s arguments can be bigints', testSerializeArgument, 1n, execaSync);
test('execaSync()\'s arguments can be symbols', testSerializeArgument, Symbol('test'), execaSync);
test('execaNode()\'s arguments can be numbers', testSerializeArgument, 1, execaNode);
test('execaNode()\'s arguments can be booleans', testSerializeArgument, true, execaNode);
test('execaNode()\'s arguments can be NaN', testSerializeArgument, Number.NaN, execaNode);
test('execaNode()\'s arguments can be Infinity', testSerializeArgument, Number.POSITIVE_INFINITY, execaNode);
test('execaNode()\'s arguments can be null', testSerializeArgument, null, execaNode);
test('execaNode()\'s arguments can be undefined', testSerializeArgument, undefined, execaNode);
test('execaNode()\'s arguments can be bigints', testSerializeArgument, 1n, execaNode);
test('execaNode()\'s arguments can be symbols', testSerializeArgument, Symbol('test'), execaNode);
test('$\'s arguments can be numbers', testSerializeArgument, 1, $);
test('$\'s arguments can be booleans', testSerializeArgument, true, $);
test('$\'s arguments can be NaN', testSerializeArgument, Number.NaN, $);
test('$\'s arguments can be Infinity', testSerializeArgument, Number.POSITIVE_INFINITY, $);
test('$\'s arguments can be null', testSerializeArgument, null, $);
test('$\'s arguments can be undefined', testSerializeArgument, undefined, $);
test('$\'s arguments can be bigints', testSerializeArgument, 1n, $);
test('$\'s arguments can be symbols', testSerializeArgument, Symbol('test'), $);
test('$.sync\'s arguments can be numbers', testSerializeArgument, 1, $.sync);
test('$.sync\'s arguments can be booleans', testSerializeArgument, true, $.sync);
test('$.sync\'s arguments can be NaN', testSerializeArgument, Number.NaN, $.sync);
test('$.sync\'s arguments can be Infinity', testSerializeArgument, Number.POSITIVE_INFINITY, $.sync);
test('$.sync\'s arguments can be null', testSerializeArgument, null, $.sync);
test('$.sync\'s arguments can be undefined', testSerializeArgument, undefined, $.sync);
test('$.sync\'s arguments can be bigints', testSerializeArgument, 1n, $.sync);
test('$.sync\'s arguments can be symbols', testSerializeArgument, Symbol('test'), $.sync);

const testInvalidOptions = async (t, execaMethod) => {
	t.throws(() => {
		execaMethod('echo', [], new Map());
	}, {message: /Last argument must be an options object/});
};

test('execa()\'s third argument must be a plain object', testInvalidOptions, execa);
test('execaSync()\'s third argument must be a plain object', testInvalidOptions, execaSync);
test('execaCommand()\'s third argument must be a plain object', testInvalidOptions, execaCommand);
test('execaCommandSync()\'s third argument must be a plain object', testInvalidOptions, execaCommandSync);
test('execaNode()\'s third argument must be a plain object', testInvalidOptions, execaNode);
test('$\'s third argument must be a plain object', testInvalidOptions, $);
test('$.sync\'s third argument must be a plain object', testInvalidOptions, $.sync);
