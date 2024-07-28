import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'ava';
import {
	execa,
	execaSync,
	execaCommand,
	execaCommandSync,
	execaNode,
	$,
} from '../../index.js';
import {setFixtureDirectory, FIXTURES_DIRECTORY_URL} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const testFileUrl = async (t, execaMethod) => {
	const command = new URL('noop.js', FIXTURES_DIRECTORY_URL);
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

const testInvalidCommand = async (t, commandArgument, execaMethod) => {
	t.throws(() => {
		execaMethod(commandArgument);
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

const testRelativePath = async (t, execaMethod) => {
	// @todo: use import.meta.dirname after dropping support for Node <20.11.0
	const rootDirectory = path.basename(fileURLToPath(new URL('../..', import.meta.url)));
	const pathViaParentDirectory = path.join('..', rootDirectory, 'test', 'fixtures', 'noop.js');
	const {stdout} = await execaMethod(pathViaParentDirectory);
	t.is(stdout, foobarString);
};

test('execa() use relative path with \'..\' chars', testRelativePath, execa);
test('execaSync() use relative path with \'..\' chars', testRelativePath, execaSync);
test('execaCommand() use relative path with \'..\' chars', testRelativePath, execaCommand);
test('execaCommandSync() use relative path with \'..\' chars', testRelativePath, execaCommandSync);
test('execaNode() use relative path with \'..\' chars', testRelativePath, execaNode);
test('$ use relative path with \'..\' chars', testRelativePath, $);
test('$.sync use relative path with \'..\' chars', testRelativePath, $.sync);
