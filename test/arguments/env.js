import path from 'node:path';
import process from 'node:process';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory, PATH_KEY, FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';

setFixtureDirectory();
process.env.FOO = 'foo';

const isWindows = process.platform === 'win32';

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

// `process.env` must not leak when the `env` option is not set, since `extendEnv: false` means only `env` is used.
// The file is spawned with an absolute path since the environment has no `PATH`.
const environmentFile = path.join(FIXTURES_DIRECTORY, 'environment.js');

const testNoEnvironment = async (t, execaMethod, options) => {
	const {stdout} = await execaMethod(process.execPath, [environmentFile], {extendEnv: false, ...options});
	t.deepEqual(stdout.split('\n'), ['undefined', 'undefined']);
};

test('do not use process.env with `extendEnv: false` and no `env`', testNoEnvironment, execa, {});
test('do not use process.env with `extendEnv: false` and no `env`, sync', testNoEnvironment, execaSync, {});
test('do not use process.env with `extendEnv: false` and `env: {}`', testNoEnvironment, execa, {env: {}});
test('do not use process.env with `extendEnv: false`, no `env` and `preferLocal`', testNoEnvironment, execa, {preferLocal: true});

test('use extend environment with `extendEnv: true` and `shell: true`', async t => {
	process.env.TEST = 'test';
	const command = isWindows ? 'echo %TEST%' : 'echo $TEST';
	const {stdout} = await execa(command, {shell: true, env: {}, extendEnv: true});
	t.is(stdout, 'test');
	delete process.env.TEST;
});
