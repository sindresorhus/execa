import {stripVTControlCharacters} from 'node:util';
import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {getNormalizedLines, getCommandLine, getCompletionLine} from '../helpers/verbose.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';

setFixtureDirectory();

const testNoStdout = async (t, verbose, isSync) => {
	const {stdout} = await nestedSubprocess('noop.js', [foobarString], {verbose, stdio: 'inherit', isSync});
	t.is(stdout, foobarString);
};

test('Logs on stderr not stdout, verbose "none"', testNoStdout, 'none', false);
test('Logs on stderr not stdout, verbose "short"', testNoStdout, 'short', false);
test('Logs on stderr not stdout, verbose "full"', testNoStdout, 'full', false);
test('Logs on stderr not stdout, verbose "none", sync', testNoStdout, 'none', true);
test('Logs on stderr not stdout, verbose "short", sync', testNoStdout, 'short', true);
test('Logs on stderr not stdout, verbose "full", sync', testNoStdout, 'full', true);

const testColor = async (t, expectedResult, forceColor) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose: 'short'}, {env: {FORCE_COLOR: forceColor}});
	t.is(stderr !== stripVTControlCharacters(stderr), expectedResult);
};

test('Prints with colors if supported', testColor, true, '1');
test('Prints without colors if not supported', testColor, false, '0');

test.serial('Prints lines in order when interleaved with subprocess stderr', async t => {
	const results = await Promise.all(Array.from({length: PARALLEL_COUNT}, () =>
		nestedSubprocess('noop-fd.js', ['2', `${foobarString}\n`], {verbose: 'full', stderr: 'inherit'}, {all: true}),
	));
	for (const {all} of results) {
		t.deepEqual(
			getNormalizedLines(all),
			[getCommandLine(all), foobarString, getCompletionLine(all)],
		);
	}
});
