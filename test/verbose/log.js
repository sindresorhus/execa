import assert from 'node:assert/strict';
import {stripVTControlCharacters} from 'node:util';
import test from 'node:test';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {getNormalizedLines, getCommandLine, getCompletionLine} from '../helpers/verbose.js';
import {PARALLEL_COUNT} from '../helpers/parallel.js';
/* eslint-disable node-test/no-conditional-assertion -- shared helper functions are called from conditional paths on purpose */

setFixtureDirectory();

const testNoStdout = async (verbose, isSync) => {
	const {stdout} = await nestedSubprocess('noop.js', [foobarString], {verbose, stdio: 'inherit', isSync});
	assert.equal(stdout, foobarString);
};

test('Logs on stderr not stdout, verbose "none"', () => testNoStdout('none', false));
test('Logs on stderr not stdout, verbose "short"', () => testNoStdout('short', false));
test('Logs on stderr not stdout, verbose "full"', () => testNoStdout('full', false));
test('Logs on stderr not stdout, verbose "none", sync', () => testNoStdout('none', true));
test('Logs on stderr not stdout, verbose "short", sync', () => testNoStdout('short', true));
test('Logs on stderr not stdout, verbose "full", sync', () => testNoStdout('full', true));

const testColor = async (expectedResult, forceColor) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose: 'short'}, {env: {FORCE_COLOR: forceColor, NO_COLOR: undefined}});
	assert.equal(stderr !== stripVTControlCharacters(stderr), expectedResult);
};

test('Prints with colors if supported', () => testColor(true, '1'));
test('Prints without colors if not supported', () => testColor(false, '0'));

test('Prints lines in order when interleaved with subprocess stderr', async () => {
	const results = await Promise.all(Array.from({length: PARALLEL_COUNT}, () =>
		nestedSubprocess('noop-fd.js', ['2', `${foobarString}\n`], {verbose: 'full', stderr: 'inherit'}, {all: true})));
	for (const {all} of results) {
		assert.deepEqual(
			getNormalizedLines(all),
			[getCommandLine(all), foobarString, getCompletionLine(all)],
		);
	}
});

/* eslint-enable node-test/no-conditional-assertion */
