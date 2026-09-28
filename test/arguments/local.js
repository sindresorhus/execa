import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa, $} from '../../index.js';
import {setFixtureDirectory, PATH_KEY} from '../helpers/fixtures-directory.js';

setFixtureDirectory();
process.env.FOO = 'foo';

const isWindows = process.platform === 'win32';
const ENOENT_REGEXP = isWindows ? /failed with exit code 1/ : /spawn.* ENOENT/;
// `c8` is used instead of a globally installed command since it is a devDependency, so `preferLocal` is the only way to find it
const C8_BINARY_NAMES = isWindows ? ['c8.cmd', 'c8.exe', 'c8.bat', 'c8.ps1', 'c8'] : ['c8'];

const getPathWithoutCommand = commandNames => {
	const newPath = process.env[PATH_KEY]
		.split(path.delimiter)
		.filter(pathDirectory => commandNames.every(commandName => !existsSync(path.join(pathDirectory, commandName))))
		.join(path.delimiter);
	return {[PATH_KEY]: newPath};
};

const pathWithoutC8 = getPathWithoutCommand(C8_BINARY_NAMES);

test('preferLocal: true', async () => {
	await assert.doesNotReject(execa('c8', ['--version'], {preferLocal: true, env: pathWithoutC8}));
});

test('preferLocal: false', async () => {
	await assertRejects(execa('c8', ['--version'], {preferLocal: false, env: pathWithoutC8}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined', async () => {
	await assertRejects(execa('c8', ['--version'], {env: pathWithoutC8}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined with $', async () => {
	await assert.doesNotReject($('c8', ['--version'], {env: pathWithoutC8}));
});

test('preferLocal: undefined with $.sync', () => {
	assert.doesNotThrow(() => $.sync('c8', ['--version'], {env: pathWithoutC8}));
});

test('preferLocal: undefined with execa.pipe`...`', async () => {
	await assertRejects(() => execa('node', ['--version']).pipe({env: pathWithoutC8})`c8 --version`);
});

test('preferLocal: undefined with $.pipe`...`', async () => {
	await assert.doesNotThrow(() => $('node', ['--version']).pipe({env: pathWithoutC8})`c8 --version`);
});

test('preferLocal: undefined with execa.pipe()', async () => {
	await assertRejects(() => execa('node', ['--version']).pipe('c8', ['--version'], {env: pathWithoutC8}));
});

test('preferLocal: undefined with $.pipe()', async () => {
	await assert.doesNotThrow(() => $('node', ['--version']).pipe('c8', ['--version'], {env: pathWithoutC8}));
});

test('localDir option', async () => {
	const command = isWindows ? 'echo %PATH%' : 'echo $PATH';
	const {stdout} = await execa(command, {shell: true, preferLocal: true, localDir: '/test'});
	const envPaths = stdout.split(path.delimiter);
	assert.ok(envPaths.some(envPath => envPath.endsWith('.bin')));
});

test('localDir option can be a URL', async () => {
	const command = isWindows ? 'echo %PATH%' : 'echo $PATH';
	const {stdout} = await execa(command, {shell: true, preferLocal: true, localDir: pathToFileURL('/test')});
	const envPaths = stdout.split(path.delimiter);
	assert.ok(envPaths.some(envPath => envPath.endsWith('.bin')));
});
