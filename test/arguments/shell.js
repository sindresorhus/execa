import assert from 'node:assert/strict';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {whichCommand} from 'which-command';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {identity} from '../helpers/stdio.js';

setFixtureDirectory();
process.env.FOO = 'foo';

const isWindows = process.platform === 'win32';

test('can use `options.shell: true`', async () => {
	const {stdout} = await execa('node test/fixtures/noop.js foo', {shell: true});
	assert.equal(stdout, 'foo');
});

const testShellPath = async mapPath => {
	const shellPath = isWindows ? 'cmd.exe' : 'bash';
	const shell = mapPath(await whichCommand(shellPath));
	const {stdout} = await execa('node test/fixtures/noop.js foo', {shell});
	assert.equal(stdout, 'foo');
};

test('can use `options.shell: string`', () => testShellPath(identity));
test('can use `options.shell: file URL`', () => testShellPath(pathToFileURL));
