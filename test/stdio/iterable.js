import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdinOption, getStdoutOption, getStderrOption} from '../helpers/stdio.js';

setFixtureDir();

const textEncoder = new TextEncoder();
const binaryFoo = textEncoder.encode('foo');
const binaryBar = textEncoder.encode('bar');

const stringGenerator = function * () {
	yield * ['foo', 'bar'];
};

const binaryGenerator = function * () {
	yield * [binaryFoo, binaryBar];
};

// eslint-disable-next-line require-yield
const throwingGenerator = function * () {
	throw new Error('generator error');
};

const testIterable = async (t, stdioOption, fixtureName, getOptions) => {
	const {stdout} = await execa(fixtureName, getOptions(stdioOption));
	t.is(stdout, 'foobar');
};

test('stdin option can be a sync iterable of strings', testIterable, ['foo', 'bar'], 'stdin.js', getStdinOption);
test('stdin option can be a sync iterable of Uint8Arrays', testIterable, [binaryFoo, binaryBar], 'stdin.js', getStdinOption);
test('stdin option can be an sync iterable of strings', testIterable, stringGenerator(), 'stdin.js', getStdinOption);
test('stdin option can be an sync iterable of Uint8Arrays', testIterable, binaryGenerator(), 'stdin.js', getStdinOption);

const testIterableSync = (t, stdioOption, fixtureName, getOptions) => {
	t.throws(() => {
		execaSync(fixtureName, getOptions(stdioOption));
	}, {message: /an iterable in sync mode/});
};

test('stdin option cannot be a sync iterable - sync', testIterableSync, ['foo', 'bar'], 'stdin.js', getStdinOption);
test('stdin option cannot be an async iterable - sync', testIterableSync, stringGenerator(), 'stdin.js', getStdinOption);

const testIterableError = async (t, fixtureName, getOptions) => {
	const {originalMessage} = await t.throwsAsync(execa(fixtureName, getOptions(throwingGenerator())));
	t.is(originalMessage, 'generator error');
};

test('stdin option handles errors in iterables', testIterableError, 'stdin.js', getStdinOption);

const testNoIterableOutput = (t, getOptions, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', getOptions(['foo', 'bar']));
	}, {message: /cannot be an iterable/});
};

test('stdout option cannot be an iterable', testNoIterableOutput, getStdoutOption, execa);
test('stderr option cannot be an iterable', testNoIterableOutput, getStderrOption, execa);
test('stdout option cannot be an iterable - sync', testNoIterableOutput, getStdoutOption, execaSync);
test('stderr option cannot be an iterable - sync', testNoIterableOutput, getStderrOption, execaSync);
