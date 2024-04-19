import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {noopReadable, noopWritable, noopDuplex} from '../helpers/stream.js';
import {destroyOptionStream, destroySubprocessStream, getStreamStdio} from '../helpers/wait.js';

setFixtureDirectory();

// eslint-disable-next-line max-params
const testStreamError = async (t, streamMethod, stream, fdNumber, useTransform) => {
	const subprocess = execa('empty.js', getStreamStdio(fdNumber, stream, useTransform));
	const cause = new Error('test');
	streamMethod({
		stream,
		subprocess,
		fdNumber,
		error: cause,
	});

	const error = await t.throwsAsync(subprocess);
	t.is(error.cause, cause);
	t.is(error.exitCode, 0);
	t.is(error.signal, undefined);
	t.false(error.isTerminated);
	t.true(error.failed);
	t.true(stream.destroyed);
};

test('Throws stream error when stdin option errors', testStreamError, destroyOptionStream, noopReadable(), 0, false);
test('Throws stream error when stdin option Duplex errors', testStreamError, destroyOptionStream, noopDuplex(), 0, false);
test('Throws stream error when stdout option errors', testStreamError, destroyOptionStream, noopWritable(), 1, false);
test('Throws stream error when stdout option Duplex errors', testStreamError, destroyOptionStream, noopDuplex(), 1, false);
test('Throws stream error when stderr option errors', testStreamError, destroyOptionStream, noopWritable(), 2, false);
test('Throws stream error when stderr option Duplex errors', testStreamError, destroyOptionStream, noopDuplex(), 2, false);
test('Throws stream error when output stdio[*] option errors', testStreamError, destroyOptionStream, noopWritable(), 3, false);
test('Throws stream error when output stdio[*] Duplex option errors', testStreamError, destroyOptionStream, noopDuplex(), 3, false);
test('Throws stream error when input stdio[*] option errors', testStreamError, destroyOptionStream, noopReadable(), 3, false);
test('Throws stream error when subprocess.stdin errors', testStreamError, destroySubprocessStream, noopReadable(), 0, false);
test('Throws stream error when subprocess.stdin Duplex errors', testStreamError, destroySubprocessStream, noopDuplex(), 0, false);
test('Throws stream error when subprocess.stdout errors', testStreamError, destroySubprocessStream, noopWritable(), 1, false);
test('Throws stream error when subprocess.stdout Duplex errors', testStreamError, destroySubprocessStream, noopDuplex(), 1, false);
test('Throws stream error when subprocess.stderr errors', testStreamError, destroySubprocessStream, noopWritable(), 2, false);
test('Throws stream error when subprocess.stderr Duplex errors', testStreamError, destroySubprocessStream, noopDuplex(), 2, false);
test('Throws stream error when output subprocess.stdio[*] errors', testStreamError, destroySubprocessStream, noopWritable(), 3, false);
test('Throws stream error when output subprocess.stdio[*] Duplex errors', testStreamError, destroySubprocessStream, noopDuplex(), 3, false);
test('Throws stream error when input subprocess.stdio[*] errors', testStreamError, destroySubprocessStream, noopReadable(), 3, false);
test('Throws stream error when stdin option errors, with a transform', testStreamError, destroyOptionStream, noopReadable(), 0, true);
test('Throws stream error when stdin option Duplex errors, with a transform', testStreamError, destroyOptionStream, noopDuplex(), 0, true);
test('Throws stream error when stdout option errors, with a transform', testStreamError, destroyOptionStream, noopWritable(), 1, true);
test('Throws stream error when stdout option Duplex errors, with a transform', testStreamError, destroyOptionStream, noopDuplex(), 1, true);
test('Throws stream error when stderr option errors, with a transform', testStreamError, destroyOptionStream, noopWritable(), 2, true);
test('Throws stream error when stderr option Duplex errors, with a transform', testStreamError, destroyOptionStream, noopDuplex(), 2, true);
test('Throws stream error when output stdio[*] option errors, with a transform', testStreamError, destroyOptionStream, noopWritable(), 3, true);
test('Throws stream error when output stdio[*] Duplex option errors, with a transform', testStreamError, destroyOptionStream, noopDuplex(), 3, true);
test('Throws stream error when input stdio[*] option errors, with a transform', testStreamError, destroyOptionStream, noopReadable(), 3, true);
test('Throws stream error when subprocess.stdin errors, with a transform', testStreamError, destroySubprocessStream, noopReadable(), 0, true);
test('Throws stream error when subprocess.stdin Duplex errors, with a transform', testStreamError, destroySubprocessStream, noopDuplex(), 0, true);
test('Throws stream error when subprocess.stdout errors, with a transform', testStreamError, destroySubprocessStream, noopWritable(), 1, true);
test('Throws stream error when subprocess.stdout Duplex errors, with a transform', testStreamError, destroySubprocessStream, noopDuplex(), 1, true);
test('Throws stream error when subprocess.stderr errors, with a transform', testStreamError, destroySubprocessStream, noopWritable(), 2, true);
test('Throws stream error when subprocess.stderr Duplex errors, with a transform', testStreamError, destroySubprocessStream, noopDuplex(), 2, true);
test('Throws stream error when output subprocess.stdio[*] errors, with a transform', testStreamError, destroySubprocessStream, noopWritable(), 3, true);
test('Throws stream error when output subprocess.stdio[*] Duplex errors, with a transform', testStreamError, destroySubprocessStream, noopDuplex(), 3, true);
test('Throws stream error when input subprocess.stdio[*] errors, with a transform', testStreamError, destroySubprocessStream, noopReadable(), 3, true);
