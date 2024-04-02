import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {noopGenerator, uppercaseGenerator} from '../helpers/generator.js';
import {uppercaseBufferDuplex} from '../helpers/duplex.js';
import {uppercaseBufferWebTransform} from '../helpers/web-transform.js';
import {generatorsMap} from '../helpers/map.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

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

// eslint-disable-next-line max-params
const testUndefinedOption = (t, fdNumber, optionName, type, optionValue) => {
	t.throws(() => {
		execa('empty.js', getStdio(fdNumber, {...generatorsMap[type].uppercase(), [optionName]: optionValue}));
	}, {message: /can only be defined when using a generator/});
};

test('Cannot use "binary" with duplexes and stdin', testUndefinedOption, 0, 'binary', 'duplex', true);
test('Cannot use "binary" with duplexes and stdout', testUndefinedOption, 1, 'binary', 'duplex', true);
test('Cannot use "binary" with duplexes and stderr', testUndefinedOption, 2, 'binary', 'duplex', true);
test('Cannot use "binary" with duplexes and stdio[*]', testUndefinedOption, 3, 'binary', 'duplex', true);
test('Cannot use "final" with duplexes and stdin', testUndefinedOption, 0, 'final', 'duplex', uppercaseBufferDuplex().transform);
test('Cannot use "final" with duplexes and stdout', testUndefinedOption, 1, 'final', 'duplex', uppercaseBufferDuplex().transform);
test('Cannot use "final" with duplexes and stderr', testUndefinedOption, 2, 'final', 'duplex', uppercaseBufferDuplex().transform);
test('Cannot use "final" with duplexes and stdio[*]', testUndefinedOption, 3, 'final', 'duplex', uppercaseBufferDuplex().transform);
test('Cannot use "binary" with webTransforms and stdin', testUndefinedOption, 0, 'binary', 'webTransform', true);
test('Cannot use "binary" with webTransforms and stdout', testUndefinedOption, 1, 'binary', 'webTransform', true);
test('Cannot use "binary" with webTransforms and stderr', testUndefinedOption, 2, 'binary', 'webTransform', true);
test('Cannot use "binary" with webTransforms and stdio[*]', testUndefinedOption, 3, 'binary', 'webTransform', true);
test('Cannot use "final" with webTransforms and stdin', testUndefinedOption, 0, 'final', 'webTransform', uppercaseBufferWebTransform().transform);
test('Cannot use "final" with webTransforms and stdout', testUndefinedOption, 1, 'final', 'webTransform', uppercaseBufferWebTransform().transform);
test('Cannot use "final" with webTransforms and stderr', testUndefinedOption, 2, 'final', 'webTransform', uppercaseBufferWebTransform().transform);
test('Cannot use "final" with webTransforms and stdio[*]', testUndefinedOption, 3, 'final', 'webTransform', uppercaseBufferWebTransform().transform);

const testUndefinedFinal = (t, fdNumber, type, useTransform) => {
	t.throws(() => {
		execa('empty.js', getStdio(fdNumber, {
			transform: useTransform ? uppercaseGenerator().transform : undefined,
			final: generatorsMap[type].uppercase().transform,
		}));
	}, {message: type === 'duplex' ? /must not be a Duplex/ : /must not be a web TransformStream/});
};

test('Cannot use "final" with duplexes and stdin, without transform', testUndefinedFinal, 0, 'duplex', false);
test('Cannot use "final" with duplexes and stdout, without transform', testUndefinedFinal, 1, 'duplex', false);
test('Cannot use "final" with duplexes and stderr, without transform', testUndefinedFinal, 2, 'duplex', false);
test('Cannot use "final" with duplexes and stdio[*], without transform', testUndefinedFinal, 3, 'duplex', false);
test('Cannot use "final" with duplexes and stdin, with transform', testUndefinedFinal, 0, 'duplex', true);
test('Cannot use "final" with duplexes and stdout, with transform', testUndefinedFinal, 1, 'duplex', true);
test('Cannot use "final" with duplexes and stderr, with transform', testUndefinedFinal, 2, 'duplex', true);
test('Cannot use "final" with duplexes and stdio[*], with transform', testUndefinedFinal, 3, 'duplex', true);
test('Cannot use "final" with webTransforms and stdin, without transform', testUndefinedFinal, 0, 'webTransform', false);
test('Cannot use "final" with webTransforms and stdout, without transform', testUndefinedFinal, 1, 'webTransform', false);
test('Cannot use "final" with webTransforms and stderr, without transform', testUndefinedFinal, 2, 'webTransform', false);
test('Cannot use "final" with webTransforms and stdio[*], without transform', testUndefinedFinal, 3, 'webTransform', false);
test('Cannot use "final" with webTransforms and stdin, with transform', testUndefinedFinal, 0, 'webTransform', true);
test('Cannot use "final" with webTransforms and stdout, with transform', testUndefinedFinal, 1, 'webTransform', true);
test('Cannot use "final" with webTransforms and stderr, with transform', testUndefinedFinal, 2, 'webTransform', true);
test('Cannot use "final" with webTransforms and stdio[*], with transform', testUndefinedFinal, 3, 'webTransform', true);

const testSyncMethodsDuplex = (t, fdNumber, type) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(fdNumber, generatorsMap[type].uppercase()));
	}, {message: type === 'duplex' ? /cannot be a Duplex stream/ : /cannot be a web TransformStream/});
};

test('Cannot use duplexes with sync methods and stdin', testSyncMethodsDuplex, 0, 'duplex');
test('Cannot use duplexes with sync methods and stdout', testSyncMethodsDuplex, 1, 'duplex');
test('Cannot use duplexes with sync methods and stderr', testSyncMethodsDuplex, 2, 'duplex');
test('Cannot use duplexes with sync methods and stdio[*]', testSyncMethodsDuplex, 3, 'duplex');
test('Cannot use webTransforms with sync methods and stdin', testSyncMethodsDuplex, 0, 'webTransform');
test('Cannot use webTransforms with sync methods and stdout', testSyncMethodsDuplex, 1, 'webTransform');
test('Cannot use webTransforms with sync methods and stderr', testSyncMethodsDuplex, 2, 'webTransform');
test('Cannot use webTransforms with sync methods and stdio[*]', testSyncMethodsDuplex, 3, 'webTransform');
