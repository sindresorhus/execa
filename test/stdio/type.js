import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {noopGenerator} from '../helpers/generator.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const uppercaseGenerator = function * (line) {
	yield line.toUpperCase();
};

const testInvalidGenerator = (t, index, stdioOption) => {
	t.throws(() => {
		execa('empty.js', getStdio(index, {...noopGenerator(), ...stdioOption}));
	}, {message: /must be a generator/});
};

test('Cannot use invalid "transform" with stdin', testInvalidGenerator, 0, {transform: true});
test('Cannot use invalid "transform" with stdout', testInvalidGenerator, 1, {transform: true});
test('Cannot use invalid "transform" with stderr', testInvalidGenerator, 2, {transform: true});
test('Cannot use invalid "transform" with stdio[*]', testInvalidGenerator, 3, {transform: true});
test('Cannot use invalid "final" with stdin', testInvalidGenerator, 0, {final: true});
test('Cannot use invalid "final" with stdout', testInvalidGenerator, 1, {final: true});
test('Cannot use invalid "final" with stderr', testInvalidGenerator, 2, {final: true});
test('Cannot use invalid "final" with stdio[*]', testInvalidGenerator, 3, {final: true});

const testInvalidBinary = (t, index, optionName) => {
	t.throws(() => {
		execa('empty.js', getStdio(index, {transform: uppercaseGenerator, [optionName]: 'true'}));
	}, {message: /a boolean/});
};

test('Cannot use invalid "binary" with stdin', testInvalidBinary, 0, 'binary');
test('Cannot use invalid "binary" with stdout', testInvalidBinary, 1, 'binary');
test('Cannot use invalid "binary" with stderr', testInvalidBinary, 2, 'binary');
test('Cannot use invalid "binary" with stdio[*]', testInvalidBinary, 3, 'binary');
test('Cannot use invalid "objectMode" with stdin', testInvalidBinary, 0, 'objectMode');
test('Cannot use invalid "objectMode" with stdout', testInvalidBinary, 1, 'objectMode');
test('Cannot use invalid "objectMode" with stderr', testInvalidBinary, 2, 'objectMode');
test('Cannot use invalid "objectMode" with stdio[*]', testInvalidBinary, 3, 'objectMode');

const testSyncMethods = (t, index) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(index, uppercaseGenerator));
	}, {message: /cannot be a generator/});
};

test('Cannot use generators with sync methods and stdin', testSyncMethods, 0);
test('Cannot use generators with sync methods and stdout', testSyncMethods, 1);
test('Cannot use generators with sync methods and stderr', testSyncMethods, 2);
test('Cannot use generators with sync methods and stdio[*]', testSyncMethods, 3);
