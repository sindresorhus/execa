import {join} from 'node:path';
import test from 'ava';
import {execa, execaSync, execaCommand, execaCommandSync, execaNode, $} from '../../index.js';
import {setFixtureDir, FIXTURES_DIR} from '../helpers/fixtures-dir.js';

setFixtureDir();

const NOOP_PATH = join(FIXTURES_DIR, 'noop.js');

const testSerializeArg = async (t, arg, execaMethod) => {
	const {stdout} = await execaMethod(NOOP_PATH, [arg]);
	t.is(stdout, String(arg));
};

test('execa()\'s arguments can be numbers', testSerializeArg, 1, execa);
test('execa()\'s arguments can be booleans', testSerializeArg, true, execa);
test('execa()\'s arguments can be NaN', testSerializeArg, Number.NaN, execa);
test('execa()\'s arguments can be Infinity', testSerializeArg, Number.POSITIVE_INFINITY, execa);
test('execa()\'s arguments can be null', testSerializeArg, null, execa);
test('execa()\'s arguments can be undefined', testSerializeArg, undefined, execa);
test('execa()\'s arguments can be bigints', testSerializeArg, 1n, execa);
test('execa()\'s arguments can be symbols', testSerializeArg, Symbol('test'), execa);
test('execaSync()\'s arguments can be numbers', testSerializeArg, 1, execaSync);
test('execaSync()\'s arguments can be booleans', testSerializeArg, true, execaSync);
test('execaSync()\'s arguments can be NaN', testSerializeArg, Number.NaN, execaSync);
test('execaSync()\'s arguments can be Infinity', testSerializeArg, Number.POSITIVE_INFINITY, execaSync);
test('execaSync()\'s arguments can be null', testSerializeArg, null, execaSync);
test('execaSync()\'s arguments can be undefined', testSerializeArg, undefined, execaSync);
test('execaSync()\'s arguments can be bigints', testSerializeArg, 1n, execaSync);
test('execaSync()\'s arguments can be symbols', testSerializeArg, Symbol('test'), execaSync);
test('execaNode()\'s arguments can be numbers', testSerializeArg, 1, execaNode);
test('execaNode()\'s arguments can be booleans', testSerializeArg, true, execaNode);
test('execaNode()\'s arguments can be NaN', testSerializeArg, Number.NaN, execaNode);
test('execaNode()\'s arguments can be Infinity', testSerializeArg, Number.POSITIVE_INFINITY, execaNode);
test('execaNode()\'s arguments can be null', testSerializeArg, null, execaNode);
test('execaNode()\'s arguments can be undefined', testSerializeArg, undefined, execaNode);
test('execaNode()\'s arguments can be bigints', testSerializeArg, 1n, execaNode);
test('execaNode()\'s arguments can be symbols', testSerializeArg, Symbol('test'), execaNode);
test('$\'s arguments can be numbers', testSerializeArg, 1, $);
test('$\'s arguments can be booleans', testSerializeArg, true, $);
test('$\'s arguments can be NaN', testSerializeArg, Number.NaN, $);
test('$\'s arguments can be Infinity', testSerializeArg, Number.POSITIVE_INFINITY, $);
test('$\'s arguments can be null', testSerializeArg, null, $);
test('$\'s arguments can be undefined', testSerializeArg, undefined, $);
test('$\'s arguments can be bigints', testSerializeArg, 1n, $);
test('$\'s arguments can be symbols', testSerializeArg, Symbol('test'), $);
test('$.sync\'s arguments can be numbers', testSerializeArg, 1, $.sync);
test('$.sync\'s arguments can be booleans', testSerializeArg, true, $.sync);
test('$.sync\'s arguments can be NaN', testSerializeArg, Number.NaN, $.sync);
test('$.sync\'s arguments can be Infinity', testSerializeArg, Number.POSITIVE_INFINITY, $.sync);
test('$.sync\'s arguments can be null', testSerializeArg, null, $.sync);
test('$.sync\'s arguments can be undefined', testSerializeArg, undefined, $.sync);
test('$.sync\'s arguments can be bigints', testSerializeArg, 1n, $.sync);
test('$.sync\'s arguments can be symbols', testSerializeArg, Symbol('test'), $.sync);

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
