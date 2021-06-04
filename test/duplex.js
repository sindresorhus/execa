import path from 'path';
import test from 'ava';
import execa from '..';
import stream from 'stream';
import {promisify} from 'util';

const pipeline = promisify(stream.pipeline);

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

function makeCollector() {
	const chunks = [];
	const writableStream = new stream.Writable({
		write(chunk, encoding, callback) {
			chunks.push(chunk);
			callback();
		},
		final(callback) {
			callback();
		}
	});
	writableStream.collect = () => Buffer.concat(chunks).toString('utf-8');
	return writableStream;
}

function makeEmptyReadableStream() {
	return new stream.Readable({
		read() {}
	});
}

function createReadableStream(data) {
	return new stream.Readable({
		read() {
			this.push(data);
			this.push(null);
		}
	});
}

test('simple pipeline', async t => {
	const duplex = execa.duplexStream('stdin');
	const collector = makeCollector();
	t.is(await pipeline(createReadableStream('hello, world'), duplex, collector), undefined);
	t.is(collector.collect(), 'hello, world');
});

test('command failure should result in pipeline failure', async t => {
	const duplex = execa.duplexStream('fail');
	const error = await t.throwsAsync(pipeline(makeEmptyReadableStream(), duplex, makeCollector()));
	t.is(error.exitCode, 2);
});

test('pipeline failure should kill the process', async t => {
	const duplex = execa.duplexStream('forever');
	const failingStream = makeEmptyReadableStream();
	failingStream.destroy(new Error('oops'));
	const {message} = await t.throwsAsync(pipeline(failingStream, duplex, makeCollector()));
	t.is(message, 'oops');
});

test('invalid arguments should result in an invalid read stream', async t => {
	const duplex = execa.duplexStream('noop', {uid: -1});
	const {failed} = await t.throwsAsync(pipeline(duplex, makeCollector()));
	t.true(failed);
});

test('invalid arguments should result in an invalid write stream', async t => {
	const duplex = execa.duplexStream('noop', {uid: -1});
	const {failed} = await t.throwsAsync(pipeline(createReadableStream('hello'), duplex));
	t.true(failed);
});

test('all', async t => {
	const collector = makeCollector();
	await pipeline(createReadableStream(Buffer.alloc(0)), execa.duplexStream('noop-132', {all: true}), collector);
	t.is(collector.collect(), '132');
});

test('we should get all output even with non-zero exit code', async t => {
	const collector = makeCollector();
	const {failed} = await t.throwsAsync(pipeline(execa.duplexStream('echo-fail'), collector));
	t.true(failed);
	t.is(collector.collect(), 'stdout\n');
});

test('timeout', async t => {
	const collector = makeCollector();
	const {failed, timedOut} = await t.throwsAsync(pipeline(execa.duplexStream('noop', {timeout: 1}), collector));
	t.is(timedOut, true);
	t.is(failed, true);
});
