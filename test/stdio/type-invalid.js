import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {noopGenerator} from '../helpers/generator.js';
import {generatorsMap} from '../helpers/map.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const testInvalidGenerator = (t, fdNumber, stdioOption, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(fdNumber, {...noopGenerator(), ...stdioOption}));
	}, {message: 'final' in stdioOption ? /must be a generator/ : /must be a generator, a Duplex stream or a web TransformStream/});
};

test('Cannot use invalid "transform" with stdin', testInvalidGenerator, 0, {transform: true}, execa);
test('Cannot use invalid "transform" with stdout', testInvalidGenerator, 1, {transform: true}, execa);
test('Cannot use invalid "transform" with stderr', testInvalidGenerator, 2, {transform: true}, execa);
test('Cannot use invalid "transform" with stdio[*]', testInvalidGenerator, 3, {transform: true}, execa);
test('Cannot use invalid "final" with stdin', testInvalidGenerator, 0, {final: true}, execa);
test('Cannot use invalid "final" with stdout', testInvalidGenerator, 1, {final: true}, execa);
test('Cannot use invalid "final" with stderr', testInvalidGenerator, 2, {final: true}, execa);
test('Cannot use invalid "final" with stdio[*]', testInvalidGenerator, 3, {final: true}, execa);
test('Cannot use invalid "transform" with stdin, sync', testInvalidGenerator, 0, {transform: true}, execaSync);
test('Cannot use invalid "transform" with stdout, sync', testInvalidGenerator, 1, {transform: true}, execaSync);
test('Cannot use invalid "transform" with stderr, sync', testInvalidGenerator, 2, {transform: true}, execaSync);
test('Cannot use invalid "transform" with stdio[*], sync', testInvalidGenerator, 3, {transform: true}, execaSync);
test('Cannot use invalid "final" with stdin, sync', testInvalidGenerator, 0, {final: true}, execaSync);
test('Cannot use invalid "final" with stdout, sync', testInvalidGenerator, 1, {final: true}, execaSync);
test('Cannot use invalid "final" with stderr, sync', testInvalidGenerator, 2, {final: true}, execaSync);
test('Cannot use invalid "final" with stdio[*], sync', testInvalidGenerator, 3, {final: true}, execaSync);

// eslint-disable-next-line max-params
const testInvalidBinary = (t, fdNumber, optionName, type, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(fdNumber, {...generatorsMap[type].uppercase(), [optionName]: 'true'}));
	}, {message: /a boolean/});
};

test('Cannot use invalid "binary" with stdin', testInvalidBinary, 0, 'binary', 'generator', execa);
test('Cannot use invalid "binary" with stdout', testInvalidBinary, 1, 'binary', 'generator', execa);
test('Cannot use invalid "binary" with stderr', testInvalidBinary, 2, 'binary', 'generator', execa);
test('Cannot use invalid "binary" with stdio[*]', testInvalidBinary, 3, 'binary', 'generator', execa);
test('Cannot use invalid "objectMode" with stdin, generators', testInvalidBinary, 0, 'objectMode', 'generator', execa);
test('Cannot use invalid "objectMode" with stdout, generators', testInvalidBinary, 1, 'objectMode', 'generator', execa);
test('Cannot use invalid "objectMode" with stderr, generators', testInvalidBinary, 2, 'objectMode', 'generator', execa);
test('Cannot use invalid "objectMode" with stdio[*], generators', testInvalidBinary, 3, 'objectMode', 'generator', execa);
test('Cannot use invalid "binary" with stdin, sync', testInvalidBinary, 0, 'binary', 'generator', execaSync);
test('Cannot use invalid "binary" with stdout, sync', testInvalidBinary, 1, 'binary', 'generator', execaSync);
test('Cannot use invalid "binary" with stderr, sync', testInvalidBinary, 2, 'binary', 'generator', execaSync);
test('Cannot use invalid "binary" with stdio[*], sync', testInvalidBinary, 3, 'binary', 'generator', execaSync);
test('Cannot use invalid "objectMode" with stdin, generators, sync', testInvalidBinary, 0, 'objectMode', 'generator', execaSync);
test('Cannot use invalid "objectMode" with stdout, generators, sync', testInvalidBinary, 1, 'objectMode', 'generator', execaSync);
test('Cannot use invalid "objectMode" with stderr, generators, sync', testInvalidBinary, 2, 'objectMode', 'generator', execaSync);
test('Cannot use invalid "objectMode" with stdio[*], generators, sync', testInvalidBinary, 3, 'objectMode', 'generator', execaSync);
test('Cannot use invalid "objectMode" with stdin, duplexes', testInvalidBinary, 0, 'objectMode', 'duplex', execa);
test('Cannot use invalid "objectMode" with stdout, duplexes', testInvalidBinary, 1, 'objectMode', 'duplex', execa);
test('Cannot use invalid "objectMode" with stderr, duplexes', testInvalidBinary, 2, 'objectMode', 'duplex', execa);
test('Cannot use invalid "objectMode" with stdio[*], duplexes', testInvalidBinary, 3, 'objectMode', 'duplex', execa);
test('Cannot use invalid "objectMode" with stdin, webTransforms', testInvalidBinary, 0, 'objectMode', 'webTransform', execa);
test('Cannot use invalid "objectMode" with stdout, webTransforms', testInvalidBinary, 1, 'objectMode', 'webTransform', execa);
test('Cannot use invalid "objectMode" with stderr, webTransforms', testInvalidBinary, 2, 'objectMode', 'webTransform', execa);
test('Cannot use invalid "objectMode" with stdio[*], webTransforms', testInvalidBinary, 3, 'objectMode', 'webTransform', execa);
