import process from 'node:process';
import test from 'ava';
import {execa, execaSync, $} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {earlyErrorOptions, getEarlyErrorProcess, getEarlyErrorProcessSync, expectedEarlyError} from '../helpers/early-error.js';

setFixtureDir();

const isWindows = process.platform === 'win32';
const ENOENT_REGEXP = isWindows ? /failed with exit code 1/ : /spawn.* ENOENT/;

test('execaSync() throws error if ENOENT', t => {
	t.throws(() => {
		execaSync('foo');
	}, {message: ENOENT_REGEXP});
});

const testEarlyErrorShape = async (t, reject) => {
	const subprocess = getEarlyErrorProcess({reject});
	t.notThrows(() => {
		subprocess.catch(() => {});
		subprocess.unref();
		subprocess.on('error', () => {});
	});
};

test('child_process.spawn() early errors have correct shape', testEarlyErrorShape, true);
test('child_process.spawn() early errors have correct shape - reject false', testEarlyErrorShape, false);

test('child_process.spawn() early errors are propagated', async t => {
	await t.throwsAsync(getEarlyErrorProcess(), expectedEarlyError);
});

test('child_process.spawn() early errors are returned', async t => {
	const {failed} = await getEarlyErrorProcess({reject: false});
	t.true(failed);
});

test('child_process.spawnSync() early errors are propagated with a correct shape', t => {
	t.throws(getEarlyErrorProcessSync, expectedEarlyError);
});

test('child_process.spawnSync() early errors are propagated with a correct shape - reject false', t => {
	const {failed} = getEarlyErrorProcessSync({reject: false});
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

const testEarlyErrorPipe = async (t, getChildProcess) => {
	await t.throwsAsync(getChildProcess(), expectedEarlyError);
};

test('child_process.spawn() early errors on source can use .pipe()', testEarlyErrorPipe, () => getEarlyErrorProcess().pipe(execa('empty.js')));
test('child_process.spawn() early errors on destination can use .pipe()', testEarlyErrorPipe, () => execa('empty.js').pipe(getEarlyErrorProcess()));
test('child_process.spawn() early errors on source and destination can use .pipe()', testEarlyErrorPipe, () => getEarlyErrorProcess().pipe(getEarlyErrorProcess()));
test('child_process.spawn() early errors can use .pipe() multiple times', testEarlyErrorPipe, () => getEarlyErrorProcess().pipe(getEarlyErrorProcess()).pipe(getEarlyErrorProcess()));
test('child_process.spawn() early errors can use .pipe``', testEarlyErrorPipe, () => $(earlyErrorOptions)`empty.js`.pipe(earlyErrorOptions)`empty.js`);
test('child_process.spawn() early errors can use .pipe`` multiple times', testEarlyErrorPipe, () => $(earlyErrorOptions)`empty.js`.pipe(earlyErrorOptions)`empty.js`.pipe`empty.js`);

const testEarlyErrorStream = async (t, getStreamProperty, all) => {
	const childProcess = getEarlyErrorProcess({all});
	getStreamProperty(childProcess).on('end', () => {});
	await t.throwsAsync(childProcess);
};

test('child_process.spawn() early errors can use .stdin', testEarlyErrorStream, ({stdin}) => stdin, false);
test('child_process.spawn() early errors can use .stdout', testEarlyErrorStream, ({stdout}) => stdout, false);
test('child_process.spawn() early errors can use .stderr', testEarlyErrorStream, ({stderr}) => stderr, false);
test('child_process.spawn() early errors can use .stdio', testEarlyErrorStream, ({stdio}) => stdio[1], false);
test('child_process.spawn() early errors can use .all', testEarlyErrorStream, ({all}) => all, true);
