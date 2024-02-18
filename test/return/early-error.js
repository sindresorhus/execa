import process from 'node:process';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const isWindows = process.platform === 'win32';
const ENOENT_REGEXP = isWindows ? /failed with exit code 1/ : /spawn.* ENOENT/;

test('execaSync() throws error if ENOENT', t => {
	t.throws(() => {
		execaSync('foo');
	}, {message: ENOENT_REGEXP});
});

const testEarlyErrorShape = async (t, reject) => {
	const subprocess = execa('', {reject});
	t.notThrows(() => {
		subprocess.catch(() => {});
		subprocess.unref();
		subprocess.on('error', () => {});
	});
};

test('child_process.spawn() early errors have correct shape', testEarlyErrorShape, true);
test('child_process.spawn() early errors have correct shape - reject false', testEarlyErrorShape, false);

test('child_process.spawn() early errors are propagated', async t => {
	const {failed} = await t.throwsAsync(execa(''));
	t.true(failed);
});

test('child_process.spawn() early errors are returned', async t => {
	const {failed} = await execa('', {reject: false});
	t.true(failed);
});

test('child_process.spawnSync() early errors are propagated with a correct shape', t => {
	const {failed} = t.throws(() => {
		execaSync('');
	});
	t.true(failed);
});

test('child_process.spawnSync() early errors are propagated with a correct shape - reject false', t => {
	const {failed} = execaSync('', {reject: false});
	t.true(failed);
});

if (!isWindows) {
	test('execa() rejects if running non-executable', async t => {
		await t.throwsAsync(execa('non-executable.js'));
	});

	test('execa() rejects with correct error and doesn\'t throw if running non-executable with input', async t => {
		await t.throwsAsync(execa('non-executable.js', {input: 'Hey!'}), {message: /EACCES/});
	});

	test('write to fast-exit process', async t => {
		// Try-catch here is necessary, because this test is not 100% accurate
		// Sometimes process can manage to accept input before exiting
		try {
			await execa(`fast-exit-${process.platform}`, [], {input: 'data'});
			t.pass();
		} catch (error) {
			t.is(error.code, 'EPIPE');
		}
	});
}
