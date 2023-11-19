import {Buffer} from 'node:buffer';
import {exec} from 'node:child_process';
import process from 'node:process';
import {once} from 'node:events';
import fs from 'node:fs';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {relative} from 'node:path';
import Stream from 'node:stream';
import {setTimeout} from 'node:timers/promises';
import {promisify} from 'node:util';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import getStream from 'get-stream';
import {pEvent} from 'p-event';
import tempfile from 'tempfile';
import {execa, execaSync, $} from '../index.js';
import {setFixtureDir, FIXTURES_DIR} from './helpers/fixtures-dir.js';

const pExec = promisify(exec);

setFixtureDir();

const nonFileUrl = new URL('https://example.com');

test('buffer', async t => {
	const {stdout} = await execa('noop.js', ['foo'], {encoding: null});
	t.true(Buffer.isBuffer(stdout));
	t.is(stdout.toString(), 'foo');
});

const checkEncoding = async (t, encoding) => {
	const {stdout} = await execa('noop-no-newline.js', [STRING_TO_ENCODE], {encoding});
	t.is(stdout, BUFFER_TO_ENCODE.toString(encoding));

	const {stdout: nativeStdout} = await pExec(`node noop-no-newline.js ${STRING_TO_ENCODE}`, {encoding, cwd: FIXTURES_DIR});
	t.is(stdout, nativeStdout);
};

// This string gives different outputs with each encoding type
const STRING_TO_ENCODE = '\u1000.';
const BUFFER_TO_ENCODE = Buffer.from(STRING_TO_ENCODE);

test('can pass encoding "utf8"', checkEncoding, 'utf8');
test('can pass encoding "utf-8"', checkEncoding, 'utf8');
test('can pass encoding "utf16le"', checkEncoding, 'utf16le');
test('can pass encoding "utf-16le"', checkEncoding, 'utf16le');
test('can pass encoding "ucs2"', checkEncoding, 'utf16le');
test('can pass encoding "ucs-2"', checkEncoding, 'utf16le');
test('can pass encoding "latin1"', checkEncoding, 'latin1');
test('can pass encoding "binary"', checkEncoding, 'latin1');
test('can pass encoding "ascii"', checkEncoding, 'ascii');
test('can pass encoding "hex"', checkEncoding, 'hex');
test('can pass encoding "base64"', checkEncoding, 'base64');
test('can pass encoding "base64url"', checkEncoding, 'base64url');

const checkBufferEncoding = async (t, encoding) => {
	const {stdout} = await execa('noop-no-newline.js', [STRING_TO_ENCODE], {encoding});
	t.true(BUFFER_TO_ENCODE.equals(stdout));

	const {stdout: nativeStdout} = await pExec(`node noop-no-newline.js ${STRING_TO_ENCODE}`, {encoding, cwd: FIXTURES_DIR});
	t.true(BUFFER_TO_ENCODE.equals(nativeStdout));
};

test('can pass encoding "buffer"', checkBufferEncoding, 'buffer');

test('validate unknown encodings', async t => {
	await t.throwsAsync(execa('noop.js', {encoding: 'unknownEncoding'}), {code: 'ERR_UNKNOWN_ENCODING'});
});

test('pass `stdout` to a file descriptor', async t => {
	const file = tempfile({extension: '.txt'});
	await execa('noop.js', ['foo bar'], {stdout: fs.openSync(file, 'w')});
	t.is(fs.readFileSync(file, 'utf8'), 'foo bar\n');
});

test('pass `stderr` to a file descriptor', async t => {
	const file = tempfile({extension: '.txt'});
	await execa('noop-err.js', ['foo bar'], {stderr: fs.openSync(file, 'w')});
	t.is(fs.readFileSync(file, 'utf8'), 'foo bar\n');
});

test.serial('result.all shows both `stdout` and `stderr` intermixed', async t => {
	const {all} = await execa('noop-132.js', {all: true});
	t.is(all, '132');
});

test('result.all is undefined unless opts.all is true', async t => {
	const {all} = await execa('noop.js');
	t.is(all, undefined);
});

test('stdout/stderr/all are undefined if ignored', async t => {
	const {stdout, stderr, all} = await execa('noop.js', {stdio: 'ignore', all: true});
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.is(all, undefined);
});

