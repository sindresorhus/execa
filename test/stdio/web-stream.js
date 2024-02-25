import {Readable} from 'node:stream';
import {setImmediate} from 'node:timers/promises';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';

setFixtureDir();

const testReadableStream = async (t, fdNumber) => {
	const readableStream = Readable.toWeb(Readable.from('foobar'));
	const {stdout} = await execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, readableStream));
	t.is(stdout, 'foobar');
};

test('stdin can be a ReadableStream', testReadableStream, 0);
test('stdio[*] can be a ReadableStream', testReadableStream, 3);

const testWritableStream = async (t, fdNumber) => {
	const result = [];
	const writableStream = new WritableStream({
		write(chunk) {
			result.push(chunk);
		},
	});
	await execa('noop-fd.js', [`${fdNumber}`, 'foobar'], getStdio(fdNumber, writableStream));
	t.is(result.join(''), 'foobar');
};

test('stdout can be a WritableStream', testWritableStream, 1);
test('stderr can be a WritableStream', testWritableStream, 2);
test('stdio[*] can be a WritableStream', testWritableStream, 3);

const testWebStreamSync = (t, StreamClass, fdNumber, optionName) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(fdNumber, new StreamClass()));
	}, {message: `The \`${optionName}\` option cannot be a web stream in sync mode.`});
};

test('stdin cannot be a ReadableStream - sync', testWebStreamSync, ReadableStream, 0, 'stdin');
test('stdio[*] cannot be a ReadableStream - sync', testWebStreamSync, ReadableStream, 3, 'stdio[3]');
test('stdout cannot be a WritableStream - sync', testWebStreamSync, WritableStream, 1, 'stdout');
test('stderr cannot be a WritableStream - sync', testWebStreamSync, WritableStream, 2, 'stderr');
test('stdio[*] cannot be a WritableStream - sync', testWebStreamSync, WritableStream, 3, 'stdio[3]');

const testLongWritableStream = async (t, fdNumber) => {
	let result = false;
	const writableStream = new WritableStream({
		async close() {
			await setImmediate();
			result = true;
		},
	});
	await execa('empty.js', getStdio(fdNumber, writableStream));
	t.true(result);
};

test('stdout waits for WritableStream completion', testLongWritableStream, 1);
test('stderr waits for WritableStream completion', testLongWritableStream, 2);
test('stdio[*] waits for WritableStream completion', testLongWritableStream, 3);

const testWritableStreamError = async (t, fdNumber) => {
	const error = new Error('foobar');
	const writableStream = new WritableStream({
		start(controller) {
			controller.error(error);
		},
	});
	const thrownError = await t.throwsAsync(execa('noop.js', getStdio(fdNumber, writableStream)));
	t.is(thrownError, error);
};

test('stdout option handles errors in WritableStream', testWritableStreamError, 1);
test('stderr option handles errors in WritableStream', testWritableStreamError, 2);
test('stdio[*] option handles errors in WritableStream', testWritableStreamError, 3);

const testReadableStreamError = async (t, fdNumber) => {
	const error = new Error('foobar');
	const readableStream = new ReadableStream({
		start(controller) {
			controller.error(error);
		},
	});
	const thrownError = await t.throwsAsync(execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, readableStream)));
	t.is(thrownError, error);
};

test('stdin option handles errors in ReadableStream', testReadableStreamError, 0);
test('stdio[*] option handles errors in ReadableStream', testReadableStreamError, 3);

test('ReadableStream with stdin is canceled on process exit', async t => {
	let readableStream;
	const promise = new Promise(resolve => {
		readableStream = new ReadableStream({cancel: resolve});
	});
	await t.throwsAsync(execa('stdin.js', {stdin: readableStream, timeout: 1}), {message: /timed out/});
	await promise;
});
