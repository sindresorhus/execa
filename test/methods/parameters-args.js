import test from 'ava';
import {
	execa,
	execaSync,
	execaCommand,
	execaCommandSync,
	execaNode,
	$,
} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const testInvalidArguments = async (t, execaMethod) => {
	t.throws(() => {
		execaMethod('echo', true);
	}, {message: /Second argument must be either/});
};

test('execa()\'s second argument must be valid', testInvalidArguments, execa);
test('execaSync()\'s second argument must be valid', testInvalidArguments, execaSync);
test('execaCommand()\'s second argument must be valid', testInvalidArguments, execaCommand);
test('execaCommandSync()\'s second argument must be valid', testInvalidArguments, execaCommandSync);
test('execaNode()\'s second argument must be valid', testInvalidArguments, execaNode);
test('$\'s second argument must be valid', testInvalidArguments, $);
test('$.sync\'s second argument must be valid', testInvalidArguments, $.sync);

const testInvalidArgumentsItems = async (t, execaMethod) => {
	t.throws(() => {
		execaMethod('echo', [{}]);
	}, {message: 'Second argument must be an array of strings: [object Object]'});
};

test('execa()\'s second argument must not be objects', testInvalidArgumentsItems, execa);
test('execaSync()\'s second argument must not be objects', testInvalidArgumentsItems, execaSync);
test('execaCommand()\'s second argument must not be objects', testInvalidArgumentsItems, execaCommand);
test('execaCommandSync()\'s second argument must not be objects', testInvalidArgumentsItems, execaCommandSync);
test('execaNode()\'s second argument must not be objects', testInvalidArgumentsItems, execaNode);
test('$\'s second argument must not be objects', testInvalidArgumentsItems, $);
test('$.sync\'s second argument must not be objects', testInvalidArgumentsItems, $.sync);

const testNullByteArgument = async (t, execaMethod) => {
	t.throws(() => {
		execaMethod('echo', ['a\0b']);
	}, {message: /null bytes/});
};

test('execa()\'s second argument must not include \\0', testNullByteArgument, execa);
test('execaSync()\'s second argument must not include \\0', testNullByteArgument, execaSync);
test('execaCommand()\'s second argument must not include \\0', testNullByteArgument, execaCommand);
test('execaCommandSync()\'s second argument must not include \\0', testNullByteArgument, execaCommandSync);
test('execaNode()\'s second argument must not include \\0', testNullByteArgument, execaNode);
test('$\'s second argument must not include \\0', testNullByteArgument, $);
test('$.sync\'s second argument must not include \\0', testNullByteArgument, $.sync);
