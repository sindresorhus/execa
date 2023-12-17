import {once} from 'node:events';
import {createReadStream, createWriteStream} from 'node:fs';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {Readable, Writable, PassThrough} from 'node:stream';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdinOption, getStdoutOption, getStderrOption, getInputOption} from '../helpers/stdio.js';

setFixtureDir();

const createNoFileReadable = value => {
	const stream = new PassThrough();
	stream.write(value);
	stream.end();
	return stream;
};

const testNodeStreamSync = (t, StreamClass, getOptions, optionName) => {
	t.throws(() => {
		execaSync('noop.js', getOptions(new StreamClass()));
	}, {message: `The \`${optionName}\` option cannot be a Node.js stream in sync mode.`});
};

test('input cannot be a Node.js Readable - sync', testNodeStreamSync, Readable, getInputOption, 'input');

test('input can be a Node.js Readable without a file descriptor', async t => {
	const {stdout} = await execa('stdin.js', {input: createNoFileReadable('foobar')});
	t.is(stdout, 'foobar');
});

const testNoFileStream = async (t, getOptions, StreamClass) => {
	await t.throwsAsync(execa('noop.js', getOptions(new StreamClass())), {code: 'ERR_INVALID_ARG_VALUE'});
};

test('stdin cannot be a Node.js Readable without a file descriptor', testNoFileStream, getStdinOption, Readable);
test('stdout cannot be a Node.js Writable without a file descriptor', testNoFileStream, getStdoutOption, Writable);
test('stderr cannot be a Node.js Writable without a file descriptor', testNoFileStream, getStderrOption, Writable);

const testFileReadable = async (t, fixtureName, getOptions) => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const stream = createReadStream(filePath);
	await once(stream, 'open');

	const {stdout} = await execa(fixtureName, getOptions(stream));
	t.is(stdout, 'foobar');

	await rm(filePath);
};

test('input can be a Node.js Readable with a file descriptor', testFileReadable, 'stdin.js', getInputOption);
test('stdin can be a Node.js Readable with a file descriptor', testFileReadable, 'stdin.js', getStdinOption);

const testFileWritable = async (t, getOptions, fixtureName) => {
	const filePath = tempfile();
	const stream = createWriteStream(filePath);
	await once(stream, 'open');

	await execa(fixtureName, ['foobar'], getOptions(stream));
	t.is(await readFile(filePath, 'utf8'), 'foobar\n');

	await rm(filePath);
};

test('stdout can be a Node.js Writable with a file descriptor', testFileWritable, getStdoutOption, 'noop.js');
test('stderr can be a Node.js Writable with a file descriptor', testFileWritable, getStderrOption, 'noop-err.js');
