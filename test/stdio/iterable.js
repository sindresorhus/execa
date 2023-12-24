import {once} from 'node:events';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdinOption, getStdoutOption, getStderrOption, getStdioOption} from '../helpers/stdio.js';
import {stringGenerator, binaryGenerator, asyncGenerator, throwingGenerator, infiniteGenerator} from '../helpers/generator.js';

setFixtureDir();

const testIterable = async (t, stdioOption, fixtureName, getOptions) => {
	const {stdout} = await execa(fixtureName, getOptions(stdioOption));
	t.is(stdout, 'foobar');
};

test('stdin option can be an iterable of strings', testIterable, stringGenerator(), 'stdin.js', getStdinOption);
test('stdio[*] option can be an iterable of strings', testIterable, stringGenerator(), 'stdin-fd3.js', getStdioOption);
test('stdin option can be an iterable of Uint8Arrays', testIterable, binaryGenerator(), 'stdin.js', getStdinOption);
test('stdio[*] option can be an iterable of Uint8Arrays', testIterable, binaryGenerator(), 'stdin-fd3.js', getStdioOption);
test('stdin option can be an async iterable', testIterable, asyncGenerator(), 'stdin.js', getStdinOption);
test('stdio[*] option can be an async iterable', testIterable, asyncGenerator(), 'stdin-fd3.js', getStdioOption);

const testIterableSync = (t, stdioOption, fixtureName, getOptions) => {
	t.throws(() => {
		execaSync(fixtureName, getOptions(stdioOption));
	}, {message: /an iterable in sync mode/});
};

test('stdin option cannot be a sync iterable - sync', testIterableSync, stringGenerator(), 'stdin.js', getStdinOption);
test('stdio[*] option cannot be a sync iterable - sync', testIterableSync, stringGenerator(), 'stdin-fd3.js', getStdioOption);
test('stdin option cannot be an async iterable - sync', testIterableSync, asyncGenerator(), 'stdin.js', getStdinOption);
test('stdio[*] option cannot be an async iterable - sync', testIterableSync, asyncGenerator(), 'stdin-fd3.js', getStdioOption);

const testIterableError = async (t, fixtureName, getOptions) => {
	const {originalMessage} = await t.throwsAsync(execa(fixtureName, getOptions(throwingGenerator())));
	t.is(originalMessage, 'generator error');
};

test('stdin option handles errors in iterables', testIterableError, 'stdin.js', getStdinOption);
test('stdio[*] option handles errors in iterables', testIterableError, 'stdin-fd3.js', getStdioOption);

const testNoIterableOutput = (t, getOptions, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', getOptions(stringGenerator()));
	}, {message: /cannot be an iterable/});
};

test('stdout option cannot be an iterable', testNoIterableOutput, getStdoutOption, execa);
test('stderr option cannot be an iterable', testNoIterableOutput, getStderrOption, execa);
test('stdout option cannot be an iterable - sync', testNoIterableOutput, getStdoutOption, execaSync);
test('stderr option cannot be an iterable - sync', testNoIterableOutput, getStderrOption, execaSync);

test('stdin option can be an infinite iterable', async t => {
	const {iterable, abort} = infiniteGenerator();
	try {
		const childProcess = execa('stdin.js', getStdinOption(iterable));
		const stdout = await once(childProcess.stdout, 'data');
		t.is(stdout.toString(), 'foo');
		childProcess.kill('SIGKILL');
		await t.throwsAsync(childProcess, {message: /SIGKILL/});
	} finally {
		abort();
	}
});
