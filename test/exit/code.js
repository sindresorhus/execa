import process from 'node:process';
import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

const isWindows = process.platform === 'win32';

setFixtureDir();

test('exitCode is 0 on success', async t => {
	const {exitCode} = await execa('noop.js', ['foo']);
	t.is(exitCode, 0);
});

const testExitCode = async (t, expectedExitCode) => {
	const {exitCode, originalMessage, shortMessage, message} = await t.throwsAsync(
		execa('exit.js', [`${expectedExitCode}`]),
	);
	t.is(exitCode, expectedExitCode);
	t.is(originalMessage, '');
	t.is(shortMessage, `Command failed with exit code ${expectedExitCode}: exit.js ${expectedExitCode}`);
	t.is(message, shortMessage);
};

test('exitCode is 2', testExitCode, 2);
test('exitCode is 3', testExitCode, 3);
test('exitCode is 4', testExitCode, 4);

if (!isWindows) {
	test('error.signal is SIGINT', async t => {
		const subprocess = execa('forever.js');

		process.kill(subprocess.pid, 'SIGINT');

		const {signal} = await t.throwsAsync(subprocess, {message: /was killed with SIGINT/});
		t.is(signal, 'SIGINT');
	});

	test('error.signalDescription is defined', async t => {
		const subprocess = execa('forever.js');

		process.kill(subprocess.pid, 'SIGINT');

		const {signalDescription} = await t.throwsAsync(subprocess, {message: /User interruption with CTRL-C/});
		t.is(signalDescription, 'User interruption with CTRL-C');
	});

	test('error.signal is SIGTERM', async t => {
		const subprocess = execa('forever.js');

		process.kill(subprocess.pid, 'SIGTERM');

		const {signal} = await t.throwsAsync(subprocess, {message: /was killed with SIGTERM/});
		t.is(signal, 'SIGTERM');
	});

	test('error.signal uses killSignal', async t => {
		const {signal} = await t.throwsAsync(execa('forever.js', {killSignal: 'SIGINT', timeout: 1, message: /timed out after/}));
		t.is(signal, 'SIGINT');
	});

	test('exitCode is undefined on signal termination', async t => {
		const subprocess = execa('forever.js');

		process.kill(subprocess.pid);

		const {exitCode} = await t.throwsAsync(subprocess);
		t.is(exitCode, undefined);
	});
}

test('result.signal is undefined for successful execution', async t => {
	const {signal} = await execa('noop.js');
	t.is(signal, undefined);
});

test('result.signal is undefined if process failed, but was not killed', async t => {
	const {signal} = await t.throwsAsync(execa('fail.js'));
	t.is(signal, undefined);
});

test('result.signalDescription is undefined for successful execution', async t => {
	const {signalDescription} = await execa('noop.js');
	t.is(signalDescription, undefined);
});
