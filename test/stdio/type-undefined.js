import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {uppercaseGenerator} from '../helpers/generator.js';
import {uppercaseBufferDuplex} from '../helpers/duplex.js';
import {uppercaseBufferWebTransform} from '../helpers/web-transform.js';
import {generatorsMap} from '../helpers/map.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

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
