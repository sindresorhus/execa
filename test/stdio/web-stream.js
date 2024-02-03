import {Readable} from 'node:stream';
import {setImmediate} from 'node:timers/promises';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';

setFixtureDir();

const testReadableStream = async (t, index) => {
	const readableStream = Readable.toWeb(Readable.from('foobar'));
	const {stdout} = await execa('stdin-fd.js', [`${index}`], getStdio(index, readableStream));
	t.is(stdout, 'foobar');
};

test('stdin can be a ReadableStream', testReadableStream, 0);
test('stdio[*] can be a ReadableStream', testReadableStream, 3);

const testWritableStream = async (t, index) => {
	const result = [];
	const writableStream = new WritableStream({
		write(chunk) {
			result.push(chunk);
		},
	});
	await execa('noop-fd.js', [`${index}`, 'foobar'], getStdio(index, writableStream));
	t.is(result.join(''), 'foobar');
};

test('stdout can be a WritableStream', testWritableStream, 1);
test('stderr can be a WritableStream', testWritableStream, 2);
test('stdio[*] can be a WritableStream', testWritableStream, 3);

const testWebStreamSync = (t, StreamClass, index, optionName) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(index, new StreamClass()));
	}, {message: `The \`${optionName}\` option cannot be a web stream in sync mode.`});
};

test('stdin cannot be a ReadableStream - sync', testWebStreamSync, ReadableStream, 0, 'stdin');
test('stdio[*] cannot be a ReadableStream - sync', testWebStreamSync, ReadableStream, 3, 'stdio[3]');
test('stdout cannot be a WritableStream - sync', testWebStreamSync, WritableStream, 1, 'stdout');
test('stderr cannot be a WritableStream - sync', testWebStreamSync, WritableStream, 2, 'stderr');
test('stdio[*] cannot be a WritableStream - sync', testWebStreamSync, WritableStream, 3, 'stdio[3]');

const testLongWritableStream = async (t, index) => {
	let result = false;
	const writableStream = new WritableStream({
		async close() {
			await setImmediate();
			result = true;
		},
	});
	await execa('empty.js', getStdio(index, writableStream));
	t.true(result);
};

test('stdout waits for WritableStream completion', testLongWritableStream, 1);
test('stderr waits for WritableStream completion', testLongWritableStream, 2);
test('stdio[*] waits for WritableStream completion', testLongWritableStream, 3);

const testWritableStreamError = async (t, index) => {
	const error = new Error('foobar');
	const writableStream = new WritableStream({
		start(controller) {
			controller.error(error);
		},
	});
	const thrownError = await t.throwsAsync(execa('noop.js', getStdio(index, writableStream)));
	t.is(thrownError, error);
};

test('stdout option handles errors in WritableStream', testWritableStreamError, 1);
test('stderr option handles errors in WritableStream', testWritableStreamError, 2);
test('stdio[*] option handles errors in WritableStream', testWritableStreamError, 3);

const testReadableStreamError = async (t, index) => {
	const error = new Error('foobar');
	const readableStream = new ReadableStream({
		start(controller) {
			controller.error(error);
		},
	});
	const thrownError = await t.throwsAsync(execa('stdin-fd.js', [`${index}`], getStdio(index, readableStream)));
	t.is(thrownError, error);
};

test('stdin option handles errors in ReadableStream', testReadableStreamError, 0);
test('stdio[*] option handles errors in ReadableStream', testReadableStreamError, 3);
