import {Buffer} from 'node:buffer';
import {exec} from 'node:child_process';
import {promisify} from 'node:util';
import test from 'ava';
import getStream, {getStreamAsBuffer} from 'get-stream';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir, FIXTURES_DIR} from '../helpers/fixtures-dir.js';
import {fullStdio} from '../helpers/stdio.js';
import {outputObjectGenerator, getChunksGenerator} from '../helpers/generator.js';
import {foobarObject} from '../helpers/input.js';

const pExec = promisify(exec);

setFixtureDir();

const checkEncoding = async (t, encoding, index, execaMethod) => {
	const {stdio} = await execaMethod('noop-fd.js', [`${index}`, STRING_TO_ENCODE], {...fullStdio, encoding});
	compareValues(t, stdio[index], encoding);

	if (execaMethod !== execaSync) {
		const childProcess = execaMethod('noop-fd.js', [`${index}`, STRING_TO_ENCODE], {...fullStdio, encoding, buffer: false});
		const getStreamMethod = encoding === 'buffer' ? getStreamAsBuffer : getStream;
		const result = await getStreamMethod(childProcess.stdio[index]);
		compareValues(t, result, encoding);
		await childProcess;
	}

	if (index === 3) {
		return;
	}

	const {stdout, stderr} = await pExec(`node noop-fd.js ${index} ${STRING_TO_ENCODE}`, {encoding, cwd: FIXTURES_DIR});
	compareValues(t, index === 1 ? stdout : stderr, encoding);
};

const compareValues = (t, value, encoding) => {
	if (encoding === 'buffer') {
		t.true(ArrayBuffer.isView(value));
		t.true(BUFFER_TO_ENCODE.equals(value));
	} else {
		t.is(value, BUFFER_TO_ENCODE.toString(encoding));
	}
};

// This string gives different outputs with each encoding type
const STRING_TO_ENCODE = '\u1000.';
const BUFFER_TO_ENCODE = Buffer.from(STRING_TO_ENCODE);

