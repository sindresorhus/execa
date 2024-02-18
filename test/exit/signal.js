import {once} from 'node:events';
import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

test('result.isCanceled is false when abort isn\'t called (success)', async t => {
	const {isCanceled} = await execa('noop.js');
	t.false(isCanceled);
});

test('result.isCanceled is false when abort isn\'t called (failure)', async t => {
	const {isCanceled} = await t.throwsAsync(execa('fail.js'));
	t.false(isCanceled);
});

test('result.isCanceled is false when abort isn\'t called in sync mode (success)', t => {
	const {isCanceled} = execaSync('noop.js');
	t.false(isCanceled);
});

test('result.isCanceled is false when abort isn\'t called in sync mode (failure)', t => {
	const {isCanceled} = t.throws(() => {
		execaSync('fail.js');
	});
	t.false(isCanceled);
});

test('error.isCanceled is true when abort is used', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {signal: abortController.signal});
	abortController.abort();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
});

test('error.isCanceled is false when kill method is used', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {signal: abortController.signal});
	subprocess.kill();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.false(isCanceled);
});

test('calling abort is considered a signal termination', async t => {
	const abortController = new AbortController();
	const subprocess = execa('forever.js', {signal: abortController.signal});
	await once(subprocess, 'spawn');
	abortController.abort();
	const {isTerminated, signal} = await t.throwsAsync(subprocess);
	t.true(isTerminated);
	t.is(signal, 'SIGTERM');
});

test('calling abort throws an error with message "Command was canceled"', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {signal: abortController.signal});
	abortController.abort();
	await t.throwsAsync(subprocess, {message: /Command was canceled/});
});

test('calling abort twice should show the same behaviour as calling it once', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {signal: abortController.signal});
	abortController.abort();
	abortController.abort();
	const {isCanceled} = await t.throwsAsync(subprocess);
	t.true(isCanceled);
});

test('calling abort on a successfully completed process does not make result.isCanceled true', async t => {
	const abortController = new AbortController();
	const subprocess = execa('noop.js', {signal: abortController.signal});
	const result = await subprocess;
	abortController.abort();
	t.false(result.isCanceled);
});
