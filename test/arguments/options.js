import {delimiter, join, basename} from 'node:path';
import process from 'node:process';
import {pathToFileURL, fileURLToPath} from 'node:url';
import test from 'ava';
import which from 'which';
import {execa, $, execaSync, execaNode} from '../../index.js';
import {setFixtureDir, FIXTURES_DIR_URL, PATH_KEY} from '../helpers/fixtures-dir.js';
import {identity} from '../helpers/stdio.js';

setFixtureDir();
process.env.FOO = 'foo';

const isWindows = process.platform === 'win32';
const ENOENT_REGEXP = isWindows ? /failed with exit code 1/ : /spawn.* ENOENT/;

const getPathWithoutLocalDir = () => {
	const newPath = process.env[PATH_KEY].split(delimiter).filter(pathDir => !BIN_DIR_REGEXP.test(pathDir)).join(delimiter);
	return {[PATH_KEY]: newPath};
};

const BIN_DIR_REGEXP = /node_modules[\\/]\.bin/;

test('preferLocal: true', async t => {
	await t.notThrowsAsync(execa('ava', ['--version'], {preferLocal: true, env: getPathWithoutLocalDir()}));
});

test('preferLocal: false', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {preferLocal: false, env: getPathWithoutLocalDir()}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {env: getPathWithoutLocalDir()}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined with $', async t => {
	await t.notThrowsAsync($({env: getPathWithoutLocalDir()})`ava --version`);
});

test('preferLocal: undefined with $.sync', t => {
	t.notThrows(() => $({env: getPathWithoutLocalDir()}).sync`ava --version`);
});

test('localDir option', async t => {
	const command = isWindows ? 'echo %PATH%' : 'echo $PATH';
	const {stdout} = await execa(command, {shell: true, preferLocal: true, localDir: '/test'});
	const envPaths = stdout.split(delimiter);
	t.true(envPaths.some(envPath => envPath.endsWith('.bin')));
});

test('localDir option can be a URL', async t => {
	const command = isWindows ? 'echo %PATH%' : 'echo $PATH';
	const {stdout} = await execa(command, {shell: true, preferLocal: true, localDir: pathToFileURL('/test')});
	const envPaths = stdout.split(delimiter);
	t.true(envPaths.some(envPath => envPath.endsWith('.bin')));
});

test('use environment variables by default', async t => {
	const {stdout} = await execa('environment.js');
	t.deepEqual(stdout.split('\n'), ['foo', 'undefined']);
});

test('extend environment variables by default', async t => {
	const {stdout} = await execa('environment.js', [], {env: {BAR: 'bar', [PATH_KEY]: process.env[PATH_KEY]}});
	t.deepEqual(stdout.split('\n'), ['foo', 'bar']);
});

test('do not extend environment with `extendEnv: false`', async t => {
	const {stdout} = await execa('environment.js', [], {env: {BAR: 'bar', [PATH_KEY]: process.env[PATH_KEY]}, extendEnv: false});
	t.deepEqual(stdout.split('\n'), ['undefined', 'bar']);
});

test('use extend environment with `extendEnv: true` and `shell: true`', async t => {
	process.env.TEST = 'test';
	const command = isWindows ? 'echo %TEST%' : 'echo $TEST';
	const {stdout} = await execa(command, {shell: true, env: {}, extendEnv: true});
	t.is(stdout, 'test');
	delete process.env.TEST;
});

test('can use `options.shell: true`', async t => {
	const {stdout} = await execa('node test/fixtures/noop.js foo', {shell: true});
	t.is(stdout, 'foo');
});

const testShellPath = async (t, mapPath) => {
	const shellPath = isWindows ? 'cmd.exe' : 'bash';
	const shell = mapPath(await which(shellPath));
	const {stdout} = await execa('node test/fixtures/noop.js foo', {shell});
	t.is(stdout, 'foo');
};

test('can use `options.shell: string`', testShellPath, identity);
test('can use `options.shell: file URL`', testShellPath, pathToFileURL);

const testFileUrl = async (t, execaMethod) => {
	const command = new URL('noop.js', FIXTURES_DIR_URL);
	const {stdout} = await execaMethod(command, ['foobar']);
	t.is(stdout, 'foobar');
};

