import assert from 'node:assert/strict';
import test from 'node:test';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

test('skip throwing when using reject option', async () => {
	const {exitCode} = await execa('fail.js', {reject: false});
	assert.equal(exitCode, 2);
});

test('skip throwing when using reject option in sync mode', () => {
	const {exitCode} = execaSync('fail.js', {reject: false});
	assert.equal(exitCode, 2);
});