test('stdout/stderr/all are undefined if ignored in sync mode', t => {
	const {stdout, stderr, all} = execaSync('noop.js', {stdio: 'ignore', all: true});
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.is(all, undefined);
});

test('stdin option can be a sync iterable of strings', async t => {
	const {stdout} = await execa('stdin.js', {stdin: ['foo', 'bar']});
	t.is(stdout, 'foobar');
});

const textEncoder = new TextEncoder();
const binaryFoo = textEncoder.encode('foo');
const binaryBar = textEncoder.encode('bar');

test('stdin option can be a sync iterable of Uint8Arrays', async t => {
	const {stdout} = await execa('stdin.js', {stdin: [binaryFoo, binaryBar]});
	t.is(stdout, 'foobar');
});

const stringGenerator = function * () {
	yield * ['foo', 'bar'];
};

const binaryGenerator = function * () {
	yield * [binaryFoo, binaryBar];
};

const throwingGenerator = function * () {
	yield 'foo';
	throw new Error('generator error');
};

test('stdin option can be an async iterable of strings', async t => {
	const {stdout} = await execa('stdin.js', {stdin: stringGenerator()});
	t.is(stdout, 'foobar');
});

test('stdin option can be an async iterable of Uint8Arrays', async t => {
	const {stdout} = await execa('stdin.js', {stdin: binaryGenerator()});
	t.is(stdout, 'foobar');
});

test('stdin option cannot be a sync iterable with execa.sync()', t => {
	t.throws(() => {
		execaSync('stdin.js', {stdin: ['foo', 'bar']});
	}, {message: /an iterable in sync mode/});
});

test('stdin option cannot be an async iterable with execa.sync()', t => {
	t.throws(() => {
		execaSync('stdin.js', {stdin: stringGenerator()});
	}, {message: /an iterable in sync mode/});
});

test('stdin option cannot be an iterable when "input" is used', t => {
	t.throws(() => {
		execa('stdin.js', {stdin: ['foo', 'bar'], input: 'foobar'});
	}, {message: /`input` and `stdin` options/});
});

test('stdin option cannot be an iterable when "inputFile" is used', t => {
	t.throws(() => {
		execa('stdin.js', {stdin: ['foo', 'bar'], inputFile: 'dummy.txt'});
	}, {message: /`inputFile` and `stdin` options/});
});

test('stdin option cannot be a file URL when "input" is used', t => {
	t.throws(() => {
		execa('stdin.js', {stdin: pathToFileURL('unknown'), input: 'foobar'});
	}, {message: /`input` and `stdin` options/});
});

test('stdin option cannot be a file URL when "inputFile" is used', t => {
	t.throws(() => {
		execa('stdin.js', {stdin: pathToFileURL('unknown'), inputFile: 'dummy.txt'});
	}, {message: /`inputFile` and `stdin` options/});
});

test('stdin option cannot be a file path when "input" is used', t => {
	t.throws(() => {
		execa('stdin.js', {stdin: './unknown', input: 'foobar'});
	}, {message: /`input` and `stdin` options/});
});

test('stdin option cannot be a file path when "inputFile" is used', t => {
	t.throws(() => {
		execa('stdin.js', {stdin: './unknown', inputFile: 'dummy.txt'});
	}, {message: /`inputFile` and `stdin` options/});
});

test('stdin option handles errors in iterables', async t => {
	const {originalMessage} = await t.throwsAsync(execa('stdin.js', {stdin: throwingGenerator()}));
	t.is(originalMessage, 'generator error');
});

const testNoIterableOutput = (t, optionName, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', {[optionName]: ['foo', 'bar']});
	}, {message: /cannot be an iterable/});
};

test('stdout option cannot be an iterable', testNoIterableOutput, 'stdout', execa);
test('stderr option cannot be an iterable', testNoIterableOutput, 'stderr', execa);
test('stdout option cannot be an iterable - sync', testNoIterableOutput, 'stdout', execaSync);
test('stderr option cannot be an iterable - sync', testNoIterableOutput, 'stderr', execaSync);

const testWritableStreamError = async (t, streamName) => {
	const writableStream = new WritableStream({
		start(controller) {
			controller.error(new Error('foobar'));
		},
	});
	const {originalMessage} = await t.throwsAsync(execa('noop.js', {[streamName]: writableStream}));
	t.is(originalMessage, 'foobar');
};

