import {stripVTControlCharacters} from 'node:util';
import test from 'ava';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';
import {nestedExecaAsync, nestedExecaSync} from '../helpers/verbose.js';

setFixtureDir();

const testNoStdout = async (t, verbose, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', [foobarString], {verbose, stdio: 'inherit'});
	t.is(stdout, foobarString);
};

test('Logs on stderr not stdout, verbose "none"', testNoStdout, 'none', nestedExecaAsync);
test('Logs on stderr not stdout, verbose "short"', testNoStdout, 'short', nestedExecaAsync);
test('Logs on stderr not stdout, verbose "full"', testNoStdout, 'full', nestedExecaAsync);
test('Logs on stderr not stdout, verbose "none", sync', testNoStdout, 'none', nestedExecaSync);
test('Logs on stderr not stdout, verbose "short", sync', testNoStdout, 'short', nestedExecaSync);
test('Logs on stderr not stdout, verbose "full", sync', testNoStdout, 'full', nestedExecaSync);

const testColor = async (t, expectedResult, forceColor) => {
	const {stderr} = await nestedExecaAsync('noop.js', [foobarString], {verbose: 'short'}, {env: {FORCE_COLOR: forceColor}});
	t.is(stderr !== stripVTControlCharacters(stderr), expectedResult);
};

test('Prints with colors if supported', testColor, true, '1');
test('Prints without colors if not supported', testColor, false, '0');
