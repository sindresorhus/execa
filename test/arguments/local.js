import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {assertRejects, assertThrows} from '../helpers/assert.js';
import {execa, execaSync, $} from '../../index.js';
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

test('explicit preferLocal: undefined uses the $ default', async () => {
	await assert.doesNotReject($('c8', ['--version'], {env: pathWithoutC8, preferLocal: undefined}));
});

test('explicit preferLocal: undefined uses the $.sync default', () => {
	assert.doesNotThrow(() => $.sync('c8', ['--version'], {env: pathWithoutC8, preferLocal: undefined}));
});

test('explicit preferLocal: undefined uses the $.pipe template default', async () => {
	await assert.doesNotReject($('node', ['--version']).pipe({env: pathWithoutC8, preferLocal: undefined})`c8 --version`);
});

test('explicit preferLocal: undefined uses the $.pipe array default', async () => {
	await assert.doesNotReject($('node', ['--version']).pipe('c8', ['--version'], {env: pathWithoutC8, preferLocal: undefined}));
});

test('bound preferLocal: undefined uses the $ template default', async () => {
	await assert.doesNotReject($({env: pathWithoutC8, preferLocal: undefined})`c8 --version`);
});

test('bound preferLocal: undefined uses the $.sync template default', () => {
	assert.doesNotThrow(() => $.sync({env: pathWithoutC8, preferLocal: undefined})`c8 --version`);
});

const testScriptResetPreferLocal = async execaMethod => {
	const {exitCode} = await execaMethod({preferLocal: false})('c8', ['--version'], {env: pathWithoutC8, preferLocal: undefined});
	assert.equal(exitCode, 0);
};

test('undefined resets bound preferLocal: false to the $ default', () => testScriptResetPreferLocal($));
test('undefined resets bound preferLocal: false to the $.sync default', () => testScriptResetPreferLocal($.sync));

test('rebinding preferLocal: undefined resets to the $ default', async () => {
	const {exitCode} = await $({env: pathWithoutC8, preferLocal: false})({preferLocal: undefined})`c8 --version`;
	assert.equal(exitCode, 0);
});

test('bound source preferLocal: false does not override an undefined pipe destination default', async () => {
	const {exitCode} = await $({preferLocal: false})('node', ['--version']).pipe('c8', ['--version'], {env: pathWithoutC8, preferLocal: undefined});
	assert.equal(exitCode, 0);
});

test('preferLocal: false disables the $ default', async () => {
	await assertRejects($('c8', ['--version'], {env: pathWithoutC8, preferLocal: false}), {message: ENOENT_REGEXP});
});

test('preferLocal: false disables the $.sync default', () => {
	assertThrows(() => $.sync('c8', ['--version'], {env: pathWithoutC8, preferLocal: false}), {message: ENOENT_REGEXP});
});

test('bound preferLocal: false disables the $ default', async () => {
	await assertRejects($({env: pathWithoutC8, preferLocal: false})`c8 --version`, {message: ENOENT_REGEXP});
});

test('preferLocal: false disables the $.pipe destination default', async () => {
	await assertRejects($('node', ['--version']).pipe('c8', ['--version'], {env: pathWithoutC8, preferLocal: false}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined resets bound execa options to false', async () => {
	await assertRejects(execa({preferLocal: true})('c8', ['--version'], {env: pathWithoutC8, preferLocal: undefined}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined resets bound execaSync options to false', () => {
	assertThrows(() => execaSync({preferLocal: true})('c8', ['--version'], {env: pathWithoutC8, preferLocal: undefined}), {message: ENOENT_REGEXP});
});

test('preferLocal: undefined with execa.pipe`...`', async () => {
	await assertRejects(() => execa('node', ['--version']).pipe({env: pathWithoutC8})`c8 --version`);
});

test('preferLocal: undefined with $.pipe`...`', async () => {
	await assert.doesNotReject($('node', ['--version']).pipe({env: pathWithoutC8})`c8 --version`);
});

test('preferLocal: undefined with execa.pipe()', async () => {
	await assertRejects(() => execa('node', ['--version']).pipe('c8', ['--version'], {env: pathWithoutC8}));
});

test('preferLocal: undefined with $.pipe()', async () => {
	await assert.doesNotReject($('node', ['--version']).pipe('c8', ['--version'], {env: pathWithoutC8}));
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