test('stdout option handles errors in WritableStream', testWritableStreamError, 'stdout');
test('stderr option handles errors in WritableStream', testWritableStreamError, 'stderr');

test('input option can be a String', async t => {
	const {stdout} = await execa('stdin.js', {input: 'foobar'});
	t.is(stdout, 'foobar');
});

test('input option cannot be a String when stdin is set', t => {
	t.throws(() => {
		execa('stdin.js', {input: 'foobar', stdin: 'ignore'});
	}, {message: /`input` and `stdin` options/});
});

test('input option cannot be a String when stdio is set', t => {
	t.throws(() => {
		execa('stdin.js', {input: 'foobar', stdio: 'ignore'});
	}, {message: /`input` and `stdin` options/});
});

test('input option can be a Buffer', async t => {
	const {stdout} = await execa('stdin.js', {input: 'testing12'});
	t.is(stdout, 'testing12');
});

const createNoFileReadable = value => {
	const stream = new Stream.PassThrough();
	stream.write(value);
	stream.end();
	return stream;
};

test('input can be a Node.js Readable without a file descriptor', async t => {
	const {stdout} = await execa('stdin.js', {input: createNoFileReadable('foobar')});
	t.is(stdout, 'foobar');
});

const testNoFileStream = async (t, optionName, StreamClass) => {
	await t.throwsAsync(execa('noop.js', {[optionName]: new StreamClass()}), {code: 'ERR_INVALID_ARG_VALUE'});
};

test('stdin cannot be a Node.js Readable without a file descriptor', testNoFileStream, 'stdin', Stream.Readable);
test('stdout cannot be a Node.js Writable without a file descriptor', testNoFileStream, 'stdout', Stream.Writable);
test('stderr cannot be a Node.js Writable without a file descriptor', testNoFileStream, 'stderr', Stream.Writable);

const createFileReadable = async value => {
	const filePath = tempfile();
	await writeFile(filePath, value);
	const stream = fs.createReadStream(filePath);
	await once(stream, 'open');
	const cleanup = () => rm(filePath);
	return {stream, cleanup};
};

const testFileReadable = async (t, optionName) => {
	const {stream, cleanup} = await createFileReadable('foobar');
	try {
		const {stdout} = await execa('stdin.js', {[optionName]: stream});
		t.is(stdout, 'foobar');
	} finally {
		await cleanup();
	}
};

test('input can be a Node.js Readable with a file descriptor', testFileReadable, 'input');
test('stdin can be a Node.js Readable with a file descriptor', testFileReadable, 'stdin');

const createFileWritable = async () => {
	const filePath = tempfile();
	const stream = fs.createWriteStream(filePath);
	await once(stream, 'open');
	const cleanup = () => rm(filePath);
	return {stream, filePath, cleanup};
};

const testFileWritable = async (t, optionName, fixtureName) => {
	const {stream, filePath, cleanup} = await createFileWritable();
	try {
		await execa(fixtureName, ['foobar'], {[optionName]: stream});
		t.is(await readFile(filePath, 'utf8'), 'foobar\n');
	} finally {
		await cleanup();
	}
};

test('stdout can be a Node.js Writable with a file descriptor', testFileWritable, 'stdout', 'noop.js');
test('stderr can be a Node.js Writable with a file descriptor', testFileWritable, 'stderr', 'noop-err.js');

test('input option cannot be a Node.js Readable when stdin is set', t => {
	t.throws(() => {
		execa('stdin.js', {input: new Stream.PassThrough(), stdin: 'ignore'});
	}, {message: /`input` and `stdin` options/});
});

test('input option can be used with $', async t => {
	const {stdout} = await $({input: 'foobar'})`stdin.js`;
	t.is(stdout, 'foobar');
});

test('stdin can be a ReadableStream', async t => {
	const stdin = Stream.Readable.toWeb(Stream.Readable.from('howdy'));
	const {stdout} = await execa('stdin.js', {stdin});
	t.is(stdout, 'howdy');
});

const testWritableStream = async (t, streamName, fixtureName) => {
	const result = [];
	const writableStream = new WritableStream({
		write(chunk) {
			result.push(chunk);
		},
	});
	await execa(fixtureName, ['foobar'], {[streamName]: writableStream});
	t.is(result.join(''), 'foobar\n');
};

