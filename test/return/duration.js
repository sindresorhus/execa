import assert from 'node:assert/strict';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getEarlyErrorSubprocess, getEarlyErrorSubprocessSync} from '../helpers/early-error.js';

setFixtureDirectory();

const assertDurationMs = durationMs => {
	assert.equal(typeof durationMs, 'number');
	assert.ok(Number.isFinite(durationMs));
	assert.notEqual(durationMs, 0);
	assert.ok(durationMs > 0);
};

test('result.durationMs', async () => {
	const {durationMs} = await execa('empty.js');
	assertDurationMs(durationMs);
});

test('result.durationMs - sync', () => {
	const {durationMs} = execaSync('empty.js');
	assertDurationMs(durationMs);
});

test('error.durationMs', async () => {
	const {durationMs} = await assertRejects(execa('fail.js'));
	assertDurationMs(durationMs);
});

test('error.durationMs - sync', () => {
	const {durationMs} = assertThrows(() => {
		execaSync('fail.js');
	});
	assertDurationMs(durationMs);
});

test('error.durationMs - early validation', async () => {
	const {durationMs} = await assertRejects(getEarlyErrorSubprocess());
	assertDurationMs(durationMs);
});

test('error.durationMs - early validation, sync', () => {
	const {durationMs} = assertThrows(getEarlyErrorSubprocessSync);
	assertDurationMs(durationMs);
});

test('error.durationMs - unpipeSignal', async () => {
	const {durationMs} = await assertRejects(execa('noop.js').pipe('stdin.js', {signal: AbortSignal.abort()}));
	assertDurationMs(durationMs);
});

test('error.durationMs - pipe validation', async () => {
	const {durationMs} = await assertRejects(execa('noop.js').pipe(false));
	assertDurationMs(durationMs);
});

test('result.durationMs is accurate', async () => {
	const minDurationMs = 1e3;
	const {durationMs} = await execa('delay.js', [minDurationMs]);
	assert.ok(durationMs >= minDurationMs);
});
