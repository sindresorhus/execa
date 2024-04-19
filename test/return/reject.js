import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

test('skip throwing when using reject option', async t => {
	const {exitCode} = await execa('fail.js', {reject: false});
	t.is(exitCode, 2);
});

test('skip throwing when using reject option in sync mode', t => {
	const {exitCode} = execaSync('fail.js', {reject: false});
	t.is(exitCode, 2);
});