test('stdout can be a WritableStream', testWritableStream, 'stdout', 'noop.js');
test('stderr can be a WritableStream', testWritableStream, 'stderr', 'noop-err.js');

test('stdin cannot be a ReadableStream when input is used', t => {
	const stdin = Stream.Readable.toWeb(Stream.Readable.from('howdy'));
	t.throws(() => {
		execa('stdin.js', {stdin, input: 'foobar'});
	}, {message: /`input` and `stdin` options/});
});

test('stdin cannot be a ReadableStream when inputFile is used', t => {
	const stdin = Stream.Readable.toWeb(Stream.Readable.from('howdy'));
	t.throws(() => {
		execa('stdin.js', {stdin, inputFile: 'dummy.txt'});
	}, {message: /`inputFile` and `stdin` options/});
});

test('stdin can be a file URL', async t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const {stdout} = await execa('stdin.js', {stdin: pathToFileURL(inputFile)});
	t.is(stdout, 'howdy');
});

const testOutputFileUrl = async (t, streamName, fixtureName) => {
	const outputFile = tempfile();
	await execa(fixtureName, ['foobar'], {[streamName]: pathToFileURL(outputFile)});
	t.is(await readFile(outputFile, 'utf8'), 'foobar\n');
};

test('stdout can be a file URL', testOutputFileUrl, 'stdout', 'noop.js');
test('stderr can be a file URL', testOutputFileUrl, 'stderr', 'noop-err.js');

const testStdioNonFileUrl = (t, streamName, method) => {
	t.throws(() => {
		method('noop.js', {[streamName]: nonFileUrl});
	}, {message: /pathToFileURL/});
};

test('stdin cannot be a non-file URL', testStdioNonFileUrl, 'stdin', execa);
test('stdout cannot be a non-file URL', testStdioNonFileUrl, 'stdout', execa);
test('stderr cannot be a non-file URL', testStdioNonFileUrl, 'stderr', execa);
test('stdin cannot be a non-file URL - sync', testStdioNonFileUrl, 'stdin', execaSync);
test('stdout cannot be a non-file URL - sync', testStdioNonFileUrl, 'stdout', execaSync);
test('stderr cannot be a non-file URL - sync', testStdioNonFileUrl, 'stderr', execaSync);

test('stdin can be an absolute file path', async t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const {stdout} = await execa('stdin.js', {stdin: inputFile});
	t.is(stdout, 'howdy');
});

const testOutputAbsoluteFile = async (t, streamName, fixtureName) => {
	const outputFile = tempfile();
	await execa(fixtureName, ['foobar'], {[streamName]: outputFile});
	t.is(await readFile(outputFile, 'utf8'), 'foobar\n');
};

test('stdout can be an absolute file path', testOutputAbsoluteFile, 'stdout', 'noop.js');
test('stderr can be an absolute file path', testOutputAbsoluteFile, 'stderr', 'noop-err.js');

test('stdin can be a relative file path', async t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const {stdout} = await execa('stdin.js', {stdin: relative('.', inputFile)});
	t.is(stdout, 'howdy');
});

const testOutputRelativeFile = async (t, streamName, fixtureName) => {
	const outputFile = tempfile();
	await execa(fixtureName, ['foobar'], {[streamName]: relative('.', outputFile)});
	t.is(await readFile(outputFile, 'utf8'), 'foobar\n');
};

test('stdout can be a relative file path', testOutputRelativeFile, 'stdout', 'noop.js');
test('stderr can be a relative file path', testOutputRelativeFile, 'stderr', 'noop-err.js');

const testStdioValidUrl = (t, streamName, method) => {
	t.throws(() => {
		method('noop.js', {[streamName]: 'foobar'});
	}, {message: /absolute file path/});
};

test('stdin must start with . when being a relative file path', testStdioValidUrl, 'stdin', execa);
test('stdout must start with . when being a relative file path', testStdioValidUrl, 'stdout', execa);
test('stderr must start with . when being a relative file path', testStdioValidUrl, 'stderr', execa);
test('stdin must start with . when being a relative file path - sync', testStdioValidUrl, 'stdin', execaSync);
test('stdout must start with . when being a relative file path - sync', testStdioValidUrl, 'stdout', execaSync);
test('stderr must start with . when being a relative file path - sync', testStdioValidUrl, 'stderr', execaSync);

