import {Readable} from 'node:stream';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdinOption, getStdoutOption, getStderrOption} from '../helpers/stdio.js';

setFixtureDir();

const testReadableStream = async (t, fixtureName, getOptions) => {
	const readableStream = Readable.toWeb(Readable.from('foobar'));
	const {stdout} = await execa(fixtureName, getOptions(readableStream));
	t.is(stdout, 'foobar');
};

test('stdin can be a ReadableStream', testReadableStream, 'stdin.js', getStdinOption);

const testWritableStream = async (t, fixtureName, getOptions) => {
	const result = [];
	const writableStream = new WritableStream({
		write(chunk) {
			result.push(chunk);
		},
	});
	await execa(fixtureName, ['foobar'], getOptions(writableStream));
	t.is(result.join(''), 'foobar\n');
};

test('stdout can be a WritableStream', testWritableStream, 'noop.js', getStdoutOption);
test('stderr can be a WritableStream', testWritableStream, 'noop-err.js', getStderrOption);

const testWebStreamSync = (t, StreamClass, getOptions, optionName) => {
	t.throws(() => {
		execaSync('noop.js', getOptions(new StreamClass()));
	}, {message: `The \`${optionName}\` option cannot be a web stream in sync mode.`});
};

test('stdin cannot be a ReadableStream - sync', testWebStreamSync, ReadableStream, getStdinOption, 'stdin');
test('stdout cannot be a WritableStream - sync', testWebStreamSync, WritableStream, getStdoutOption, 'stdout');
test('stderr cannot be a WritableStream - sync', testWebStreamSync, WritableStream, getStderrOption, 'stderr');

const testWritableStreamError = async (t, getOptions) => {
	const writableStream = new WritableStream({
		start(controller) {
			controller.error(new Error('foobar'));
		},
	});
	const {originalMessage} = await t.throwsAsync(execa('noop.js', getOptions(writableStream)));
	t.is(originalMessage, 'foobar');
};

test('stdout option handles errors in WritableStream', testWritableStreamError, getStdoutOption);
test('stderr option handles errors in WritableStream', testWritableStreamError, getStderrOption);
