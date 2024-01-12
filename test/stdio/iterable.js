import {once} from 'node:events';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {stringGenerator, binaryGenerator, asyncGenerator, throwingGenerator, infiniteGenerator} from '../helpers/generator.js';

setFixtureDir();

const testIterable = async (t, stdioOption, index) => {
	const {stdout} = await execa('stdin-fd.js', [`${index}`], getStdio(index, stdioOption));
	t.is(stdout, 'foobar');
};

test('stdin option can be an iterable of strings', testIterable, stringGenerator(), 0);
test('stdio[*] option can be an iterable of strings', testIterable, stringGenerator(), 3);
test('stdin option can be an iterable of Uint8Arrays', testIterable, binaryGenerator(), 0);
test('stdio[*] option can be an iterable of Uint8Arrays', testIterable, binaryGenerator(), 3);
test('stdin option can be an async iterable', testIterable, asyncGenerator(), 0);
test('stdio[*] option can be an async iterable', testIterable, asyncGenerator(), 3);

const testIterableSync = (t, stdioOption, index) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(index, stdioOption));
	}, {message: /an iterable in sync mode/});
};

test('stdin option cannot be a sync iterable - sync', testIterableSync, stringGenerator(), 0);
test('stdio[*] option cannot be a sync iterable - sync', testIterableSync, stringGenerator(), 3);
test('stdin option cannot be an async iterable - sync', testIterableSync, asyncGenerator(), 0);
test('stdio[*] option cannot be an async iterable - sync', testIterableSync, asyncGenerator(), 3);

const testIterableError = async (t, index) => {
	const {originalMessage} = await t.throwsAsync(execa('stdin-fd.js', [`${index}`], getStdio(index, throwingGenerator())));
	t.is(originalMessage, 'generator error');
};

test('stdin option handles errors in iterables', testIterableError, 0);
test('stdio[*] option handles errors in iterables', testIterableError, 3);

const testNoIterableOutput = (t, index, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(index, stringGenerator()));
	}, {message: /cannot be an iterable/});
};

test('stdout option cannot be an iterable', testNoIterableOutput, 1, execa);
test('stderr option cannot be an iterable', testNoIterableOutput, 2, execa);
test('stdout option cannot be an iterable - sync', testNoIterableOutput, 1, execaSync);
test('stderr option cannot be an iterable - sync', testNoIterableOutput, 2, execaSync);

test('stdin option can be an infinite iterable', async t => {
	const {iterable, abort} = infiniteGenerator();
	try {
		const childProcess = execa('stdin.js', getStdio(0, iterable));
		const stdout = await once(childProcess.stdout, 'data');
		t.is(stdout.toString(), 'foo');
		childProcess.kill('SIGKILL');
		await t.throwsAsync(childProcess, {message: /SIGKILL/});
	} finally {
		abort();
	}
});

const testMultipleIterable = async (t, index) => {
	const {stdout} = await execa('stdin-fd.js', [`${index}`], getStdio(index, [stringGenerator(), asyncGenerator()]));
	t.is(stdout, 'foobarfoobar');
};

test('stdin option can be multiple iterables', testMultipleIterable, 0);
test('stdio[*] option can be multiple iterables', testMultipleIterable, 3);
