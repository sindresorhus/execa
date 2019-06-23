import path from 'path';
import childProcess from 'child_process';
import test from 'ava';
import execa from '..';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

const TIMEOUT_REGEXP = /timed out after/;

const getExitRegExp = exitMessage => new RegExp(`failed with exit code ${exitMessage}`);

test('stdout/stderr/all available on errors', async t => {
	const {stdout, stderr, all} = await t.throwsAsync(execa('exit', ['2']), {message: getExitRegExp('2')});
	t.is(typeof stdout, 'string');
	t.is(typeof stderr, 'string');
	t.is(typeof all, 'string');
});

const WRONG_COMMAND = process.platform === 'win32' ?
	'\'wrong\' is not recognized as an internal or external command,\r\noperable program or batch file.' :
	'';

test('stdout/stderr/all on process errors', async t => {
	const {stdout, stderr, all} = await t.throwsAsync(execa('wrong command'));
	t.is(stdout, '');
	t.is(stderr, WRONG_COMMAND);
	t.is(all, WRONG_COMMAND);
});

test('stdout/stderr/all on process errors, in sync mode', t => {
	const {stdout, stderr, all} = t.throws(() => {
		execa.sync('wrong command');
	});
	t.is(stdout, '');
	t.is(stderr, WRONG_COMMAND);
	t.is(all, undefined);
});

test('allow unknown exit code', async t => {
	const {exitCode, exitCodeName} = await t.throwsAsync(execa('exit', ['255']), {message: /exit code 255 \(Unknown system error -255\)/});
	t.is(exitCode, 255);
	t.is(exitCodeName, 'Unknown system error -255');
});

test('execa() does not return code and failed properties on success', async t => {
	const {exitCode, exitCodeName, failed} = await execa('noop', ['foo']);
	t.is(exitCode, 0);
	t.is(exitCodeName, 'SUCCESS');
	t.false(failed);
});

test('execa() returns code and failed properties', async t => {
	const {exitCode, exitCodeName, failed} = await t.throwsAsync(execa('exit', ['2']), {message: getExitRegExp('2')});
	t.is(exitCode, 2);
	const expectedName = process.platform === 'win32' ? 'Unknown system error -2' : 'ENOENT';
	t.is(exitCodeName, expectedName);
	t.true(failed);
});

test('error.killed is true if process was killed directly', async t => {
	const cp = execa('forever');

	cp.kill();

	const {killed} = await t.throwsAsync(cp, {message: /was killed with SIGTERM/});
	t.true(killed);
});

test('error.killed is false if process was killed indirectly', async t => {
	const cp = execa('forever');

	process.kill(cp.pid, 'SIGINT');

	// `process.kill()` is emulated by Node.js on Windows
	const message = process.platform === 'win32' ? /failed with exit code 1/ : /was killed with SIGINT/;
	const {killed} = await t.throwsAsync(cp, {message});
	t.false(killed);
});

test('result.killed is false if not killed', async t => {
	const {killed} = await execa('noop');
	t.false(killed);
});

test('result.killed is false if not killed, in sync mode', t => {
	const {killed} = execa.sync('noop');
	t.false(killed);
});

test('result.killed is false on process error', async t => {
	const {killed} = await t.throwsAsync(execa('wrong command'));
	t.false(killed);
});

test('result.killed is false on process error, in sync mode', t => {
	const {killed} = t.throws(() => {
		execa.sync('wrong command');
	});
	t.false(killed);
});

if (process.platform === 'darwin') {
	test.cb('sanity check: child_process.exec also has killed.false if killed indirectly', t => {
		const {pid} = childProcess.exec('forever', error => {
			t.truthy(error);
			t.false(error.killed);
			t.end();
		});

		process.kill(pid, 'SIGINT');
	});
}

if (process.platform !== 'win32') {
	test('error.signal is SIGINT', async t => {
		const cp = execa('forever');

		process.kill(cp.pid, 'SIGINT');

		const {signal} = await t.throwsAsync(cp, {message: /was killed with SIGINT/});
		t.is(signal, 'SIGINT');
	});

	test('error.signal is SIGTERM', async t => {
		const cp = execa('forever');

		process.kill(cp.pid, 'SIGTERM');

		const {signal} = await t.throwsAsync(cp, {message: /was killed with SIGTERM/});
		t.is(signal, 'SIGTERM');
	});

	test('custom error.signal', async t => {
		const {signal} = await t.throwsAsync(execa('forever', {killSignal: 'SIGHUP', timeout: 1, message: TIMEOUT_REGEXP}));
		t.is(signal, 'SIGHUP');
	});
}

test('result.signal is undefined for successful execution', async t => {
	const {signal} = await execa('noop');
	t.is(signal, undefined);
});

test('result.signal is undefined if process failed, but was not killed', async t => {
	const {signal} = await t.throwsAsync(execa('exit', [2]), {message: getExitRegExp('2')});
	t.is(signal, undefined);
});

const testExitCode = async (t, num) => {
	const {exitCode} = await t.throwsAsync(execa('exit', [`${num}`]), {message: getExitRegExp(num)});
	t.is(exitCode, num);
};

test('error.exitCode is 2', testExitCode, 2);
test('error.exitCode is 3', testExitCode, 3);
test('error.exitCode is 4', testExitCode, 4);

const errorMessage = async (t, expected, ...args) => {
	await t.throwsAsync(execa('exit', args), {message: expected});
};

errorMessage.title = (message, expected) => `error.message matches: ${expected}`;

test(errorMessage, /Command failed with exit code 2.*: exit 2 foo bar/, 2, 'foo', 'bar');
test(errorMessage, /Command failed with exit code 3.*: exit 3 baz quz/, 3, 'baz', 'quz');