test('inputFile can be set', async t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const {stdout} = await execa('stdin.js', {inputFile});
	t.is(stdout, 'howdy');
});

test('inputFile can be set with $', async t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const {stdout} = await $({inputFile})`stdin.js`;
	t.is(stdout, 'howdy');
});

test('inputFile and input cannot be both set', t => {
	t.throws(() => execa('stdin.js', {inputFile: '', input: ''}), {
		message: /cannot be both set/,
	});
});

test('inputFile option cannot be set when stdin is set', t => {
	t.throws(() => {
		execa('stdin.js', {inputFile: '', stdin: 'ignore'});
	}, {message: /`inputFile` and `stdin` options/});
});

const testFileUrlError = async (t, streamName) => {
	await t.throwsAsync(
		execa('noop.js', {[streamName]: pathToFileURL('./unknown/file')}),
		{code: 'ENOENT'},
	);
};

test('stdin file URL errors should be handled', testFileUrlError, 'stdin');
test('stdout file URL errors should be handled', testFileUrlError, 'stdout');
test('stderr file URL errors should be handled', testFileUrlError, 'stderr');

const testFileUrlErrorSync = (t, streamName) => {
	t.throws(() => {
		execaSync('noop.js', {[streamName]: pathToFileURL('./unknown/file')});
	}, {code: 'ENOENT'});
};

test('stdin file URL errors should be handled - sync', testFileUrlErrorSync, 'stdin');
test('stdout file URL errors should be handled - sync', testFileUrlErrorSync, 'stdout');
test('stderr file URL errors should be handled - sync', testFileUrlErrorSync, 'stderr');

const testFilePathError = async (t, streamName) => {
	await t.throwsAsync(
		execa('noop.js', {[streamName]: './unknown/file'}),
		{code: 'ENOENT'},
	);
};

test('stdin file path errors should be handled', testFilePathError, 'stdin');
test('stdout file path errors should be handled', testFilePathError, 'stdout');
test('stderr file path errors should be handled', testFilePathError, 'stderr');

const testFilePathErrorSync = (t, streamName) => {
	t.throws(() => {
		execaSync('noop.js', {[streamName]: './unknown/file'});
	}, {code: 'ENOENT'});
};

test('stdin file path errors should be handled - sync', testFilePathErrorSync, 'stdin');
test('stdout file path errors should be handled - sync', testFilePathErrorSync, 'stdout');
test('stderr file path errors should be handled - sync', testFilePathErrorSync, 'stderr');

test('inputFile errors should be handled', async t => {
	await t.throwsAsync(execa('stdin.js', {inputFile: 'unknown'}), {code: 'ENOENT'});
});

test('you can write to child.stdin', async t => {
	const subprocess = execa('stdin.js');
	subprocess.stdin.end('unicorns');
	const {stdout} = await subprocess;
	t.is(stdout, 'unicorns');
});

test('input option can be a String - sync', t => {
	const {stdout} = execaSync('stdin.js', {input: 'foobar'});
	t.is(stdout, 'foobar');
});

test('input option can be used with $.sync', t => {
	const {stdout} = $({input: 'foobar'}).sync`stdin.js`;
	t.is(stdout, 'foobar');
});

test('input option can be a Buffer - sync', t => {
	const {stdout} = execaSync('stdin.js', {input: Buffer.from('testing12', 'utf8')});
	t.is(stdout, 'testing12');
});

test('opts.stdout:ignore - stdout will not collect data', async t => {
	const {stdout} = await execa('stdin.js', {
		input: 'hello',
		stdio: [undefined, 'ignore', undefined],
	});
	t.is(stdout, undefined);
});

test('input cannot be a Node.js Readable in sync mode', t => {
	t.throws(() => {
		execaSync('stdin.js', {input: new Stream.PassThrough()});
	}, {message: /The `input` option cannot be a Node\.js stream in sync mode/});
});

test('stdin cannot be a ReadableStream in sync mode', t => {
	const stdin = Stream.Readable.toWeb(Stream.Readable.from('howdy'));
	t.throws(() => {
		execaSync('stdin.js', {stdin});
	}, {message: /The `stdin` option cannot be a web stream in sync mode/});
});

const testWritableStreamSync = (t, streamName) => {
	t.throws(() => {
		execaSync('noop.js', {[streamName]: new WritableStream()});
	}, {message: new RegExp(`The \`${streamName}\` option cannot be a web stream in sync mode`)});
};

