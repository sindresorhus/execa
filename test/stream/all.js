import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {defaultHighWaterMark} from '../helpers/stream.js';
import {foobarString} from '../helpers/input.js';

setFixtureDir();

const textEncoder = new TextEncoder();
const foobarStringFull = `${foobarString}\n`;
const doubleFoobarStringFull = `${foobarStringFull}${foobarStringFull}`;
const doubleFoobarString = `${foobarStringFull}${foobarString}`;
const doubleFoobarUint8ArrayFull = textEncoder.encode(doubleFoobarStringFull);
const doubleFoobarUint8Array = textEncoder.encode(doubleFoobarString);
const doubleFoobarArrayFull = [foobarStringFull, foobarStringFull];
const doubleFoobarArray = [foobarString, foobarString];

// eslint-disable-next-line max-params
const testAllBoth = async (t, expectedOutput, encoding, lines, stripFinalNewline, isFailure, execaMethod) => {
	const fixtureName = isFailure ? 'noop-both-fail.js' : 'noop-both.js';
	const {exitCode, all} = await execaMethod(fixtureName, [foobarString], {all: true, encoding, lines, stripFinalNewline, reject: !isFailure});
	t.is(exitCode, isFailure ? 1 : 0);
	t.deepEqual(all, expectedOutput);
};

test('result.all is defined', testAllBoth, doubleFoobarStringFull, 'utf8', false, false, false, execa);
test('result.all is defined, encoding "buffer"', testAllBoth, doubleFoobarUint8ArrayFull, 'buffer', false, false, false, execa);
test('result.all is defined, lines', testAllBoth, doubleFoobarArrayFull, 'utf8', true, false, false, execa);
test('result.all is defined, stripFinalNewline', testAllBoth, doubleFoobarString, 'utf8', false, true, false, execa);
test('result.all is defined, encoding "buffer", stripFinalNewline', testAllBoth, doubleFoobarUint8Array, 'buffer', false, true, false, execa);
test('result.all is defined, lines, stripFinalNewline', testAllBoth, doubleFoobarArray, 'utf8', true, true, false, execa);
test('result.all is defined, failure', testAllBoth, doubleFoobarStringFull, 'utf8', false, false, true, execa);
test('result.all is defined, encoding "buffer", failure', testAllBoth, doubleFoobarUint8ArrayFull, 'buffer', false, false, true, execa);
test('result.all is defined, lines, failure', testAllBoth, doubleFoobarArrayFull, 'utf8', true, false, true, execa);
test('result.all is defined, stripFinalNewline, failure', testAllBoth, doubleFoobarString, 'utf8', false, true, true, execa);
test('result.all is defined, encoding "buffer", stripFinalNewline, failure', testAllBoth, doubleFoobarUint8Array, 'buffer', false, true, true, execa);
test('result.all is defined, lines, stripFinalNewline, failure', testAllBoth, doubleFoobarArray, 'utf8', true, true, true, execa);
test('result.all is defined, sync', testAllBoth, doubleFoobarStringFull, 'utf8', false, false, false, execaSync);
test('result.all is defined, encoding "buffer", sync', testAllBoth, doubleFoobarUint8ArrayFull, 'buffer', false, false, false, execaSync);
test('result.all is defined, lines, sync', testAllBoth, doubleFoobarArrayFull, 'utf8', true, false, false, execaSync);
test('result.all is defined, stripFinalNewline, sync', testAllBoth, doubleFoobarString, 'utf8', false, true, false, execaSync);
test('result.all is defined, encoding "buffer", stripFinalNewline, sync', testAllBoth, doubleFoobarUint8Array, 'buffer', false, true, false, execaSync);
test('result.all is defined, lines, stripFinalNewline, sync', testAllBoth, doubleFoobarArray, 'utf8', true, true, false, execaSync);
test('result.all is defined, failure, sync', testAllBoth, doubleFoobarStringFull, 'utf8', false, false, true, execaSync);
test('result.all is defined, encoding "buffer", failure, sync', testAllBoth, doubleFoobarUint8ArrayFull, 'buffer', false, false, true, execaSync);
test('result.all is defined, lines, failure, sync', testAllBoth, doubleFoobarArrayFull, 'utf8', true, false, true, execaSync);
test('result.all is defined, stripFinalNewline, failure, sync', testAllBoth, doubleFoobarString, 'utf8', false, true, true, execaSync);
test('result.all is defined, encoding "buffer", stripFinalNewline, failure, sync', testAllBoth, doubleFoobarUint8Array, 'buffer', false, true, true, execaSync);
test('result.all is defined, lines, stripFinalNewline, failure, sync', testAllBoth, doubleFoobarArray, 'utf8', true, true, true, execaSync);

