import test from 'ava';
import {execa, execaSync, execaCommand, execaCommandSync, execaNode, $} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const testInvalidArgs = async (t, execaMethod) => {
	t.throws(() => {
		execaMethod('echo', true);
	}, {message: /Second argument must be either/});
};

test('execa()\'s second argument must be valid', testInvalidArgs, execa);
test('execaSync()\'s second argument must be valid', testInvalidArgs, execaSync);
test('execaCommand()\'s second argument must be valid', testInvalidArgs, execaCommand);
test('execaCommandSync()\'s second argument must be valid', testInvalidArgs, execaCommandSync);
test('execaNode()\'s second argument must be valid', testInvalidArgs, execaNode);
test('$\'s second argument must be valid', testInvalidArgs, $);
test('$.sync\'s second argument must be valid', testInvalidArgs, $.sync);

const testInvalidArgsItems = async (t, execaMethod) => {
	t.throws(() => {
		execaMethod('echo', [{}]);
	}, {message: 'Second argument must be an array of strings: [object Object]'});
};

test('execa()\'s second argument must not be objects', testInvalidArgsItems, execa);
test('execaSync()\'s second argument must not be objects', testInvalidArgsItems, execaSync);
test('execaCommand()\'s second argument must not be objects', testInvalidArgsItems, execaCommand);
test('execaCommandSync()\'s second argument must not be objects', testInvalidArgsItems, execaCommandSync);
test('execaNode()\'s second argument must not be objects', testInvalidArgsItems, execaNode);
test('$\'s second argument must not be objects', testInvalidArgsItems, $);
test('$.sync\'s second argument must not be objects', testInvalidArgsItems, $.sync);

const testNullByteArg = async (t, execaMethod) => {
	t.throws(() => {
		execaMethod('echo', ['a\0b']);
	}, {message: /null bytes/});
};

test('execa()\'s second argument must not include \\0', testNullByteArg, execa);
test('execaSync()\'s second argument must not include \\0', testNullByteArg, execaSync);
test('execaCommand()\'s second argument must not include \\0', testNullByteArg, execaCommand);
test('execaCommandSync()\'s second argument must not include \\0', testNullByteArg, execaCommandSync);
test('execaNode()\'s second argument must not include \\0', testNullByteArg, execaNode);
test('$\'s second argument must not include \\0', testNullByteArg, $);
test('$.sync\'s second argument must not include \\0', testNullByteArg, $.sync);