test('stdout cannot be a WritableStream in sync mode', testWritableStreamSync, 'stdout');
test('stderr cannot be a WritableStream in sync mode', testWritableStreamSync, 'stderr');

test('stdin can be a file URL - sync', t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const stdin = pathToFileURL(inputFile);
	const {stdout} = execaSync('stdin.js', {stdin});
	t.is(stdout, 'howdy');
});

const testOutputFileUrlSync = (t, streamName, fixtureName) => {
	const outputFile = tempfile();
	execaSync(fixtureName, ['foobar'], {[streamName]: pathToFileURL(outputFile)});
	t.is(fs.readFileSync(outputFile, 'utf8'), 'foobar\n');
};

test('stdout can be a file URL - sync', testOutputFileUrlSync, 'stdout', 'noop.js');
test('stderr can be a file URL - sync', testOutputFileUrlSync, 'stderr', 'noop-err.js');

test('stdin can be an absolute file path - sync', t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const {stdout} = execaSync('stdin.js', {stdin: inputFile});
	t.is(stdout, 'howdy');
});

const testOutputAbsoluteFileSync = (t, streamName, fixtureName) => {
	const outputFile = tempfile();
	execaSync(fixtureName, ['foobar'], {[streamName]: outputFile});
	t.is(fs.readFileSync(outputFile, 'utf8'), 'foobar\n');
};

test('stdout can be an absolute file path - sync', testOutputAbsoluteFileSync, 'stdout', 'noop.js');
test('stderr can be an absolute file path - sync', testOutputAbsoluteFileSync, 'stderr', 'noop-err.js');

test('stdin can be a relative file path - sync', t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const stdin = relative('.', inputFile);
	const {stdout} = execaSync('stdin.js', {stdin});
	t.is(stdout, 'howdy');
});

const testOutputRelativeFileSync = (t, streamName, fixtureName) => {
	const outputFile = tempfile();
	execaSync(fixtureName, ['foobar'], {[streamName]: relative('.', outputFile)});
	t.is(fs.readFileSync(outputFile, 'utf8'), 'foobar\n');
};

test('stdout can be a relative file path - sync', testOutputRelativeFileSync, 'stdout', 'noop.js');
test('stderr can be a relative file path - sync', testOutputRelativeFileSync, 'stderr', 'noop-err.js');

test('inputFile can be set - sync', t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const {stdout} = execaSync('stdin.js', {inputFile});
	t.is(stdout, 'howdy');
});

test('inputFile option can be used with $.sync', t => {
	const inputFile = tempfile();
	fs.writeFileSync(inputFile, 'howdy');
	const {stdout} = $({inputFile}).sync`stdin.js`;
	t.is(stdout, 'howdy');
});

test('inputFile and input cannot be both set - sync', t => {
	t.throws(() => execaSync('stdin.js', {inputFile: '', input: ''}), {
		message: /cannot be both set/,
	});
});

test('maxBuffer affects stdout', async t => {
	await t.notThrowsAsync(execa('max-buffer.js', ['stdout', '10'], {maxBuffer: 10}));
	const {stdout, all} = await t.throwsAsync(execa('max-buffer.js', ['stdout', '11'], {maxBuffer: 10, all: true}), {message: /max-buffer.js stdout/});
	t.is(stdout, '.'.repeat(10));
	t.is(all, '.'.repeat(10));
});

test('maxBuffer affects stderr', async t => {
	await t.notThrowsAsync(execa('max-buffer.js', ['stderr', '10'], {maxBuffer: 10}));
	const {stderr, all} = await t.throwsAsync(execa('max-buffer.js', ['stderr', '11'], {maxBuffer: 10, all: true}), {message: /max-buffer.js stderr/});
	t.is(stderr, '.'.repeat(10));
	t.is(all, '.'.repeat(10));
});

test('do not buffer stdout when `buffer` set to `false`', async t => {
	const promise = execa('max-buffer.js', ['stdout', '10'], {buffer: false});
	const [result, stdout] = await Promise.all([
		promise,
		getStream(promise.stdout),
	]);

	t.is(result.stdout, undefined);
	t.is(stdout, '.........\n');
});