test.serial('result.all shows both `stdout` and `stderr` intermixed', async t => {
	const {all} = await execa('noop-132.js', {all: true});
	t.is(all, '132');
});

test('result.all shows both `stdout` and `stderr` not intermixed, sync', t => {
	const {all} = execaSync('noop-132.js', {all: true});
	t.is(all, '123');
});

const testAllIgnored = async (t, options, execaMethod) => {
	const {all} = await execaMethod('noop.js');
	t.is(all, undefined);
};

test('result.all is undefined unless opts.all is true', testAllIgnored, {}, execa);
test('result.all is undefined if opts.all is false', testAllIgnored, {all: false}, execa);
test('result.all is undefined if ignored', testAllIgnored, {stdio: 'ignore', all: true}, execa);
test('result.all is undefined unless opts.all is true, sync', testAllIgnored, {}, execaSync);
test('result.all is undefined if opts.all is false, sync', testAllIgnored, {all: false}, execaSync);
test('result.all is undefined if ignored, sync', testAllIgnored, {stdio: 'ignore', all: true}, execaSync);

const testAllProperties = async (t, options) => {
	const subprocess = execa('empty.js', {...options, all: true});
	t.is(subprocess.all.readableObjectMode, false);
	t.is(subprocess.all.readableHighWaterMark, defaultHighWaterMark);
	await subprocess;
};

test('subprocess.all has the right objectMode and highWaterMark - stdout + stderr', testAllProperties, {});
test('subprocess.all has the right objectMode and highWaterMark - stdout only', testAllProperties, {stderr: 'ignore'});
test('subprocess.all has the right objectMode and highWaterMark - stderr only', testAllProperties, {stdout: 'ignore'});

const testAllIgnore = async (t, streamName, otherStreamName) => {
	const subprocess = execa('noop-both.js', {[otherStreamName]: 'ignore', all: true});
	t.is(subprocess[otherStreamName], null);
	t.not(subprocess[streamName], null);
	t.not(subprocess.all, null);
	t.is(subprocess.all.readableObjectMode, subprocess[streamName].readableObjectMode);
	t.is(subprocess.all.readableHighWaterMark, subprocess[streamName].readableHighWaterMark);

	const result = await subprocess;
	t.is(result[otherStreamName], undefined);
	t.is(result[streamName], foobarString);
	t.is(result.all, foobarString);
};

test('can use all: true with stdout: ignore', testAllIgnore, 'stderr', 'stdout');
test('can use all: true with stderr: ignore', testAllIgnore, 'stdout', 'stderr');

const testAllIgnoreSync = (t, streamName, otherStreamName) => {
	const result = execaSync('noop-both.js', {[otherStreamName]: 'ignore', all: true});
	t.is(result[otherStreamName], undefined);
	t.is(result[streamName], foobarString);
	t.is(result.all, foobarString);
};

test('can use all: true with stdout: ignore, sync', testAllIgnoreSync, 'stderr', 'stdout');
test('can use all: true with stderr: ignore, sync', testAllIgnoreSync, 'stdout', 'stderr');

test('can use all: true with stdout: ignore + stderr: ignore', async t => {
	const subprocess = execa('noop-both.js', {stdout: 'ignore', stderr: 'ignore', all: true});
	t.is(subprocess.stdout, null);
	t.is(subprocess.stderr, null);
	t.is(subprocess.all, undefined);

	const {stdout, stderr, all} = await subprocess;
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.is(all, undefined);
});

test('can use all: true with stdout: ignore + stderr: ignore, sync', t => {
	const {stdout, stderr, all} = execaSync('noop-both.js', {stdout: 'ignore', stderr: 'ignore', all: true});
	t.is(stdout, undefined);
	t.is(stderr, undefined);
	t.is(all, undefined);
});
