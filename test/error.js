import path from 'path';
import childProcess from 'child_process';
import test from 'ava';
import execa from '..';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

const TIMEOUT_REGEXP = /timed out after/;

const getExitRegExp = exitMessage => new RegExp(`failed with exit code ${exitMessage}`);

test('stdout/stderr/all available on errors', async t => {
	const {stdout, stderr, all} = await t.throwsAsync(execa('exit', ['2'], {all: true}), {message: getExitRegExp('2')});
	t.is(typeof stdout, 'string');
	t.is(typeof stderr, 'string');
	t.is(typeof all, 'string');
});

const WRONG_COMMAND = process.platform === 'win32' ?
	'\'wrong\' is not recognized as an internal or external command,\r\noperable program or batch file.' :
	'';

test('stdout/stderr/all on process errors', async t => {
	const {stdout, stderr, all} = await t.throwsAsync(execa('wrong command', {all: true}));
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

test('exitCode is 0 on success', async t => {
	const {exitCode} = await execa('noop', ['foo']);
	t.is(exitCode, 0);
});

const testExitCode = async (t, num) => {
	const {exitCode} = await t.throwsAsync(execa('exit', [`${num}`]), {message: getExitRegExp(num)});
	t.is(exitCode, num);
};

test('exitCode is 2', testExitCode, 2);
test('exitCode is 3', testExitCode, 3);
test('exitCode is 4', testExitCode, 4);

test('error.message contains the command', async t => {
	await t.throwsAsync(execa('exit', ['2', 'foo', 'bar']), {message: /exit 2 foo bar/});
});

test('error.message contains stdout/stderr if available', async t => {
	const {message} = await t.throwsAsync(execa('echo-fail'));
	t.true(message.includes('stderr'));
	t.true(message.includes('stdout'));
});

test('error.message does not contain stdout/stderr if not available', async t => {
	const {message} = await t.throwsAsync(execa('echo-fail', {stdio: 'ignore'}));
	t.false(message.includes('stderr'));
	t.false(message.includes('stdout'));
});

test('error.shortMessage does not contain stdout/stderr', async t => {
	const {shortMessage} = await t.throwsAsync(execa('echo-fail'));
	t.false(shortMessage.includes('stderr'));
	t.false(shortMessage.includes('stdout'));
});

test('Original error.message is kept', async t => {
	const {originalMessage} = await t.throwsAsync(execa('wrong command'));
	t.is(originalMessage, 'spawn wrong command ENOENT');
});

test('failed is false on success', async t => {
	const {failed} = await execa('noop', ['foo']);
	t.false(failed);
});

test('failed is true on failure', async t => {
	const {failed} = await t.throwsAsync(execa('exit', ['2']));
	t.true(failed);
});

test('error.killed is true if process was killed directly', async t => {
	const subprocess = execa('noop');

	subprocess.kill();

	const {killed} = await t.throwsAsync(subprocess, {message: /was killed with SIGTERM/});
	t.true(killed);
});

test('error.killed is false if process was killed indirectly', async t => {
	const subprocess = execa('noop');

	process.kill(subprocess.pid, 'SIGINT');

	// `process.kill()` is emulated by Node.js on Windows
	const message = process.platform === 'win32' ? /failed with exit code 1/ : /was killed with SIGINT/;
	const {killed} = await t.throwsAsync(subprocess, {message});
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
		const {pid} = childProcess.exec('noop', error => {
			t.truthy(error);
			t.false(error.killed);
			t.end();
		});

		process.kill(pid, 'SIGINT');
	});
}

if (process.platform !== 'win32') {
	test('error.signal is SIGINT', async t => {
		const subprocess = execa('noop');

		process.kill(subprocess.pid, 'SIGINT');

		const {signal} = await t.throwsAsync(subprocess, {message: /was killed with SIGINT/});
		t.is(signal, 'SIGINT');
	});

	test('error.signalDescription is defined', async t => {
		const subprocess = execa('noop');

		process.kill(subprocess.pid, 'SIGINT');

		const {signalDescription} = await t.throwsAsync(subprocess, {message: /User interruption with CTRL-C/});
		t.is(signalDescription, 'User interruption with CTRL-C');
	});

	test('error.signal is SIGTERM', async t => {
		const subprocess = execa('noop');

		process.kill(subprocess.pid, 'SIGTERM');

		const {signal} = await t.throwsAsync(subprocess, {message: /was killed with SIGTERM/});
		t.is(signal, 'SIGTERM');
	});

	test('custom error.signal', async t => {
		const {signal} = await t.throwsAsync(execa('noop', {killSignal: 'SIGHUP', timeout: 1, message: TIMEOUT_REGEXP}));
		t.is(signal, 'SIGHUP');
	});

	test('exitCode is undefined on signal termination', async t => {
		const subprocess = execa('noop');

		process.kill(subprocess.pid);

		const {exitCode} = await t.throwsAsync(subprocess);
		t.is(exitCode, undefined);
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

test('result.signalDescription is undefined for successful execution', async t => {
	const {signalDescription} = await execa('noop');
	t.is(signalDescription, undefined);
});

test('error.code is undefined on success', async t => {
	const {code} = await execa('noop');
	t.is(code, undefined);
});

test('error.code is defined on failure if applicable', async t => {
	const {code} = await t.throwsAsync(execa('invalid'));
	t.is(code, 'ENOENT');
});
