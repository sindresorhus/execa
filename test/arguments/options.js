import {delimiter} from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import which from 'which';
import {execa, $} from '../../index.js';
import {setFixtureDir, PATH_KEY} from '../helpers/fixtures-dir.js';
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

const pathWitoutLocalDir = getPathWithoutLocalDir();

test('preferLocal: true', async t => {
	await t.notThrowsAsync(execa('ava', ['--version'], {preferLocal: true, env: pathWitoutLocalDir}));
});

test('preferLocal: false', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {preferLocal: false, env: pathWitoutLocalDir}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {env: pathWitoutLocalDir}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined with $', async t => {
	await t.notThrowsAsync($('ava', ['--version'], {env: pathWitoutLocalDir}));
});

test('preferLocal: undefined with $.sync', t => {
	t.notThrows(() => $.sync('ava', ['--version'], {env: pathWitoutLocalDir}));
});

test('preferLocal: undefined with execa.pipe`...`', async t => {
	await t.throwsAsync(() => execa('node', ['--version']).pipe({env: pathWitoutLocalDir})`ava --version`);
});

test('preferLocal: undefined with $.pipe`...`', async t => {
	await t.notThrows(() => $('node', ['--version']).pipe({env: pathWitoutLocalDir})`ava --version`);
});

test('preferLocal: undefined with execa.pipe()', async t => {
	await t.throwsAsync(() => execa('node', ['--version']).pipe('ava', ['--version'], {env: pathWitoutLocalDir}));
});

test('preferLocal: undefined with $.pipe()', async t => {
	await t.notThrows(() => $('node', ['--version']).pipe('ava', ['--version'], {env: pathWitoutLocalDir}));
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
