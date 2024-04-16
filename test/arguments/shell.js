import process from 'node:process';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import which from 'which';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {identity} from '../helpers/stdio.js';

setFixtureDir();
process.env.FOO = 'foo';

const isWindows = process.platform === 'win32';

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
