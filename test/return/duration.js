import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getEarlyErrorSubprocess, getEarlyErrorSubprocessSync} from '../helpers/early-error.js';

setFixtureDir();

const assertDurationMs = (t, durationMs) => {
	t.is(typeof durationMs, 'number');
	t.true(Number.isFinite(durationMs));
	t.not(durationMs, 0);
	t.true(durationMs > 0);
};

test('result.durationMs', async t => {
	const {durationMs} = await execa('empty.js');
	assertDurationMs(t, durationMs);
});

test('result.durationMs - sync', t => {
	const {durationMs} = execaSync('empty.js');
	assertDurationMs(t, durationMs);
});

test('error.durationMs', async t => {
	const {durationMs} = await t.throwsAsync(execa('fail.js'));
	assertDurationMs(t, durationMs);
});

test('error.durationMs - sync', t => {
	const {durationMs} = t.throws(() => {
		execaSync('fail.js');
	});
	assertDurationMs(t, durationMs);
});

test('error.durationMs - early validation', async t => {
	const {durationMs} = await t.throwsAsync(getEarlyErrorSubprocess());
	assertDurationMs(t, durationMs);
});

test('error.durationMs - early validation, sync', t => {
	const {durationMs} = t.throws(getEarlyErrorSubprocessSync);
	assertDurationMs(t, durationMs);
});

test('error.durationMs - unpipeSignal', async t => {
	const {durationMs} = await t.throwsAsync(execa('noop.js').pipe('stdin.js', {signal: AbortSignal.abort()}));
	assertDurationMs(t, durationMs);
});

test('error.durationMs - pipe validation', async t => {
	const {durationMs} = await t.throwsAsync(execa('noop.js').pipe(false));
	assertDurationMs(t, durationMs);
});

test.serial('result.durationMs is accurate', async t => {
	const minDurationMs = 1e3;
	const {durationMs} = await execa('delay.js', [minDurationMs]);
	t.true(durationMs >= minDurationMs);
});
