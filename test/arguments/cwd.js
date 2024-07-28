import {mkdir, rmdir} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {pathToFileURL, fileURLToPath} from 'node:url';
import tempfile from 'tempfile';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {FIXTURES_DIRECTORY, setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const isWindows = process.platform === 'win32';

const testOptionCwdString = async (t, execaMethod) => {
	const cwd = '/';
	const {stdout} = await execaMethod('node', ['-p', 'process.cwd()'], {cwd});
	t.is(path.toNamespacedPath(stdout), path.toNamespacedPath(cwd));
};

test('The "cwd" option can be a string', testOptionCwdString, execa);
test('The "cwd" option can be a string - sync', testOptionCwdString, execaSync);

const testOptionCwdUrl = async (t, execaMethod) => {
	const cwd = '/';
	const cwdUrl = pathToFileURL(cwd);
	const {stdout} = await execaMethod('node', ['-p', 'process.cwd()'], {cwd: cwdUrl});
	t.is(path.toNamespacedPath(stdout), path.toNamespacedPath(cwd));
};

test('The "cwd" option can be a URL', testOptionCwdUrl, execa);
test('The "cwd" option can be a URL - sync', testOptionCwdUrl, execaSync);

const testOptionCwdInvalid = (t, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', {cwd: true});
	}, {message: /The "cwd" option must be a string or a file URL: true/});
};

test('The "cwd" option cannot be an invalid type', testOptionCwdInvalid, execa);
test('The "cwd" option cannot be an invalid type - sync', testOptionCwdInvalid, execaSync);

const testErrorCwdDefault = async (t, execaMethod) => {
	const {cwd} = await execaMethod('empty.js');
	t.is(cwd, process.cwd());
};

test('The "cwd" option defaults to process.cwd()', testErrorCwdDefault, execa);
test('The "cwd" option defaults to process.cwd() - sync', testErrorCwdDefault, execaSync);

// Windows does not allow removing a directory used as `cwd` of a running subprocess
if (!isWindows) {
	const testCwdPreSpawn = async (t, execaMethod) => {
		const currentCwd = process.cwd();
		const filePath = tempfile();
		await mkdir(filePath);
		process.chdir(filePath);
		await rmdir(filePath);

		try {
			t.throws(() => {
				execaMethod('empty.js');
			}, {message: /The current directory does not exist/});
		} finally {
			process.chdir(currentCwd);
		}
	};

	test.serial('The "cwd" option default fails if current cwd is missing', testCwdPreSpawn, execa);
	test.serial('The "cwd" option default fails if current cwd is missing - sync', testCwdPreSpawn, execaSync);
}

const cwdNotExisting = {cwd: 'does_not_exist', expectedCode: 'ENOENT', expectedMessage: 'The "cwd" option is invalid'};
const cwdTooLong = {cwd: '.'.repeat(1e5), expectedCode: 'ENAMETOOLONG', expectedMessage: 'The "cwd" option is invalid'};
// @todo: use import.meta.dirname after dropping support for Node <20.11.0
const cwdNotDirectory = {cwd: fileURLToPath(import.meta.url), expectedCode: isWindows ? 'ENOENT' : 'ENOTDIR', expectedMessage: 'The "cwd" option is not a directory'};

const testCwdPostSpawn = async (t, {cwd, expectedCode, expectedMessage}, execaMethod) => {
	const {failed, code, message} = await execaMethod('empty.js', {cwd, reject: false});
	t.true(failed);
	t.is(code, expectedCode);
	t.true(message.includes(expectedMessage));
	t.true(message.includes(cwd));
};

test('The "cwd" option must be an existing file', testCwdPostSpawn, cwdNotExisting, execa);
test('The "cwd" option must be an existing file - sync', testCwdPostSpawn, cwdNotExisting, execaSync);
test('The "cwd" option must not be too long', testCwdPostSpawn, cwdTooLong, execa);
test('The "cwd" option must not be too long - sync', testCwdPostSpawn, cwdTooLong, execaSync);
test('The "cwd" option must be a directory', testCwdPostSpawn, cwdNotDirectory, execa);
test('The "cwd" option must be a directory - sync', testCwdPostSpawn, cwdNotDirectory, execaSync);

const successProperties = {fixtureName: 'empty.js', expectedFailed: false};
const errorProperties = {fixtureName: 'fail.js', expectedFailed: true};

const testErrorCwd = async (t, execaMethod, {fixtureName, expectedFailed}) => {
	const {failed, cwd} = await execaMethod(fixtureName, {cwd: path.relative('.', FIXTURES_DIRECTORY), reject: false});
	t.is(failed, expectedFailed);
	t.is(cwd, FIXTURES_DIRECTORY);
};

test('result.cwd is defined', testErrorCwd, execa, successProperties);
test('result.cwd is defined - sync', testErrorCwd, execaSync, successProperties);
test('error.cwd is defined', testErrorCwd, execa, errorProperties);
test('error.cwd is defined - sync', testErrorCwd, execaSync, errorProperties);
