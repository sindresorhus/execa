import process from 'node:process';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir, PATH_KEY} from '../helpers/fixtures-dir.js';

setFixtureDir();
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

test('use extend environment with `extendEnv: true` and `shell: true`', async t => {
	process.env.TEST = 'test';
	const command = isWindows ? 'echo %TEST%' : 'echo $TEST';
	const {stdout} = await execa(command, {shell: true, env: {}, extendEnv: true});
	t.is(stdout, 'test');
	delete process.env.TEST;
});
