import assert from 'node:assert/strict';
import {assertRejects} from './assert.js';

export const assertPipeError = async (pipePromise, message) => {
	const error = await assertRejects(pipePromise);

	assert.equal(error.command, 'source.pipe(destination)');
	assert.equal(error.escapedCommand, error.command);

	assert.equal(typeof error.cwd, 'string');
	assert.equal(error.failed, true);
	assert.equal(error.timedOut, false);
	assert.equal(error.isCanceled, false);
	assert.equal(error.isTerminated, false);
	assert.equal(error.exitCode, undefined);
	assert.equal(error.signal, undefined);
	assert.equal(error.signalDescription, undefined);
	assert.equal(error.stdout, undefined);
	assert.equal(error.stderr, undefined);
	assert.equal(error.all, undefined);
	assert.deepEqual(error.stdio, Array.from({length: error.stdio.length}));
	assert.deepEqual(error.pipedFrom, []);

	assert.ok(error.shortMessage.includes(`Command failed: ${error.command}`));
	assert.ok(error.shortMessage.includes(error.originalMessage));
	assert.ok(error.message.includes(error.shortMessage));

	assert.ok(error.originalMessage.includes(message));
};