/* eslint-disable unicorn/text-encoding-identifier-case */
test('can pass encoding "buffer" to stdout', checkEncoding, 'buffer', 1, execa);
test('can pass encoding "utf8" to stdout', checkEncoding, 'utf8', 1, execa);
test('can pass encoding "utf-8" to stdout', checkEncoding, 'utf-8', 1, execa);
test('can pass encoding "utf16le" to stdout', checkEncoding, 'utf16le', 1, execa);
test('can pass encoding "utf-16le" to stdout', checkEncoding, 'utf-16le', 1, execa);
test('can pass encoding "ucs2" to stdout', checkEncoding, 'ucs2', 1, execa);
test('can pass encoding "ucs-2" to stdout', checkEncoding, 'ucs-2', 1, execa);
test('can pass encoding "latin1" to stdout', checkEncoding, 'latin1', 1, execa);
test('can pass encoding "binary" to stdout', checkEncoding, 'binary', 1, execa);
test('can pass encoding "ascii" to stdout', checkEncoding, 'ascii', 1, execa);
test('can pass encoding "hex" to stdout', checkEncoding, 'hex', 1, execa);
test('can pass encoding "base64" to stdout', checkEncoding, 'base64', 1, execa);
test('can pass encoding "base64url" to stdout', checkEncoding, 'base64url', 1, execa);
test('can pass encoding "buffer" to stderr', checkEncoding, 'buffer', 2, execa);
test('can pass encoding "utf8" to stderr', checkEncoding, 'utf8', 2, execa);
test('can pass encoding "utf-8" to stderr', checkEncoding, 'utf-8', 2, execa);
test('can pass encoding "utf16le" to stderr', checkEncoding, 'utf16le', 2, execa);
test('can pass encoding "utf-16le" to stderr', checkEncoding, 'utf-16le', 2, execa);
test('can pass encoding "ucs2" to stderr', checkEncoding, 'ucs2', 2, execa);
test('can pass encoding "ucs-2" to stderr', checkEncoding, 'ucs-2', 2, execa);
test('can pass encoding "latin1" to stderr', checkEncoding, 'latin1', 2, execa);
test('can pass encoding "binary" to stderr', checkEncoding, 'binary', 2, execa);
test('can pass encoding "ascii" to stderr', checkEncoding, 'ascii', 2, execa);
test('can pass encoding "hex" to stderr', checkEncoding, 'hex', 2, execa);
test('can pass encoding "base64" to stderr', checkEncoding, 'base64', 2, execa);
test('can pass encoding "base64url" to stderr', checkEncoding, 'base64url', 2, execa);
test('can pass encoding "buffer" to stdio[*]', checkEncoding, 'buffer', 3, execa);
test('can pass encoding "utf8" to stdio[*]', checkEncoding, 'utf8', 3, execa);
test('can pass encoding "utf-8" to stdio[*]', checkEncoding, 'utf-8', 3, execa);
test('can pass encoding "utf16le" to stdio[*]', checkEncoding, 'utf16le', 3, execa);
test('can pass encoding "utf-16le" to stdio[*]', checkEncoding, 'utf-16le', 3, execa);
test('can pass encoding "ucs2" to stdio[*]', checkEncoding, 'ucs2', 3, execa);
test('can pass encoding "ucs-2" to stdio[*]', checkEncoding, 'ucs-2', 3, execa);
test('can pass encoding "latin1" to stdio[*]', checkEncoding, 'latin1', 3, execa);
test('can pass encoding "binary" to stdio[*]', checkEncoding, 'binary', 3, execa);
test('can pass encoding "ascii" to stdio[*]', checkEncoding, 'ascii', 3, execa);
test('can pass encoding "hex" to stdio[*]', checkEncoding, 'hex', 3, execa);
test('can pass encoding "base64" to stdio[*]', checkEncoding, 'base64', 3, execa);
test('can pass encoding "base64url" to stdio[*]', checkEncoding, 'base64url', 3, execa);
test('can pass encoding "buffer" to stdout - sync', checkEncoding, 'buffer', 1, execaSync);
test('can pass encoding "utf8" to stdout - sync', checkEncoding, 'utf8', 1, execaSync);
test('can pass encoding "utf-8" to stdout - sync', checkEncoding, 'utf-8', 1, execaSync);
test('can pass encoding "utf16le" to stdout - sync', checkEncoding, 'utf16le', 1, execaSync);
test('can pass encoding "utf-16le" to stdout - sync', checkEncoding, 'utf-16le', 1, execaSync);
test('can pass encoding "ucs2" to stdout - sync', checkEncoding, 'ucs2', 1, execaSync);
test('can pass encoding "ucs-2" to stdout - sync', checkEncoding, 'ucs-2', 1, execaSync);
test('can pass encoding "latin1" to stdout - sync', checkEncoding, 'latin1', 1, execaSync);
test('can pass encoding "binary" to stdout - sync', checkEncoding, 'binary', 1, execaSync);
test('can pass encoding "ascii" to stdout - sync', checkEncoding, 'ascii', 1, execaSync);
test('can pass encoding "hex" to stdout - sync', checkEncoding, 'hex', 1, execaSync);
test('can pass encoding "base64" to stdout - sync', checkEncoding, 'base64', 1, execaSync);
test('can pass encoding "base64url" to stdout - sync', checkEncoding, 'base64url', 1, execaSync);
test('can pass encoding "buffer" to stderr - sync', checkEncoding, 'buffer', 2, execaSync);
test('can pass encoding "utf8" to stderr - sync', checkEncoding, 'utf8', 2, execaSync);
test('can pass encoding "utf-8" to stderr - sync', checkEncoding, 'utf-8', 2, execaSync);
test('can pass encoding "utf16le" to stderr - sync', checkEncoding, 'utf16le', 2, execaSync);
test('can pass encoding "utf-16le" to stderr - sync', checkEncoding, 'utf-16le', 2, execaSync);
test('can pass encoding "ucs2" to stderr - sync', checkEncoding, 'ucs2', 2, execaSync);
test('can pass encoding "ucs-2" to stderr - sync', checkEncoding, 'ucs-2', 2, execaSync);
test('can pass encoding "latin1" to stderr - sync', checkEncoding, 'latin1', 2, execaSync);
test('can pass encoding "binary" to stderr - sync', checkEncoding, 'binary', 2, execaSync);
test('can pass encoding "ascii" to stderr - sync', checkEncoding, 'ascii', 2, execaSync);
test('can pass encoding "hex" to stderr - sync', checkEncoding, 'hex', 2, execaSync);
test('can pass encoding "base64" to stderr - sync', checkEncoding, 'base64', 2, execaSync);
test('can pass encoding "base64url" to stderr - sync', checkEncoding, 'base64url', 2, execaSync);
test('can pass encoding "buffer" to stdio[*] - sync', checkEncoding, 'buffer', 3, execaSync);
test('can pass encoding "utf8" to stdio[*] - sync', checkEncoding, 'utf8', 3, execaSync);
test('can pass encoding "utf-8" to stdio[*] - sync', checkEncoding, 'utf-8', 3, execaSync);
test('can pass encoding "utf16le" to stdio[*] - sync', checkEncoding, 'utf16le', 3, execaSync);
test('can pass encoding "utf-16le" to stdio[*] - sync', checkEncoding, 'utf-16le', 3, execaSync);
test('can pass encoding "ucs2" to stdio[*] - sync', checkEncoding, 'ucs2', 3, execaSync);
test('can pass encoding "ucs-2" to stdio[*] - sync', checkEncoding, 'ucs-2', 3, execaSync);
test('can pass encoding "latin1" to stdio[*] - sync', checkEncoding, 'latin1', 3, execaSync);
test('can pass encoding "binary" to stdio[*] - sync', checkEncoding, 'binary', 3, execaSync);
test('can pass encoding "ascii" to stdio[*] - sync', checkEncoding, 'ascii', 3, execaSync);
test('can pass encoding "hex" to stdio[*] - sync', checkEncoding, 'hex', 3, execaSync);
test('can pass encoding "base64" to stdio[*] - sync', checkEncoding, 'base64', 3, execaSync);
test('can pass encoding "base64url" to stdio[*] - sync', checkEncoding, 'base64url', 3, execaSync);
/* eslint-enable unicorn/text-encoding-identifier-case */

test('validate unknown encodings', async t => {
	await t.throwsAsync(execa('noop.js', {encoding: 'unknownEncoding'}), {code: 'ERR_UNKNOWN_ENCODING'});
});

const foobarArray = ['fo', 'ob', 'ar', '..'];

test('Handle multibyte characters', async t => {
	const {stdout} = await execa('noop.js', {stdout: getChunksGenerator(foobarArray, false), encoding: 'base64'});
	t.is(stdout, btoa(foobarArray.join('')));
});

test('Handle multibyte characters, with objectMode', async t => {
	const {stdout} = await execa('noop.js', {stdout: getChunksGenerator(foobarArray, true), encoding: 'base64'});
	t.deepEqual(stdout, foobarArray.map(chunk => btoa(chunk)));
});

test('Other encodings work with transforms that return objects', async t => {
	const {stdout} = await execa('noop.js', {stdout: outputObjectGenerator, encoding: 'base64'});
	t.deepEqual(stdout, [foobarObject]);
});