test('do not buffer stderr when `buffer` set to `false`', async t => {
	const promise = execa('max-buffer.js', ['stderr', '10'], {buffer: false});
	const [result, stderr] = await Promise.all([
		promise,
		getStream(promise.stderr),
	]);

	t.is(result.stderr, undefined);
	t.is(stderr, '.........\n');
});

test('do not buffer when streaming', async t => {
	const {stdout} = execa('max-buffer.js', ['stdout', '21'], {maxBuffer: 10});
	const result = await getStream(stdout);
	t.is(result, '....................\n');
});

test('buffer: false > promise resolves', async t => {
	await t.notThrowsAsync(execa('noop.js', {buffer: false}));
});

test('buffer: false > promise resolves when output is big but is not pipable', async t => {
	await t.notThrowsAsync(execa('max-buffer.js', {buffer: false, stdout: 'ignore'}));
});

test('buffer: false > promise resolves when output is big and is read', async t => {
	const subprocess = execa('max-buffer.js', {buffer: false});
	subprocess.stdout.resume();
	subprocess.stderr.resume();
	await t.notThrowsAsync(subprocess);
});

test('buffer: false > promise resolves when output is big and "all" is used and is read', async t => {
	const subprocess = execa('max-buffer.js', {buffer: false, all: true});
	subprocess.all.resume();
	await t.notThrowsAsync(subprocess);
});

test('buffer: false > promise rejects when process returns non-zero', async t => {
	const subprocess = execa('fail.js', {buffer: false});
	const {exitCode} = await t.throwsAsync(subprocess);
	t.is(exitCode, 2);
});

test('buffer: false > emits end event when promise is rejected', async t => {
	const subprocess = execa('wrong command', {buffer: false, reject: false});
	await t.notThrowsAsync(Promise.all([subprocess, pEvent(subprocess.stdout, 'end')]));
});

test('can use all: true with stdout: ignore', async t => {
	await t.notThrowsAsync(execa('max-buffer.js', {buffer: false, stdout: 'ignore', all: true}));
});

test('can use all: true with stderr: ignore', async t => {
	await t.notThrowsAsync(execa('max-buffer.js', ['stderr'], {buffer: false, stderr: 'ignore', all: true}));
});

const BUFFER_TIMEOUT = 1e3;

// On Unix (not Windows), a process won't exit if stdout has not been read.
if (process.platform !== 'win32') {
	test.serial('buffer: false > promise does not resolve when output is big and is not read', async t => {
		const {timedOut} = await t.throwsAsync(execa('max-buffer.js', {buffer: false, timeout: BUFFER_TIMEOUT}));
		t.true(timedOut);
	});

	test.serial('buffer: false > promise does not resolve when output is big and "all" is used but not read', async t => {
		const subprocess = execa('max-buffer.js', {buffer: false, all: true, timeout: BUFFER_TIMEOUT});
		subprocess.stdout.resume();
		subprocess.stderr.resume();
		const {timedOut} = await t.throwsAsync(subprocess);
		t.true(timedOut);
	});
}

test('Errors on streams should make the process exit', async t => {
	const childProcess = execa('forever');
	childProcess.stdout.destroy();
	await t.throwsAsync(childProcess, {code: 'ERR_STREAM_PREMATURE_CLOSE'});
});

test.serial('Processes wait on stdin before exiting', async t => {
	const childProcess = execa('stdin.js');
	await setTimeout(1e3);
	childProcess.stdin.end('foobar');
	const {stdout} = await childProcess;
	t.is(stdout, 'foobar');
});

test.serial('Processes buffer stdout before it is read', async t => {
	const childProcess = execa('noop-delay.js', ['foobar']);
	await setTimeout(5e2);
	const {stdout} = await childProcess;
	t.is(stdout, 'foobar');
});

// This test is not the desired behavior, but is the current one.
// I.e. this is mostly meant for documentation and regression testing.
test.serial('Processes might successfully exit before their stdout is read', async t => {
	const childProcess = execa('noop.js', ['foobar']);
	await setTimeout(1e3);
	const {stdout} = await childProcess;
	t.is(stdout, '');
});

test.serial('Processes might fail before their stdout is read', async t => {
	const childProcess = execa('noop-fail.js', ['foobar'], {reject: false});
	await setTimeout(1e3);
	const {stdout} = await childProcess;
	t.is(stdout, '');
});
