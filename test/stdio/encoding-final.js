import {Buffer} from 'node:buffer';
import {exec} from 'node:child_process';
import {promisify} from 'node:util';
import test from 'ava';
import getStream from 'get-stream';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir, FIXTURES_DIR} from '../helpers/fixtures-dir.js';
import {fullStdio} from '../helpers/stdio.js';
import {foobarString, foobarUint8Array, foobarHex} from '../helpers/input.js';

const pExec = promisify(exec);

setFixtureDir();

const checkEncoding = async (t, encoding, fdNumber, execaMethod) => {
	const {stdio} = await execaMethod('noop-fd.js', [`${fdNumber}`, STRING_TO_ENCODE], {...fullStdio, encoding});
	compareValues(t, stdio[fdNumber], encoding);

	if (execaMethod !== execaSync) {
		const subprocess = execaMethod('noop-fd.js', [`${fdNumber}`, STRING_TO_ENCODE], {...fullStdio, encoding});
		const result = await getStream(subprocess.stdio[fdNumber]);
		compareValues(t, result, 'utf8');
		await subprocess;
	}

	if (fdNumber === 3) {
		return;
	}

	const {stdout, stderr} = await pExec(`node noop-fd.js ${fdNumber} ${STRING_TO_ENCODE}`, {encoding, cwd: FIXTURES_DIR});
	compareValues(t, fdNumber === 1 ? stdout : stderr, encoding);
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

test('can pass encoding "buffer" to stdout', checkEncoding, 'buffer', 1, execa);
test('can pass encoding "utf8" to stdout', checkEncoding, 'utf8', 1, execa);
test('can pass encoding "utf16le" to stdout', checkEncoding, 'utf16le', 1, execa);
test('can pass encoding "latin1" to stdout', checkEncoding, 'latin1', 1, execa);
test('can pass encoding "ascii" to stdout', checkEncoding, 'ascii', 1, execa);
test('can pass encoding "hex" to stdout', checkEncoding, 'hex', 1, execa);
test('can pass encoding "base64" to stdout', checkEncoding, 'base64', 1, execa);
test('can pass encoding "base64url" to stdout', checkEncoding, 'base64url', 1, execa);
test('can pass encoding "buffer" to stderr', checkEncoding, 'buffer', 2, execa);
test('can pass encoding "utf8" to stderr', checkEncoding, 'utf8', 2, execa);
test('can pass encoding "utf16le" to stderr', checkEncoding, 'utf16le', 2, execa);
test('can pass encoding "latin1" to stderr', checkEncoding, 'latin1', 2, execa);
test('can pass encoding "ascii" to stderr', checkEncoding, 'ascii', 2, execa);
test('can pass encoding "hex" to stderr', checkEncoding, 'hex', 2, execa);
test('can pass encoding "base64" to stderr', checkEncoding, 'base64', 2, execa);
test('can pass encoding "base64url" to stderr', checkEncoding, 'base64url', 2, execa);
test('can pass encoding "buffer" to stdio[*]', checkEncoding, 'buffer', 3, execa);
test('can pass encoding "utf8" to stdio[*]', checkEncoding, 'utf8', 3, execa);
test('can pass encoding "utf16le" to stdio[*]', checkEncoding, 'utf16le', 3, execa);
test('can pass encoding "latin1" to stdio[*]', checkEncoding, 'latin1', 3, execa);
test('can pass encoding "ascii" to stdio[*]', checkEncoding, 'ascii', 3, execa);
test('can pass encoding "hex" to stdio[*]', checkEncoding, 'hex', 3, execa);
test('can pass encoding "base64" to stdio[*]', checkEncoding, 'base64', 3, execa);
test('can pass encoding "base64url" to stdio[*]', checkEncoding, 'base64url', 3, execa);
test('can pass encoding "buffer" to stdout - sync', checkEncoding, 'buffer', 1, execaSync);
test('can pass encoding "utf8" to stdout - sync', checkEncoding, 'utf8', 1, execaSync);
test('can pass encoding "utf16le" to stdout - sync', checkEncoding, 'utf16le', 1, execaSync);
test('can pass encoding "latin1" to stdout - sync', checkEncoding, 'latin1', 1, execaSync);
test('can pass encoding "ascii" to stdout - sync', checkEncoding, 'ascii', 1, execaSync);
test('can pass encoding "hex" to stdout - sync', checkEncoding, 'hex', 1, execaSync);
test('can pass encoding "base64" to stdout - sync', checkEncoding, 'base64', 1, execaSync);
test('can pass encoding "base64url" to stdout - sync', checkEncoding, 'base64url', 1, execaSync);
test('can pass encoding "buffer" to stderr - sync', checkEncoding, 'buffer', 2, execaSync);
test('can pass encoding "utf8" to stderr - sync', checkEncoding, 'utf8', 2, execaSync);
test('can pass encoding "utf16le" to stderr - sync', checkEncoding, 'utf16le', 2, execaSync);
test('can pass encoding "latin1" to stderr - sync', checkEncoding, 'latin1', 2, execaSync);
test('can pass encoding "ascii" to stderr - sync', checkEncoding, 'ascii', 2, execaSync);
test('can pass encoding "hex" to stderr - sync', checkEncoding, 'hex', 2, execaSync);
test('can pass encoding "base64" to stderr - sync', checkEncoding, 'base64', 2, execaSync);
test('can pass encoding "base64url" to stderr - sync', checkEncoding, 'base64url', 2, execaSync);
test('can pass encoding "buffer" to stdio[*] - sync', checkEncoding, 'buffer', 3, execaSync);
test('can pass encoding "utf8" to stdio[*] - sync', checkEncoding, 'utf8', 3, execaSync);
test('can pass encoding "utf16le" to stdio[*] - sync', checkEncoding, 'utf16le', 3, execaSync);
test('can pass encoding "latin1" to stdio[*] - sync', checkEncoding, 'latin1', 3, execaSync);
test('can pass encoding "ascii" to stdio[*] - sync', checkEncoding, 'ascii', 3, execaSync);
test('can pass encoding "hex" to stdio[*] - sync', checkEncoding, 'hex', 3, execaSync);
test('can pass encoding "base64" to stdio[*] - sync', checkEncoding, 'base64', 3, execaSync);
test('can pass encoding "base64url" to stdio[*] - sync', checkEncoding, 'base64url', 3, execaSync);

// eslint-disable-next-line max-params
const testEncodingInput = async (t, input, expectedStdout, encoding, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {input, encoding});
	t.deepEqual(stdout, expectedStdout);
};

