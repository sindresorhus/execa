import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {noopGenerator, uppercaseGenerator} from '../helpers/generator.js';
import {uppercaseBufferDuplex} from '../helpers/duplex.js';
import {uppercaseBufferWebTransform} from '../helpers/web-transform.js';
import {generatorsMap} from '../helpers/map.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const testInvalidGenerator = (t, fdNumber, stdioOption) => {
	t.throws(() => {
		execa('empty.js', getStdio(fdNumber, {...noopGenerator(), ...stdioOption}));
	}, {message: 'final' in stdioOption ? /must be a generator/ : /must be a generator, a Duplex stream or a web TransformStream/});
};

test('Cannot use invalid "transform" with stdin', testInvalidGenerator, 0, {transform: true});
test('Cannot use invalid "transform" with stdout', testInvalidGenerator, 1, {transform: true});
test('Cannot use invalid "transform" with stderr', testInvalidGenerator, 2, {transform: true});
test('Cannot use invalid "transform" with stdio[*]', testInvalidGenerator, 3, {transform: true});
test('Cannot use invalid "final" with stdin', testInvalidGenerator, 0, {final: true});
test('Cannot use invalid "final" with stdout', testInvalidGenerator, 1, {final: true});
test('Cannot use invalid "final" with stderr', testInvalidGenerator, 2, {final: true});
test('Cannot use invalid "final" with stdio[*]', testInvalidGenerator, 3, {final: true});

const testInvalidBinary = (t, fdNumber, optionName, type) => {
	t.throws(() => {
		execa('empty.js', getStdio(fdNumber, {...generatorsMap[type].uppercase(), [optionName]: 'true'}));
	}, {message: /a boolean/});
};

test('Cannot use invalid "binary" with stdin', testInvalidBinary, 0, 'binary', 'generator');
test('Cannot use invalid "binary" with stdout', testInvalidBinary, 1, 'binary', 'generator');
test('Cannot use invalid "binary" with stderr', testInvalidBinary, 2, 'binary', 'generator');
test('Cannot use invalid "binary" with stdio[*]', testInvalidBinary, 3, 'binary', 'generator');
test('Cannot use invalid "objectMode" with stdin, generators', testInvalidBinary, 0, 'objectMode', 'generator');
test('Cannot use invalid "objectMode" with stdout, generators', testInvalidBinary, 1, 'objectMode', 'generator');
test('Cannot use invalid "objectMode" with stderr, generators', testInvalidBinary, 2, 'objectMode', 'generator');
test('Cannot use invalid "objectMode" with stdio[*], generators', testInvalidBinary, 3, 'objectMode', 'generator');
test('Cannot use invalid "objectMode" with stdin, duplexes', testInvalidBinary, 0, 'objectMode', 'duplex');
test('Cannot use invalid "objectMode" with stdout, duplexes', testInvalidBinary, 1, 'objectMode', 'duplex');
test('Cannot use invalid "objectMode" with stderr, duplexes', testInvalidBinary, 2, 'objectMode', 'duplex');
test('Cannot use invalid "objectMode" with stdio[*], duplexes', testInvalidBinary, 3, 'objectMode', 'duplex');
test('Cannot use invalid "objectMode" with stdin, webTransforms', testInvalidBinary, 0, 'objectMode', 'webTransform');
test('Cannot use invalid "objectMode" with stdout, webTransforms', testInvalidBinary, 1, 'objectMode', 'webTransform');
test('Cannot use invalid "objectMode" with stderr, webTransforms', testInvalidBinary, 2, 'objectMode', 'webTransform');
test('Cannot use invalid "objectMode" with stdio[*], webTransforms', testInvalidBinary, 3, 'objectMode', 'webTransform');

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

const testSyncMethodsGenerator = (t, fdNumber) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(fdNumber, uppercaseGenerator()));
	}, {message: /cannot be a generator/});
};

test('Cannot use generators with sync methods and stdin', testSyncMethodsGenerator, 0);
test('Cannot use generators with sync methods and stdout', testSyncMethodsGenerator, 1);
test('Cannot use generators with sync methods and stderr', testSyncMethodsGenerator, 2);
test('Cannot use generators with sync methods and stdio[*]', testSyncMethodsGenerator, 3);

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
