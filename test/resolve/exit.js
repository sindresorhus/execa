import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

const isWindows = process.platform === 'win32';

setFixtureDirectory();

test('exitCode is 0 on success', async () => {
	const {exitCode} = await execa('noop.js', ['foo']);
	assert.equal(exitCode, 0);
});

const testExitCode = async expectedExitCode => {
	const {exitCode, originalMessage, shortMessage, message} = await assertRejects(execa('exit.js', [`${expectedExitCode}`]));
	assert.equal(exitCode, expectedExitCode);
	assert.equal(originalMessage, undefined);
	assert.equal(shortMessage, `Command failed with exit code ${expectedExitCode}: exit.js ${expectedExitCode}`);
	assert.equal(message, shortMessage);
};

test('exitCode is 2', () => testExitCode(2));
test('exitCode is 3', () => testExitCode(3));
test('exitCode is 4', () => testExitCode(4));

if (!isWindows) {
	test('error.signal is SIGINT', async () => {
		const subprocess = execa('forever.js');

		process.kill(subprocess.pid, 'SIGINT');

		const {signal} = await assertRejects(subprocess, {message: /was killed with SIGINT/});
		assert.equal(signal, 'SIGINT');
	});

	test('error.signalDescription is defined', async () => {
		const subprocess = execa('forever.js');

		process.kill(subprocess.pid, 'SIGINT');

		const {signalDescription} = await assertRejects(subprocess, {message: /User interruption with CTRL-C/});
		assert.equal(signalDescription, 'User interruption with CTRL-C');
	});

	test('error.signal is SIGTERM', async () => {
		const subprocess = execa('forever.js');

		process.kill(subprocess.pid, 'SIGTERM');

		const {signal} = await assertRejects(subprocess, {message: /was killed with SIGTERM/});
		assert.equal(signal, 'SIGTERM');
	});

	test('error.signal uses killSignal', async () => {
		const {signal} = await assertRejects(execa('forever.js', {killSignal: 'SIGINT', timeout: 1, message: /timed out after/}));
		assert.equal(signal, 'SIGINT');
	});

	test('exitCode is undefined on signal termination', async () => {
		const subprocess = execa('forever.js');

		process.kill(subprocess.pid);

		const {exitCode} = await assertRejects(subprocess);
		assert.equal(exitCode, undefined);
	});
}

test('result.signal is undefined for successful execution', async () => {
	const {signal} = await execa('noop.js');
	assert.equal(signal, undefined);
});

test('result.signal is undefined if subprocess failed, but was not killed', async () => {
	const {signal} = await assertRejects(execa('fail.js'));
	assert.equal(signal, undefined);
});

test('result.signalDescription is undefined for successful execution', async () => {
	const {signalDescription} = await execa('noop.js');
	assert.equal(signalDescription, undefined);
});