test('Can use string input', testEncodingInput, foobarString, foobarString, 'utf8', execa);
test('Can use Uint8Array input', testEncodingInput, foobarUint8Array, foobarString, 'utf8', execa);
test('Can use string input, encoding "buffer"', testEncodingInput, foobarString, foobarUint8Array, 'buffer', execa);
test('Can use Uint8Array input, encoding "buffer"', testEncodingInput, foobarUint8Array, foobarUint8Array, 'buffer', execa);
test('Can use string input, encoding "hex"', testEncodingInput, foobarString, foobarHex, 'hex', execa);
test('Can use Uint8Array input, encoding "hex"', testEncodingInput, foobarUint8Array, foobarHex, 'hex', execa);
test('Can use string input, sync', testEncodingInput, foobarString, foobarString, 'utf8', execaSync);
test('Can use Uint8Array input, sync', testEncodingInput, foobarUint8Array, foobarString, 'utf8', execaSync);
test('Can use string input, encoding "buffer", sync', testEncodingInput, foobarString, foobarUint8Array, 'buffer', execaSync);
test('Can use Uint8Array input, encoding "buffer", sync', testEncodingInput, foobarUint8Array, foobarUint8Array, 'buffer', execaSync);
test('Can use string input, encoding "hex", sync', testEncodingInput, foobarString, foobarHex, 'hex', execaSync);
test('Can use Uint8Array input, encoding "hex", sync', testEncodingInput, foobarUint8Array, foobarHex, 'hex', execaSync);

const testSubprocessEncoding = (t, encoding) => {
	const subprocess = execa('empty.js', {...fullStdio, encoding});
	t.is(subprocess.stdout.readableEncoding, null);
	t.is(subprocess.stderr.readableEncoding, null);
	t.is(subprocess.stdio[3].readableEncoding, null);
};

test('Does not modify subprocess.std* encoding, "utf8"', testSubprocessEncoding, 'utf8');
test('Does not modify subprocess.std* encoding, "utf16le"', testSubprocessEncoding, 'utf16le');
test('Does not modify subprocess.std* encoding, "buffer"', testSubprocessEncoding, 'buffer');
test('Does not modify subprocess.std* encoding, "hex"', testSubprocessEncoding, 'hex');
test('Does not modify subprocess.std* encoding, "base64"', testSubprocessEncoding, 'base64');
test('Does not modify subprocess.std* encoding, "base64url"', testSubprocessEncoding, 'base64url');
test('Does not modify subprocess.std* encoding, "latin1"', testSubprocessEncoding, 'latin1');
test('Does not modify subprocess.std* encoding, "ascii"', testSubprocessEncoding, 'ascii');
