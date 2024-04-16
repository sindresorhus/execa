import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

test('skip throwing when using reject option', async t => {
	const {exitCode} = await execa('fail.js', {reject: false});
	t.is(exitCode, 2);
});

test('skip throwing when using reject option in sync mode', t => {
	const {exitCode} = execaSync('fail.js', {reject: false});
	t.is(exitCode, 2);
});
