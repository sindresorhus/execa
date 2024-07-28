import path from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import {execa, $} from '../../index.js';
import {setFixtureDirectory, PATH_KEY} from '../helpers/fixtures-directory.js';

setFixtureDirectory();
process.env.FOO = 'foo';

const isWindows = process.platform === 'win32';
const ENOENT_REGEXP = isWindows ? /failed with exit code 1/ : /spawn.* ENOENT/;

const getPathWithoutLocalDirectory = () => {
	const newPath = process.env[PATH_KEY]
		.split(path.delimiter)
		.filter(pathDirectory => !BIN_DIR_REGEXP.test(pathDirectory)).join(path.delimiter);
	return {[PATH_KEY]: newPath};
};

const BIN_DIR_REGEXP = /node_modules[\\/]\.bin/;

const pathWitoutLocalDirectory = getPathWithoutLocalDirectory();

test('preferLocal: true', async t => {
	await t.notThrowsAsync(execa('ava', ['--version'], {preferLocal: true, env: pathWitoutLocalDirectory}));
});

test('preferLocal: false', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {preferLocal: false, env: pathWitoutLocalDirectory}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined', async t => {
	await t.throwsAsync(execa('ava', ['--version'], {env: pathWitoutLocalDirectory}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined with $', async t => {
	await t.notThrowsAsync($('ava', ['--version'], {env: pathWitoutLocalDirectory}));
});

test('preferLocal: undefined with $.sync', t => {
	t.notThrows(() => $.sync('ava', ['--version'], {env: pathWitoutLocalDirectory}));
});

test('preferLocal: undefined with execa.pipe`...`', async t => {
	await t.throwsAsync(() => execa('node', ['--version']).pipe({env: pathWitoutLocalDirectory})`ava --version`);
});

test('preferLocal: undefined with $.pipe`...`', async t => {
	await t.notThrows(() => $('node', ['--version']).pipe({env: pathWitoutLocalDirectory})`ava --version`);
});

test('preferLocal: undefined with execa.pipe()', async t => {
	await t.throwsAsync(() => execa('node', ['--version']).pipe('ava', ['--version'], {env: pathWitoutLocalDirectory}));
});

test('preferLocal: undefined with $.pipe()', async t => {
	await t.notThrows(() => $('node', ['--version']).pipe('ava', ['--version'], {env: pathWitoutLocalDirectory}));
});

test('localDir option', async t => {
	const command = isWindows ? 'echo %PATH%' : 'echo $PATH';
	const {stdout} = await execa(command, {shell: true, preferLocal: true, localDir: '/test'});
	const envPaths = stdout.split(path.delimiter);
	t.true(envPaths.some(envPath => envPath.endsWith('.bin')));
});

test('localDir option can be a URL', async t => {
	const command = isWindows ? 'echo %PATH%' : 'echo $PATH';
	const {stdout} = await execa(command, {shell: true, preferLocal: true, localDir: pathToFileURL('/test')});
	const envPaths = stdout.split(path.delimiter);
	t.true(envPaths.some(envPath => envPath.endsWith('.bin')));
});
