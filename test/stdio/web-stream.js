import {Readable} from 'node:stream';
import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdinOption, getStdoutOption, getStderrOption, getStdioOption} from '../helpers/stdio.js';

setFixtureDir();

const testReadableStream = async (t, fixtureName, getOptions) => {
	const readableStream = Readable.toWeb(Readable.from('foobar'));
	const {stdout} = await execa(fixtureName, getOptions(readableStream));
	t.is(stdout, 'foobar');
};

test('stdin can be a ReadableStream', testReadableStream, 'stdin.js', getStdinOption);
test('stdio[*] can be a ReadableStream', testReadableStream, 'stdin-fd3.js', getStdioOption);

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
test('stdio[*] can be a WritableStream', testWritableStream, 'noop-fd3.js', getStdioOption);

const testWebStreamSync = (t, StreamClass, getOptions, optionName) => {
	t.throws(() => {
		execaSync('noop.js', getOptions(new StreamClass()));
	}, {message: `The \`${optionName}\` option cannot be a web stream in sync mode.`});
};

test('stdin cannot be a ReadableStream - sync', testWebStreamSync, ReadableStream, getStdinOption, 'stdin');
test('stdio[*] cannot be a ReadableStream - sync', testWebStreamSync, ReadableStream, getStdioOption, 'stdio[3]');
test('stdout cannot be a WritableStream - sync', testWebStreamSync, WritableStream, getStdoutOption, 'stdout');
test('stderr cannot be a WritableStream - sync', testWebStreamSync, WritableStream, getStderrOption, 'stderr');
test('stdio[*] cannot be a WritableStream - sync', testWebStreamSync, WritableStream, getStdioOption, 'stdio[3]');

const testLongWritableStream = async (t, getOptions) => {
	let result = false;
	const writableStream = new WritableStream({
		async close() {
			await setTimeout(0);
			result = true;
		},
	});
	await execa('empty.js', getOptions(writableStream));
	t.true(result);
};

test('stdout waits for WritableStream completion', testLongWritableStream, getStdoutOption);
test('stderr waits for WritableStream completion', testLongWritableStream, getStderrOption);
test('stdio[*] waits for WritableStream completion', testLongWritableStream, getStdioOption);

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
test('stdio[*] option handles errors in WritableStream', testWritableStreamError, getStdioOption);