test('execa()\'s command argument can be a file URL', testFileUrl, execa);
test('execaSync()\'s command argument can be a file URL', testFileUrl, execaSync);
test('execaNode()\'s command argument can be a file URL', testFileUrl, execaNode);

const testInvalidFileUrl = async (t, execaMethod) => {
	const invalidUrl = new URL('https://invalid.com');
	t.throws(() => {
		execaMethod(invalidUrl);
	}, {code: 'ERR_INVALID_URL_SCHEME'});
};

test('execa()\'s command argument cannot be a non-file URL', testInvalidFileUrl, execa);
test('execaSync()\'s command argument cannot be a non-file URL', testInvalidFileUrl, execaSync);
test('execaNode()\'s command argument cannot be a non-file URL', testInvalidFileUrl, execaNode);

const testInvalidCommand = async (t, execaMethod) => {
	t.throws(() => {
		execaMethod(['command', 'arg']);
	}, {message: /First argument must be a string or a file URL/});
};

test('execa()\'s command argument must be a string or file URL', testInvalidCommand, execa);
test('execaSync()\'s command argument must be a string or file URL', testInvalidCommand, execaSync);
test('execaNode()\'s command argument must be a string or file URL', testInvalidCommand, execaNode);

const testInvalidArgs = async (t, execaMethod) => {
	t.throws(() => {
		execaMethod('echo', true);
	}, {message: /Second argument must be either/});
};

test('execa()\'s second argument must be an array', testInvalidArgs, execa);
test('execaSync()\'s second argument must be an array', testInvalidArgs, execaSync);
test('execaNode()\'s second argument must be an array', testInvalidArgs, execaNode);

const testInvalidArgsItems = async (t, execaMethod) => {
	t.throws(() => {
		execaMethod('echo', [{}]);
	}, {message: 'Second argument must be an array of strings: [object Object]'});
};

test('execa()\'s second argument must not be objects', testInvalidArgsItems, execa);
test('execaSync()\'s second argument must not be objects', testInvalidArgsItems, execaSync);
test('execaNode()\'s second argument must not be objects', testInvalidArgsItems, execaNode);

const testNullByteArg = async (t, execaMethod) => {
	t.throws(() => {
		execaMethod('echo', ['a\0b']);
	}, {message: /null bytes/});
};

test('execa()\'s second argument must not include \\0', testNullByteArg, execa);
test('execaSync()\'s second argument must not include \\0', testNullByteArg, execaSync);
test('execaNode()\'s second argument must not include \\0', testNullByteArg, execaNode);

const testSerializeArg = async (t, arg) => {
	const {stdout} = await execa('noop.js', [arg]);
	t.is(stdout, String(arg));
};

test('execa()\'s arguments can be numbers', testSerializeArg, 1);
test('execa()\'s arguments can be booleans', testSerializeArg, true);
test('execa()\'s arguments can be NaN', testSerializeArg, Number.NaN);
test('execa()\'s arguments can be Infinity', testSerializeArg, Number.POSITIVE_INFINITY);
test('execa()\'s arguments can be null', testSerializeArg, null);
test('execa()\'s arguments can be undefined', testSerializeArg, undefined);
test('execa()\'s arguments can be bigints', testSerializeArg, 1n);
test('execa()\'s arguments can be symbols', testSerializeArg, Symbol('test'));

const testInvalidOptions = async (t, execaMethod) => {
	t.throws(() => {
		execaMethod('echo', [], new Map());
	}, {message: /Last argument must be an options object/});
};

test('execa()\'s third argument must be a plain object', testInvalidOptions, execa);
test('execaSync()\'s third argument must be a plain object', testInvalidOptions, execaSync);
test('execaNode()\'s third argument must be a plain object', testInvalidOptions, execaNode);

test('use relative path with \'..\' chars', async t => {
	const pathViaParentDir = join('..', basename(fileURLToPath(new URL('../..', import.meta.url))), 'test', 'fixtures', 'noop.js');
	const {stdout} = await execa(pathViaParentDir, ['foo']);
	t.is(stdout, 'foo');
});
