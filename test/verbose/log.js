import test from 'ava';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';
import {nestedExecaAsync, nestedExecaSync} from '../helpers/verbose.js';

setFixtureDir();

const testNoStdout = async (t, verbose, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', [foobarString], {verbose, stdio: 'inherit'});
	t.is(stdout, foobarString);
};

test('Logs on stderr not stdout, verbose false', testNoStdout, false, nestedExecaAsync);
test('Logs on stderr not stdout, verbose true', testNoStdout, true, nestedExecaAsync);
test('Logs on stderr not stdout, verbose false, sync', testNoStdout, false, nestedExecaSync);
test('Logs on stderr not stdout, verbose true, sync', testNoStdout, true, nestedExecaSync);
