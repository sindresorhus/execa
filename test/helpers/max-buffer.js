import assert from 'node:assert/strict';
import {execa, execaSync} from '../../index.js';

export const maxBuffer = 10;

export const assertErrorMessage = (shortMessage, {execaMethod = execa, length = maxBuffer, fdNumber = 1, unit = 'characters'} = {}) => {
	const expectedUnit = execaMethod === execaSync ? 'bytes' : unit;
	assert.ok(shortMessage.includes(`${STREAM_NAMES[fdNumber]} was larger than ${length} ${expectedUnit}`));
};

const STREAM_NAMES = ['stdin', 'stdout', 'stderr', 'stdio[3]'];
