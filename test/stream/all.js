import {getDefaultHighWaterMark} from 'node:stream';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

test.serial('result.all shows both `stdout` and `stderr` intermixed', async t => {
	const {all} = await execa('noop-132.js', {all: true});
	t.is(all, '132');
});

test('result.all is undefined unless opts.all is true', async t => {
	const {all} = await execa('noop.js');
	t.is(all, undefined);
});

test('result.all is undefined if ignored', async t => {
	const {all} = await execa('noop.js', {stdio: 'ignore', all: true});
	t.is(all, undefined);
});

const testAllProperties = async (t, options) => {
	const subprocess = execa('empty.js', {...options, all: true});
	t.is(subprocess.all.readableObjectMode, false);
	t.is(subprocess.all.readableHighWaterMark, getDefaultHighWaterMark(false));
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
	t.is(result[streamName], 'foobar');
	t.is(result.all, 'foobar');
};

test('can use all: true with stdout: ignore', testAllIgnore, 'stderr', 'stdout');
test('can use all: true with stderr: ignore', testAllIgnore, 'stdout', 'stderr');

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
