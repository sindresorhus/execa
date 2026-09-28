import assert from 'node:assert/strict';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory, PATH_KEY, FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';

setFixtureDirectory();
process.env.FOO = 'foo';

const isWindows = process.platform === 'win32';

test('use environment variables by default', async () => {
	const {stdout} = await execa('environment.js');
	assert.deepEqual(stdout.split('\n'), ['foo', 'undefined']);
});

test('extend environment variables by default', async () => {
	const {stdout} = await execa('environment.js', [], {env: {BAR: 'bar', [PATH_KEY]: process.env[PATH_KEY]}});
	assert.deepEqual(stdout.split('\n'), ['foo', 'bar']);
});

test('do not extend environment with `extendEnv: false`', async () => {
	const {stdout} = await execa('environment.js', [], {env: {BAR: 'bar', [PATH_KEY]: process.env[PATH_KEY]}, extendEnv: false});
	assert.deepEqual(stdout.split('\n'), ['undefined', 'bar']);
});

// `process.env` must not leak when the `env` option is not set, since `extendEnv: false` means only `env` is used.
// The file is spawned with an absolute path since the environment has no `PATH`.
const environmentFile = path.join(FIXTURES_DIRECTORY, 'environment.js');

const testNoEnvironment = async (execaMethod, options) => {
	const {stdout} = await execaMethod(process.execPath, [environmentFile], {extendEnv: false, ...options});
	assert.deepEqual(stdout.split('\n'), ['undefined', 'undefined']);
};

test('do not use process.env with `extendEnv: false` and no `env`', () => testNoEnvironment(execa, {}));
test('do not use process.env with `extendEnv: false` and no `env`, sync', () => testNoEnvironment(execaSync, {}));
test('do not use process.env with `extendEnv: false` and `env: {}`', () => testNoEnvironment(execa, {env: {}}));
test('do not use process.env with `extendEnv: false`, no `env` and `preferLocal`', () => testNoEnvironment(execa, {preferLocal: true}));

// `preferLocal` adds directories to `process.env.PATH` when `env` has no `PATH`, so system commands still resolve
test('use process.env.PATH with `extendEnv: false`, no `env` and `preferLocal`', async () => {
	const {stdout} = await execa('node', ['-p', '"ok"'], {extendEnv: false, preferLocal: true});
	assert.equal(stdout, 'ok');
});

// The `env` option is kept on a null-prototype object, so the properties it inherits are not passed to the subprocess
const testInheritedEnv = async execaMethod => {
	const env = Object.assign(Object.create({FOO: 'foo'}), {BAR: 'bar'});
	const {stdout} = await execaMethod(process.execPath, [environmentFile], {env, extendEnv: false});
	assert.deepEqual(stdout.split('\n'), ['undefined', 'bar']);
};

test('The "env" option does not pass inherited properties', () => testInheritedEnv(execa));
test('The "env" option does not pass inherited properties, sync', () => testInheritedEnv(execaSync));

test('use extend environment with `extendEnv: true` and `shell: true`', async () => {
	process.env.TEST = 'test';
	const command = isWindows ? 'echo %TEST%' : 'echo $TEST';
	const {stdout} = await execa(command, {shell: true, env: {}, extendEnv: true});
	assert.equal(stdout, 'test');
	delete process.env.TEST;
});
