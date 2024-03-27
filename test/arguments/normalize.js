import {join, basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'ava';
import {execa, execaSync, execaCommand, execaCommandSync, execaNode, $} from '../../index.js';
import {setFixtureDir, FIXTURES_DIR, FIXTURES_DIR_URL} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';

setFixtureDir();
const NOOP_PATH = join(FIXTURES_DIR, 'noop.js');

const testFileUrl = async (t, execaMethod) => {
	const command = new URL('noop.js', FIXTURES_DIR_URL);
	const {stdout} = await execaMethod(command);
	t.is(stdout, foobarString);
};

test('execa()\'s command argument can be a file URL', testFileUrl, execa);
test('execaSync()\'s command argument can be a file URL', testFileUrl, execaSync);
test('execaCommand()\'s command argument can be a file URL', testFileUrl, execaCommand);
test('execaCommandSync()\'s command argument can be a file URL', testFileUrl, execaCommandSync);
test('execaNode()\'s command argument can be a file URL', testFileUrl, execaNode);
test('$\'s command argument can be a file URL', testFileUrl, $);
test('$.sync\'s command argument can be a file URL', testFileUrl, $.sync);

const testInvalidFileUrl = async (t, execaMethod) => {
	const invalidUrl = new URL('https://invalid.com');
	t.throws(() => {
		execaMethod(invalidUrl);
	}, {code: 'ERR_INVALID_URL_SCHEME'});
};

test('execa()\'s command argument cannot be a non-file URL', testInvalidFileUrl, execa);
test('execaSync()\'s command argument cannot be a non-file URL', testInvalidFileUrl, execaSync);
test('execaCommand()\'s command argument cannot be a non-file URL', testInvalidFileUrl, execaCommand);
test('execaCommandSync()\'s command argument cannot be a non-file URL', testInvalidFileUrl, execaCommandSync);
test('execaNode()\'s command argument cannot be a non-file URL', testInvalidFileUrl, execaNode);
test('$\'s command argument cannot be a non-file URL', testInvalidFileUrl, $);
test('$.sync\'s command argument cannot be a non-file URL', testInvalidFileUrl, $.sync);

const testInvalidCommand = async (t, arg, execaMethod) => {
	t.throws(() => {
		execaMethod(arg);
	}, {message: /First argument must be a string or a file URL/});
};

test('execa()\'s first argument must be defined', testInvalidCommand, undefined, execa);
test('execaSync()\'s first argument must be defined', testInvalidCommand, undefined, execaSync);
test('execaCommand()\'s first argument must be defined', testInvalidCommand, undefined, execaCommand);
test('execaCommandSync()\'s first argument must be defined', testInvalidCommand, undefined, execaCommandSync);
test('execaNode()\'s first argument must be defined', testInvalidCommand, undefined, execaNode);
test('$\'s first argument must be defined', testInvalidCommand, undefined, $);
test('$.sync\'s first argument must be defined', testInvalidCommand, undefined, $.sync);
test('execa()\'s first argument must be valid', testInvalidCommand, true, execa);
test('execaSync()\'s first argument must be valid', testInvalidCommand, true, execaSync);
test('execaCommand()\'s first argument must be valid', testInvalidCommand, true, execaCommand);
test('execaCommandSync()\'s first argument must be valid', testInvalidCommand, true, execaCommandSync);
test('execaNode()\'s first argument must be valid', testInvalidCommand, true, execaNode);
test('$\'s first argument must be valid', testInvalidCommand, true, $);
test('$.sync\'s first argument must be valid', testInvalidCommand, true, $.sync);
test('execa()\'s command argument must be a string or file URL', testInvalidCommand, ['command', 'arg'], execa);
test('execaSync()\'s command argument must be a string or file URL', testInvalidCommand, ['command', 'arg'], execaSync);
test('execaCommand()\'s command argument must be a string or file URL', testInvalidCommand, ['command', 'arg'], execaCommand);
test('execaCommandSync()\'s command argument must be a string or file URL', testInvalidCommand, ['command', 'arg'], execaCommandSync);
test('execaNode()\'s command argument must be a string or file URL', testInvalidCommand, ['command', 'arg'], execaNode);
test('$\'s command argument must be a string or file URL', testInvalidCommand, ['command', 'arg'], $);
test('$.sync\'s command argument must be a string or file URL', testInvalidCommand, ['command', 'arg'], $.sync);

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

const testRelativePath = async (t, execaMethod) => {
	const rootDir = basename(fileURLToPath(new URL('../..', import.meta.url)));
	const pathViaParentDir = join('..', rootDir, 'test', 'fixtures', 'noop.js');
	const {stdout} = await execaMethod(pathViaParentDir);
	t.is(stdout, foobarString);
};

test('execa() use relative path with \'..\' chars', testRelativePath, execa);
test('execaSync() use relative path with \'..\' chars', testRelativePath, execaSync);
test('execaCommand() use relative path with \'..\' chars', testRelativePath, execaCommand);
test('execaCommandSync() use relative path with \'..\' chars', testRelativePath, execaCommandSync);
test('execaNode() use relative path with \'..\' chars', testRelativePath, execaNode);
test('$ use relative path with \'..\' chars', testRelativePath, $);
test('$.sync use relative path with \'..\' chars', testRelativePath, $.sync);
